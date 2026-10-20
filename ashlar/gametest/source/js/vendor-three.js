// ===== rolldown runtime + three.js r184 (vendor, minified top-level names) =====
// DO NOT EDIT. The game code (js/game/*.js) uses these names directly and both are ONE module scope:
// the files listed in js/manifest.json are concatenated in order.
var e = Object.defineProperty, t = (e4, t2) => () => (e4 && (t2 = e4(e4 = 0)), t2), n = (t2, n2) => {
  let r2 = {};
  for (var i2 in t2) e(r2, i2, { get: t2[i2], enumerable: true });
  return n2 || e(r2, Symbol.toStringTag, { value: `Module` }), r2;
};
(function() {
  let e4 = document.createElement(`link`).relList;
  if (e4 && e4.supports && e4.supports(`modulepreload`)) return;
  for (let e5 of document.querySelectorAll(`link[rel="modulepreload"]`)) n2(e5);
  new MutationObserver((e5) => {
    for (let t3 of e5) if (t3.type === `childList`) for (let e6 of t3.addedNodes) e6.tagName === `LINK` && e6.rel === `modulepreload` && n2(e6);
  }).observe(document, { childList: true, subtree: true });
  function t2(e5) {
    let t3 = {};
    return e5.integrity && (t3.integrity = e5.integrity), e5.referrerPolicy && (t3.referrerPolicy = e5.referrerPolicy), e5.crossOrigin === `use-credentials` ? t3.credentials = `include` : e5.crossOrigin === `anonymous` ? t3.credentials = `omit` : t3.credentials = `same-origin`, t3;
  }
  function n2(e5) {
    if (e5.ep) return;
    e5.ep = true;
    let n3 = t2(e5);
    fetch(e5.href, n3);
  }
})();
function r(e4) {
  for (let t2 = e4.length - 1; t2 >= 0; --t2) if (e4[t2] >= 65535) return true;
  return false;
}
function i(e4) {
  return ArrayBuffer.isView(e4) && !(e4 instanceof DataView);
}
function a(e4) {
  return document.createElementNS(`http://www.w3.org/1999/xhtml`, e4);
}
function o() {
  let e4 = a(`canvas`);
  return e4.style.display = `block`, e4;
}
function s(...e4) {
  let t2 = `THREE.` + e4.shift();
  Xn ? Xn(`log`, t2, ...e4) : console.log(t2, ...e4);
}
function c(e4) {
  let t2 = e4[0];
  if (typeof t2 == `string` && t2.startsWith(`TSL:`)) {
    let t3 = e4[1];
    t3 && t3.isStackTrace ? e4[0] += ` ` + t3.getLocation() : e4[1] = `Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`;
  }
  return e4;
}
function l(...e4) {
  e4 = c(e4);
  let t2 = `THREE.` + e4.shift();
  if (Xn) Xn(`warn`, t2, ...e4);
  else {
    let n2 = e4[0];
    n2 && n2.isStackTrace ? console.warn(n2.getError(t2)) : console.warn(t2, ...e4);
  }
}
function u(...e4) {
  e4 = c(e4);
  let t2 = `THREE.` + e4.shift();
  if (Xn) Xn(`error`, t2, ...e4);
  else {
    let n2 = e4[0];
    n2 && n2.isStackTrace ? console.error(n2.getError(t2)) : console.error(t2, ...e4);
  }
}
function d(...e4) {
  let t2 = e4.join(` `);
  t2 in Yn || (Yn[t2] = true, l(...e4));
}
function f(e4, t2, n2) {
  return new Promise(function(r2, i2) {
    function a2() {
      switch (e4.clientWaitSync(t2, e4.SYNC_FLUSH_COMMANDS_BIT, 0)) {
        case e4.WAIT_FAILED:
          i2();
          break;
        case e4.TIMEOUT_EXPIRED:
          setTimeout(a2, n2);
          break;
        default:
          r2();
      }
    }
    setTimeout(a2, n2);
  });
}
function p() {
  let e4 = Math.random() * 4294967295 | 0, t2 = Math.random() * 4294967295 | 0, n2 = Math.random() * 4294967295 | 0, r2 = Math.random() * 4294967295 | 0;
  return ($n[e4 & 255] + $n[e4 >> 8 & 255] + $n[e4 >> 16 & 255] + $n[e4 >> 24 & 255] + `-` + $n[t2 & 255] + $n[t2 >> 8 & 255] + `-` + $n[t2 >> 16 & 15 | 64] + $n[t2 >> 24 & 255] + `-` + $n[n2 & 63 | 128] + $n[n2 >> 8 & 255] + `-` + $n[n2 >> 16 & 255] + $n[n2 >> 24 & 255] + $n[r2 & 255] + $n[r2 >> 8 & 255] + $n[r2 >> 16 & 255] + $n[r2 >> 24 & 255]).toLowerCase();
}
function m(e4, t2, n2) {
  return Math.max(t2, Math.min(n2, e4));
}
function h(e4, t2) {
  return (e4 % t2 + t2) % t2;
}
function g(e4, t2, n2, r2, i2) {
  return r2 + (e4 - t2) * (i2 - r2) / (n2 - t2);
}
function _(e4, t2, n2) {
  return e4 === t2 ? 0 : (n2 - e4) / (t2 - e4);
}
function v(e4, t2, n2) {
  return (1 - n2) * e4 + n2 * t2;
}
function y(e4, t2, n2, r2) {
  return v(e4, t2, 1 - Math.exp(-n2 * r2));
}
function b(e4, t2 = 1) {
  return t2 - Math.abs(h(e4, t2 * 2) - t2);
}
function x(e4, t2, n2) {
  return e4 <= t2 ? 0 : e4 >= n2 ? 1 : (e4 = (e4 - t2) / (n2 - t2), e4 * e4 * (3 - 2 * e4));
}
function S(e4, t2, n2) {
  return e4 <= t2 ? 0 : e4 >= n2 ? 1 : (e4 = (e4 - t2) / (n2 - t2), e4 * e4 * e4 * (e4 * (e4 * 6 - 15) + 10));
}
function C(e4, t2) {
  return e4 + Math.floor(Math.random() * (t2 - e4 + 1));
}
function w(e4, t2) {
  return e4 + Math.random() * (t2 - e4);
}
function T(e4) {
  return e4 * (0.5 - Math.random());
}
function E(e4) {
  e4 !== void 0 && (er = e4);
  let t2 = er += 1831565813;
  return t2 = Math.imul(t2 ^ t2 >>> 15, t2 | 1), t2 ^= t2 + Math.imul(t2 ^ t2 >>> 7, t2 | 61), ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
}
function D(e4) {
  return e4 * tr;
}
function O(e4) {
  return e4 * nr;
}
function k(e4) {
  return (e4 & e4 - 1) == 0 && e4 !== 0;
}
function A(e4) {
  return 2 ** Math.ceil(Math.log(e4) / Math.LN2);
}
function ee(e4) {
  return 2 ** Math.floor(Math.log(e4) / Math.LN2);
}
function te(e4, t2, n2, r2, i2) {
  let a2 = Math.cos, o2 = Math.sin, s2 = a2(n2 / 2), c2 = o2(n2 / 2), u2 = a2((t2 + r2) / 2), d2 = o2((t2 + r2) / 2), f2 = a2((t2 - r2) / 2), p2 = o2((t2 - r2) / 2), m2 = a2((r2 - t2) / 2), h2 = o2((r2 - t2) / 2);
  switch (i2) {
    case `XYX`:
      e4.set(s2 * d2, c2 * f2, c2 * p2, s2 * u2);
      break;
    case `YZY`:
      e4.set(c2 * p2, s2 * d2, c2 * f2, s2 * u2);
      break;
    case `ZXZ`:
      e4.set(c2 * f2, c2 * p2, s2 * d2, s2 * u2);
      break;
    case `XZX`:
      e4.set(s2 * d2, c2 * h2, c2 * m2, s2 * u2);
      break;
    case `YXY`:
      e4.set(c2 * m2, s2 * d2, c2 * h2, s2 * u2);
      break;
    case `ZYZ`:
      e4.set(c2 * h2, c2 * m2, s2 * d2, s2 * u2);
      break;
    default:
      l(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ` + i2);
  }
}
function ne(e4, t2) {
  switch (t2.constructor) {
    case Float32Array:
      return e4;
    case Uint32Array:
      return e4 / 4294967295;
    case Uint16Array:
      return e4 / 65535;
    case Uint8Array:
      return e4 / 255;
    case Int32Array:
      return Math.max(e4 / 2147483647, -1);
    case Int16Array:
      return Math.max(e4 / 32767, -1);
    case Int8Array:
      return Math.max(e4 / 127, -1);
    default:
      throw Error(`Invalid component type.`);
  }
}
function re(e4, t2) {
  switch (t2.constructor) {
    case Float32Array:
      return e4;
    case Uint32Array:
      return Math.round(e4 * 4294967295);
    case Uint16Array:
      return Math.round(e4 * 65535);
    case Uint8Array:
      return Math.round(e4 * 255);
    case Int32Array:
      return Math.round(e4 * 2147483647);
    case Int16Array:
      return Math.round(e4 * 32767);
    case Int8Array:
      return Math.round(e4 * 127);
    default:
      throw Error(`Invalid component type.`);
  }
}
function ie() {
  let e4 = { enabled: true, workingColorSpace: Hn, spaces: {}, convert: function(e5, t3, n3) {
    return this.enabled === false || t3 === n3 || !t3 || !n3 ? e5 : (this.spaces[t3].transfer === `srgb` && (e5.r = ae(e5.r), e5.g = ae(e5.g), e5.b = ae(e5.b)), this.spaces[t3].primaries !== this.spaces[n3].primaries && (e5.applyMatrix3(this.spaces[t3].toXYZ), e5.applyMatrix3(this.spaces[n3].fromXYZ)), this.spaces[n3].transfer === `srgb` && (e5.r = oe(e5.r), e5.g = oe(e5.g), e5.b = oe(e5.b)), e5);
  }, workingToColorSpace: function(e5, t3) {
    return this.convert(e5, this.workingColorSpace, t3);
  }, colorSpaceToWorking: function(e5, t3) {
    return this.convert(e5, t3, this.workingColorSpace);
  }, getPrimaries: function(e5) {
    return this.spaces[e5].primaries;
  }, getTransfer: function(e5) {
    return e5 === `` ? Un : this.spaces[e5].transfer;
  }, getToneMappingMode: function(e5) {
    return this.spaces[e5].outputColorSpaceConfig.toneMappingMode || `standard`;
  }, getLuminanceCoefficients: function(e5, t3 = this.workingColorSpace) {
    return e5.fromArray(this.spaces[t3].luminanceCoefficients);
  }, define: function(e5) {
    Object.assign(this.spaces, e5);
  }, _getMatrix: function(e5, t3, n3) {
    return e5.copy(this.spaces[t3].toXYZ).multiply(this.spaces[n3].fromXYZ);
  }, _getDrawingBufferColorSpace: function(e5) {
    return this.spaces[e5].outputColorSpaceConfig.drawingBufferColorSpace;
  }, _getUnpackColorSpace: function(e5 = this.workingColorSpace) {
    return this.spaces[e5].workingColorSpaceConfig.unpackColorSpace;
  }, fromWorkingColorSpace: function(t3, n3) {
    return d(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`), e4.workingToColorSpace(t3, n3);
  }, toWorkingColorSpace: function(t3, n3) {
    return d(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`), e4.colorSpaceToWorking(t3, n3);
  } }, t2 = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06], n2 = [0.2126, 0.7152, 0.0722], r2 = [0.3127, 0.329];
  return e4.define({ [Hn]: { primaries: t2, whitePoint: r2, transfer: Un, toXYZ: lr, fromXYZ: ur, luminanceCoefficients: n2, workingColorSpaceConfig: { unpackColorSpace: Vn }, outputColorSpaceConfig: { drawingBufferColorSpace: Vn } }, [Vn]: { primaries: t2, whitePoint: r2, transfer: Wn, toXYZ: lr, fromXYZ: ur, luminanceCoefficients: n2, outputColorSpaceConfig: { drawingBufferColorSpace: Vn } } }), e4;
}
function ae(e4) {
  return e4 < 0.04045 ? e4 * 0.0773993808 : (e4 * 0.9478672986 + 0.0521327014) ** 2.4;
}
function oe(e4) {
  return e4 < 31308e-7 ? e4 * 12.92 : 1.055 * e4 ** 0.41666 - 0.055;
}
function se(e4) {
  return typeof HTMLImageElement < `u` && e4 instanceof HTMLImageElement || typeof HTMLCanvasElement < `u` && e4 instanceof HTMLCanvasElement || typeof ImageBitmap < `u` && e4 instanceof ImageBitmap ? pr.getDataURL(e4) : e4.data ? { data: Array.from(e4.data), width: e4.width, height: e4.height, type: e4.data.constructor.name } : (l(`Texture: Unable to serialize Texture.`), {});
}
function ce(e4, t2, n2) {
  return n2 < 0 && (n2 += 1), n2 > 1 && --n2, n2 < 1 / 6 ? e4 + (t2 - e4) * 6 * n2 : n2 < 1 / 2 ? t2 : n2 < 2 / 3 ? e4 + (t2 - e4) * 6 * (2 / 3 - n2) : e4;
}
function le(e4, t2, n2, r2, i2) {
  for (let a2 = 0, o2 = e4.length - 3; a2 <= o2; a2 += 3) {
    Ni.fromArray(e4, a2);
    let o3 = i2.x * Math.abs(Ni.x) + i2.y * Math.abs(Ni.y) + i2.z * Math.abs(Ni.z), s2 = t2.dot(Ni), c2 = n2.dot(Ni), l2 = r2.dot(Ni);
    if (Math.max(-Math.max(s2, c2, l2), Math.min(s2, c2, l2)) > o3) return false;
  }
  return true;
}
function ue(e4, t2, n2, r2, i2, a2, o2, s2) {
  let c2;
  if (c2 = t2.side === 1 ? r2.intersectTriangle(o2, a2, i2, true, s2) : r2.intersectTriangle(i2, a2, o2, t2.side === 0, s2), c2 === null) return null;
  ba.copy(s2), ba.applyMatrix4(e4.matrixWorld);
  let l2 = n2.ray.origin.distanceTo(ba);
  return l2 < n2.near || l2 > n2.far ? null : { distance: l2, point: ba.clone(), object: e4 };
}
function de(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2) {
  e4.getVertexPosition(s2, ma), e4.getVertexPosition(c2, ha), e4.getVertexPosition(l2, ga);
  let u2 = ue(e4, t2, n2, r2, ma, ha, ga, ya);
  if (u2) {
    let e5 = new N();
    yi.getBarycoord(ya, ma, ha, ga, e5), i2 && (u2.uv = yi.getInterpolatedAttribute(i2, s2, c2, l2, e5, new M())), a2 && (u2.uv1 = yi.getInterpolatedAttribute(a2, s2, c2, l2, e5, new M())), o2 && (u2.normal = yi.getInterpolatedAttribute(o2, s2, c2, l2, e5, new N()), u2.normal.dot(r2.direction) > 0 && u2.normal.multiplyScalar(-1));
    let t3 = { a: s2, b: c2, c: l2, normal: new N(), materialIndex: 0 };
    yi.getNormal(ma, ha, ga, t3.normal), u2.face = t3, u2.barycoord = e5;
  }
  return u2;
}
function fe() {
  let e4 = 0, t2 = 0, n2 = 0, r2 = 0;
  function i2(i3, a2, o2, s2) {
    e4 = i3, t2 = o2, n2 = -3 * i3 + 3 * a2 - 2 * o2 - s2, r2 = 2 * i3 - 2 * a2 + o2 + s2;
  }
  return { initCatmullRom: function(e5, t3, n3, r3, a2) {
    i2(t3, n3, a2 * (n3 - e5), a2 * (r3 - t3));
  }, initNonuniformCatmullRom: function(e5, t3, n3, r3, a2, o2, s2) {
    let c2 = (t3 - e5) / a2 - (n3 - e5) / (a2 + o2) + (n3 - t3) / o2, l2 = (n3 - t3) / o2 - (r3 - t3) / (o2 + s2) + (r3 - n3) / s2;
    c2 *= o2, l2 *= o2, i2(t3, n3, c2, l2);
  }, calc: function(i3) {
    let a2 = i3 * i3, o2 = a2 * i3;
    return e4 + t2 * i3 + n2 * a2 + r2 * o2;
  } };
}
function pe(e4, t2, n2, r2, i2) {
  let a2 = (r2 - t2) * 0.5, o2 = (i2 - n2) * 0.5, s2 = e4 * e4, c2 = e4 * s2;
  return (2 * n2 - 2 * r2 + a2 + o2) * c2 + (-3 * n2 + 3 * r2 - 2 * a2 - o2) * s2 + a2 * e4 + n2;
}
function me(e4, t2) {
  let n2 = 1 - e4;
  return n2 * n2 * t2;
}
function he(e4, t2) {
  return 2 * (1 - e4) * e4 * t2;
}
function ge(e4, t2) {
  return e4 * e4 * t2;
}
function _e(e4, t2, n2, r2) {
  return me(e4, t2) + he(e4, n2) + ge(e4, r2);
}
function ve(e4, t2) {
  let n2 = 1 - e4;
  return n2 * n2 * n2 * t2;
}
function ye(e4, t2) {
  let n2 = 1 - e4;
  return 3 * n2 * n2 * e4 * t2;
}
function be(e4, t2) {
  return 3 * (1 - e4) * e4 * e4 * t2;
}
function xe(e4, t2) {
  return e4 * e4 * e4 * t2;
}
function Se(e4, t2, n2, r2, i2) {
  return ve(e4, t2) + ye(e4, n2) + be(e4, r2) + xe(e4, i2);
}
function Ce(e4, t2, n2 = 2) {
  let r2 = t2 && t2.length, i2 = r2 ? t2[0] * n2 : e4.length, a2 = we(e4, 0, i2, n2, true), o2 = [];
  if (!a2 || a2.next === a2.prev) return o2;
  let s2, c2, l2;
  if (r2 && (a2 = Ae(e4, t2, a2, n2)), e4.length > 80 * n2) {
    s2 = e4[0], c2 = e4[1];
    let t3 = s2, r3 = c2;
    for (let a3 = n2; a3 < i2; a3 += n2) {
      let n3 = e4[a3], i3 = e4[a3 + 1];
      n3 < s2 && (s2 = n3), i3 < c2 && (c2 = i3), n3 > t3 && (t3 = n3), i3 > r3 && (r3 = i3);
    }
    l2 = Math.max(t3 - s2, r3 - c2), l2 = l2 === 0 ? 0 : 32767 / l2;
  }
  return Ee(a2, o2, n2, s2, c2, l2, 0), o2;
}
function we(e4, t2, n2, r2, i2) {
  let a2;
  if (i2 === et(e4, t2, n2, r2) > 0) for (let i3 = t2; i3 < n2; i3 += r2) a2 = Ze(i3 / r2 | 0, e4[i3], e4[i3 + 1], a2);
  else for (let i3 = n2 - r2; i3 >= t2; i3 -= r2) a2 = Ze(i3 / r2 | 0, e4[i3], e4[i3 + 1], a2);
  return a2 && Ue(a2, a2.next) && (Qe(a2), a2 = a2.next), a2;
}
function Te(e4, t2) {
  if (!e4) return e4;
  t2 ||= e4;
  let n2 = e4, r2;
  do
    if (r2 = false, !n2.steiner && (Ue(n2, n2.next) || He(n2.prev, n2, n2.next) === 0)) {
      if (Qe(n2), n2 = t2 = n2.prev, n2 === n2.next) break;
      r2 = true;
    } else n2 = n2.next;
  while (r2 || n2 !== t2);
  return t2;
}
function Ee(e4, t2, n2, r2, i2, a2, o2) {
  if (!e4) return;
  !o2 && a2 && Fe(e4, r2, i2, a2);
  let s2 = e4;
  for (; e4.prev !== e4.next; ) {
    let c2 = e4.prev, l2 = e4.next;
    if (a2 ? Oe(e4, r2, i2, a2) : De(e4)) {
      t2.push(c2.i, e4.i, l2.i), Qe(e4), e4 = l2.next, s2 = l2.next;
      continue;
    }
    if (e4 = l2, e4 === s2) {
      o2 ? o2 === 1 ? (e4 = j(Te(e4), t2), Ee(e4, t2, n2, r2, i2, a2, 2)) : o2 === 2 && ke(e4, t2, n2, r2, i2, a2) : Ee(Te(e4), t2, n2, r2, i2, a2, 1);
      break;
    }
  }
}
function De(e4) {
  let t2 = e4.prev, n2 = e4, r2 = e4.next;
  if (He(t2, n2, r2) >= 0) return false;
  let i2 = t2.x, a2 = n2.x, o2 = r2.x, s2 = t2.y, c2 = n2.y, l2 = r2.y, u2 = Math.min(i2, a2, o2), d2 = Math.min(s2, c2, l2), f2 = Math.max(i2, a2, o2), p2 = Math.max(s2, c2, l2), m2 = r2.next;
  for (; m2 !== t2; ) {
    if (m2.x >= u2 && m2.x <= f2 && m2.y >= d2 && m2.y <= p2 && Be(i2, s2, a2, c2, o2, l2, m2.x, m2.y) && He(m2.prev, m2, m2.next) >= 0) return false;
    m2 = m2.next;
  }
  return true;
}
function Oe(e4, t2, n2, r2) {
  let i2 = e4.prev, a2 = e4, o2 = e4.next;
  if (He(i2, a2, o2) >= 0) return false;
  let s2 = i2.x, c2 = a2.x, l2 = o2.x, u2 = i2.y, d2 = a2.y, f2 = o2.y, p2 = Math.min(s2, c2, l2), m2 = Math.min(u2, d2, f2), h2 = Math.max(s2, c2, l2), g2 = Math.max(u2, d2, f2), _2 = Le(p2, m2, t2, n2, r2), v2 = Le(h2, g2, t2, n2, r2), y2 = e4.prevZ, b2 = e4.nextZ;
  for (; y2 && y2.z >= _2 && b2 && b2.z <= v2; ) {
    if (y2.x >= p2 && y2.x <= h2 && y2.y >= m2 && y2.y <= g2 && y2 !== i2 && y2 !== o2 && Be(s2, u2, c2, d2, l2, f2, y2.x, y2.y) && He(y2.prev, y2, y2.next) >= 0 || (y2 = y2.prevZ, b2.x >= p2 && b2.x <= h2 && b2.y >= m2 && b2.y <= g2 && b2 !== i2 && b2 !== o2 && Be(s2, u2, c2, d2, l2, f2, b2.x, b2.y) && He(b2.prev, b2, b2.next) >= 0)) return false;
    b2 = b2.nextZ;
  }
  for (; y2 && y2.z >= _2; ) {
    if (y2.x >= p2 && y2.x <= h2 && y2.y >= m2 && y2.y <= g2 && y2 !== i2 && y2 !== o2 && Be(s2, u2, c2, d2, l2, f2, y2.x, y2.y) && He(y2.prev, y2, y2.next) >= 0) return false;
    y2 = y2.prevZ;
  }
  for (; b2 && b2.z <= v2; ) {
    if (b2.x >= p2 && b2.x <= h2 && b2.y >= m2 && b2.y <= g2 && b2 !== i2 && b2 !== o2 && Be(s2, u2, c2, d2, l2, f2, b2.x, b2.y) && He(b2.prev, b2, b2.next) >= 0) return false;
    b2 = b2.nextZ;
  }
  return true;
}
function j(e4, t2) {
  let n2 = e4;
  do {
    let r2 = n2.prev, i2 = n2.next.next;
    !Ue(r2, i2) && We(r2, n2, n2.next, i2) && Je(r2, i2) && Je(i2, r2) && (t2.push(r2.i, n2.i, i2.i), Qe(n2), Qe(n2.next), n2 = e4 = i2), n2 = n2.next;
  } while (n2 !== e4);
  return Te(n2);
}
function ke(e4, t2, n2, r2, i2, a2) {
  let o2 = e4;
  do {
    let e5 = o2.next.next;
    for (; e5 !== o2.prev; ) {
      if (o2.i !== e5.i && Ve(o2, e5)) {
        let s2 = Xe(o2, e5);
        o2 = Te(o2, o2.next), s2 = Te(s2, s2.next), Ee(o2, t2, n2, r2, i2, a2, 0), Ee(s2, t2, n2, r2, i2, a2, 0);
        return;
      }
      e5 = e5.next;
    }
    o2 = o2.next;
  } while (o2 !== e4);
}
function Ae(e4, t2, n2, r2) {
  let i2 = [];
  for (let n3 = 0, a2 = t2.length; n3 < a2; n3++) {
    let o2 = we(e4, t2[n3] * r2, n3 < a2 - 1 ? t2[n3 + 1] * r2 : e4.length, r2, false);
    o2 === o2.next && (o2.steiner = true), i2.push(Re(o2));
  }
  i2.sort(je);
  for (let e5 = 0; e5 < i2.length; e5++) n2 = Me(i2[e5], n2);
  return n2;
}
function je(e4, t2) {
  let n2 = e4.x - t2.x;
  return n2 === 0 && (n2 = e4.y - t2.y, n2 === 0 && (n2 = (e4.next.y - e4.y) / (e4.next.x - e4.x) - (t2.next.y - t2.y) / (t2.next.x - t2.x))), n2;
}
function Me(e4, t2) {
  let n2 = Ne(e4, t2);
  if (!n2) return t2;
  let r2 = Xe(n2, e4);
  return Te(r2, r2.next), Te(n2, n2.next);
}
function Ne(e4, t2) {
  let n2 = t2, r2 = e4.x, i2 = e4.y, a2 = -1 / 0, o2;
  if (Ue(e4, n2)) return n2;
  do {
    if (Ue(e4, n2.next)) return n2.next;
    if (i2 <= n2.y && i2 >= n2.next.y && n2.next.y !== n2.y) {
      let e5 = n2.x + (i2 - n2.y) * (n2.next.x - n2.x) / (n2.next.y - n2.y);
      if (e5 <= r2 && e5 > a2 && (a2 = e5, o2 = n2.x < n2.next.x ? n2 : n2.next, e5 === r2)) return o2;
    }
    n2 = n2.next;
  } while (n2 !== t2);
  if (!o2) return null;
  let s2 = o2, c2 = o2.x, l2 = o2.y, u2 = 1 / 0;
  n2 = o2;
  do {
    if (r2 >= n2.x && n2.x >= c2 && r2 !== n2.x && ze(i2 < l2 ? r2 : a2, i2, c2, l2, i2 < l2 ? a2 : r2, i2, n2.x, n2.y)) {
      let t3 = Math.abs(i2 - n2.y) / (r2 - n2.x);
      Je(n2, e4) && (t3 < u2 || t3 === u2 && (n2.x > o2.x || n2.x === o2.x && Pe(o2, n2))) && (o2 = n2, u2 = t3);
    }
    n2 = n2.next;
  } while (n2 !== s2);
  return o2;
}
function Pe(e4, t2) {
  return He(e4.prev, e4, t2.prev) < 0 && He(t2.next, e4, e4.next) < 0;
}
function Fe(e4, t2, n2, r2) {
  let i2 = e4;
  do
    i2.z === 0 && (i2.z = Le(i2.x, i2.y, t2, n2, r2)), i2.prevZ = i2.prev, i2.nextZ = i2.next, i2 = i2.next;
  while (i2 !== e4);
  i2.prevZ.nextZ = null, i2.prevZ = null, Ie(i2);
}
function Ie(e4) {
  let t2, n2 = 1;
  do {
    let r2 = e4, i2;
    e4 = null;
    let a2 = null;
    for (t2 = 0; r2; ) {
      t2++;
      let o2 = r2, s2 = 0;
      for (let e5 = 0; e5 < n2 && (s2++, o2 = o2.nextZ, o2); e5++) ;
      let c2 = n2;
      for (; s2 > 0 || c2 > 0 && o2; ) s2 !== 0 && (c2 === 0 || !o2 || r2.z <= o2.z) ? (i2 = r2, r2 = r2.nextZ, s2--) : (i2 = o2, o2 = o2.nextZ, c2--), a2 ? a2.nextZ = i2 : e4 = i2, i2.prevZ = a2, a2 = i2;
      r2 = o2;
    }
    a2.nextZ = null, n2 *= 2;
  } while (t2 > 1);
  return e4;
}
function Le(e4, t2, n2, r2, i2) {
  return e4 = (e4 - n2) * i2 | 0, t2 = (t2 - r2) * i2 | 0, e4 = (e4 | e4 << 8) & 16711935, e4 = (e4 | e4 << 4) & 252645135, e4 = (e4 | e4 << 2) & 858993459, e4 = (e4 | e4 << 1) & 1431655765, t2 = (t2 | t2 << 8) & 16711935, t2 = (t2 | t2 << 4) & 252645135, t2 = (t2 | t2 << 2) & 858993459, t2 = (t2 | t2 << 1) & 1431655765, e4 | t2 << 1;
}
function Re(e4) {
  let t2 = e4, n2 = e4;
  do
    (t2.x < n2.x || t2.x === n2.x && t2.y < n2.y) && (n2 = t2), t2 = t2.next;
  while (t2 !== e4);
  return n2;
}
function ze(e4, t2, n2, r2, i2, a2, o2, s2) {
  return (i2 - o2) * (t2 - s2) >= (e4 - o2) * (a2 - s2) && (e4 - o2) * (r2 - s2) >= (n2 - o2) * (t2 - s2) && (n2 - o2) * (a2 - s2) >= (i2 - o2) * (r2 - s2);
}
function Be(e4, t2, n2, r2, i2, a2, o2, s2) {
  return !(e4 === o2 && t2 === s2) && ze(e4, t2, n2, r2, i2, a2, o2, s2);
}
function Ve(e4, t2) {
  return e4.next.i !== t2.i && e4.prev.i !== t2.i && !qe(e4, t2) && (Je(e4, t2) && Je(t2, e4) && Ye(e4, t2) && (He(e4.prev, e4, t2.prev) || He(e4, t2.prev, t2)) || Ue(e4, t2) && He(e4.prev, e4, e4.next) > 0 && He(t2.prev, t2, t2.next) > 0);
}
function He(e4, t2, n2) {
  return (t2.y - e4.y) * (n2.x - t2.x) - (t2.x - e4.x) * (n2.y - t2.y);
}
function Ue(e4, t2) {
  return e4.x === t2.x && e4.y === t2.y;
}
function We(e4, t2, n2, r2) {
  let i2 = Ke(He(e4, t2, n2)), a2 = Ke(He(e4, t2, r2)), o2 = Ke(He(n2, r2, e4)), s2 = Ke(He(n2, r2, t2));
  return !!(i2 !== a2 && o2 !== s2 || i2 === 0 && Ge(e4, n2, t2) || a2 === 0 && Ge(e4, r2, t2) || o2 === 0 && Ge(n2, e4, r2) || s2 === 0 && Ge(n2, t2, r2));
}
function Ge(e4, t2, n2) {
  return t2.x <= Math.max(e4.x, n2.x) && t2.x >= Math.min(e4.x, n2.x) && t2.y <= Math.max(e4.y, n2.y) && t2.y >= Math.min(e4.y, n2.y);
}
function Ke(e4) {
  return e4 > 0 ? 1 : e4 < 0 ? -1 : 0;
}
function qe(e4, t2) {
  let n2 = e4;
  do {
    if (n2.i !== e4.i && n2.next.i !== e4.i && n2.i !== t2.i && n2.next.i !== t2.i && We(n2, n2.next, e4, t2)) return true;
    n2 = n2.next;
  } while (n2 !== e4);
  return false;
}
function Je(e4, t2) {
  return He(e4.prev, e4, e4.next) < 0 ? He(e4, t2, e4.next) >= 0 && He(e4, e4.prev, t2) >= 0 : He(e4, t2, e4.prev) < 0 || He(e4, e4.next, t2) < 0;
}
function Ye(e4, t2) {
  let n2 = e4, r2 = false, i2 = (e4.x + t2.x) / 2, a2 = (e4.y + t2.y) / 2;
  do
    n2.y > a2 != n2.next.y > a2 && n2.next.y !== n2.y && i2 < (n2.next.x - n2.x) * (a2 - n2.y) / (n2.next.y - n2.y) + n2.x && (r2 = !r2), n2 = n2.next;
  while (n2 !== e4);
  return r2;
}
function Xe(e4, t2) {
  let n2 = $e(e4.i, e4.x, e4.y), r2 = $e(t2.i, t2.x, t2.y), i2 = e4.next, a2 = t2.prev;
  return e4.next = t2, t2.prev = e4, n2.next = i2, i2.prev = n2, r2.next = n2, n2.prev = r2, a2.next = r2, r2.prev = a2, r2;
}
function Ze(e4, t2, n2, r2) {
  let i2 = $e(e4, t2, n2);
  return r2 ? (i2.next = r2.next, i2.prev = r2, r2.next.prev = i2, r2.next = i2) : (i2.prev = i2, i2.next = i2), i2;
}
function Qe(e4) {
  e4.next.prev = e4.prev, e4.prev.next = e4.next, e4.prevZ && (e4.prevZ.nextZ = e4.nextZ), e4.nextZ && (e4.nextZ.prevZ = e4.prevZ);
}
function $e(e4, t2, n2) {
  return { i: e4, x: t2, y: n2, prev: null, next: null, z: 0, prevZ: null, nextZ: null, steiner: false };
}
function et(e4, t2, n2, r2) {
  let i2 = 0;
  for (let a2 = t2, o2 = n2 - r2; a2 < n2; a2 += r2) i2 += (e4[o2] - e4[a2]) * (e4[a2 + 1] + e4[o2 + 1]), o2 = a2;
  return i2;
}
function tt(e4) {
  let t2 = e4.length;
  t2 > 2 && e4[t2 - 1].equals(e4[0]) && e4.pop();
}
function nt(e4, t2) {
  for (let n2 = 0; n2 < t2.length; n2++) e4.push(t2[n2].x), e4.push(t2[n2].y);
}
function rt(e4, t2, n2) {
  if (n2.shapes = [], Array.isArray(e4)) for (let t3 = 0, r2 = e4.length; t3 < r2; t3++) {
    let r3 = e4[t3];
    n2.shapes.push(r3.uuid);
  }
  else n2.shapes.push(e4.uuid);
  return n2.options = Object.assign({}, t2), t2.extrudePath !== void 0 && (n2.options.extrudePath = t2.extrudePath.toJSON()), n2;
}
function it(e4, t2) {
  if (t2.shapes = [], Array.isArray(e4)) for (let n2 = 0, r2 = e4.length; n2 < r2; n2++) {
    let r3 = e4[n2];
    t2.shapes.push(r3.uuid);
  }
  else t2.shapes.push(e4.uuid);
  return t2;
}
function at(e4) {
  let t2 = {};
  for (let n2 in e4) {
    t2[n2] = {};
    for (let r2 in e4[n2]) {
      let i2 = e4[n2][r2];
      if (st(i2)) i2.isRenderTargetTexture ? (l(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`), t2[n2][r2] = null) : t2[n2][r2] = i2.clone();
      else if (Array.isArray(i2)) if (st(i2[0])) {
        let e5 = [];
        for (let t3 = 0, n3 = i2.length; t3 < n3; t3++) e5[t3] = i2[t3].clone();
        t2[n2][r2] = e5;
      } else t2[n2][r2] = i2.slice();
      else t2[n2][r2] = i2;
    }
  }
  return t2;
}
function ot(e4) {
  let t2 = {};
  for (let n2 = 0; n2 < e4.length; n2++) {
    let r2 = at(e4[n2]);
    for (let e5 in r2) t2[e5] = r2[e5];
  }
  return t2;
}
function st(e4) {
  return e4 && (e4.isColor || e4.isMatrix3 || e4.isMatrix4 || e4.isVector2 || e4.isVector3 || e4.isVector4 || e4.isTexture || e4.isQuaternion);
}
function ct(e4) {
  let t2 = [];
  for (let n2 = 0; n2 < e4.length; n2++) t2.push(e4[n2].clone());
  return t2;
}
function lt(e4) {
  let t2 = e4.getRenderTarget();
  return t2 === null ? e4.outputColorSpace : t2.isXRRenderTarget === true ? t2.texture.colorSpace : dr.workingColorSpace;
}
function ut(e4, t2) {
  return !e4 || e4.constructor === t2 ? e4 : typeof t2.BYTES_PER_ELEMENT == `number` ? new t2(e4) : Array.prototype.slice.call(e4);
}
function dt() {
  this._document.hidden === false && this.reset();
}
function ft(e4, t2) {
  return e4.distance - t2.distance;
}
function pt(e4, t2, n2, r2) {
  let i2 = true;
  if (e4.layers.test(t2.layers) && e4.raycast(t2, n2) === false && (i2 = false), i2 === true && r2 === true) {
    let r3 = e4.children;
    for (let e5 = 0, i3 = r3.length; e5 < i3; e5++) pt(r3[e5], t2, n2, true);
  }
}
function mt(e4, t2, n2, r2) {
  let i2 = ht(r2);
  switch (n2) {
    case zt:
      return e4 * t2;
    case Wt:
      return e4 * t2 / i2.components * i2.byteLength;
    case Gt:
      return e4 * t2 / i2.components * i2.byteLength;
    case Kt:
      return e4 * t2 * 2 / i2.components * i2.byteLength;
    case qt:
      return e4 * t2 * 2 / i2.components * i2.byteLength;
    case Bt:
      return e4 * t2 * 3 / i2.components * i2.byteLength;
    case Vt:
      return e4 * t2 * 4 / i2.components * i2.byteLength;
    case Jt:
      return e4 * t2 * 4 / i2.components * i2.byteLength;
    case Yt:
    case Xt:
      return Math.floor((e4 + 3) / 4) * Math.floor((t2 + 3) / 4) * 8;
    case Zt:
    case Qt:
      return Math.floor((e4 + 3) / 4) * Math.floor((t2 + 3) / 4) * 16;
    case en:
    case nn:
      return Math.max(e4, 16) * Math.max(t2, 8) / 4;
    case $t:
    case tn:
      return Math.max(e4, 8) * Math.max(t2, 8) / 2;
    case rn:
    case an:
    case sn:
    case cn:
      return Math.floor((e4 + 3) / 4) * Math.floor((t2 + 3) / 4) * 8;
    case on:
    case ln:
    case un:
      return Math.floor((e4 + 3) / 4) * Math.floor((t2 + 3) / 4) * 16;
    case dn:
      return Math.floor((e4 + 3) / 4) * Math.floor((t2 + 3) / 4) * 16;
    case fn:
      return Math.floor((e4 + 4) / 5) * Math.floor((t2 + 3) / 4) * 16;
    case pn:
      return Math.floor((e4 + 4) / 5) * Math.floor((t2 + 4) / 5) * 16;
    case mn:
      return Math.floor((e4 + 5) / 6) * Math.floor((t2 + 4) / 5) * 16;
    case hn:
      return Math.floor((e4 + 5) / 6) * Math.floor((t2 + 5) / 6) * 16;
    case gn:
      return Math.floor((e4 + 7) / 8) * Math.floor((t2 + 4) / 5) * 16;
    case _n:
      return Math.floor((e4 + 7) / 8) * Math.floor((t2 + 5) / 6) * 16;
    case vn:
      return Math.floor((e4 + 7) / 8) * Math.floor((t2 + 7) / 8) * 16;
    case yn:
      return Math.floor((e4 + 9) / 10) * Math.floor((t2 + 4) / 5) * 16;
    case bn:
      return Math.floor((e4 + 9) / 10) * Math.floor((t2 + 5) / 6) * 16;
    case xn:
      return Math.floor((e4 + 9) / 10) * Math.floor((t2 + 7) / 8) * 16;
    case Sn:
      return Math.floor((e4 + 9) / 10) * Math.floor((t2 + 9) / 10) * 16;
    case Cn:
      return Math.floor((e4 + 11) / 12) * Math.floor((t2 + 9) / 10) * 16;
    case wn:
      return Math.floor((e4 + 11) / 12) * Math.floor((t2 + 11) / 12) * 16;
    case Tn:
    case En:
    case Dn:
      return Math.ceil(e4 / 4) * Math.ceil(t2 / 4) * 16;
    case On:
    case kn:
      return Math.ceil(e4 / 4) * Math.ceil(t2 / 4) * 8;
    case An:
    case jn:
      return Math.ceil(e4 / 4) * Math.ceil(t2 / 4) * 16;
  }
  throw Error(`Unable to determine texture byte length for ${n2} format.`);
}
function ht(e4) {
  switch (e4) {
    case Et:
    case Dt:
      return { byteLength: 1, components: 1 };
    case kt:
    case Ot:
    case Nt:
      return { byteLength: 2, components: 1 };
    case Pt:
    case Ft:
      return { byteLength: 2, components: 4 };
    case jt:
    case At:
    case Mt:
      return { byteLength: 4, components: 1 };
    case Lt:
    case Rt:
      return { byteLength: 4, components: 3 };
  }
  throw Error(`Unknown texture type ${e4}.`);
}
var gt, _t, vt, yt, bt, xt, St, Ct, wt, Tt, Et, Dt, Ot, kt, At, jt, Mt, Nt, Pt, Ft, It, Lt, Rt, zt, Bt, Vt, Ht, Ut, Wt, Gt, Kt, qt, Jt, Yt, Xt, Zt, Qt, $t, en, tn, nn, rn, an, on, sn, cn, ln, un, dn, fn, pn, mn, hn, gn, _n, vn, yn, bn, xn, Sn, Cn, wn, Tn, En, Dn, On, kn, An, jn, Mn, Nn, Pn, Fn, In, Ln, Rn, zn, Bn, Vn, Hn, Un, Wn, Gn, Kn, qn, Jn, Yn, Xn, Zn, Qn, $n, er, tr, nr, rr, M, ir, N, ar, or, sr, cr, lr, ur, dr, fr, pr, mr, hr, gr, _r, vr, yr, br, xr, Sr, Cr, wr, Tr, Er, Dr, Or, kr, Ar, jr, Mr, Nr, Pr, Fr, Ir, Lr, Rr, zr, Br, Vr, Hr, Ur, Wr, Gr, Kr, qr, Jr, Yr, Xr, Zr, Qr, $r, ei, ti, ni, ri, P, ii, ai, oi, si, ci, li, ui, di, fi, pi, mi, hi, gi, _i, vi, yi, bi, xi, Si, Ci, wi, Ti, Ei, Di, Oi, ki, Ai, ji, Mi, Ni, Pi, Fi, Ii, Li, Ri, zi, Bi, Vi, Hi, Ui, Wi, Gi, Ki, qi, Ji, Yi, Xi, Zi, Qi, $i, ea, ta, na, ra, ia, aa, oa, sa, ca, la, ua, da, fa, pa, ma, ha, ga, _a, va, ya, ba, xa, Sa, Ca, wa, Ta, Ea, Da, Oa, ka, Aa, ja, Ma, Na, Pa, Fa, Ia, La, Ra, za, Ba, Va, Ha, Ua, Wa, Ga, Ka, qa, Ja, Ya, Xa, Za, Qa, $a, eo, to, no, ro, io, ao, oo, so, co, lo, uo, fo, po, mo, ho, go, _o, vo, yo, bo, xo, So, Co, wo, To, Eo, Do, Oo, ko, Ao, jo, Mo, No, Po, Fo, Io, Lo, Ro, zo, Bo, Vo, Ho, Uo, Wo, Go, Ko, qo, Jo, Yo, Xo, Zo, Qo, $o, es, ts, ns, rs, is, as, os, ss, cs, ls, us, ds, fs, ps, ms, hs, gs, _s, vs, ys, bs, xs, Ss, Cs, ws, Ts, Es, Ds, Os, ks, As, js, Ms, Ns, Ps, Fs, Is, Ls, Rs, zs, Bs, Vs, Hs, Us, Ws, Gs, Ks, qs, Js, Ys, Xs, Zs, Qs, $s, ec, tc, nc, rc, ic, ac, oc, sc, cc = t((() => {
  gt = `attached`, _t = 1e3, vt = 1001, yt = 1002, bt = 1003, xt = 1004, St = 1005, Ct = 1006, wt = 1007, Tt = 1008, Et = 1009, Dt = 1010, Ot = 1011, kt = 1012, At = 1013, jt = 1014, Mt = 1015, Nt = 1016, Pt = 1017, Ft = 1018, It = 1020, Lt = 35902, Rt = 35899, zt = 1021, Bt = 1022, Vt = 1023, Ht = 1026, Ut = 1027, Wt = 1028, Gt = 1029, Kt = 1030, qt = 1031, Jt = 1033, Yt = 33776, Xt = 33777, Zt = 33778, Qt = 33779, $t = 35840, en = 35841, tn = 35842, nn = 35843, rn = 36196, an = 37492, on = 37496, sn = 37488, cn = 37489, ln = 37490, un = 37491, dn = 37808, fn = 37809, pn = 37810, mn = 37811, hn = 37812, gn = 37813, _n = 37814, vn = 37815, yn = 37816, bn = 37817, xn = 37818, Sn = 37819, Cn = 37820, wn = 37821, Tn = 36492, En = 36494, Dn = 36495, On = 36283, kn = 36284, An = 36285, jn = 36286, Mn = 2300, Nn = 2301, Pn = 2302, Fn = 2303, In = 2400, Ln = 2401, Rn = 2402, zn = 3200, Bn = 3201, Vn = `srgb`, Hn = `srgb-linear`, Un = `linear`, Wn = `srgb`, Gn = 7680, Kn = 35044, qn = 35048, Jn = 2e3, Yn = {}, Xn = null, Zn = { 0: 1, 2: 6, 4: 7, 3: 5, 1: 0, 6: 2, 7: 4, 5: 3 }, Qn = class {
    addEventListener(e4, t2) {
      this._listeners === void 0 && (this._listeners = {});
      let n2 = this._listeners;
      n2[e4] === void 0 && (n2[e4] = []), n2[e4].indexOf(t2) === -1 && n2[e4].push(t2);
    }
    hasEventListener(e4, t2) {
      let n2 = this._listeners;
      return n2 === void 0 ? false : n2[e4] !== void 0 && n2[e4].indexOf(t2) !== -1;
    }
    removeEventListener(e4, t2) {
      let n2 = this._listeners;
      if (n2 === void 0) return;
      let r2 = n2[e4];
      if (r2 !== void 0) {
        let e5 = r2.indexOf(t2);
        e5 !== -1 && r2.splice(e5, 1);
      }
    }
    dispatchEvent(e4) {
      let t2 = this._listeners;
      if (t2 === void 0) return;
      let n2 = t2[e4.type];
      if (n2 !== void 0) {
        e4.target = this;
        let t3 = n2.slice(0);
        for (let n3 = 0, r2 = t3.length; n3 < r2; n3++) t3[n3].call(this, e4);
        e4.target = null;
      }
    }
  }, $n = `00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`), er = 1234567, tr = Math.PI / 180, nr = 180 / Math.PI, rr = { DEG2RAD: tr, RAD2DEG: nr, generateUUID: p, clamp: m, euclideanModulo: h, mapLinear: g, inverseLerp: _, lerp: v, damp: y, pingpong: b, smoothstep: x, smootherstep: S, randInt: C, randFloat: w, randFloatSpread: T, seededRandom: E, degToRad: D, radToDeg: O, isPowerOfTwo: k, ceilPowerOfTwo: A, floorPowerOfTwo: ee, setQuaternionFromProperEuler: te, normalize: re, denormalize: ne }, M = class e4 {
    static {
      e4.prototype.isVector2 = true;
    }
    constructor(e5 = 0, t2 = 0) {
      this.x = e5, this.y = t2;
    }
    get width() {
      return this.x;
    }
    set width(e5) {
      this.x = e5;
    }
    get height() {
      return this.y;
    }
    set height(e5) {
      this.y = e5;
    }
    set(e5, t2) {
      return this.x = e5, this.y = t2, this;
    }
    setScalar(e5) {
      return this.x = e5, this.y = e5, this;
    }
    setX(e5) {
      return this.x = e5, this;
    }
    setY(e5) {
      return this.y = e5, this;
    }
    setComponent(e5, t2) {
      switch (e5) {
        case 0:
          this.x = t2;
          break;
        case 1:
          this.y = t2;
          break;
        default:
          throw Error(`index is out of range: ` + e5);
      }
      return this;
    }
    getComponent(e5) {
      switch (e5) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        default:
          throw Error(`index is out of range: ` + e5);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y);
    }
    copy(e5) {
      return this.x = e5.x, this.y = e5.y, this;
    }
    add(e5) {
      return this.x += e5.x, this.y += e5.y, this;
    }
    addScalar(e5) {
      return this.x += e5, this.y += e5, this;
    }
    addVectors(e5, t2) {
      return this.x = e5.x + t2.x, this.y = e5.y + t2.y, this;
    }
    addScaledVector(e5, t2) {
      return this.x += e5.x * t2, this.y += e5.y * t2, this;
    }
    sub(e5) {
      return this.x -= e5.x, this.y -= e5.y, this;
    }
    subScalar(e5) {
      return this.x -= e5, this.y -= e5, this;
    }
    subVectors(e5, t2) {
      return this.x = e5.x - t2.x, this.y = e5.y - t2.y, this;
    }
    multiply(e5) {
      return this.x *= e5.x, this.y *= e5.y, this;
    }
    multiplyScalar(e5) {
      return this.x *= e5, this.y *= e5, this;
    }
    divide(e5) {
      return this.x /= e5.x, this.y /= e5.y, this;
    }
    divideScalar(e5) {
      return this.multiplyScalar(1 / e5);
    }
    applyMatrix3(e5) {
      let t2 = this.x, n2 = this.y, r2 = e5.elements;
      return this.x = r2[0] * t2 + r2[3] * n2 + r2[6], this.y = r2[1] * t2 + r2[4] * n2 + r2[7], this;
    }
    min(e5) {
      return this.x = Math.min(this.x, e5.x), this.y = Math.min(this.y, e5.y), this;
    }
    max(e5) {
      return this.x = Math.max(this.x, e5.x), this.y = Math.max(this.y, e5.y), this;
    }
    clamp(e5, t2) {
      return this.x = m(this.x, e5.x, t2.x), this.y = m(this.y, e5.y, t2.y), this;
    }
    clampScalar(e5, t2) {
      return this.x = m(this.x, e5, t2), this.y = m(this.y, e5, t2), this;
    }
    clampLength(e5, t2) {
      let n2 = this.length();
      return this.divideScalar(n2 || 1).multiplyScalar(m(n2, e5, t2));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this;
    }
    dot(e5) {
      return this.x * e5.x + this.y * e5.y;
    }
    cross(e5) {
      return this.x * e5.y - this.y * e5.x;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    angle() {
      return Math.atan2(-this.y, -this.x) + Math.PI;
    }
    angleTo(e5) {
      let t2 = Math.sqrt(this.lengthSq() * e5.lengthSq());
      if (t2 === 0) return Math.PI / 2;
      let n2 = this.dot(e5) / t2;
      return Math.acos(m(n2, -1, 1));
    }
    distanceTo(e5) {
      return Math.sqrt(this.distanceToSquared(e5));
    }
    distanceToSquared(e5) {
      let t2 = this.x - e5.x, n2 = this.y - e5.y;
      return t2 * t2 + n2 * n2;
    }
    manhattanDistanceTo(e5) {
      return Math.abs(this.x - e5.x) + Math.abs(this.y - e5.y);
    }
    setLength(e5) {
      return this.normalize().multiplyScalar(e5);
    }
    lerp(e5, t2) {
      return this.x += (e5.x - this.x) * t2, this.y += (e5.y - this.y) * t2, this;
    }
    lerpVectors(e5, t2, n2) {
      return this.x = e5.x + (t2.x - e5.x) * n2, this.y = e5.y + (t2.y - e5.y) * n2, this;
    }
    equals(e5) {
      return e5.x === this.x && e5.y === this.y;
    }
    fromArray(e5, t2 = 0) {
      return this.x = e5[t2], this.y = e5[t2 + 1], this;
    }
    toArray(e5 = [], t2 = 0) {
      return e5[t2] = this.x, e5[t2 + 1] = this.y, e5;
    }
    fromBufferAttribute(e5, t2) {
      return this.x = e5.getX(t2), this.y = e5.getY(t2), this;
    }
    rotateAround(e5, t2) {
      let n2 = Math.cos(t2), r2 = Math.sin(t2), i2 = this.x - e5.x, a2 = this.y - e5.y;
      return this.x = i2 * n2 - a2 * r2 + e5.x, this.y = i2 * r2 + a2 * n2 + e5.y, this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y;
    }
  }, ir = class {
    constructor(e4 = 0, t2 = 0, n2 = 0, r2 = 1) {
      this.isQuaternion = true, this._x = e4, this._y = t2, this._z = n2, this._w = r2;
    }
    static slerpFlat(e4, t2, n2, r2, i2, a2, o2) {
      let s2 = n2[r2 + 0], c2 = n2[r2 + 1], l2 = n2[r2 + 2], u2 = n2[r2 + 3], d2 = i2[a2 + 0], f2 = i2[a2 + 1], p2 = i2[a2 + 2], m2 = i2[a2 + 3];
      if (u2 !== m2 || s2 !== d2 || c2 !== f2 || l2 !== p2) {
        let e5 = s2 * d2 + c2 * f2 + l2 * p2 + u2 * m2;
        e5 < 0 && (d2 = -d2, f2 = -f2, p2 = -p2, m2 = -m2, e5 = -e5);
        let t3 = 1 - o2;
        if (e5 < 0.9995) {
          let n3 = Math.acos(e5), r3 = Math.sin(n3);
          t3 = Math.sin(t3 * n3) / r3, o2 = Math.sin(o2 * n3) / r3, s2 = s2 * t3 + d2 * o2, c2 = c2 * t3 + f2 * o2, l2 = l2 * t3 + p2 * o2, u2 = u2 * t3 + m2 * o2;
        } else {
          s2 = s2 * t3 + d2 * o2, c2 = c2 * t3 + f2 * o2, l2 = l2 * t3 + p2 * o2, u2 = u2 * t3 + m2 * o2;
          let e6 = 1 / Math.sqrt(s2 * s2 + c2 * c2 + l2 * l2 + u2 * u2);
          s2 *= e6, c2 *= e6, l2 *= e6, u2 *= e6;
        }
      }
      e4[t2] = s2, e4[t2 + 1] = c2, e4[t2 + 2] = l2, e4[t2 + 3] = u2;
    }
    static multiplyQuaternionsFlat(e4, t2, n2, r2, i2, a2) {
      let o2 = n2[r2], s2 = n2[r2 + 1], c2 = n2[r2 + 2], l2 = n2[r2 + 3], u2 = i2[a2], d2 = i2[a2 + 1], f2 = i2[a2 + 2], p2 = i2[a2 + 3];
      return e4[t2] = o2 * p2 + l2 * u2 + s2 * f2 - c2 * d2, e4[t2 + 1] = s2 * p2 + l2 * d2 + c2 * u2 - o2 * f2, e4[t2 + 2] = c2 * p2 + l2 * f2 + o2 * d2 - s2 * u2, e4[t2 + 3] = l2 * p2 - o2 * u2 - s2 * d2 - c2 * f2, e4;
    }
    get x() {
      return this._x;
    }
    set x(e4) {
      this._x = e4, this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(e4) {
      this._y = e4, this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(e4) {
      this._z = e4, this._onChangeCallback();
    }
    get w() {
      return this._w;
    }
    set w(e4) {
      this._w = e4, this._onChangeCallback();
    }
    set(e4, t2, n2, r2) {
      return this._x = e4, this._y = t2, this._z = n2, this._w = r2, this._onChangeCallback(), this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._w);
    }
    copy(e4) {
      return this._x = e4.x, this._y = e4.y, this._z = e4.z, this._w = e4.w, this._onChangeCallback(), this;
    }
    setFromEuler(e4, t2 = true) {
      let n2 = e4._x, r2 = e4._y, i2 = e4._z, a2 = e4._order, o2 = Math.cos, s2 = Math.sin, c2 = o2(n2 / 2), u2 = o2(r2 / 2), d2 = o2(i2 / 2), f2 = s2(n2 / 2), p2 = s2(r2 / 2), m2 = s2(i2 / 2);
      switch (a2) {
        case `XYZ`:
          this._x = f2 * u2 * d2 + c2 * p2 * m2, this._y = c2 * p2 * d2 - f2 * u2 * m2, this._z = c2 * u2 * m2 + f2 * p2 * d2, this._w = c2 * u2 * d2 - f2 * p2 * m2;
          break;
        case `YXZ`:
          this._x = f2 * u2 * d2 + c2 * p2 * m2, this._y = c2 * p2 * d2 - f2 * u2 * m2, this._z = c2 * u2 * m2 - f2 * p2 * d2, this._w = c2 * u2 * d2 + f2 * p2 * m2;
          break;
        case `ZXY`:
          this._x = f2 * u2 * d2 - c2 * p2 * m2, this._y = c2 * p2 * d2 + f2 * u2 * m2, this._z = c2 * u2 * m2 + f2 * p2 * d2, this._w = c2 * u2 * d2 - f2 * p2 * m2;
          break;
        case `ZYX`:
          this._x = f2 * u2 * d2 - c2 * p2 * m2, this._y = c2 * p2 * d2 + f2 * u2 * m2, this._z = c2 * u2 * m2 - f2 * p2 * d2, this._w = c2 * u2 * d2 + f2 * p2 * m2;
          break;
        case `YZX`:
          this._x = f2 * u2 * d2 + c2 * p2 * m2, this._y = c2 * p2 * d2 + f2 * u2 * m2, this._z = c2 * u2 * m2 - f2 * p2 * d2, this._w = c2 * u2 * d2 - f2 * p2 * m2;
          break;
        case `XZY`:
          this._x = f2 * u2 * d2 - c2 * p2 * m2, this._y = c2 * p2 * d2 - f2 * u2 * m2, this._z = c2 * u2 * m2 + f2 * p2 * d2, this._w = c2 * u2 * d2 + f2 * p2 * m2;
          break;
        default:
          l(`Quaternion: .setFromEuler() encountered an unknown order: ` + a2);
      }
      return t2 === true && this._onChangeCallback(), this;
    }
    setFromAxisAngle(e4, t2) {
      let n2 = t2 / 2, r2 = Math.sin(n2);
      return this._x = e4.x * r2, this._y = e4.y * r2, this._z = e4.z * r2, this._w = Math.cos(n2), this._onChangeCallback(), this;
    }
    setFromRotationMatrix(e4) {
      let t2 = e4.elements, n2 = t2[0], r2 = t2[4], i2 = t2[8], a2 = t2[1], o2 = t2[5], s2 = t2[9], c2 = t2[2], l2 = t2[6], u2 = t2[10], d2 = n2 + o2 + u2;
      if (d2 > 0) {
        let e5 = 0.5 / Math.sqrt(d2 + 1);
        this._w = 0.25 / e5, this._x = (l2 - s2) * e5, this._y = (i2 - c2) * e5, this._z = (a2 - r2) * e5;
      } else if (n2 > o2 && n2 > u2) {
        let e5 = 2 * Math.sqrt(1 + n2 - o2 - u2);
        this._w = (l2 - s2) / e5, this._x = 0.25 * e5, this._y = (r2 + a2) / e5, this._z = (i2 + c2) / e5;
      } else if (o2 > u2) {
        let e5 = 2 * Math.sqrt(1 + o2 - n2 - u2);
        this._w = (i2 - c2) / e5, this._x = (r2 + a2) / e5, this._y = 0.25 * e5, this._z = (s2 + l2) / e5;
      } else {
        let e5 = 2 * Math.sqrt(1 + u2 - n2 - o2);
        this._w = (a2 - r2) / e5, this._x = (i2 + c2) / e5, this._y = (s2 + l2) / e5, this._z = 0.25 * e5;
      }
      return this._onChangeCallback(), this;
    }
    setFromUnitVectors(e4, t2) {
      let n2 = e4.dot(t2) + 1;
      return n2 < 1e-8 ? (n2 = 0, Math.abs(e4.x) > Math.abs(e4.z) ? (this._x = -e4.y, this._y = e4.x, this._z = 0, this._w = n2) : (this._x = 0, this._y = -e4.z, this._z = e4.y, this._w = n2)) : (this._x = e4.y * t2.z - e4.z * t2.y, this._y = e4.z * t2.x - e4.x * t2.z, this._z = e4.x * t2.y - e4.y * t2.x, this._w = n2), this.normalize();
    }
    angleTo(e4) {
      return 2 * Math.acos(Math.abs(m(this.dot(e4), -1, 1)));
    }
    rotateTowards(e4, t2) {
      let n2 = this.angleTo(e4);
      if (n2 === 0) return this;
      let r2 = Math.min(1, t2 / n2);
      return this.slerp(e4, r2), this;
    }
    identity() {
      return this.set(0, 0, 0, 1);
    }
    invert() {
      return this.conjugate();
    }
    conjugate() {
      return this._x *= -1, this._y *= -1, this._z *= -1, this._onChangeCallback(), this;
    }
    dot(e4) {
      return this._x * e4._x + this._y * e4._y + this._z * e4._z + this._w * e4._w;
    }
    lengthSq() {
      return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
    }
    length() {
      return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
    }
    normalize() {
      let e4 = this.length();
      return e4 === 0 ? (this._x = 0, this._y = 0, this._z = 0, this._w = 1) : (e4 = 1 / e4, this._x *= e4, this._y *= e4, this._z *= e4, this._w *= e4), this._onChangeCallback(), this;
    }
    multiply(e4) {
      return this.multiplyQuaternions(this, e4);
    }
    premultiply(e4) {
      return this.multiplyQuaternions(e4, this);
    }
    multiplyQuaternions(e4, t2) {
      let n2 = e4._x, r2 = e4._y, i2 = e4._z, a2 = e4._w, o2 = t2._x, s2 = t2._y, c2 = t2._z, l2 = t2._w;
      return this._x = n2 * l2 + a2 * o2 + r2 * c2 - i2 * s2, this._y = r2 * l2 + a2 * s2 + i2 * o2 - n2 * c2, this._z = i2 * l2 + a2 * c2 + n2 * s2 - r2 * o2, this._w = a2 * l2 - n2 * o2 - r2 * s2 - i2 * c2, this._onChangeCallback(), this;
    }
    slerp(e4, t2) {
      let n2 = e4._x, r2 = e4._y, i2 = e4._z, a2 = e4._w, o2 = this.dot(e4);
      o2 < 0 && (n2 = -n2, r2 = -r2, i2 = -i2, a2 = -a2, o2 = -o2);
      let s2 = 1 - t2;
      if (o2 < 0.9995) {
        let e5 = Math.acos(o2), c2 = Math.sin(e5);
        s2 = Math.sin(s2 * e5) / c2, t2 = Math.sin(t2 * e5) / c2, this._x = this._x * s2 + n2 * t2, this._y = this._y * s2 + r2 * t2, this._z = this._z * s2 + i2 * t2, this._w = this._w * s2 + a2 * t2, this._onChangeCallback();
      } else this._x = this._x * s2 + n2 * t2, this._y = this._y * s2 + r2 * t2, this._z = this._z * s2 + i2 * t2, this._w = this._w * s2 + a2 * t2, this.normalize();
      return this;
    }
    slerpQuaternions(e4, t2, n2) {
      return this.copy(e4).slerp(t2, n2);
    }
    random() {
      let e4 = 2 * Math.PI * Math.random(), t2 = 2 * Math.PI * Math.random(), n2 = Math.random(), r2 = Math.sqrt(1 - n2), i2 = Math.sqrt(n2);
      return this.set(r2 * Math.sin(e4), r2 * Math.cos(e4), i2 * Math.sin(t2), i2 * Math.cos(t2));
    }
    equals(e4) {
      return e4._x === this._x && e4._y === this._y && e4._z === this._z && e4._w === this._w;
    }
    fromArray(e4, t2 = 0) {
      return this._x = e4[t2], this._y = e4[t2 + 1], this._z = e4[t2 + 2], this._w = e4[t2 + 3], this._onChangeCallback(), this;
    }
    toArray(e4 = [], t2 = 0) {
      return e4[t2] = this._x, e4[t2 + 1] = this._y, e4[t2 + 2] = this._z, e4[t2 + 3] = this._w, e4;
    }
    fromBufferAttribute(e4, t2) {
      return this._x = e4.getX(t2), this._y = e4.getY(t2), this._z = e4.getZ(t2), this._w = e4.getW(t2), this._onChangeCallback(), this;
    }
    toJSON() {
      return this.toArray();
    }
    _onChange(e4) {
      return this._onChangeCallback = e4, this;
    }
    _onChangeCallback() {
    }
    *[Symbol.iterator]() {
      yield this._x, yield this._y, yield this._z, yield this._w;
    }
  }, N = class e4 {
    static {
      e4.prototype.isVector3 = true;
    }
    constructor(e5 = 0, t2 = 0, n2 = 0) {
      this.x = e5, this.y = t2, this.z = n2;
    }
    set(e5, t2, n2) {
      return n2 === void 0 && (n2 = this.z), this.x = e5, this.y = t2, this.z = n2, this;
    }
    setScalar(e5) {
      return this.x = e5, this.y = e5, this.z = e5, this;
    }
    setX(e5) {
      return this.x = e5, this;
    }
    setY(e5) {
      return this.y = e5, this;
    }
    setZ(e5) {
      return this.z = e5, this;
    }
    setComponent(e5, t2) {
      switch (e5) {
        case 0:
          this.x = t2;
          break;
        case 1:
          this.y = t2;
          break;
        case 2:
          this.z = t2;
          break;
        default:
          throw Error(`index is out of range: ` + e5);
      }
      return this;
    }
    getComponent(e5) {
      switch (e5) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        default:
          throw Error(`index is out of range: ` + e5);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z);
    }
    copy(e5) {
      return this.x = e5.x, this.y = e5.y, this.z = e5.z, this;
    }
    add(e5) {
      return this.x += e5.x, this.y += e5.y, this.z += e5.z, this;
    }
    addScalar(e5) {
      return this.x += e5, this.y += e5, this.z += e5, this;
    }
    addVectors(e5, t2) {
      return this.x = e5.x + t2.x, this.y = e5.y + t2.y, this.z = e5.z + t2.z, this;
    }
    addScaledVector(e5, t2) {
      return this.x += e5.x * t2, this.y += e5.y * t2, this.z += e5.z * t2, this;
    }
    sub(e5) {
      return this.x -= e5.x, this.y -= e5.y, this.z -= e5.z, this;
    }
    subScalar(e5) {
      return this.x -= e5, this.y -= e5, this.z -= e5, this;
    }
    subVectors(e5, t2) {
      return this.x = e5.x - t2.x, this.y = e5.y - t2.y, this.z = e5.z - t2.z, this;
    }
    multiply(e5) {
      return this.x *= e5.x, this.y *= e5.y, this.z *= e5.z, this;
    }
    multiplyScalar(e5) {
      return this.x *= e5, this.y *= e5, this.z *= e5, this;
    }
    multiplyVectors(e5, t2) {
      return this.x = e5.x * t2.x, this.y = e5.y * t2.y, this.z = e5.z * t2.z, this;
    }
    applyEuler(e5) {
      return this.applyQuaternion(or.setFromEuler(e5));
    }
    applyAxisAngle(e5, t2) {
      return this.applyQuaternion(or.setFromAxisAngle(e5, t2));
    }
    applyMatrix3(e5) {
      let t2 = this.x, n2 = this.y, r2 = this.z, i2 = e5.elements;
      return this.x = i2[0] * t2 + i2[3] * n2 + i2[6] * r2, this.y = i2[1] * t2 + i2[4] * n2 + i2[7] * r2, this.z = i2[2] * t2 + i2[5] * n2 + i2[8] * r2, this;
    }
    applyNormalMatrix(e5) {
      return this.applyMatrix3(e5).normalize();
    }
    applyMatrix4(e5) {
      let t2 = this.x, n2 = this.y, r2 = this.z, i2 = e5.elements, a2 = 1 / (i2[3] * t2 + i2[7] * n2 + i2[11] * r2 + i2[15]);
      return this.x = (i2[0] * t2 + i2[4] * n2 + i2[8] * r2 + i2[12]) * a2, this.y = (i2[1] * t2 + i2[5] * n2 + i2[9] * r2 + i2[13]) * a2, this.z = (i2[2] * t2 + i2[6] * n2 + i2[10] * r2 + i2[14]) * a2, this;
    }
    applyQuaternion(e5) {
      let t2 = this.x, n2 = this.y, r2 = this.z, i2 = e5.x, a2 = e5.y, o2 = e5.z, s2 = e5.w, c2 = 2 * (a2 * r2 - o2 * n2), l2 = 2 * (o2 * t2 - i2 * r2), u2 = 2 * (i2 * n2 - a2 * t2);
      return this.x = t2 + s2 * c2 + a2 * u2 - o2 * l2, this.y = n2 + s2 * l2 + o2 * c2 - i2 * u2, this.z = r2 + s2 * u2 + i2 * l2 - a2 * c2, this;
    }
    project(e5) {
      return this.applyMatrix4(e5.matrixWorldInverse).applyMatrix4(e5.projectionMatrix);
    }
    unproject(e5) {
      return this.applyMatrix4(e5.projectionMatrixInverse).applyMatrix4(e5.matrixWorld);
    }
    transformDirection(e5) {
      let t2 = this.x, n2 = this.y, r2 = this.z, i2 = e5.elements;
      return this.x = i2[0] * t2 + i2[4] * n2 + i2[8] * r2, this.y = i2[1] * t2 + i2[5] * n2 + i2[9] * r2, this.z = i2[2] * t2 + i2[6] * n2 + i2[10] * r2, this.normalize();
    }
    divide(e5) {
      return this.x /= e5.x, this.y /= e5.y, this.z /= e5.z, this;
    }
    divideScalar(e5) {
      return this.multiplyScalar(1 / e5);
    }
    min(e5) {
      return this.x = Math.min(this.x, e5.x), this.y = Math.min(this.y, e5.y), this.z = Math.min(this.z, e5.z), this;
    }
    max(e5) {
      return this.x = Math.max(this.x, e5.x), this.y = Math.max(this.y, e5.y), this.z = Math.max(this.z, e5.z), this;
    }
    clamp(e5, t2) {
      return this.x = m(this.x, e5.x, t2.x), this.y = m(this.y, e5.y, t2.y), this.z = m(this.z, e5.z, t2.z), this;
    }
    clampScalar(e5, t2) {
      return this.x = m(this.x, e5, t2), this.y = m(this.y, e5, t2), this.z = m(this.z, e5, t2), this;
    }
    clampLength(e5, t2) {
      let n2 = this.length();
      return this.divideScalar(n2 || 1).multiplyScalar(m(n2, e5, t2));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this.z = -this.z, this;
    }
    dot(e5) {
      return this.x * e5.x + this.y * e5.y + this.z * e5.z;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(e5) {
      return this.normalize().multiplyScalar(e5);
    }
    lerp(e5, t2) {
      return this.x += (e5.x - this.x) * t2, this.y += (e5.y - this.y) * t2, this.z += (e5.z - this.z) * t2, this;
    }
    lerpVectors(e5, t2, n2) {
      return this.x = e5.x + (t2.x - e5.x) * n2, this.y = e5.y + (t2.y - e5.y) * n2, this.z = e5.z + (t2.z - e5.z) * n2, this;
    }
    cross(e5) {
      return this.crossVectors(this, e5);
    }
    crossVectors(e5, t2) {
      let n2 = e5.x, r2 = e5.y, i2 = e5.z, a2 = t2.x, o2 = t2.y, s2 = t2.z;
      return this.x = r2 * s2 - i2 * o2, this.y = i2 * a2 - n2 * s2, this.z = n2 * o2 - r2 * a2, this;
    }
    projectOnVector(e5) {
      let t2 = e5.lengthSq();
      if (t2 === 0) return this.set(0, 0, 0);
      let n2 = e5.dot(this) / t2;
      return this.copy(e5).multiplyScalar(n2);
    }
    projectOnPlane(e5) {
      return ar.copy(this).projectOnVector(e5), this.sub(ar);
    }
    reflect(e5) {
      return this.sub(ar.copy(e5).multiplyScalar(2 * this.dot(e5)));
    }
    angleTo(e5) {
      let t2 = Math.sqrt(this.lengthSq() * e5.lengthSq());
      if (t2 === 0) return Math.PI / 2;
      let n2 = this.dot(e5) / t2;
      return Math.acos(m(n2, -1, 1));
    }
    distanceTo(e5) {
      return Math.sqrt(this.distanceToSquared(e5));
    }
    distanceToSquared(e5) {
      let t2 = this.x - e5.x, n2 = this.y - e5.y, r2 = this.z - e5.z;
      return t2 * t2 + n2 * n2 + r2 * r2;
    }
    manhattanDistanceTo(e5) {
      return Math.abs(this.x - e5.x) + Math.abs(this.y - e5.y) + Math.abs(this.z - e5.z);
    }
    setFromSpherical(e5) {
      return this.setFromSphericalCoords(e5.radius, e5.phi, e5.theta);
    }
    setFromSphericalCoords(e5, t2, n2) {
      let r2 = Math.sin(t2) * e5;
      return this.x = r2 * Math.sin(n2), this.y = Math.cos(t2) * e5, this.z = r2 * Math.cos(n2), this;
    }
    setFromCylindrical(e5) {
      return this.setFromCylindricalCoords(e5.radius, e5.theta, e5.y);
    }
    setFromCylindricalCoords(e5, t2, n2) {
      return this.x = e5 * Math.sin(t2), this.y = n2, this.z = e5 * Math.cos(t2), this;
    }
    setFromMatrixPosition(e5) {
      let t2 = e5.elements;
      return this.x = t2[12], this.y = t2[13], this.z = t2[14], this;
    }
    setFromMatrixScale(e5) {
      let t2 = this.setFromMatrixColumn(e5, 0).length(), n2 = this.setFromMatrixColumn(e5, 1).length(), r2 = this.setFromMatrixColumn(e5, 2).length();
      return this.x = t2, this.y = n2, this.z = r2, this;
    }
    setFromMatrixColumn(e5, t2) {
      return this.fromArray(e5.elements, t2 * 4);
    }
    setFromMatrix3Column(e5, t2) {
      return this.fromArray(e5.elements, t2 * 3);
    }
    setFromEuler(e5) {
      return this.x = e5._x, this.y = e5._y, this.z = e5._z, this;
    }
    setFromColor(e5) {
      return this.x = e5.r, this.y = e5.g, this.z = e5.b, this;
    }
    equals(e5) {
      return e5.x === this.x && e5.y === this.y && e5.z === this.z;
    }
    fromArray(e5, t2 = 0) {
      return this.x = e5[t2], this.y = e5[t2 + 1], this.z = e5[t2 + 2], this;
    }
    toArray(e5 = [], t2 = 0) {
      return e5[t2] = this.x, e5[t2 + 1] = this.y, e5[t2 + 2] = this.z, e5;
    }
    fromBufferAttribute(e5, t2) {
      return this.x = e5.getX(t2), this.y = e5.getY(t2), this.z = e5.getZ(t2), this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this;
    }
    randomDirection() {
      let e5 = Math.random() * Math.PI * 2, t2 = Math.random() * 2 - 1, n2 = Math.sqrt(1 - t2 * t2);
      return this.x = n2 * Math.cos(e5), this.y = t2, this.z = n2 * Math.sin(e5), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y, yield this.z;
    }
  }, ar = new N(), or = new ir(), sr = class e4 {
    static {
      e4.prototype.isMatrix3 = true;
    }
    constructor(e5, t2, n2, r2, i2, a2, o2, s2, c2) {
      this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1], e5 !== void 0 && this.set(e5, t2, n2, r2, i2, a2, o2, s2, c2);
    }
    set(e5, t2, n2, r2, i2, a2, o2, s2, c2) {
      let l2 = this.elements;
      return l2[0] = e5, l2[1] = r2, l2[2] = o2, l2[3] = t2, l2[4] = i2, l2[5] = s2, l2[6] = n2, l2[7] = a2, l2[8] = c2, this;
    }
    identity() {
      return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this;
    }
    copy(e5) {
      let t2 = this.elements, n2 = e5.elements;
      return t2[0] = n2[0], t2[1] = n2[1], t2[2] = n2[2], t2[3] = n2[3], t2[4] = n2[4], t2[5] = n2[5], t2[6] = n2[6], t2[7] = n2[7], t2[8] = n2[8], this;
    }
    extractBasis(e5, t2, n2) {
      return e5.setFromMatrix3Column(this, 0), t2.setFromMatrix3Column(this, 1), n2.setFromMatrix3Column(this, 2), this;
    }
    setFromMatrix4(e5) {
      let t2 = e5.elements;
      return this.set(t2[0], t2[4], t2[8], t2[1], t2[5], t2[9], t2[2], t2[6], t2[10]), this;
    }
    multiply(e5) {
      return this.multiplyMatrices(this, e5);
    }
    premultiply(e5) {
      return this.multiplyMatrices(e5, this);
    }
    multiplyMatrices(e5, t2) {
      let n2 = e5.elements, r2 = t2.elements, i2 = this.elements, a2 = n2[0], o2 = n2[3], s2 = n2[6], c2 = n2[1], l2 = n2[4], u2 = n2[7], d2 = n2[2], f2 = n2[5], p2 = n2[8], m2 = r2[0], h2 = r2[3], g2 = r2[6], _2 = r2[1], v2 = r2[4], y2 = r2[7], b2 = r2[2], x2 = r2[5], S2 = r2[8];
      return i2[0] = a2 * m2 + o2 * _2 + s2 * b2, i2[3] = a2 * h2 + o2 * v2 + s2 * x2, i2[6] = a2 * g2 + o2 * y2 + s2 * S2, i2[1] = c2 * m2 + l2 * _2 + u2 * b2, i2[4] = c2 * h2 + l2 * v2 + u2 * x2, i2[7] = c2 * g2 + l2 * y2 + u2 * S2, i2[2] = d2 * m2 + f2 * _2 + p2 * b2, i2[5] = d2 * h2 + f2 * v2 + p2 * x2, i2[8] = d2 * g2 + f2 * y2 + p2 * S2, this;
    }
    multiplyScalar(e5) {
      let t2 = this.elements;
      return t2[0] *= e5, t2[3] *= e5, t2[6] *= e5, t2[1] *= e5, t2[4] *= e5, t2[7] *= e5, t2[2] *= e5, t2[5] *= e5, t2[8] *= e5, this;
    }
    determinant() {
      let e5 = this.elements, t2 = e5[0], n2 = e5[1], r2 = e5[2], i2 = e5[3], a2 = e5[4], o2 = e5[5], s2 = e5[6], c2 = e5[7], l2 = e5[8];
      return t2 * a2 * l2 - t2 * o2 * c2 - n2 * i2 * l2 + n2 * o2 * s2 + r2 * i2 * c2 - r2 * a2 * s2;
    }
    invert() {
      let e5 = this.elements, t2 = e5[0], n2 = e5[1], r2 = e5[2], i2 = e5[3], a2 = e5[4], o2 = e5[5], s2 = e5[6], c2 = e5[7], l2 = e5[8], u2 = l2 * a2 - o2 * c2, d2 = o2 * s2 - l2 * i2, f2 = c2 * i2 - a2 * s2, p2 = t2 * u2 + n2 * d2 + r2 * f2;
      if (p2 === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
      let m2 = 1 / p2;
      return e5[0] = u2 * m2, e5[1] = (r2 * c2 - l2 * n2) * m2, e5[2] = (o2 * n2 - r2 * a2) * m2, e5[3] = d2 * m2, e5[4] = (l2 * t2 - r2 * s2) * m2, e5[5] = (r2 * i2 - o2 * t2) * m2, e5[6] = f2 * m2, e5[7] = (n2 * s2 - c2 * t2) * m2, e5[8] = (a2 * t2 - n2 * i2) * m2, this;
    }
    transpose() {
      let e5, t2 = this.elements;
      return e5 = t2[1], t2[1] = t2[3], t2[3] = e5, e5 = t2[2], t2[2] = t2[6], t2[6] = e5, e5 = t2[5], t2[5] = t2[7], t2[7] = e5, this;
    }
    getNormalMatrix(e5) {
      return this.setFromMatrix4(e5).invert().transpose();
    }
    transposeIntoArray(e5) {
      let t2 = this.elements;
      return e5[0] = t2[0], e5[1] = t2[3], e5[2] = t2[6], e5[3] = t2[1], e5[4] = t2[4], e5[5] = t2[7], e5[6] = t2[2], e5[7] = t2[5], e5[8] = t2[8], this;
    }
    setUvTransform(e5, t2, n2, r2, i2, a2, o2) {
      let s2 = Math.cos(i2), c2 = Math.sin(i2);
      return this.set(n2 * s2, n2 * c2, -n2 * (s2 * a2 + c2 * o2) + a2 + e5, -r2 * c2, r2 * s2, -r2 * (-c2 * a2 + s2 * o2) + o2 + t2, 0, 0, 1), this;
    }
    scale(e5, t2) {
      return this.premultiply(cr.makeScale(e5, t2)), this;
    }
    rotate(e5) {
      return this.premultiply(cr.makeRotation(-e5)), this;
    }
    translate(e5, t2) {
      return this.premultiply(cr.makeTranslation(e5, t2)), this;
    }
    makeTranslation(e5, t2) {
      return e5.isVector2 ? this.set(1, 0, e5.x, 0, 1, e5.y, 0, 0, 1) : this.set(1, 0, e5, 0, 1, t2, 0, 0, 1), this;
    }
    makeRotation(e5) {
      let t2 = Math.cos(e5), n2 = Math.sin(e5);
      return this.set(t2, -n2, 0, n2, t2, 0, 0, 0, 1), this;
    }
    makeScale(e5, t2) {
      return this.set(e5, 0, 0, 0, t2, 0, 0, 0, 1), this;
    }
    equals(e5) {
      let t2 = this.elements, n2 = e5.elements;
      for (let e6 = 0; e6 < 9; e6++) if (t2[e6] !== n2[e6]) return false;
      return true;
    }
    fromArray(e5, t2 = 0) {
      for (let n2 = 0; n2 < 9; n2++) this.elements[n2] = e5[n2 + t2];
      return this;
    }
    toArray(e5 = [], t2 = 0) {
      let n2 = this.elements;
      return e5[t2] = n2[0], e5[t2 + 1] = n2[1], e5[t2 + 2] = n2[2], e5[t2 + 3] = n2[3], e5[t2 + 4] = n2[4], e5[t2 + 5] = n2[5], e5[t2 + 6] = n2[6], e5[t2 + 7] = n2[7], e5[t2 + 8] = n2[8], e5;
    }
    clone() {
      return new this.constructor().fromArray(this.elements);
    }
  }, cr = new sr(), lr = new sr().set(0.4123908, 0.3575843, 0.1804808, 0.212639, 0.7151687, 0.0721923, 0.0193308, 0.1191948, 0.9505322), ur = new sr().set(3.2409699, -1.5373832, -0.4986108, -0.9692436, 1.8759675, 0.0415551, 0.0556301, -0.203977, 1.0569715), dr = ie(), pr = class {
    static getDataURL(e4, t2 = `image/png`) {
      if (/^data:/i.test(e4.src) || typeof HTMLCanvasElement > `u`) return e4.src;
      let n2;
      if (e4 instanceof HTMLCanvasElement) n2 = e4;
      else {
        fr === void 0 && (fr = a(`canvas`)), fr.width = e4.width, fr.height = e4.height;
        let t3 = fr.getContext(`2d`);
        e4 instanceof ImageData ? t3.putImageData(e4, 0, 0) : t3.drawImage(e4, 0, 0, e4.width, e4.height), n2 = fr;
      }
      return n2.toDataURL(t2);
    }
    static sRGBToLinear(e4) {
      if (typeof HTMLImageElement < `u` && e4 instanceof HTMLImageElement || typeof HTMLCanvasElement < `u` && e4 instanceof HTMLCanvasElement || typeof ImageBitmap < `u` && e4 instanceof ImageBitmap) {
        let t2 = a(`canvas`);
        t2.width = e4.width, t2.height = e4.height;
        let n2 = t2.getContext(`2d`);
        n2.drawImage(e4, 0, 0, e4.width, e4.height);
        let r2 = n2.getImageData(0, 0, e4.width, e4.height), i2 = r2.data;
        for (let e5 = 0; e5 < i2.length; e5++) i2[e5] = ae(i2[e5] / 255) * 255;
        return n2.putImageData(r2, 0, 0), t2;
      } else if (e4.data) {
        let t2 = e4.data.slice(0);
        for (let e5 = 0; e5 < t2.length; e5++) t2 instanceof Uint8Array || t2 instanceof Uint8ClampedArray ? t2[e5] = Math.floor(ae(t2[e5] / 255) * 255) : t2[e5] = ae(t2[e5]);
        return { data: t2, width: e4.width, height: e4.height };
      } else return l(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`), e4;
    }
  }, mr = 0, hr = class {
    constructor(e4 = null) {
      this.isSource = true, Object.defineProperty(this, `id`, { value: mr++ }), this.uuid = p(), this.data = e4, this.dataReady = true, this.version = 0;
    }
    getSize(e4) {
      let t2 = this.data;
      return typeof HTMLVideoElement < `u` && t2 instanceof HTMLVideoElement ? e4.set(t2.videoWidth, t2.videoHeight, 0) : typeof VideoFrame < `u` && t2 instanceof VideoFrame ? e4.set(t2.displayWidth, t2.displayHeight, 0) : t2 === null ? e4.set(0, 0, 0) : e4.set(t2.width, t2.height, t2.depth || 0), e4;
    }
    set needsUpdate(e4) {
      e4 === true && this.version++;
    }
    toJSON(e4) {
      let t2 = e4 === void 0 || typeof e4 == `string`;
      if (!t2 && e4.images[this.uuid] !== void 0) return e4.images[this.uuid];
      let n2 = { uuid: this.uuid, url: `` }, r2 = this.data;
      if (r2 !== null) {
        let e5;
        if (Array.isArray(r2)) {
          e5 = [];
          for (let t3 = 0, n3 = r2.length; t3 < n3; t3++) r2[t3].isDataTexture ? e5.push(se(r2[t3].image)) : e5.push(se(r2[t3]));
        } else e5 = se(r2);
        n2.url = e5;
      }
      return t2 || (e4.images[this.uuid] = n2), n2;
    }
  }, gr = 0, _r = new N(), vr = class e4 extends Qn {
    constructor(t2 = e4.DEFAULT_IMAGE, n2 = e4.DEFAULT_MAPPING, r2 = vt, i2 = vt, a2 = Ct, o2 = Tt, s2 = Vt, c2 = Et, l2 = e4.DEFAULT_ANISOTROPY, u2 = ``) {
      super(), this.isTexture = true, Object.defineProperty(this, `id`, { value: gr++ }), this.uuid = p(), this.name = ``, this.source = new hr(t2), this.mipmaps = [], this.mapping = n2, this.channel = 0, this.wrapS = r2, this.wrapT = i2, this.magFilter = a2, this.minFilter = o2, this.anisotropy = l2, this.format = s2, this.internalFormat = null, this.type = c2, this.offset = new M(0, 0), this.repeat = new M(1, 1), this.center = new M(0, 0), this.rotation = 0, this.matrixAutoUpdate = true, this.matrix = new sr(), this.generateMipmaps = true, this.premultiplyAlpha = false, this.flipY = true, this.unpackAlignment = 4, this.colorSpace = u2, this.userData = {}, this.updateRanges = [], this.version = 0, this.onUpdate = null, this.renderTarget = null, this.isRenderTargetTexture = false, this.isArrayTexture = !!(t2 && t2.depth && t2.depth > 1), this.pmremVersion = 0, this.normalized = false;
    }
    get width() {
      return this.source.getSize(_r).x;
    }
    get height() {
      return this.source.getSize(_r).y;
    }
    get depth() {
      return this.source.getSize(_r).z;
    }
    get image() {
      return this.source.data;
    }
    set image(e5) {
      this.source.data = e5;
    }
    updateMatrix() {
      this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
    }
    addUpdateRange(e5, t2) {
      this.updateRanges.push({ start: e5, count: t2 });
    }
    clearUpdateRanges() {
      this.updateRanges.length = 0;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e5) {
      return this.name = e5.name, this.source = e5.source, this.mipmaps = e5.mipmaps.slice(0), this.mapping = e5.mapping, this.channel = e5.channel, this.wrapS = e5.wrapS, this.wrapT = e5.wrapT, this.magFilter = e5.magFilter, this.minFilter = e5.minFilter, this.anisotropy = e5.anisotropy, this.format = e5.format, this.internalFormat = e5.internalFormat, this.type = e5.type, this.normalized = e5.normalized, this.offset.copy(e5.offset), this.repeat.copy(e5.repeat), this.center.copy(e5.center), this.rotation = e5.rotation, this.matrixAutoUpdate = e5.matrixAutoUpdate, this.matrix.copy(e5.matrix), this.generateMipmaps = e5.generateMipmaps, this.premultiplyAlpha = e5.premultiplyAlpha, this.flipY = e5.flipY, this.unpackAlignment = e5.unpackAlignment, this.colorSpace = e5.colorSpace, this.renderTarget = e5.renderTarget, this.isRenderTargetTexture = e5.isRenderTargetTexture, this.isArrayTexture = e5.isArrayTexture, this.userData = JSON.parse(JSON.stringify(e5.userData)), this.needsUpdate = true, this;
    }
    setValues(e5) {
      for (let t2 in e5) {
        let n2 = e5[t2];
        if (n2 === void 0) {
          l(`Texture.setValues(): parameter '${t2}' has value of undefined.`);
          continue;
        }
        let r2 = this[t2];
        if (r2 === void 0) {
          l(`Texture.setValues(): property '${t2}' does not exist.`);
          continue;
        }
        r2 && n2 && r2.isVector2 && n2.isVector2 || r2 && n2 && r2.isVector3 && n2.isVector3 || r2 && n2 && r2.isMatrix3 && n2.isMatrix3 ? r2.copy(n2) : this[t2] = n2;
      }
    }
    toJSON(e5) {
      let t2 = e5 === void 0 || typeof e5 == `string`;
      if (!t2 && e5.textures[this.uuid] !== void 0) return e5.textures[this.uuid];
      let n2 = { metadata: { version: 4.7, type: `Texture`, generator: `Texture.toJSON` }, uuid: this.uuid, name: this.name, image: this.source.toJSON(e5).uuid, mapping: this.mapping, channel: this.channel, repeat: [this.repeat.x, this.repeat.y], offset: [this.offset.x, this.offset.y], center: [this.center.x, this.center.y], rotation: this.rotation, wrap: [this.wrapS, this.wrapT], format: this.format, internalFormat: this.internalFormat, type: this.type, normalized: this.normalized, colorSpace: this.colorSpace, minFilter: this.minFilter, magFilter: this.magFilter, anisotropy: this.anisotropy, flipY: this.flipY, generateMipmaps: this.generateMipmaps, premultiplyAlpha: this.premultiplyAlpha, unpackAlignment: this.unpackAlignment };
      return Object.keys(this.userData).length > 0 && (n2.userData = this.userData), t2 || (e5.textures[this.uuid] = n2), n2;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
    transformUv(e5) {
      if (this.mapping !== 300) return e5;
      if (e5.applyMatrix3(this.matrix), e5.x < 0 || e5.x > 1) switch (this.wrapS) {
        case _t:
          e5.x -= Math.floor(e5.x);
          break;
        case vt:
          e5.x = e5.x < 0 ? 0 : 1;
          break;
        case yt:
          Math.abs(Math.floor(e5.x) % 2) === 1 ? e5.x = Math.ceil(e5.x) - e5.x : e5.x -= Math.floor(e5.x);
          break;
      }
      if (e5.y < 0 || e5.y > 1) switch (this.wrapT) {
        case _t:
          e5.y -= Math.floor(e5.y);
          break;
        case vt:
          e5.y = e5.y < 0 ? 0 : 1;
          break;
        case yt:
          Math.abs(Math.floor(e5.y) % 2) === 1 ? e5.y = Math.ceil(e5.y) - e5.y : e5.y -= Math.floor(e5.y);
          break;
      }
      return this.flipY && (e5.y = 1 - e5.y), e5;
    }
    set needsUpdate(e5) {
      e5 === true && (this.version++, this.source.needsUpdate = true);
    }
    set needsPMREMUpdate(e5) {
      e5 === true && this.pmremVersion++;
    }
  }, vr.DEFAULT_IMAGE = null, vr.DEFAULT_MAPPING = 300, vr.DEFAULT_ANISOTROPY = 1, yr = class e4 {
    static {
      e4.prototype.isVector4 = true;
    }
    constructor(e5 = 0, t2 = 0, n2 = 0, r2 = 1) {
      this.x = e5, this.y = t2, this.z = n2, this.w = r2;
    }
    get width() {
      return this.z;
    }
    set width(e5) {
      this.z = e5;
    }
    get height() {
      return this.w;
    }
    set height(e5) {
      this.w = e5;
    }
    set(e5, t2, n2, r2) {
      return this.x = e5, this.y = t2, this.z = n2, this.w = r2, this;
    }
    setScalar(e5) {
      return this.x = e5, this.y = e5, this.z = e5, this.w = e5, this;
    }
    setX(e5) {
      return this.x = e5, this;
    }
    setY(e5) {
      return this.y = e5, this;
    }
    setZ(e5) {
      return this.z = e5, this;
    }
    setW(e5) {
      return this.w = e5, this;
    }
    setComponent(e5, t2) {
      switch (e5) {
        case 0:
          this.x = t2;
          break;
        case 1:
          this.y = t2;
          break;
        case 2:
          this.z = t2;
          break;
        case 3:
          this.w = t2;
          break;
        default:
          throw Error(`index is out of range: ` + e5);
      }
      return this;
    }
    getComponent(e5) {
      switch (e5) {
        case 0:
          return this.x;
        case 1:
          return this.y;
        case 2:
          return this.z;
        case 3:
          return this.w;
        default:
          throw Error(`index is out of range: ` + e5);
      }
    }
    clone() {
      return new this.constructor(this.x, this.y, this.z, this.w);
    }
    copy(e5) {
      return this.x = e5.x, this.y = e5.y, this.z = e5.z, this.w = e5.w === void 0 ? 1 : e5.w, this;
    }
    add(e5) {
      return this.x += e5.x, this.y += e5.y, this.z += e5.z, this.w += e5.w, this;
    }
    addScalar(e5) {
      return this.x += e5, this.y += e5, this.z += e5, this.w += e5, this;
    }
    addVectors(e5, t2) {
      return this.x = e5.x + t2.x, this.y = e5.y + t2.y, this.z = e5.z + t2.z, this.w = e5.w + t2.w, this;
    }
    addScaledVector(e5, t2) {
      return this.x += e5.x * t2, this.y += e5.y * t2, this.z += e5.z * t2, this.w += e5.w * t2, this;
    }
    sub(e5) {
      return this.x -= e5.x, this.y -= e5.y, this.z -= e5.z, this.w -= e5.w, this;
    }
    subScalar(e5) {
      return this.x -= e5, this.y -= e5, this.z -= e5, this.w -= e5, this;
    }
    subVectors(e5, t2) {
      return this.x = e5.x - t2.x, this.y = e5.y - t2.y, this.z = e5.z - t2.z, this.w = e5.w - t2.w, this;
    }
    multiply(e5) {
      return this.x *= e5.x, this.y *= e5.y, this.z *= e5.z, this.w *= e5.w, this;
    }
    multiplyScalar(e5) {
      return this.x *= e5, this.y *= e5, this.z *= e5, this.w *= e5, this;
    }
    applyMatrix4(e5) {
      let t2 = this.x, n2 = this.y, r2 = this.z, i2 = this.w, a2 = e5.elements;
      return this.x = a2[0] * t2 + a2[4] * n2 + a2[8] * r2 + a2[12] * i2, this.y = a2[1] * t2 + a2[5] * n2 + a2[9] * r2 + a2[13] * i2, this.z = a2[2] * t2 + a2[6] * n2 + a2[10] * r2 + a2[14] * i2, this.w = a2[3] * t2 + a2[7] * n2 + a2[11] * r2 + a2[15] * i2, this;
    }
    divide(e5) {
      return this.x /= e5.x, this.y /= e5.y, this.z /= e5.z, this.w /= e5.w, this;
    }
    divideScalar(e5) {
      return this.multiplyScalar(1 / e5);
    }
    setAxisAngleFromQuaternion(e5) {
      this.w = 2 * Math.acos(e5.w);
      let t2 = Math.sqrt(1 - e5.w * e5.w);
      return t2 < 1e-4 ? (this.x = 1, this.y = 0, this.z = 0) : (this.x = e5.x / t2, this.y = e5.y / t2, this.z = e5.z / t2), this;
    }
    setAxisAngleFromRotationMatrix(e5) {
      let t2, n2, r2, i2, a2 = 0.01, o2 = 0.1, s2 = e5.elements, c2 = s2[0], l2 = s2[4], u2 = s2[8], d2 = s2[1], f2 = s2[5], p2 = s2[9], m2 = s2[2], h2 = s2[6], g2 = s2[10];
      if (Math.abs(l2 - d2) < a2 && Math.abs(u2 - m2) < a2 && Math.abs(p2 - h2) < a2) {
        if (Math.abs(l2 + d2) < o2 && Math.abs(u2 + m2) < o2 && Math.abs(p2 + h2) < o2 && Math.abs(c2 + f2 + g2 - 3) < o2) return this.set(1, 0, 0, 0), this;
        t2 = Math.PI;
        let e6 = (c2 + 1) / 2, s3 = (f2 + 1) / 2, _3 = (g2 + 1) / 2, v2 = (l2 + d2) / 4, y2 = (u2 + m2) / 4, b2 = (p2 + h2) / 4;
        return e6 > s3 && e6 > _3 ? e6 < a2 ? (n2 = 0, r2 = 0.707106781, i2 = 0.707106781) : (n2 = Math.sqrt(e6), r2 = v2 / n2, i2 = y2 / n2) : s3 > _3 ? s3 < a2 ? (n2 = 0.707106781, r2 = 0, i2 = 0.707106781) : (r2 = Math.sqrt(s3), n2 = v2 / r2, i2 = b2 / r2) : _3 < a2 ? (n2 = 0.707106781, r2 = 0.707106781, i2 = 0) : (i2 = Math.sqrt(_3), n2 = y2 / i2, r2 = b2 / i2), this.set(n2, r2, i2, t2), this;
      }
      let _2 = Math.sqrt((h2 - p2) * (h2 - p2) + (u2 - m2) * (u2 - m2) + (d2 - l2) * (d2 - l2));
      return Math.abs(_2) < 1e-3 && (_2 = 1), this.x = (h2 - p2) / _2, this.y = (u2 - m2) / _2, this.z = (d2 - l2) / _2, this.w = Math.acos((c2 + f2 + g2 - 1) / 2), this;
    }
    setFromMatrixPosition(e5) {
      let t2 = e5.elements;
      return this.x = t2[12], this.y = t2[13], this.z = t2[14], this.w = t2[15], this;
    }
    min(e5) {
      return this.x = Math.min(this.x, e5.x), this.y = Math.min(this.y, e5.y), this.z = Math.min(this.z, e5.z), this.w = Math.min(this.w, e5.w), this;
    }
    max(e5) {
      return this.x = Math.max(this.x, e5.x), this.y = Math.max(this.y, e5.y), this.z = Math.max(this.z, e5.z), this.w = Math.max(this.w, e5.w), this;
    }
    clamp(e5, t2) {
      return this.x = m(this.x, e5.x, t2.x), this.y = m(this.y, e5.y, t2.y), this.z = m(this.z, e5.z, t2.z), this.w = m(this.w, e5.w, t2.w), this;
    }
    clampScalar(e5, t2) {
      return this.x = m(this.x, e5, t2), this.y = m(this.y, e5, t2), this.z = m(this.z, e5, t2), this.w = m(this.w, e5, t2), this;
    }
    clampLength(e5, t2) {
      let n2 = this.length();
      return this.divideScalar(n2 || 1).multiplyScalar(m(n2, e5, t2));
    }
    floor() {
      return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this.w = Math.floor(this.w), this;
    }
    ceil() {
      return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this.w = Math.ceil(this.w), this;
    }
    round() {
      return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this.w = Math.round(this.w), this;
    }
    roundToZero() {
      return this.x = Math.trunc(this.x), this.y = Math.trunc(this.y), this.z = Math.trunc(this.z), this.w = Math.trunc(this.w), this;
    }
    negate() {
      return this.x = -this.x, this.y = -this.y, this.z = -this.z, this.w = -this.w, this;
    }
    dot(e5) {
      return this.x * e5.x + this.y * e5.y + this.z * e5.z + this.w * e5.w;
    }
    lengthSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    manhattanLength() {
      return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
    }
    normalize() {
      return this.divideScalar(this.length() || 1);
    }
    setLength(e5) {
      return this.normalize().multiplyScalar(e5);
    }
    lerp(e5, t2) {
      return this.x += (e5.x - this.x) * t2, this.y += (e5.y - this.y) * t2, this.z += (e5.z - this.z) * t2, this.w += (e5.w - this.w) * t2, this;
    }
    lerpVectors(e5, t2, n2) {
      return this.x = e5.x + (t2.x - e5.x) * n2, this.y = e5.y + (t2.y - e5.y) * n2, this.z = e5.z + (t2.z - e5.z) * n2, this.w = e5.w + (t2.w - e5.w) * n2, this;
    }
    equals(e5) {
      return e5.x === this.x && e5.y === this.y && e5.z === this.z && e5.w === this.w;
    }
    fromArray(e5, t2 = 0) {
      return this.x = e5[t2], this.y = e5[t2 + 1], this.z = e5[t2 + 2], this.w = e5[t2 + 3], this;
    }
    toArray(e5 = [], t2 = 0) {
      return e5[t2] = this.x, e5[t2 + 1] = this.y, e5[t2 + 2] = this.z, e5[t2 + 3] = this.w, e5;
    }
    fromBufferAttribute(e5, t2) {
      return this.x = e5.getX(t2), this.y = e5.getY(t2), this.z = e5.getZ(t2), this.w = e5.getW(t2), this;
    }
    random() {
      return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this.w = Math.random(), this;
    }
    *[Symbol.iterator]() {
      yield this.x, yield this.y, yield this.z, yield this.w;
    }
  }, br = class extends Qn {
    constructor(e4 = 1, t2 = 1, n2 = {}) {
      super(), n2 = Object.assign({ generateMipmaps: false, internalFormat: null, minFilter: Ct, depthBuffer: true, stencilBuffer: false, resolveDepthBuffer: true, resolveStencilBuffer: true, depthTexture: null, samples: 0, count: 1, depth: 1, multiview: false }, n2), this.isRenderTarget = true, this.width = e4, this.height = t2, this.depth = n2.depth, this.scissor = new yr(0, 0, e4, t2), this.scissorTest = false, this.viewport = new yr(0, 0, e4, t2), this.textures = [];
      let r2 = new vr({ width: e4, height: t2, depth: n2.depth }), i2 = n2.count;
      for (let e5 = 0; e5 < i2; e5++) this.textures[e5] = r2.clone(), this.textures[e5].isRenderTargetTexture = true, this.textures[e5].renderTarget = this;
      this._setTextureOptions(n2), this.depthBuffer = n2.depthBuffer, this.stencilBuffer = n2.stencilBuffer, this.resolveDepthBuffer = n2.resolveDepthBuffer, this.resolveStencilBuffer = n2.resolveStencilBuffer, this._depthTexture = null, this.depthTexture = n2.depthTexture, this.samples = n2.samples, this.multiview = n2.multiview;
    }
    _setTextureOptions(e4 = {}) {
      let t2 = { minFilter: Ct, generateMipmaps: false, flipY: false, internalFormat: null };
      e4.mapping !== void 0 && (t2.mapping = e4.mapping), e4.wrapS !== void 0 && (t2.wrapS = e4.wrapS), e4.wrapT !== void 0 && (t2.wrapT = e4.wrapT), e4.wrapR !== void 0 && (t2.wrapR = e4.wrapR), e4.magFilter !== void 0 && (t2.magFilter = e4.magFilter), e4.minFilter !== void 0 && (t2.minFilter = e4.minFilter), e4.format !== void 0 && (t2.format = e4.format), e4.type !== void 0 && (t2.type = e4.type), e4.anisotropy !== void 0 && (t2.anisotropy = e4.anisotropy), e4.colorSpace !== void 0 && (t2.colorSpace = e4.colorSpace), e4.flipY !== void 0 && (t2.flipY = e4.flipY), e4.generateMipmaps !== void 0 && (t2.generateMipmaps = e4.generateMipmaps), e4.internalFormat !== void 0 && (t2.internalFormat = e4.internalFormat);
      for (let e5 = 0; e5 < this.textures.length; e5++) this.textures[e5].setValues(t2);
    }
    get texture() {
      return this.textures[0];
    }
    set texture(e4) {
      this.textures[0] = e4;
    }
    set depthTexture(e4) {
      this._depthTexture !== null && (this._depthTexture.renderTarget = null), e4 !== null && (e4.renderTarget = this), this._depthTexture = e4;
    }
    get depthTexture() {
      return this._depthTexture;
    }
    setSize(e4, t2, n2 = 1) {
      if (this.width !== e4 || this.height !== t2 || this.depth !== n2) {
        this.width = e4, this.height = t2, this.depth = n2;
        for (let r2 = 0, i2 = this.textures.length; r2 < i2; r2++) this.textures[r2].image.width = e4, this.textures[r2].image.height = t2, this.textures[r2].image.depth = n2, this.textures[r2].isData3DTexture !== true && (this.textures[r2].isArrayTexture = this.textures[r2].image.depth > 1);
        this.dispose();
      }
      this.viewport.set(0, 0, e4, t2), this.scissor.set(0, 0, e4, t2);
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e4) {
      this.width = e4.width, this.height = e4.height, this.depth = e4.depth, this.scissor.copy(e4.scissor), this.scissorTest = e4.scissorTest, this.viewport.copy(e4.viewport), this.textures.length = 0;
      for (let t2 = 0, n2 = e4.textures.length; t2 < n2; t2++) {
        this.textures[t2] = e4.textures[t2].clone(), this.textures[t2].isRenderTargetTexture = true, this.textures[t2].renderTarget = this;
        let n3 = Object.assign({}, e4.textures[t2].image);
        this.textures[t2].source = new hr(n3);
      }
      return this.depthBuffer = e4.depthBuffer, this.stencilBuffer = e4.stencilBuffer, this.resolveDepthBuffer = e4.resolveDepthBuffer, this.resolveStencilBuffer = e4.resolveStencilBuffer, e4.depthTexture !== null && (this.depthTexture = e4.depthTexture.clone()), this.samples = e4.samples, this.multiview = e4.multiview, this;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
  }, xr = class extends br {
    constructor(e4 = 1, t2 = 1, n2 = {}) {
      super(e4, t2, n2), this.isWebGLRenderTarget = true;
    }
  }, Sr = class extends vr {
    constructor(e4 = null, t2 = 1, n2 = 1, r2 = 1) {
      super(null), this.isDataArrayTexture = true, this.image = { data: e4, width: t2, height: n2, depth: r2 }, this.magFilter = bt, this.minFilter = bt, this.wrapR = vt, this.generateMipmaps = false, this.flipY = false, this.unpackAlignment = 1, this.layerUpdates = /* @__PURE__ */ new Set();
    }
    addLayerUpdate(e4) {
      this.layerUpdates.add(e4);
    }
    clearLayerUpdates() {
      this.layerUpdates.clear();
    }
  }, Cr = class extends vr {
    constructor(e4 = null, t2 = 1, n2 = 1, r2 = 1) {
      super(null), this.isData3DTexture = true, this.image = { data: e4, width: t2, height: n2, depth: r2 }, this.magFilter = bt, this.minFilter = bt, this.wrapR = vt, this.generateMipmaps = false, this.flipY = false, this.unpackAlignment = 1;
    }
  }, wr = class e4 {
    static {
      e4.prototype.isMatrix4 = true;
    }
    constructor(e5, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2, d2, f2, p2, m2, h2) {
      this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], e5 !== void 0 && this.set(e5, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2, d2, f2, p2, m2, h2);
    }
    set(e5, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2, d2, f2, p2, m2, h2) {
      let g2 = this.elements;
      return g2[0] = e5, g2[4] = t2, g2[8] = n2, g2[12] = r2, g2[1] = i2, g2[5] = a2, g2[9] = o2, g2[13] = s2, g2[2] = c2, g2[6] = l2, g2[10] = u2, g2[14] = d2, g2[3] = f2, g2[7] = p2, g2[11] = m2, g2[15] = h2, this;
    }
    identity() {
      return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
    }
    clone() {
      return new e4().fromArray(this.elements);
    }
    copy(e5) {
      let t2 = this.elements, n2 = e5.elements;
      return t2[0] = n2[0], t2[1] = n2[1], t2[2] = n2[2], t2[3] = n2[3], t2[4] = n2[4], t2[5] = n2[5], t2[6] = n2[6], t2[7] = n2[7], t2[8] = n2[8], t2[9] = n2[9], t2[10] = n2[10], t2[11] = n2[11], t2[12] = n2[12], t2[13] = n2[13], t2[14] = n2[14], t2[15] = n2[15], this;
    }
    copyPosition(e5) {
      let t2 = this.elements, n2 = e5.elements;
      return t2[12] = n2[12], t2[13] = n2[13], t2[14] = n2[14], this;
    }
    setFromMatrix3(e5) {
      let t2 = e5.elements;
      return this.set(t2[0], t2[3], t2[6], 0, t2[1], t2[4], t2[7], 0, t2[2], t2[5], t2[8], 0, 0, 0, 0, 1), this;
    }
    extractBasis(e5, t2, n2) {
      return this.determinant() === 0 ? (e5.set(1, 0, 0), t2.set(0, 1, 0), n2.set(0, 0, 1), this) : (e5.setFromMatrixColumn(this, 0), t2.setFromMatrixColumn(this, 1), n2.setFromMatrixColumn(this, 2), this);
    }
    makeBasis(e5, t2, n2) {
      return this.set(e5.x, t2.x, n2.x, 0, e5.y, t2.y, n2.y, 0, e5.z, t2.z, n2.z, 0, 0, 0, 0, 1), this;
    }
    extractRotation(e5) {
      if (e5.determinant() === 0) return this.identity();
      let t2 = this.elements, n2 = e5.elements, r2 = 1 / Tr.setFromMatrixColumn(e5, 0).length(), i2 = 1 / Tr.setFromMatrixColumn(e5, 1).length(), a2 = 1 / Tr.setFromMatrixColumn(e5, 2).length();
      return t2[0] = n2[0] * r2, t2[1] = n2[1] * r2, t2[2] = n2[2] * r2, t2[3] = 0, t2[4] = n2[4] * i2, t2[5] = n2[5] * i2, t2[6] = n2[6] * i2, t2[7] = 0, t2[8] = n2[8] * a2, t2[9] = n2[9] * a2, t2[10] = n2[10] * a2, t2[11] = 0, t2[12] = 0, t2[13] = 0, t2[14] = 0, t2[15] = 1, this;
    }
    makeRotationFromEuler(e5) {
      let t2 = this.elements, n2 = e5.x, r2 = e5.y, i2 = e5.z, a2 = Math.cos(n2), o2 = Math.sin(n2), s2 = Math.cos(r2), c2 = Math.sin(r2), l2 = Math.cos(i2), u2 = Math.sin(i2);
      if (e5.order === `XYZ`) {
        let e6 = a2 * l2, n3 = a2 * u2, r3 = o2 * l2, i3 = o2 * u2;
        t2[0] = s2 * l2, t2[4] = -s2 * u2, t2[8] = c2, t2[1] = n3 + r3 * c2, t2[5] = e6 - i3 * c2, t2[9] = -o2 * s2, t2[2] = i3 - e6 * c2, t2[6] = r3 + n3 * c2, t2[10] = a2 * s2;
      } else if (e5.order === `YXZ`) {
        let e6 = s2 * l2, n3 = s2 * u2, r3 = c2 * l2, i3 = c2 * u2;
        t2[0] = e6 + i3 * o2, t2[4] = r3 * o2 - n3, t2[8] = a2 * c2, t2[1] = a2 * u2, t2[5] = a2 * l2, t2[9] = -o2, t2[2] = n3 * o2 - r3, t2[6] = i3 + e6 * o2, t2[10] = a2 * s2;
      } else if (e5.order === `ZXY`) {
        let e6 = s2 * l2, n3 = s2 * u2, r3 = c2 * l2, i3 = c2 * u2;
        t2[0] = e6 - i3 * o2, t2[4] = -a2 * u2, t2[8] = r3 + n3 * o2, t2[1] = n3 + r3 * o2, t2[5] = a2 * l2, t2[9] = i3 - e6 * o2, t2[2] = -a2 * c2, t2[6] = o2, t2[10] = a2 * s2;
      } else if (e5.order === `ZYX`) {
        let e6 = a2 * l2, n3 = a2 * u2, r3 = o2 * l2, i3 = o2 * u2;
        t2[0] = s2 * l2, t2[4] = r3 * c2 - n3, t2[8] = e6 * c2 + i3, t2[1] = s2 * u2, t2[5] = i3 * c2 + e6, t2[9] = n3 * c2 - r3, t2[2] = -c2, t2[6] = o2 * s2, t2[10] = a2 * s2;
      } else if (e5.order === `YZX`) {
        let e6 = a2 * s2, n3 = a2 * c2, r3 = o2 * s2, i3 = o2 * c2;
        t2[0] = s2 * l2, t2[4] = i3 - e6 * u2, t2[8] = r3 * u2 + n3, t2[1] = u2, t2[5] = a2 * l2, t2[9] = -o2 * l2, t2[2] = -c2 * l2, t2[6] = n3 * u2 + r3, t2[10] = e6 - i3 * u2;
      } else if (e5.order === `XZY`) {
        let e6 = a2 * s2, n3 = a2 * c2, r3 = o2 * s2, i3 = o2 * c2;
        t2[0] = s2 * l2, t2[4] = -u2, t2[8] = c2 * l2, t2[1] = e6 * u2 + i3, t2[5] = a2 * l2, t2[9] = n3 * u2 - r3, t2[2] = r3 * u2 - n3, t2[6] = o2 * l2, t2[10] = i3 * u2 + e6;
      }
      return t2[3] = 0, t2[7] = 0, t2[11] = 0, t2[12] = 0, t2[13] = 0, t2[14] = 0, t2[15] = 1, this;
    }
    makeRotationFromQuaternion(e5) {
      return this.compose(Dr, e5, Or);
    }
    lookAt(e5, t2, n2) {
      let r2 = this.elements;
      return jr.subVectors(e5, t2), jr.lengthSq() === 0 && (jr.z = 1), jr.normalize(), kr.crossVectors(n2, jr), kr.lengthSq() === 0 && (Math.abs(n2.z) === 1 ? jr.x += 1e-4 : jr.z += 1e-4, jr.normalize(), kr.crossVectors(n2, jr)), kr.normalize(), Ar.crossVectors(jr, kr), r2[0] = kr.x, r2[4] = Ar.x, r2[8] = jr.x, r2[1] = kr.y, r2[5] = Ar.y, r2[9] = jr.y, r2[2] = kr.z, r2[6] = Ar.z, r2[10] = jr.z, this;
    }
    multiply(e5) {
      return this.multiplyMatrices(this, e5);
    }
    premultiply(e5) {
      return this.multiplyMatrices(e5, this);
    }
    multiplyMatrices(e5, t2) {
      let n2 = e5.elements, r2 = t2.elements, i2 = this.elements, a2 = n2[0], o2 = n2[4], s2 = n2[8], c2 = n2[12], l2 = n2[1], u2 = n2[5], d2 = n2[9], f2 = n2[13], p2 = n2[2], m2 = n2[6], h2 = n2[10], g2 = n2[14], _2 = n2[3], v2 = n2[7], y2 = n2[11], b2 = n2[15], x2 = r2[0], S2 = r2[4], C2 = r2[8], w2 = r2[12], T2 = r2[1], E2 = r2[5], D2 = r2[9], O2 = r2[13], k2 = r2[2], A2 = r2[6], ee2 = r2[10], te2 = r2[14], ne2 = r2[3], re2 = r2[7], ie2 = r2[11], ae2 = r2[15];
      return i2[0] = a2 * x2 + o2 * T2 + s2 * k2 + c2 * ne2, i2[4] = a2 * S2 + o2 * E2 + s2 * A2 + c2 * re2, i2[8] = a2 * C2 + o2 * D2 + s2 * ee2 + c2 * ie2, i2[12] = a2 * w2 + o2 * O2 + s2 * te2 + c2 * ae2, i2[1] = l2 * x2 + u2 * T2 + d2 * k2 + f2 * ne2, i2[5] = l2 * S2 + u2 * E2 + d2 * A2 + f2 * re2, i2[9] = l2 * C2 + u2 * D2 + d2 * ee2 + f2 * ie2, i2[13] = l2 * w2 + u2 * O2 + d2 * te2 + f2 * ae2, i2[2] = p2 * x2 + m2 * T2 + h2 * k2 + g2 * ne2, i2[6] = p2 * S2 + m2 * E2 + h2 * A2 + g2 * re2, i2[10] = p2 * C2 + m2 * D2 + h2 * ee2 + g2 * ie2, i2[14] = p2 * w2 + m2 * O2 + h2 * te2 + g2 * ae2, i2[3] = _2 * x2 + v2 * T2 + y2 * k2 + b2 * ne2, i2[7] = _2 * S2 + v2 * E2 + y2 * A2 + b2 * re2, i2[11] = _2 * C2 + v2 * D2 + y2 * ee2 + b2 * ie2, i2[15] = _2 * w2 + v2 * O2 + y2 * te2 + b2 * ae2, this;
    }
    multiplyScalar(e5) {
      let t2 = this.elements;
      return t2[0] *= e5, t2[4] *= e5, t2[8] *= e5, t2[12] *= e5, t2[1] *= e5, t2[5] *= e5, t2[9] *= e5, t2[13] *= e5, t2[2] *= e5, t2[6] *= e5, t2[10] *= e5, t2[14] *= e5, t2[3] *= e5, t2[7] *= e5, t2[11] *= e5, t2[15] *= e5, this;
    }
    determinant() {
      let e5 = this.elements, t2 = e5[0], n2 = e5[4], r2 = e5[8], i2 = e5[12], a2 = e5[1], o2 = e5[5], s2 = e5[9], c2 = e5[13], l2 = e5[2], u2 = e5[6], d2 = e5[10], f2 = e5[14], p2 = e5[3], m2 = e5[7], h2 = e5[11], g2 = e5[15], _2 = s2 * f2 - c2 * d2, v2 = o2 * f2 - c2 * u2, y2 = o2 * d2 - s2 * u2, b2 = a2 * f2 - c2 * l2, x2 = a2 * d2 - s2 * l2, S2 = a2 * u2 - o2 * l2;
      return t2 * (m2 * _2 - h2 * v2 + g2 * y2) - n2 * (p2 * _2 - h2 * b2 + g2 * x2) + r2 * (p2 * v2 - m2 * b2 + g2 * S2) - i2 * (p2 * y2 - m2 * x2 + h2 * S2);
    }
    transpose() {
      let e5 = this.elements, t2;
      return t2 = e5[1], e5[1] = e5[4], e5[4] = t2, t2 = e5[2], e5[2] = e5[8], e5[8] = t2, t2 = e5[6], e5[6] = e5[9], e5[9] = t2, t2 = e5[3], e5[3] = e5[12], e5[12] = t2, t2 = e5[7], e5[7] = e5[13], e5[13] = t2, t2 = e5[11], e5[11] = e5[14], e5[14] = t2, this;
    }
    setPosition(e5, t2, n2) {
      let r2 = this.elements;
      return e5.isVector3 ? (r2[12] = e5.x, r2[13] = e5.y, r2[14] = e5.z) : (r2[12] = e5, r2[13] = t2, r2[14] = n2), this;
    }
    invert() {
      let e5 = this.elements, t2 = e5[0], n2 = e5[1], r2 = e5[2], i2 = e5[3], a2 = e5[4], o2 = e5[5], s2 = e5[6], c2 = e5[7], l2 = e5[8], u2 = e5[9], d2 = e5[10], f2 = e5[11], p2 = e5[12], m2 = e5[13], h2 = e5[14], g2 = e5[15], _2 = t2 * o2 - n2 * a2, v2 = t2 * s2 - r2 * a2, y2 = t2 * c2 - i2 * a2, b2 = n2 * s2 - r2 * o2, x2 = n2 * c2 - i2 * o2, S2 = r2 * c2 - i2 * s2, C2 = l2 * m2 - u2 * p2, w2 = l2 * h2 - d2 * p2, T2 = l2 * g2 - f2 * p2, E2 = u2 * h2 - d2 * m2, D2 = u2 * g2 - f2 * m2, O2 = d2 * g2 - f2 * h2, k2 = _2 * O2 - v2 * D2 + y2 * E2 + b2 * T2 - x2 * w2 + S2 * C2;
      if (k2 === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      let A2 = 1 / k2;
      return e5[0] = (o2 * O2 - s2 * D2 + c2 * E2) * A2, e5[1] = (r2 * D2 - n2 * O2 - i2 * E2) * A2, e5[2] = (m2 * S2 - h2 * x2 + g2 * b2) * A2, e5[3] = (d2 * x2 - u2 * S2 - f2 * b2) * A2, e5[4] = (s2 * T2 - a2 * O2 - c2 * w2) * A2, e5[5] = (t2 * O2 - r2 * T2 + i2 * w2) * A2, e5[6] = (h2 * y2 - p2 * S2 - g2 * v2) * A2, e5[7] = (l2 * S2 - d2 * y2 + f2 * v2) * A2, e5[8] = (a2 * D2 - o2 * T2 + c2 * C2) * A2, e5[9] = (n2 * T2 - t2 * D2 - i2 * C2) * A2, e5[10] = (p2 * x2 - m2 * y2 + g2 * _2) * A2, e5[11] = (u2 * y2 - l2 * x2 - f2 * _2) * A2, e5[12] = (o2 * w2 - a2 * E2 - s2 * C2) * A2, e5[13] = (t2 * E2 - n2 * w2 + r2 * C2) * A2, e5[14] = (m2 * v2 - p2 * b2 - h2 * _2) * A2, e5[15] = (l2 * b2 - u2 * v2 + d2 * _2) * A2, this;
    }
    scale(e5) {
      let t2 = this.elements, n2 = e5.x, r2 = e5.y, i2 = e5.z;
      return t2[0] *= n2, t2[4] *= r2, t2[8] *= i2, t2[1] *= n2, t2[5] *= r2, t2[9] *= i2, t2[2] *= n2, t2[6] *= r2, t2[10] *= i2, t2[3] *= n2, t2[7] *= r2, t2[11] *= i2, this;
    }
    getMaxScaleOnAxis() {
      let e5 = this.elements, t2 = e5[0] * e5[0] + e5[1] * e5[1] + e5[2] * e5[2], n2 = e5[4] * e5[4] + e5[5] * e5[5] + e5[6] * e5[6], r2 = e5[8] * e5[8] + e5[9] * e5[9] + e5[10] * e5[10];
      return Math.sqrt(Math.max(t2, n2, r2));
    }
    makeTranslation(e5, t2, n2) {
      return e5.isVector3 ? this.set(1, 0, 0, e5.x, 0, 1, 0, e5.y, 0, 0, 1, e5.z, 0, 0, 0, 1) : this.set(1, 0, 0, e5, 0, 1, 0, t2, 0, 0, 1, n2, 0, 0, 0, 1), this;
    }
    makeRotationX(e5) {
      let t2 = Math.cos(e5), n2 = Math.sin(e5);
      return this.set(1, 0, 0, 0, 0, t2, -n2, 0, 0, n2, t2, 0, 0, 0, 0, 1), this;
    }
    makeRotationY(e5) {
      let t2 = Math.cos(e5), n2 = Math.sin(e5);
      return this.set(t2, 0, n2, 0, 0, 1, 0, 0, -n2, 0, t2, 0, 0, 0, 0, 1), this;
    }
    makeRotationZ(e5) {
      let t2 = Math.cos(e5), n2 = Math.sin(e5);
      return this.set(t2, -n2, 0, 0, n2, t2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this;
    }
    makeRotationAxis(e5, t2) {
      let n2 = Math.cos(t2), r2 = Math.sin(t2), i2 = 1 - n2, a2 = e5.x, o2 = e5.y, s2 = e5.z, c2 = i2 * a2, l2 = i2 * o2;
      return this.set(c2 * a2 + n2, c2 * o2 - r2 * s2, c2 * s2 + r2 * o2, 0, c2 * o2 + r2 * s2, l2 * o2 + n2, l2 * s2 - r2 * a2, 0, c2 * s2 - r2 * o2, l2 * s2 + r2 * a2, i2 * s2 * s2 + n2, 0, 0, 0, 0, 1), this;
    }
    makeScale(e5, t2, n2) {
      return this.set(e5, 0, 0, 0, 0, t2, 0, 0, 0, 0, n2, 0, 0, 0, 0, 1), this;
    }
    makeShear(e5, t2, n2, r2, i2, a2) {
      return this.set(1, n2, i2, 0, e5, 1, a2, 0, t2, r2, 1, 0, 0, 0, 0, 1), this;
    }
    compose(e5, t2, n2) {
      let r2 = this.elements, i2 = t2._x, a2 = t2._y, o2 = t2._z, s2 = t2._w, c2 = i2 + i2, l2 = a2 + a2, u2 = o2 + o2, d2 = i2 * c2, f2 = i2 * l2, p2 = i2 * u2, m2 = a2 * l2, h2 = a2 * u2, g2 = o2 * u2, _2 = s2 * c2, v2 = s2 * l2, y2 = s2 * u2, b2 = n2.x, x2 = n2.y, S2 = n2.z;
      return r2[0] = (1 - (m2 + g2)) * b2, r2[1] = (f2 + y2) * b2, r2[2] = (p2 - v2) * b2, r2[3] = 0, r2[4] = (f2 - y2) * x2, r2[5] = (1 - (d2 + g2)) * x2, r2[6] = (h2 + _2) * x2, r2[7] = 0, r2[8] = (p2 + v2) * S2, r2[9] = (h2 - _2) * S2, r2[10] = (1 - (d2 + m2)) * S2, r2[11] = 0, r2[12] = e5.x, r2[13] = e5.y, r2[14] = e5.z, r2[15] = 1, this;
    }
    decompose(e5, t2, n2) {
      let r2 = this.elements;
      e5.x = r2[12], e5.y = r2[13], e5.z = r2[14];
      let i2 = this.determinant();
      if (i2 === 0) return n2.set(1, 1, 1), t2.identity(), this;
      let a2 = Tr.set(r2[0], r2[1], r2[2]).length(), o2 = Tr.set(r2[4], r2[5], r2[6]).length(), s2 = Tr.set(r2[8], r2[9], r2[10]).length();
      i2 < 0 && (a2 = -a2), Er.copy(this);
      let c2 = 1 / a2, l2 = 1 / o2, u2 = 1 / s2;
      return Er.elements[0] *= c2, Er.elements[1] *= c2, Er.elements[2] *= c2, Er.elements[4] *= l2, Er.elements[5] *= l2, Er.elements[6] *= l2, Er.elements[8] *= u2, Er.elements[9] *= u2, Er.elements[10] *= u2, t2.setFromRotationMatrix(Er), n2.x = a2, n2.y = o2, n2.z = s2, this;
    }
    makePerspective(e5, t2, n2, r2, i2, a2, o2 = Jn, s2 = false) {
      let c2 = this.elements, l2 = 2 * i2 / (t2 - e5), u2 = 2 * i2 / (n2 - r2), d2 = (t2 + e5) / (t2 - e5), f2 = (n2 + r2) / (n2 - r2), p2, m2;
      if (s2) p2 = i2 / (a2 - i2), m2 = a2 * i2 / (a2 - i2);
      else if (o2 === 2e3) p2 = -(a2 + i2) / (a2 - i2), m2 = -2 * a2 * i2 / (a2 - i2);
      else if (o2 === 2001) p2 = -a2 / (a2 - i2), m2 = -a2 * i2 / (a2 - i2);
      else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: ` + o2);
      return c2[0] = l2, c2[4] = 0, c2[8] = d2, c2[12] = 0, c2[1] = 0, c2[5] = u2, c2[9] = f2, c2[13] = 0, c2[2] = 0, c2[6] = 0, c2[10] = p2, c2[14] = m2, c2[3] = 0, c2[7] = 0, c2[11] = -1, c2[15] = 0, this;
    }
    makeOrthographic(e5, t2, n2, r2, i2, a2, o2 = Jn, s2 = false) {
      let c2 = this.elements, l2 = 2 / (t2 - e5), u2 = 2 / (n2 - r2), d2 = -(t2 + e5) / (t2 - e5), f2 = -(n2 + r2) / (n2 - r2), p2, m2;
      if (s2) p2 = 1 / (a2 - i2), m2 = a2 / (a2 - i2);
      else if (o2 === 2e3) p2 = -2 / (a2 - i2), m2 = -(a2 + i2) / (a2 - i2);
      else if (o2 === 2001) p2 = -1 / (a2 - i2), m2 = -i2 / (a2 - i2);
      else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ` + o2);
      return c2[0] = l2, c2[4] = 0, c2[8] = 0, c2[12] = d2, c2[1] = 0, c2[5] = u2, c2[9] = 0, c2[13] = f2, c2[2] = 0, c2[6] = 0, c2[10] = p2, c2[14] = m2, c2[3] = 0, c2[7] = 0, c2[11] = 0, c2[15] = 1, this;
    }
    equals(e5) {
      let t2 = this.elements, n2 = e5.elements;
      for (let e6 = 0; e6 < 16; e6++) if (t2[e6] !== n2[e6]) return false;
      return true;
    }
    fromArray(e5, t2 = 0) {
      for (let n2 = 0; n2 < 16; n2++) this.elements[n2] = e5[n2 + t2];
      return this;
    }
    toArray(e5 = [], t2 = 0) {
      let n2 = this.elements;
      return e5[t2] = n2[0], e5[t2 + 1] = n2[1], e5[t2 + 2] = n2[2], e5[t2 + 3] = n2[3], e5[t2 + 4] = n2[4], e5[t2 + 5] = n2[5], e5[t2 + 6] = n2[6], e5[t2 + 7] = n2[7], e5[t2 + 8] = n2[8], e5[t2 + 9] = n2[9], e5[t2 + 10] = n2[10], e5[t2 + 11] = n2[11], e5[t2 + 12] = n2[12], e5[t2 + 13] = n2[13], e5[t2 + 14] = n2[14], e5[t2 + 15] = n2[15], e5;
    }
  }, Tr = new N(), Er = new wr(), Dr = new N(0, 0, 0), Or = new N(1, 1, 1), kr = new N(), Ar = new N(), jr = new N(), Mr = new wr(), Nr = new ir(), Pr = class e4 {
    constructor(t2 = 0, n2 = 0, r2 = 0, i2 = e4.DEFAULT_ORDER) {
      this.isEuler = true, this._x = t2, this._y = n2, this._z = r2, this._order = i2;
    }
    get x() {
      return this._x;
    }
    set x(e5) {
      this._x = e5, this._onChangeCallback();
    }
    get y() {
      return this._y;
    }
    set y(e5) {
      this._y = e5, this._onChangeCallback();
    }
    get z() {
      return this._z;
    }
    set z(e5) {
      this._z = e5, this._onChangeCallback();
    }
    get order() {
      return this._order;
    }
    set order(e5) {
      this._order = e5, this._onChangeCallback();
    }
    set(e5, t2, n2, r2 = this._order) {
      return this._x = e5, this._y = t2, this._z = n2, this._order = r2, this._onChangeCallback(), this;
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._order);
    }
    copy(e5) {
      return this._x = e5._x, this._y = e5._y, this._z = e5._z, this._order = e5._order, this._onChangeCallback(), this;
    }
    setFromRotationMatrix(e5, t2 = this._order, n2 = true) {
      let r2 = e5.elements, i2 = r2[0], a2 = r2[4], o2 = r2[8], s2 = r2[1], c2 = r2[5], u2 = r2[9], d2 = r2[2], f2 = r2[6], p2 = r2[10];
      switch (t2) {
        case `XYZ`:
          this._y = Math.asin(m(o2, -1, 1)), Math.abs(o2) < 0.9999999 ? (this._x = Math.atan2(-u2, p2), this._z = Math.atan2(-a2, i2)) : (this._x = Math.atan2(f2, c2), this._z = 0);
          break;
        case `YXZ`:
          this._x = Math.asin(-m(u2, -1, 1)), Math.abs(u2) < 0.9999999 ? (this._y = Math.atan2(o2, p2), this._z = Math.atan2(s2, c2)) : (this._y = Math.atan2(-d2, i2), this._z = 0);
          break;
        case `ZXY`:
          this._x = Math.asin(m(f2, -1, 1)), Math.abs(f2) < 0.9999999 ? (this._y = Math.atan2(-d2, p2), this._z = Math.atan2(-a2, c2)) : (this._y = 0, this._z = Math.atan2(s2, i2));
          break;
        case `ZYX`:
          this._y = Math.asin(-m(d2, -1, 1)), Math.abs(d2) < 0.9999999 ? (this._x = Math.atan2(f2, p2), this._z = Math.atan2(s2, i2)) : (this._x = 0, this._z = Math.atan2(-a2, c2));
          break;
        case `YZX`:
          this._z = Math.asin(m(s2, -1, 1)), Math.abs(s2) < 0.9999999 ? (this._x = Math.atan2(-u2, c2), this._y = Math.atan2(-d2, i2)) : (this._x = 0, this._y = Math.atan2(o2, p2));
          break;
        case `XZY`:
          this._z = Math.asin(-m(a2, -1, 1)), Math.abs(a2) < 0.9999999 ? (this._x = Math.atan2(f2, c2), this._y = Math.atan2(o2, i2)) : (this._x = Math.atan2(-u2, p2), this._y = 0);
          break;
        default:
          l(`Euler: .setFromRotationMatrix() encountered an unknown order: ` + t2);
      }
      return this._order = t2, n2 === true && this._onChangeCallback(), this;
    }
    setFromQuaternion(e5, t2, n2) {
      return Mr.makeRotationFromQuaternion(e5), this.setFromRotationMatrix(Mr, t2, n2);
    }
    setFromVector3(e5, t2 = this._order) {
      return this.set(e5.x, e5.y, e5.z, t2);
    }
    reorder(e5) {
      return Nr.setFromEuler(this), this.setFromQuaternion(Nr, e5);
    }
    equals(e5) {
      return e5._x === this._x && e5._y === this._y && e5._z === this._z && e5._order === this._order;
    }
    fromArray(e5) {
      return this._x = e5[0], this._y = e5[1], this._z = e5[2], e5[3] !== void 0 && (this._order = e5[3]), this._onChangeCallback(), this;
    }
    toArray(e5 = [], t2 = 0) {
      return e5[t2] = this._x, e5[t2 + 1] = this._y, e5[t2 + 2] = this._z, e5[t2 + 3] = this._order, e5;
    }
    _onChange(e5) {
      return this._onChangeCallback = e5, this;
    }
    _onChangeCallback() {
    }
    *[Symbol.iterator]() {
      yield this._x, yield this._y, yield this._z, yield this._order;
    }
  }, Pr.DEFAULT_ORDER = `XYZ`, Fr = class {
    constructor() {
      this.mask = 1;
    }
    set(e4) {
      this.mask = (1 << e4 | 0) >>> 0;
    }
    enable(e4) {
      this.mask |= 1 << e4 | 0;
    }
    enableAll() {
      this.mask = -1;
    }
    toggle(e4) {
      this.mask ^= 1 << e4 | 0;
    }
    disable(e4) {
      this.mask &= ~(1 << e4 | 0);
    }
    disableAll() {
      this.mask = 0;
    }
    test(e4) {
      return (this.mask & e4.mask) !== 0;
    }
    isEnabled(e4) {
      return (this.mask & (1 << e4 | 0)) != 0;
    }
  }, Ir = 0, Lr = new N(), Rr = new ir(), zr = new wr(), Br = new N(), Vr = new N(), Hr = new N(), Ur = new ir(), Wr = new N(1, 0, 0), Gr = new N(0, 1, 0), Kr = new N(0, 0, 1), qr = { type: `added` }, Jr = { type: `removed` }, Yr = { type: `childadded`, child: null }, Xr = { type: `childremoved`, child: null }, Zr = class e4 extends Qn {
    constructor() {
      super(), this.isObject3D = true, Object.defineProperty(this, `id`, { value: Ir++ }), this.uuid = p(), this.name = ``, this.type = `Object3D`, this.parent = null, this.children = [], this.up = e4.DEFAULT_UP.clone();
      let t2 = new N(), n2 = new Pr(), r2 = new ir(), i2 = new N(1, 1, 1);
      function a2() {
        r2.setFromEuler(n2, false);
      }
      function o2() {
        n2.setFromQuaternion(r2, void 0, false);
      }
      n2._onChange(a2), r2._onChange(o2), Object.defineProperties(this, { position: { configurable: true, enumerable: true, value: t2 }, rotation: { configurable: true, enumerable: true, value: n2 }, quaternion: { configurable: true, enumerable: true, value: r2 }, scale: { configurable: true, enumerable: true, value: i2 }, modelViewMatrix: { value: new wr() }, normalMatrix: { value: new sr() } }), this.matrix = new wr(), this.matrixWorld = new wr(), this.matrixAutoUpdate = e4.DEFAULT_MATRIX_AUTO_UPDATE, this.matrixWorldAutoUpdate = e4.DEFAULT_MATRIX_WORLD_AUTO_UPDATE, this.matrixWorldNeedsUpdate = false, this.layers = new Fr(), this.visible = true, this.castShadow = false, this.receiveShadow = false, this.frustumCulled = true, this.renderOrder = 0, this.animations = [], this.customDepthMaterial = void 0, this.customDistanceMaterial = void 0, this.static = false, this.userData = {}, this.pivot = null;
    }
    onBeforeShadow() {
    }
    onAfterShadow() {
    }
    onBeforeRender() {
    }
    onAfterRender() {
    }
    applyMatrix4(e5) {
      this.matrixAutoUpdate && this.updateMatrix(), this.matrix.premultiply(e5), this.matrix.decompose(this.position, this.quaternion, this.scale);
    }
    applyQuaternion(e5) {
      return this.quaternion.premultiply(e5), this;
    }
    setRotationFromAxisAngle(e5, t2) {
      this.quaternion.setFromAxisAngle(e5, t2);
    }
    setRotationFromEuler(e5) {
      this.quaternion.setFromEuler(e5, true);
    }
    setRotationFromMatrix(e5) {
      this.quaternion.setFromRotationMatrix(e5);
    }
    setRotationFromQuaternion(e5) {
      this.quaternion.copy(e5);
    }
    rotateOnAxis(e5, t2) {
      return Rr.setFromAxisAngle(e5, t2), this.quaternion.multiply(Rr), this;
    }
    rotateOnWorldAxis(e5, t2) {
      return Rr.setFromAxisAngle(e5, t2), this.quaternion.premultiply(Rr), this;
    }
    rotateX(e5) {
      return this.rotateOnAxis(Wr, e5);
    }
    rotateY(e5) {
      return this.rotateOnAxis(Gr, e5);
    }
    rotateZ(e5) {
      return this.rotateOnAxis(Kr, e5);
    }
    translateOnAxis(e5, t2) {
      return Lr.copy(e5).applyQuaternion(this.quaternion), this.position.add(Lr.multiplyScalar(t2)), this;
    }
    translateX(e5) {
      return this.translateOnAxis(Wr, e5);
    }
    translateY(e5) {
      return this.translateOnAxis(Gr, e5);
    }
    translateZ(e5) {
      return this.translateOnAxis(Kr, e5);
    }
    localToWorld(e5) {
      return this.updateWorldMatrix(true, false), e5.applyMatrix4(this.matrixWorld);
    }
    worldToLocal(e5) {
      return this.updateWorldMatrix(true, false), e5.applyMatrix4(zr.copy(this.matrixWorld).invert());
    }
    lookAt(e5, t2, n2) {
      e5.isVector3 ? Br.copy(e5) : Br.set(e5, t2, n2);
      let r2 = this.parent;
      this.updateWorldMatrix(true, false), Vr.setFromMatrixPosition(this.matrixWorld), this.isCamera || this.isLight ? zr.lookAt(Vr, Br, this.up) : zr.lookAt(Br, Vr, this.up), this.quaternion.setFromRotationMatrix(zr), r2 && (zr.extractRotation(r2.matrixWorld), Rr.setFromRotationMatrix(zr), this.quaternion.premultiply(Rr.invert()));
    }
    add(e5) {
      if (arguments.length > 1) {
        for (let e6 = 0; e6 < arguments.length; e6++) this.add(arguments[e6]);
        return this;
      }
      return e5 === this ? (u(`Object3D.add: object can't be added as a child of itself.`, e5), this) : (e5 && e5.isObject3D ? (e5.removeFromParent(), e5.parent = this, this.children.push(e5), e5.dispatchEvent(qr), Yr.child = e5, this.dispatchEvent(Yr), Yr.child = null) : u(`Object3D.add: object not an instance of THREE.Object3D.`, e5), this);
    }
    remove(e5) {
      if (arguments.length > 1) {
        for (let e6 = 0; e6 < arguments.length; e6++) this.remove(arguments[e6]);
        return this;
      }
      let t2 = this.children.indexOf(e5);
      return t2 !== -1 && (e5.parent = null, this.children.splice(t2, 1), e5.dispatchEvent(Jr), Xr.child = e5, this.dispatchEvent(Xr), Xr.child = null), this;
    }
    removeFromParent() {
      let e5 = this.parent;
      return e5 !== null && e5.remove(this), this;
    }
    clear() {
      return this.remove(...this.children);
    }
    attach(e5) {
      return this.updateWorldMatrix(true, false), zr.copy(this.matrixWorld).invert(), e5.parent !== null && (e5.parent.updateWorldMatrix(true, false), zr.multiply(e5.parent.matrixWorld)), e5.applyMatrix4(zr), e5.removeFromParent(), e5.parent = this, this.children.push(e5), e5.updateWorldMatrix(false, true), e5.dispatchEvent(qr), Yr.child = e5, this.dispatchEvent(Yr), Yr.child = null, this;
    }
    getObjectById(e5) {
      return this.getObjectByProperty(`id`, e5);
    }
    getObjectByName(e5) {
      return this.getObjectByProperty(`name`, e5);
    }
    getObjectByProperty(e5, t2) {
      if (this[e5] === t2) return this;
      for (let n2 = 0, r2 = this.children.length; n2 < r2; n2++) {
        let r3 = this.children[n2].getObjectByProperty(e5, t2);
        if (r3 !== void 0) return r3;
      }
    }
    getObjectsByProperty(e5, t2, n2 = []) {
      this[e5] === t2 && n2.push(this);
      let r2 = this.children;
      for (let i2 = 0, a2 = r2.length; i2 < a2; i2++) r2[i2].getObjectsByProperty(e5, t2, n2);
      return n2;
    }
    getWorldPosition(e5) {
      return this.updateWorldMatrix(true, false), e5.setFromMatrixPosition(this.matrixWorld);
    }
    getWorldQuaternion(e5) {
      return this.updateWorldMatrix(true, false), this.matrixWorld.decompose(Vr, e5, Hr), e5;
    }
    getWorldScale(e5) {
      return this.updateWorldMatrix(true, false), this.matrixWorld.decompose(Vr, Ur, e5), e5;
    }
    getWorldDirection(e5) {
      this.updateWorldMatrix(true, false);
      let t2 = this.matrixWorld.elements;
      return e5.set(t2[8], t2[9], t2[10]).normalize();
    }
    raycast() {
    }
    traverse(e5) {
      e5(this);
      let t2 = this.children;
      for (let n2 = 0, r2 = t2.length; n2 < r2; n2++) t2[n2].traverse(e5);
    }
    traverseVisible(e5) {
      if (this.visible === false) return;
      e5(this);
      let t2 = this.children;
      for (let n2 = 0, r2 = t2.length; n2 < r2; n2++) t2[n2].traverseVisible(e5);
    }
    traverseAncestors(e5) {
      let t2 = this.parent;
      t2 !== null && (e5(t2), t2.traverseAncestors(e5));
    }
    updateMatrix() {
      this.matrix.compose(this.position, this.quaternion, this.scale);
      let e5 = this.pivot;
      if (e5 !== null) {
        let t2 = e5.x, n2 = e5.y, r2 = e5.z, i2 = this.matrix.elements;
        i2[12] += t2 - i2[0] * t2 - i2[4] * n2 - i2[8] * r2, i2[13] += n2 - i2[1] * t2 - i2[5] * n2 - i2[9] * r2, i2[14] += r2 - i2[2] * t2 - i2[6] * n2 - i2[10] * r2;
      }
      this.matrixWorldNeedsUpdate = true;
    }
    updateMatrixWorld(e5) {
      this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || e5) && (this.matrixWorldAutoUpdate === true && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), this.matrixWorldNeedsUpdate = false, e5 = true);
      let t2 = this.children;
      for (let n2 = 0, r2 = t2.length; n2 < r2; n2++) t2[n2].updateMatrixWorld(e5);
    }
    updateWorldMatrix(e5, t2) {
      let n2 = this.parent;
      if (e5 === true && n2 !== null && n2.updateWorldMatrix(true, false), this.matrixAutoUpdate && this.updateMatrix(), this.matrixWorldAutoUpdate === true && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)), t2 === true) {
        let e6 = this.children;
        for (let t3 = 0, n3 = e6.length; t3 < n3; t3++) e6[t3].updateWorldMatrix(false, true);
      }
    }
    toJSON(e5) {
      let t2 = e5 === void 0 || typeof e5 == `string`, n2 = {};
      t2 && (e5 = { geometries: {}, materials: {}, textures: {}, images: {}, shapes: {}, skeletons: {}, animations: {}, nodes: {} }, n2.metadata = { version: 4.7, type: `Object`, generator: `Object3D.toJSON` });
      let r2 = {};
      r2.uuid = this.uuid, r2.type = this.type, this.name !== `` && (r2.name = this.name), this.castShadow === true && (r2.castShadow = true), this.receiveShadow === true && (r2.receiveShadow = true), this.visible === false && (r2.visible = false), this.frustumCulled === false && (r2.frustumCulled = false), this.renderOrder !== 0 && (r2.renderOrder = this.renderOrder), this.static !== false && (r2.static = this.static), Object.keys(this.userData).length > 0 && (r2.userData = this.userData), r2.layers = this.layers.mask, r2.matrix = this.matrix.toArray(), r2.up = this.up.toArray(), this.pivot !== null && (r2.pivot = this.pivot.toArray()), this.matrixAutoUpdate === false && (r2.matrixAutoUpdate = false), this.morphTargetDictionary !== void 0 && (r2.morphTargetDictionary = Object.assign({}, this.morphTargetDictionary)), this.morphTargetInfluences !== void 0 && (r2.morphTargetInfluences = this.morphTargetInfluences.slice()), this.isInstancedMesh && (r2.type = `InstancedMesh`, r2.count = this.count, r2.instanceMatrix = this.instanceMatrix.toJSON(), this.instanceColor !== null && (r2.instanceColor = this.instanceColor.toJSON())), this.isBatchedMesh && (r2.type = `BatchedMesh`, r2.perObjectFrustumCulled = this.perObjectFrustumCulled, r2.sortObjects = this.sortObjects, r2.drawRanges = this._drawRanges, r2.reservedRanges = this._reservedRanges, r2.geometryInfo = this._geometryInfo.map((e6) => ({ ...e6, boundingBox: e6.boundingBox ? e6.boundingBox.toJSON() : void 0, boundingSphere: e6.boundingSphere ? e6.boundingSphere.toJSON() : void 0 })), r2.instanceInfo = this._instanceInfo.map((e6) => ({ ...e6 })), r2.availableInstanceIds = this._availableInstanceIds.slice(), r2.availableGeometryIds = this._availableGeometryIds.slice(), r2.nextIndexStart = this._nextIndexStart, r2.nextVertexStart = this._nextVertexStart, r2.geometryCount = this._geometryCount, r2.maxInstanceCount = this._maxInstanceCount, r2.maxVertexCount = this._maxVertexCount, r2.maxIndexCount = this._maxIndexCount, r2.geometryInitialized = this._geometryInitialized, r2.matricesTexture = this._matricesTexture.toJSON(e5), r2.indirectTexture = this._indirectTexture.toJSON(e5), this._colorsTexture !== null && (r2.colorsTexture = this._colorsTexture.toJSON(e5)), this.boundingSphere !== null && (r2.boundingSphere = this.boundingSphere.toJSON()), this.boundingBox !== null && (r2.boundingBox = this.boundingBox.toJSON()));
      function i2(t3, n3) {
        return t3[n3.uuid] === void 0 && (t3[n3.uuid] = n3.toJSON(e5)), n3.uuid;
      }
      if (this.isScene) this.background && (this.background.isColor ? r2.background = this.background.toJSON() : this.background.isTexture && (r2.background = this.background.toJSON(e5).uuid)), this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true && (r2.environment = this.environment.toJSON(e5).uuid);
      else if (this.isMesh || this.isLine || this.isPoints) {
        r2.geometry = i2(e5.geometries, this.geometry);
        let t3 = this.geometry.parameters;
        if (t3 !== void 0 && t3.shapes !== void 0) {
          let n3 = t3.shapes;
          if (Array.isArray(n3)) for (let t4 = 0, r3 = n3.length; t4 < r3; t4++) {
            let r4 = n3[t4];
            i2(e5.shapes, r4);
          }
          else i2(e5.shapes, n3);
        }
      }
      if (this.isSkinnedMesh && (r2.bindMode = this.bindMode, r2.bindMatrix = this.bindMatrix.toArray(), this.skeleton !== void 0 && (i2(e5.skeletons, this.skeleton), r2.skeleton = this.skeleton.uuid)), this.material !== void 0) if (Array.isArray(this.material)) {
        let t3 = [];
        for (let n3 = 0, r3 = this.material.length; n3 < r3; n3++) t3.push(i2(e5.materials, this.material[n3]));
        r2.material = t3;
      } else r2.material = i2(e5.materials, this.material);
      if (this.children.length > 0) {
        r2.children = [];
        for (let t3 = 0; t3 < this.children.length; t3++) r2.children.push(this.children[t3].toJSON(e5).object);
      }
      if (this.animations.length > 0) {
        r2.animations = [];
        for (let t3 = 0; t3 < this.animations.length; t3++) {
          let n3 = this.animations[t3];
          r2.animations.push(i2(e5.animations, n3));
        }
      }
      if (t2) {
        let t3 = a2(e5.geometries), r3 = a2(e5.materials), i3 = a2(e5.textures), o2 = a2(e5.images), s2 = a2(e5.shapes), c2 = a2(e5.skeletons), l2 = a2(e5.animations), u2 = a2(e5.nodes);
        t3.length > 0 && (n2.geometries = t3), r3.length > 0 && (n2.materials = r3), i3.length > 0 && (n2.textures = i3), o2.length > 0 && (n2.images = o2), s2.length > 0 && (n2.shapes = s2), c2.length > 0 && (n2.skeletons = c2), l2.length > 0 && (n2.animations = l2), u2.length > 0 && (n2.nodes = u2);
      }
      return n2.object = r2, n2;
      function a2(e6) {
        let t3 = [];
        for (let n3 in e6) {
          let r3 = e6[n3];
          delete r3.metadata, t3.push(r3);
        }
        return t3;
      }
    }
    clone(e5) {
      return new this.constructor().copy(this, e5);
    }
    copy(e5, t2 = true) {
      if (this.name = e5.name, this.up.copy(e5.up), this.position.copy(e5.position), this.rotation.order = e5.rotation.order, this.quaternion.copy(e5.quaternion), this.scale.copy(e5.scale), this.pivot = e5.pivot === null ? null : e5.pivot.clone(), this.matrix.copy(e5.matrix), this.matrixWorld.copy(e5.matrixWorld), this.matrixAutoUpdate = e5.matrixAutoUpdate, this.matrixWorldAutoUpdate = e5.matrixWorldAutoUpdate, this.matrixWorldNeedsUpdate = e5.matrixWorldNeedsUpdate, this.layers.mask = e5.layers.mask, this.visible = e5.visible, this.castShadow = e5.castShadow, this.receiveShadow = e5.receiveShadow, this.frustumCulled = e5.frustumCulled, this.renderOrder = e5.renderOrder, this.static = e5.static, this.animations = e5.animations.slice(), this.userData = JSON.parse(JSON.stringify(e5.userData)), t2 === true) for (let t3 = 0; t3 < e5.children.length; t3++) {
        let n2 = e5.children[t3];
        this.add(n2.clone());
      }
      return this;
    }
  }, Zr.DEFAULT_UP = new N(0, 1, 0), Zr.DEFAULT_MATRIX_AUTO_UPDATE = true, Zr.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true, Qr = class extends Zr {
    constructor() {
      super(), this.isGroup = true, this.type = `Group`;
    }
  }, $r = { type: `move` }, ei = class {
    constructor() {
      this._targetRay = null, this._grip = null, this._hand = null;
    }
    getHandSpace() {
      return this._hand === null && (this._hand = new Qr(), this._hand.matrixAutoUpdate = false, this._hand.visible = false, this._hand.joints = {}, this._hand.inputState = { pinching: false }), this._hand;
    }
    getTargetRaySpace() {
      return this._targetRay === null && (this._targetRay = new Qr(), this._targetRay.matrixAutoUpdate = false, this._targetRay.visible = false, this._targetRay.hasLinearVelocity = false, this._targetRay.linearVelocity = new N(), this._targetRay.hasAngularVelocity = false, this._targetRay.angularVelocity = new N()), this._targetRay;
    }
    getGripSpace() {
      return this._grip === null && (this._grip = new Qr(), this._grip.matrixAutoUpdate = false, this._grip.visible = false, this._grip.hasLinearVelocity = false, this._grip.linearVelocity = new N(), this._grip.hasAngularVelocity = false, this._grip.angularVelocity = new N(), this._grip.eventsEnabled = false), this._grip;
    }
    dispatchEvent(e4) {
      return this._targetRay !== null && this._targetRay.dispatchEvent(e4), this._grip !== null && this._grip.dispatchEvent(e4), this._hand !== null && this._hand.dispatchEvent(e4), this;
    }
    connect(e4) {
      if (e4 && e4.hand) {
        let t2 = this._hand;
        if (t2) for (let n2 of e4.hand.values()) this._getHandJoint(t2, n2);
      }
      return this.dispatchEvent({ type: `connected`, data: e4 }), this;
    }
    disconnect(e4) {
      return this.dispatchEvent({ type: `disconnected`, data: e4 }), this._targetRay !== null && (this._targetRay.visible = false), this._grip !== null && (this._grip.visible = false), this._hand !== null && (this._hand.visible = false), this;
    }
    update(e4, t2, n2) {
      let r2 = null, i2 = null, a2 = null, o2 = this._targetRay, s2 = this._grip, c2 = this._hand;
      if (e4 && t2.session.visibilityState !== `visible-blurred`) {
        if (c2 && e4.hand) {
          a2 = true;
          for (let r4 of e4.hand.values()) {
            let e5 = t2.getJointPose(r4, n2), i4 = this._getHandJoint(c2, r4);
            e5 !== null && (i4.matrix.fromArray(e5.transform.matrix), i4.matrix.decompose(i4.position, i4.rotation, i4.scale), i4.matrixWorldNeedsUpdate = true, i4.jointRadius = e5.radius), i4.visible = e5 !== null;
          }
          let r3 = c2.joints[`index-finger-tip`], i3 = c2.joints[`thumb-tip`], o3 = r3.position.distanceTo(i3.position), s3 = 0.02, l2 = 5e-3;
          c2.inputState.pinching && o3 > s3 + l2 ? (c2.inputState.pinching = false, this.dispatchEvent({ type: `pinchend`, handedness: e4.handedness, target: this })) : !c2.inputState.pinching && o3 <= s3 - l2 && (c2.inputState.pinching = true, this.dispatchEvent({ type: `pinchstart`, handedness: e4.handedness, target: this }));
        } else s2 !== null && e4.gripSpace && (i2 = t2.getPose(e4.gripSpace, n2), i2 !== null && (s2.matrix.fromArray(i2.transform.matrix), s2.matrix.decompose(s2.position, s2.rotation, s2.scale), s2.matrixWorldNeedsUpdate = true, i2.linearVelocity ? (s2.hasLinearVelocity = true, s2.linearVelocity.copy(i2.linearVelocity)) : s2.hasLinearVelocity = false, i2.angularVelocity ? (s2.hasAngularVelocity = true, s2.angularVelocity.copy(i2.angularVelocity)) : s2.hasAngularVelocity = false, s2.eventsEnabled && s2.dispatchEvent({ type: `gripUpdated`, data: e4, target: this })));
        o2 !== null && (r2 = t2.getPose(e4.targetRaySpace, n2), r2 === null && i2 !== null && (r2 = i2), r2 !== null && (o2.matrix.fromArray(r2.transform.matrix), o2.matrix.decompose(o2.position, o2.rotation, o2.scale), o2.matrixWorldNeedsUpdate = true, r2.linearVelocity ? (o2.hasLinearVelocity = true, o2.linearVelocity.copy(r2.linearVelocity)) : o2.hasLinearVelocity = false, r2.angularVelocity ? (o2.hasAngularVelocity = true, o2.angularVelocity.copy(r2.angularVelocity)) : o2.hasAngularVelocity = false, this.dispatchEvent($r)));
      }
      return o2 !== null && (o2.visible = r2 !== null), s2 !== null && (s2.visible = i2 !== null), c2 !== null && (c2.visible = a2 !== null), this;
    }
    _getHandJoint(e4, t2) {
      if (e4.joints[t2.jointName] === void 0) {
        let n2 = new Qr();
        n2.matrixAutoUpdate = false, n2.visible = false, e4.joints[t2.jointName] = n2, e4.add(n2);
      }
      return e4.joints[t2.jointName];
    }
  }, ti = { aliceblue: 15792383, antiquewhite: 16444375, aqua: 65535, aquamarine: 8388564, azure: 15794175, beige: 16119260, bisque: 16770244, black: 0, blanchedalmond: 16772045, blue: 255, blueviolet: 9055202, brown: 10824234, burlywood: 14596231, cadetblue: 6266528, chartreuse: 8388352, chocolate: 13789470, coral: 16744272, cornflowerblue: 6591981, cornsilk: 16775388, crimson: 14423100, cyan: 65535, darkblue: 139, darkcyan: 35723, darkgoldenrod: 12092939, darkgray: 11119017, darkgreen: 25600, darkgrey: 11119017, darkkhaki: 12433259, darkmagenta: 9109643, darkolivegreen: 5597999, darkorange: 16747520, darkorchid: 10040012, darkred: 9109504, darksalmon: 15308410, darkseagreen: 9419919, darkslateblue: 4734347, darkslategray: 3100495, darkslategrey: 3100495, darkturquoise: 52945, darkviolet: 9699539, deeppink: 16716947, deepskyblue: 49151, dimgray: 6908265, dimgrey: 6908265, dodgerblue: 2003199, firebrick: 11674146, floralwhite: 16775920, forestgreen: 2263842, fuchsia: 16711935, gainsboro: 14474460, ghostwhite: 16316671, gold: 16766720, goldenrod: 14329120, gray: 8421504, green: 32768, greenyellow: 11403055, grey: 8421504, honeydew: 15794160, hotpink: 16738740, indianred: 13458524, indigo: 4915330, ivory: 16777200, khaki: 15787660, lavender: 15132410, lavenderblush: 16773365, lawngreen: 8190976, lemonchiffon: 16775885, lightblue: 11393254, lightcoral: 15761536, lightcyan: 14745599, lightgoldenrodyellow: 16448210, lightgray: 13882323, lightgreen: 9498256, lightgrey: 13882323, lightpink: 16758465, lightsalmon: 16752762, lightseagreen: 2142890, lightskyblue: 8900346, lightslategray: 7833753, lightslategrey: 7833753, lightsteelblue: 11584734, lightyellow: 16777184, lime: 65280, limegreen: 3329330, linen: 16445670, magenta: 16711935, maroon: 8388608, mediumaquamarine: 6737322, mediumblue: 205, mediumorchid: 12211667, mediumpurple: 9662683, mediumseagreen: 3978097, mediumslateblue: 8087790, mediumspringgreen: 64154, mediumturquoise: 4772300, mediumvioletred: 13047173, midnightblue: 1644912, mintcream: 16121850, mistyrose: 16770273, moccasin: 16770229, navajowhite: 16768685, navy: 128, oldlace: 16643558, olive: 8421376, olivedrab: 7048739, orange: 16753920, orangered: 16729344, orchid: 14315734, palegoldenrod: 15657130, palegreen: 10025880, paleturquoise: 11529966, palevioletred: 14381203, papayawhip: 16773077, peachpuff: 16767673, peru: 13468991, pink: 16761035, plum: 14524637, powderblue: 11591910, purple: 8388736, rebeccapurple: 6697881, red: 16711680, rosybrown: 12357519, royalblue: 4286945, saddlebrown: 9127187, salmon: 16416882, sandybrown: 16032864, seagreen: 3050327, seashell: 16774638, sienna: 10506797, silver: 12632256, skyblue: 8900331, slateblue: 6970061, slategray: 7372944, slategrey: 7372944, snow: 16775930, springgreen: 65407, steelblue: 4620980, tan: 13808780, teal: 32896, thistle: 14204888, tomato: 16737095, turquoise: 4251856, violet: 15631086, wheat: 16113331, white: 16777215, whitesmoke: 16119285, yellow: 16776960, yellowgreen: 10145074 }, ni = { h: 0, s: 0, l: 0 }, ri = { h: 0, s: 0, l: 0 }, P = class {
    constructor(e4, t2, n2) {
      return this.isColor = true, this.r = 1, this.g = 1, this.b = 1, this.set(e4, t2, n2);
    }
    set(e4, t2, n2) {
      if (t2 === void 0 && n2 === void 0) {
        let t3 = e4;
        t3 && t3.isColor ? this.copy(t3) : typeof t3 == `number` ? this.setHex(t3) : typeof t3 == `string` && this.setStyle(t3);
      } else this.setRGB(e4, t2, n2);
      return this;
    }
    setScalar(e4) {
      return this.r = e4, this.g = e4, this.b = e4, this;
    }
    setHex(e4, t2 = Vn) {
      return e4 = Math.floor(e4), this.r = (e4 >> 16 & 255) / 255, this.g = (e4 >> 8 & 255) / 255, this.b = (e4 & 255) / 255, dr.colorSpaceToWorking(this, t2), this;
    }
    setRGB(e4, t2, n2, r2 = dr.workingColorSpace) {
      return this.r = e4, this.g = t2, this.b = n2, dr.colorSpaceToWorking(this, r2), this;
    }
    setHSL(e4, t2, n2, r2 = dr.workingColorSpace) {
      if (e4 = h(e4, 1), t2 = m(t2, 0, 1), n2 = m(n2, 0, 1), t2 === 0) this.r = this.g = this.b = n2;
      else {
        let r3 = n2 <= 0.5 ? n2 * (1 + t2) : n2 + t2 - n2 * t2, i2 = 2 * n2 - r3;
        this.r = ce(i2, r3, e4 + 1 / 3), this.g = ce(i2, r3, e4), this.b = ce(i2, r3, e4 - 1 / 3);
      }
      return dr.colorSpaceToWorking(this, r2), this;
    }
    setStyle(e4, t2 = Vn) {
      function n2(t3) {
        t3 !== void 0 && parseFloat(t3) < 1 && l(`Color: Alpha component of ` + e4 + ` will be ignored.`);
      }
      let r2;
      if (r2 = /^(\w+)\(([^\)]*)\)/.exec(e4)) {
        let i2, a2 = r2[1], o2 = r2[2];
        switch (a2) {
          case `rgb`:
          case `rgba`:
            if (i2 = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o2)) return n2(i2[4]), this.setRGB(Math.min(255, parseInt(i2[1], 10)) / 255, Math.min(255, parseInt(i2[2], 10)) / 255, Math.min(255, parseInt(i2[3], 10)) / 255, t2);
            if (i2 = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o2)) return n2(i2[4]), this.setRGB(Math.min(100, parseInt(i2[1], 10)) / 100, Math.min(100, parseInt(i2[2], 10)) / 100, Math.min(100, parseInt(i2[3], 10)) / 100, t2);
            break;
          case `hsl`:
          case `hsla`:
            if (i2 = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o2)) return n2(i2[4]), this.setHSL(parseFloat(i2[1]) / 360, parseFloat(i2[2]) / 100, parseFloat(i2[3]) / 100, t2);
            break;
          default:
            l(`Color: Unknown color model ` + e4);
        }
      } else if (r2 = /^\#([A-Fa-f\d]+)$/.exec(e4)) {
        let n3 = r2[1], i2 = n3.length;
        if (i2 === 3) return this.setRGB(parseInt(n3.charAt(0), 16) / 15, parseInt(n3.charAt(1), 16) / 15, parseInt(n3.charAt(2), 16) / 15, t2);
        if (i2 === 6) return this.setHex(parseInt(n3, 16), t2);
        l(`Color: Invalid hex color ` + e4);
      } else if (e4 && e4.length > 0) return this.setColorName(e4, t2);
      return this;
    }
    setColorName(e4, t2 = Vn) {
      let n2 = ti[e4.toLowerCase()];
      return n2 === void 0 ? l(`Color: Unknown color ` + e4) : this.setHex(n2, t2), this;
    }
    clone() {
      return new this.constructor(this.r, this.g, this.b);
    }
    copy(e4) {
      return this.r = e4.r, this.g = e4.g, this.b = e4.b, this;
    }
    copySRGBToLinear(e4) {
      return this.r = ae(e4.r), this.g = ae(e4.g), this.b = ae(e4.b), this;
    }
    copyLinearToSRGB(e4) {
      return this.r = oe(e4.r), this.g = oe(e4.g), this.b = oe(e4.b), this;
    }
    convertSRGBToLinear() {
      return this.copySRGBToLinear(this), this;
    }
    convertLinearToSRGB() {
      return this.copyLinearToSRGB(this), this;
    }
    getHex(e4 = Vn) {
      return dr.workingToColorSpace(ii.copy(this), e4), Math.round(m(ii.r * 255, 0, 255)) * 65536 + Math.round(m(ii.g * 255, 0, 255)) * 256 + Math.round(m(ii.b * 255, 0, 255));
    }
    getHexString(e4 = Vn) {
      return (`000000` + this.getHex(e4).toString(16)).slice(-6);
    }
    getHSL(e4, t2 = dr.workingColorSpace) {
      dr.workingToColorSpace(ii.copy(this), t2);
      let n2 = ii.r, r2 = ii.g, i2 = ii.b, a2 = Math.max(n2, r2, i2), o2 = Math.min(n2, r2, i2), s2, c2, l2 = (o2 + a2) / 2;
      if (o2 === a2) s2 = 0, c2 = 0;
      else {
        let e5 = a2 - o2;
        switch (c2 = l2 <= 0.5 ? e5 / (a2 + o2) : e5 / (2 - a2 - o2), a2) {
          case n2:
            s2 = (r2 - i2) / e5 + (r2 < i2 ? 6 : 0);
            break;
          case r2:
            s2 = (i2 - n2) / e5 + 2;
            break;
          case i2:
            s2 = (n2 - r2) / e5 + 4;
            break;
        }
        s2 /= 6;
      }
      return e4.h = s2, e4.s = c2, e4.l = l2, e4;
    }
    getRGB(e4, t2 = dr.workingColorSpace) {
      return dr.workingToColorSpace(ii.copy(this), t2), e4.r = ii.r, e4.g = ii.g, e4.b = ii.b, e4;
    }
    getStyle(e4 = Vn) {
      dr.workingToColorSpace(ii.copy(this), e4);
      let t2 = ii.r, n2 = ii.g, r2 = ii.b;
      return e4 === `srgb` ? `rgb(${Math.round(t2 * 255)},${Math.round(n2 * 255)},${Math.round(r2 * 255)})` : `color(${e4} ${t2.toFixed(3)} ${n2.toFixed(3)} ${r2.toFixed(3)})`;
    }
    offsetHSL(e4, t2, n2) {
      return this.getHSL(ni), this.setHSL(ni.h + e4, ni.s + t2, ni.l + n2);
    }
    add(e4) {
      return this.r += e4.r, this.g += e4.g, this.b += e4.b, this;
    }
    addColors(e4, t2) {
      return this.r = e4.r + t2.r, this.g = e4.g + t2.g, this.b = e4.b + t2.b, this;
    }
    addScalar(e4) {
      return this.r += e4, this.g += e4, this.b += e4, this;
    }
    sub(e4) {
      return this.r = Math.max(0, this.r - e4.r), this.g = Math.max(0, this.g - e4.g), this.b = Math.max(0, this.b - e4.b), this;
    }
    multiply(e4) {
      return this.r *= e4.r, this.g *= e4.g, this.b *= e4.b, this;
    }
    multiplyScalar(e4) {
      return this.r *= e4, this.g *= e4, this.b *= e4, this;
    }
    lerp(e4, t2) {
      return this.r += (e4.r - this.r) * t2, this.g += (e4.g - this.g) * t2, this.b += (e4.b - this.b) * t2, this;
    }
    lerpColors(e4, t2, n2) {
      return this.r = e4.r + (t2.r - e4.r) * n2, this.g = e4.g + (t2.g - e4.g) * n2, this.b = e4.b + (t2.b - e4.b) * n2, this;
    }
    lerpHSL(e4, t2) {
      this.getHSL(ni), e4.getHSL(ri);
      let n2 = v(ni.h, ri.h, t2), r2 = v(ni.s, ri.s, t2), i2 = v(ni.l, ri.l, t2);
      return this.setHSL(n2, r2, i2), this;
    }
    setFromVector3(e4) {
      return this.r = e4.x, this.g = e4.y, this.b = e4.z, this;
    }
    applyMatrix3(e4) {
      let t2 = this.r, n2 = this.g, r2 = this.b, i2 = e4.elements;
      return this.r = i2[0] * t2 + i2[3] * n2 + i2[6] * r2, this.g = i2[1] * t2 + i2[4] * n2 + i2[7] * r2, this.b = i2[2] * t2 + i2[5] * n2 + i2[8] * r2, this;
    }
    equals(e4) {
      return e4.r === this.r && e4.g === this.g && e4.b === this.b;
    }
    fromArray(e4, t2 = 0) {
      return this.r = e4[t2], this.g = e4[t2 + 1], this.b = e4[t2 + 2], this;
    }
    toArray(e4 = [], t2 = 0) {
      return e4[t2] = this.r, e4[t2 + 1] = this.g, e4[t2 + 2] = this.b, e4;
    }
    fromBufferAttribute(e4, t2) {
      return this.r = e4.getX(t2), this.g = e4.getY(t2), this.b = e4.getZ(t2), this;
    }
    toJSON() {
      return this.getHex();
    }
    *[Symbol.iterator]() {
      yield this.r, yield this.g, yield this.b;
    }
  }, ii = new P(), P.NAMES = ti, ai = class extends Zr {
    constructor() {
      super(), this.isScene = true, this.type = `Scene`, this.background = null, this.environment = null, this.fog = null, this.backgroundBlurriness = 0, this.backgroundIntensity = 1, this.backgroundRotation = new Pr(), this.environmentIntensity = 1, this.environmentRotation = new Pr(), this.overrideMaterial = null, typeof __THREE_DEVTOOLS__ < `u` && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`, { detail: this }));
    }
    copy(e4, t2) {
      return super.copy(e4, t2), e4.background !== null && (this.background = e4.background.clone()), e4.environment !== null && (this.environment = e4.environment.clone()), e4.fog !== null && (this.fog = e4.fog.clone()), this.backgroundBlurriness = e4.backgroundBlurriness, this.backgroundIntensity = e4.backgroundIntensity, this.backgroundRotation.copy(e4.backgroundRotation), this.environmentIntensity = e4.environmentIntensity, this.environmentRotation.copy(e4.environmentRotation), e4.overrideMaterial !== null && (this.overrideMaterial = e4.overrideMaterial.clone()), this.matrixAutoUpdate = e4.matrixAutoUpdate, this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return this.fog !== null && (t2.object.fog = this.fog.toJSON()), this.backgroundBlurriness > 0 && (t2.object.backgroundBlurriness = this.backgroundBlurriness), this.backgroundIntensity !== 1 && (t2.object.backgroundIntensity = this.backgroundIntensity), t2.object.backgroundRotation = this.backgroundRotation.toArray(), this.environmentIntensity !== 1 && (t2.object.environmentIntensity = this.environmentIntensity), t2.object.environmentRotation = this.environmentRotation.toArray(), t2;
    }
  }, oi = new N(), si = new N(), ci = new N(), li = new N(), ui = new N(), di = new N(), fi = new N(), pi = new N(), mi = new N(), hi = new N(), gi = new yr(), _i = new yr(), vi = new yr(), yi = class e4 {
    constructor(e5 = new N(), t2 = new N(), n2 = new N()) {
      this.a = e5, this.b = t2, this.c = n2;
    }
    static getNormal(e5, t2, n2, r2) {
      r2.subVectors(n2, t2), oi.subVectors(e5, t2), r2.cross(oi);
      let i2 = r2.lengthSq();
      return i2 > 0 ? r2.multiplyScalar(1 / Math.sqrt(i2)) : r2.set(0, 0, 0);
    }
    static getBarycoord(e5, t2, n2, r2, i2) {
      oi.subVectors(r2, t2), si.subVectors(n2, t2), ci.subVectors(e5, t2);
      let a2 = oi.dot(oi), o2 = oi.dot(si), s2 = oi.dot(ci), c2 = si.dot(si), l2 = si.dot(ci), u2 = a2 * c2 - o2 * o2;
      if (u2 === 0) return i2.set(0, 0, 0), null;
      let d2 = 1 / u2, f2 = (c2 * s2 - o2 * l2) * d2, p2 = (a2 * l2 - o2 * s2) * d2;
      return i2.set(1 - f2 - p2, p2, f2);
    }
    static containsPoint(e5, t2, n2, r2) {
      return this.getBarycoord(e5, t2, n2, r2, li) === null ? false : li.x >= 0 && li.y >= 0 && li.x + li.y <= 1;
    }
    static getInterpolation(e5, t2, n2, r2, i2, a2, o2, s2) {
      return this.getBarycoord(e5, t2, n2, r2, li) === null ? (s2.x = 0, s2.y = 0, `z` in s2 && (s2.z = 0), `w` in s2 && (s2.w = 0), null) : (s2.setScalar(0), s2.addScaledVector(i2, li.x), s2.addScaledVector(a2, li.y), s2.addScaledVector(o2, li.z), s2);
    }
    static getInterpolatedAttribute(e5, t2, n2, r2, i2, a2) {
      return gi.setScalar(0), _i.setScalar(0), vi.setScalar(0), gi.fromBufferAttribute(e5, t2), _i.fromBufferAttribute(e5, n2), vi.fromBufferAttribute(e5, r2), a2.setScalar(0), a2.addScaledVector(gi, i2.x), a2.addScaledVector(_i, i2.y), a2.addScaledVector(vi, i2.z), a2;
    }
    static isFrontFacing(e5, t2, n2, r2) {
      return oi.subVectors(n2, t2), si.subVectors(e5, t2), oi.cross(si).dot(r2) < 0;
    }
    set(e5, t2, n2) {
      return this.a.copy(e5), this.b.copy(t2), this.c.copy(n2), this;
    }
    setFromPointsAndIndices(e5, t2, n2, r2) {
      return this.a.copy(e5[t2]), this.b.copy(e5[n2]), this.c.copy(e5[r2]), this;
    }
    setFromAttributeAndIndices(e5, t2, n2, r2) {
      return this.a.fromBufferAttribute(e5, t2), this.b.fromBufferAttribute(e5, n2), this.c.fromBufferAttribute(e5, r2), this;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e5) {
      return this.a.copy(e5.a), this.b.copy(e5.b), this.c.copy(e5.c), this;
    }
    getArea() {
      return oi.subVectors(this.c, this.b), si.subVectors(this.a, this.b), oi.cross(si).length() * 0.5;
    }
    getMidpoint(e5) {
      return e5.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
    }
    getNormal(t2) {
      return e4.getNormal(this.a, this.b, this.c, t2);
    }
    getPlane(e5) {
      return e5.setFromCoplanarPoints(this.a, this.b, this.c);
    }
    getBarycoord(t2, n2) {
      return e4.getBarycoord(t2, this.a, this.b, this.c, n2);
    }
    getInterpolation(t2, n2, r2, i2, a2) {
      return e4.getInterpolation(t2, this.a, this.b, this.c, n2, r2, i2, a2);
    }
    containsPoint(t2) {
      return e4.containsPoint(t2, this.a, this.b, this.c);
    }
    isFrontFacing(t2) {
      return e4.isFrontFacing(this.a, this.b, this.c, t2);
    }
    intersectsBox(e5) {
      return e5.intersectsTriangle(this);
    }
    closestPointToPoint(e5, t2) {
      let n2 = this.a, r2 = this.b, i2 = this.c, a2, o2;
      ui.subVectors(r2, n2), di.subVectors(i2, n2), pi.subVectors(e5, n2);
      let s2 = ui.dot(pi), c2 = di.dot(pi);
      if (s2 <= 0 && c2 <= 0) return t2.copy(n2);
      mi.subVectors(e5, r2);
      let l2 = ui.dot(mi), u2 = di.dot(mi);
      if (l2 >= 0 && u2 <= l2) return t2.copy(r2);
      let d2 = s2 * u2 - l2 * c2;
      if (d2 <= 0 && s2 >= 0 && l2 <= 0) return a2 = s2 / (s2 - l2), t2.copy(n2).addScaledVector(ui, a2);
      hi.subVectors(e5, i2);
      let f2 = ui.dot(hi), p2 = di.dot(hi);
      if (p2 >= 0 && f2 <= p2) return t2.copy(i2);
      let m2 = f2 * c2 - s2 * p2;
      if (m2 <= 0 && c2 >= 0 && p2 <= 0) return o2 = c2 / (c2 - p2), t2.copy(n2).addScaledVector(di, o2);
      let h2 = l2 * p2 - f2 * u2;
      if (h2 <= 0 && u2 - l2 >= 0 && f2 - p2 >= 0) return fi.subVectors(i2, r2), o2 = (u2 - l2) / (u2 - l2 + (f2 - p2)), t2.copy(r2).addScaledVector(fi, o2);
      let g2 = 1 / (h2 + m2 + d2);
      return a2 = m2 * g2, o2 = d2 * g2, t2.copy(n2).addScaledVector(ui, a2).addScaledVector(di, o2);
    }
    equals(e5) {
      return e5.a.equals(this.a) && e5.b.equals(this.b) && e5.c.equals(this.c);
    }
  }, bi = class {
    constructor(e4 = new N(1 / 0, 1 / 0, 1 / 0), t2 = new N(-1 / 0, -1 / 0, -1 / 0)) {
      this.isBox3 = true, this.min = e4, this.max = t2;
    }
    set(e4, t2) {
      return this.min.copy(e4), this.max.copy(t2), this;
    }
    setFromArray(e4) {
      this.makeEmpty();
      for (let t2 = 0, n2 = e4.length; t2 < n2; t2 += 3) this.expandByPoint(Si.fromArray(e4, t2));
      return this;
    }
    setFromBufferAttribute(e4) {
      this.makeEmpty();
      for (let t2 = 0, n2 = e4.count; t2 < n2; t2++) this.expandByPoint(Si.fromBufferAttribute(e4, t2));
      return this;
    }
    setFromPoints(e4) {
      this.makeEmpty();
      for (let t2 = 0, n2 = e4.length; t2 < n2; t2++) this.expandByPoint(e4[t2]);
      return this;
    }
    setFromCenterAndSize(e4, t2) {
      let n2 = Si.copy(t2).multiplyScalar(0.5);
      return this.min.copy(e4).sub(n2), this.max.copy(e4).add(n2), this;
    }
    setFromObject(e4, t2 = false) {
      return this.makeEmpty(), this.expandByObject(e4, t2);
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e4) {
      return this.min.copy(e4.min), this.max.copy(e4.max), this;
    }
    makeEmpty() {
      return this.min.x = this.min.y = this.min.z = 1 / 0, this.max.x = this.max.y = this.max.z = -1 / 0, this;
    }
    isEmpty() {
      return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }
    getCenter(e4) {
      return this.isEmpty() ? e4.set(0, 0, 0) : e4.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    getSize(e4) {
      return this.isEmpty() ? e4.set(0, 0, 0) : e4.subVectors(this.max, this.min);
    }
    expandByPoint(e4) {
      return this.min.min(e4), this.max.max(e4), this;
    }
    expandByVector(e4) {
      return this.min.sub(e4), this.max.add(e4), this;
    }
    expandByScalar(e4) {
      return this.min.addScalar(-e4), this.max.addScalar(e4), this;
    }
    expandByObject(e4, t2 = false) {
      e4.updateWorldMatrix(false, false);
      let n2 = e4.geometry;
      if (n2 !== void 0) {
        let r3 = n2.getAttribute(`position`);
        if (t2 === true && r3 !== void 0 && e4.isInstancedMesh !== true) for (let t3 = 0, n3 = r3.count; t3 < n3; t3++) e4.isMesh === true ? e4.getVertexPosition(t3, Si) : Si.fromBufferAttribute(r3, t3), Si.applyMatrix4(e4.matrixWorld), this.expandByPoint(Si);
        else e4.boundingBox === void 0 ? (n2.boundingBox === null && n2.computeBoundingBox(), Ci.copy(n2.boundingBox)) : (e4.boundingBox === null && e4.computeBoundingBox(), Ci.copy(e4.boundingBox)), Ci.applyMatrix4(e4.matrixWorld), this.union(Ci);
      }
      let r2 = e4.children;
      for (let e5 = 0, n3 = r2.length; e5 < n3; e5++) this.expandByObject(r2[e5], t2);
      return this;
    }
    containsPoint(e4) {
      return e4.x >= this.min.x && e4.x <= this.max.x && e4.y >= this.min.y && e4.y <= this.max.y && e4.z >= this.min.z && e4.z <= this.max.z;
    }
    containsBox(e4) {
      return this.min.x <= e4.min.x && e4.max.x <= this.max.x && this.min.y <= e4.min.y && e4.max.y <= this.max.y && this.min.z <= e4.min.z && e4.max.z <= this.max.z;
    }
    getParameter(e4, t2) {
      return t2.set((e4.x - this.min.x) / (this.max.x - this.min.x), (e4.y - this.min.y) / (this.max.y - this.min.y), (e4.z - this.min.z) / (this.max.z - this.min.z));
    }
    intersectsBox(e4) {
      return e4.max.x >= this.min.x && e4.min.x <= this.max.x && e4.max.y >= this.min.y && e4.min.y <= this.max.y && e4.max.z >= this.min.z && e4.min.z <= this.max.z;
    }
    intersectsSphere(e4) {
      return this.clampPoint(e4.center, Si), Si.distanceToSquared(e4.center) <= e4.radius * e4.radius;
    }
    intersectsPlane(e4) {
      let t2, n2;
      return e4.normal.x > 0 ? (t2 = e4.normal.x * this.min.x, n2 = e4.normal.x * this.max.x) : (t2 = e4.normal.x * this.max.x, n2 = e4.normal.x * this.min.x), e4.normal.y > 0 ? (t2 += e4.normal.y * this.min.y, n2 += e4.normal.y * this.max.y) : (t2 += e4.normal.y * this.max.y, n2 += e4.normal.y * this.min.y), e4.normal.z > 0 ? (t2 += e4.normal.z * this.min.z, n2 += e4.normal.z * this.max.z) : (t2 += e4.normal.z * this.max.z, n2 += e4.normal.z * this.min.z), t2 <= -e4.constant && n2 >= -e4.constant;
    }
    intersectsTriangle(e4) {
      if (this.isEmpty()) return false;
      this.getCenter(Ai), ji.subVectors(this.max, Ai), wi.subVectors(e4.a, Ai), Ti.subVectors(e4.b, Ai), Ei.subVectors(e4.c, Ai), Di.subVectors(Ti, wi), Oi.subVectors(Ei, Ti), ki.subVectors(wi, Ei);
      let t2 = [0, -Di.z, Di.y, 0, -Oi.z, Oi.y, 0, -ki.z, ki.y, Di.z, 0, -Di.x, Oi.z, 0, -Oi.x, ki.z, 0, -ki.x, -Di.y, Di.x, 0, -Oi.y, Oi.x, 0, -ki.y, ki.x, 0];
      return !le(t2, wi, Ti, Ei, ji) || (t2 = [1, 0, 0, 0, 1, 0, 0, 0, 1], !le(t2, wi, Ti, Ei, ji)) ? false : (Mi.crossVectors(Di, Oi), t2 = [Mi.x, Mi.y, Mi.z], le(t2, wi, Ti, Ei, ji));
    }
    clampPoint(e4, t2) {
      return t2.copy(e4).clamp(this.min, this.max);
    }
    distanceToPoint(e4) {
      return this.clampPoint(e4, Si).distanceTo(e4);
    }
    getBoundingSphere(e4) {
      return this.isEmpty() ? e4.makeEmpty() : (this.getCenter(e4.center), e4.radius = this.getSize(Si).length() * 0.5), e4;
    }
    intersect(e4) {
      return this.min.max(e4.min), this.max.min(e4.max), this.isEmpty() && this.makeEmpty(), this;
    }
    union(e4) {
      return this.min.min(e4.min), this.max.max(e4.max), this;
    }
    applyMatrix4(e4) {
      return this.isEmpty() ? this : (xi[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(e4), xi[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(e4), xi[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(e4), xi[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(e4), xi[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(e4), xi[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(e4), xi[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(e4), xi[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(e4), this.setFromPoints(xi), this);
    }
    translate(e4) {
      return this.min.add(e4), this.max.add(e4), this;
    }
    equals(e4) {
      return e4.min.equals(this.min) && e4.max.equals(this.max);
    }
    toJSON() {
      return { min: this.min.toArray(), max: this.max.toArray() };
    }
    fromJSON(e4) {
      return this.min.fromArray(e4.min), this.max.fromArray(e4.max), this;
    }
  }, xi = [new N(), new N(), new N(), new N(), new N(), new N(), new N(), new N()], Si = new N(), Ci = new bi(), wi = new N(), Ti = new N(), Ei = new N(), Di = new N(), Oi = new N(), ki = new N(), Ai = new N(), ji = new N(), Mi = new N(), Ni = new N(), Pi = new N(), Fi = new M(), Ii = 0, Li = class extends Qn {
    constructor(e4, t2, n2 = false) {
      if (super(), Array.isArray(e4)) throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);
      this.isBufferAttribute = true, Object.defineProperty(this, `id`, { value: Ii++ }), this.name = ``, this.array = e4, this.itemSize = t2, this.count = e4 === void 0 ? 0 : e4.length / t2, this.normalized = n2, this.usage = Kn, this.updateRanges = [], this.gpuType = Mt, this.version = 0;
    }
    onUploadCallback() {
    }
    set needsUpdate(e4) {
      e4 === true && this.version++;
    }
    setUsage(e4) {
      return this.usage = e4, this;
    }
    addUpdateRange(e4, t2) {
      this.updateRanges.push({ start: e4, count: t2 });
    }
    clearUpdateRanges() {
      this.updateRanges.length = 0;
    }
    copy(e4) {
      return this.name = e4.name, this.array = new e4.array.constructor(e4.array), this.itemSize = e4.itemSize, this.count = e4.count, this.normalized = e4.normalized, this.usage = e4.usage, this.gpuType = e4.gpuType, this;
    }
    copyAt(e4, t2, n2) {
      e4 *= this.itemSize, n2 *= t2.itemSize;
      for (let r2 = 0, i2 = this.itemSize; r2 < i2; r2++) this.array[e4 + r2] = t2.array[n2 + r2];
      return this;
    }
    copyArray(e4) {
      return this.array.set(e4), this;
    }
    applyMatrix3(e4) {
      if (this.itemSize === 2) for (let t2 = 0, n2 = this.count; t2 < n2; t2++) Fi.fromBufferAttribute(this, t2), Fi.applyMatrix3(e4), this.setXY(t2, Fi.x, Fi.y);
      else if (this.itemSize === 3) for (let t2 = 0, n2 = this.count; t2 < n2; t2++) Pi.fromBufferAttribute(this, t2), Pi.applyMatrix3(e4), this.setXYZ(t2, Pi.x, Pi.y, Pi.z);
      return this;
    }
    applyMatrix4(e4) {
      for (let t2 = 0, n2 = this.count; t2 < n2; t2++) Pi.fromBufferAttribute(this, t2), Pi.applyMatrix4(e4), this.setXYZ(t2, Pi.x, Pi.y, Pi.z);
      return this;
    }
    applyNormalMatrix(e4) {
      for (let t2 = 0, n2 = this.count; t2 < n2; t2++) Pi.fromBufferAttribute(this, t2), Pi.applyNormalMatrix(e4), this.setXYZ(t2, Pi.x, Pi.y, Pi.z);
      return this;
    }
    transformDirection(e4) {
      for (let t2 = 0, n2 = this.count; t2 < n2; t2++) Pi.fromBufferAttribute(this, t2), Pi.transformDirection(e4), this.setXYZ(t2, Pi.x, Pi.y, Pi.z);
      return this;
    }
    set(e4, t2 = 0) {
      return this.array.set(e4, t2), this;
    }
    getComponent(e4, t2) {
      let n2 = this.array[e4 * this.itemSize + t2];
      return this.normalized && (n2 = ne(n2, this.array)), n2;
    }
    setComponent(e4, t2, n2) {
      return this.normalized && (n2 = re(n2, this.array)), this.array[e4 * this.itemSize + t2] = n2, this;
    }
    getX(e4) {
      let t2 = this.array[e4 * this.itemSize];
      return this.normalized && (t2 = ne(t2, this.array)), t2;
    }
    setX(e4, t2) {
      return this.normalized && (t2 = re(t2, this.array)), this.array[e4 * this.itemSize] = t2, this;
    }
    getY(e4) {
      let t2 = this.array[e4 * this.itemSize + 1];
      return this.normalized && (t2 = ne(t2, this.array)), t2;
    }
    setY(e4, t2) {
      return this.normalized && (t2 = re(t2, this.array)), this.array[e4 * this.itemSize + 1] = t2, this;
    }
    getZ(e4) {
      let t2 = this.array[e4 * this.itemSize + 2];
      return this.normalized && (t2 = ne(t2, this.array)), t2;
    }
    setZ(e4, t2) {
      return this.normalized && (t2 = re(t2, this.array)), this.array[e4 * this.itemSize + 2] = t2, this;
    }
    getW(e4) {
      let t2 = this.array[e4 * this.itemSize + 3];
      return this.normalized && (t2 = ne(t2, this.array)), t2;
    }
    setW(e4, t2) {
      return this.normalized && (t2 = re(t2, this.array)), this.array[e4 * this.itemSize + 3] = t2, this;
    }
    setXY(e4, t2, n2) {
      return e4 *= this.itemSize, this.normalized && (t2 = re(t2, this.array), n2 = re(n2, this.array)), this.array[e4 + 0] = t2, this.array[e4 + 1] = n2, this;
    }
    setXYZ(e4, t2, n2, r2) {
      return e4 *= this.itemSize, this.normalized && (t2 = re(t2, this.array), n2 = re(n2, this.array), r2 = re(r2, this.array)), this.array[e4 + 0] = t2, this.array[e4 + 1] = n2, this.array[e4 + 2] = r2, this;
    }
    setXYZW(e4, t2, n2, r2, i2) {
      return e4 *= this.itemSize, this.normalized && (t2 = re(t2, this.array), n2 = re(n2, this.array), r2 = re(r2, this.array), i2 = re(i2, this.array)), this.array[e4 + 0] = t2, this.array[e4 + 1] = n2, this.array[e4 + 2] = r2, this.array[e4 + 3] = i2, this;
    }
    onUpload(e4) {
      return this.onUploadCallback = e4, this;
    }
    clone() {
      return new this.constructor(this.array, this.itemSize).copy(this);
    }
    toJSON() {
      let e4 = { itemSize: this.itemSize, type: this.array.constructor.name, array: Array.from(this.array), normalized: this.normalized };
      return this.name !== `` && (e4.name = this.name), this.usage !== 35044 && (e4.usage = this.usage), e4;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
  }, Ri = class extends Li {
    constructor(e4, t2, n2) {
      super(new Uint16Array(e4), t2, n2);
    }
  }, zi = class extends Li {
    constructor(e4, t2, n2) {
      super(new Uint32Array(e4), t2, n2);
    }
  }, Bi = class extends Li {
    constructor(e4, t2, n2) {
      super(new Float32Array(e4), t2, n2);
    }
  }, Vi = new bi(), Hi = new N(), Ui = new N(), Wi = class {
    constructor(e4 = new N(), t2 = -1) {
      this.isSphere = true, this.center = e4, this.radius = t2;
    }
    set(e4, t2) {
      return this.center.copy(e4), this.radius = t2, this;
    }
    setFromPoints(e4, t2) {
      let n2 = this.center;
      t2 === void 0 ? Vi.setFromPoints(e4).getCenter(n2) : n2.copy(t2);
      let r2 = 0;
      for (let t3 = 0, i2 = e4.length; t3 < i2; t3++) r2 = Math.max(r2, n2.distanceToSquared(e4[t3]));
      return this.radius = Math.sqrt(r2), this;
    }
    copy(e4) {
      return this.center.copy(e4.center), this.radius = e4.radius, this;
    }
    isEmpty() {
      return this.radius < 0;
    }
    makeEmpty() {
      return this.center.set(0, 0, 0), this.radius = -1, this;
    }
    containsPoint(e4) {
      return e4.distanceToSquared(this.center) <= this.radius * this.radius;
    }
    distanceToPoint(e4) {
      return e4.distanceTo(this.center) - this.radius;
    }
    intersectsSphere(e4) {
      let t2 = this.radius + e4.radius;
      return e4.center.distanceToSquared(this.center) <= t2 * t2;
    }
    intersectsBox(e4) {
      return e4.intersectsSphere(this);
    }
    intersectsPlane(e4) {
      return Math.abs(e4.distanceToPoint(this.center)) <= this.radius;
    }
    clampPoint(e4, t2) {
      let n2 = this.center.distanceToSquared(e4);
      return t2.copy(e4), n2 > this.radius * this.radius && (t2.sub(this.center).normalize(), t2.multiplyScalar(this.radius).add(this.center)), t2;
    }
    getBoundingBox(e4) {
      return this.isEmpty() ? (e4.makeEmpty(), e4) : (e4.set(this.center, this.center), e4.expandByScalar(this.radius), e4);
    }
    applyMatrix4(e4) {
      return this.center.applyMatrix4(e4), this.radius *= e4.getMaxScaleOnAxis(), this;
    }
    translate(e4) {
      return this.center.add(e4), this;
    }
    expandByPoint(e4) {
      if (this.isEmpty()) return this.center.copy(e4), this.radius = 0, this;
      Hi.subVectors(e4, this.center);
      let t2 = Hi.lengthSq();
      if (t2 > this.radius * this.radius) {
        let e5 = Math.sqrt(t2), n2 = (e5 - this.radius) * 0.5;
        this.center.addScaledVector(Hi, n2 / e5), this.radius += n2;
      }
      return this;
    }
    union(e4) {
      return e4.isEmpty() ? this : this.isEmpty() ? (this.copy(e4), this) : (this.center.equals(e4.center) === true ? this.radius = Math.max(this.radius, e4.radius) : (Ui.subVectors(e4.center, this.center).setLength(e4.radius), this.expandByPoint(Hi.copy(e4.center).add(Ui)), this.expandByPoint(Hi.copy(e4.center).sub(Ui))), this);
    }
    equals(e4) {
      return e4.center.equals(this.center) && e4.radius === this.radius;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    toJSON() {
      return { radius: this.radius, center: this.center.toArray() };
    }
    fromJSON(e4) {
      return this.radius = e4.radius, this.center.fromArray(e4.center), this;
    }
  }, Gi = 0, Ki = new wr(), qi = new Zr(), Ji = new N(), Yi = new bi(), Xi = new bi(), Zi = new N(), Qi = class e4 extends Qn {
    constructor() {
      super(), this.isBufferGeometry = true, Object.defineProperty(this, `id`, { value: Gi++ }), this.uuid = p(), this.name = ``, this.type = `BufferGeometry`, this.index = null, this.indirect = null, this.indirectOffset = 0, this.attributes = {}, this.morphAttributes = {}, this.morphTargetsRelative = false, this.groups = [], this.boundingBox = null, this.boundingSphere = null, this.drawRange = { start: 0, count: 1 / 0 }, this.userData = {};
    }
    getIndex() {
      return this.index;
    }
    setIndex(e5) {
      return Array.isArray(e5) ? this.index = new (r(e5) ? zi : Ri)(e5, 1) : this.index = e5, this;
    }
    setIndirect(e5, t2 = 0) {
      return this.indirect = e5, this.indirectOffset = t2, this;
    }
    getIndirect() {
      return this.indirect;
    }
    getAttribute(e5) {
      return this.attributes[e5];
    }
    setAttribute(e5, t2) {
      return this.attributes[e5] = t2, this;
    }
    deleteAttribute(e5) {
      return delete this.attributes[e5], this;
    }
    hasAttribute(e5) {
      return this.attributes[e5] !== void 0;
    }
    addGroup(e5, t2, n2 = 0) {
      this.groups.push({ start: e5, count: t2, materialIndex: n2 });
    }
    clearGroups() {
      this.groups = [];
    }
    setDrawRange(e5, t2) {
      this.drawRange.start = e5, this.drawRange.count = t2;
    }
    applyMatrix4(e5) {
      let t2 = this.attributes.position;
      t2 !== void 0 && (t2.applyMatrix4(e5), t2.needsUpdate = true);
      let n2 = this.attributes.normal;
      if (n2 !== void 0) {
        let t3 = new sr().getNormalMatrix(e5);
        n2.applyNormalMatrix(t3), n2.needsUpdate = true;
      }
      let r2 = this.attributes.tangent;
      return r2 !== void 0 && (r2.transformDirection(e5), r2.needsUpdate = true), this.boundingBox !== null && this.computeBoundingBox(), this.boundingSphere !== null && this.computeBoundingSphere(), this;
    }
    applyQuaternion(e5) {
      return Ki.makeRotationFromQuaternion(e5), this.applyMatrix4(Ki), this;
    }
    rotateX(e5) {
      return Ki.makeRotationX(e5), this.applyMatrix4(Ki), this;
    }
    rotateY(e5) {
      return Ki.makeRotationY(e5), this.applyMatrix4(Ki), this;
    }
    rotateZ(e5) {
      return Ki.makeRotationZ(e5), this.applyMatrix4(Ki), this;
    }
    translate(e5, t2, n2) {
      return Ki.makeTranslation(e5, t2, n2), this.applyMatrix4(Ki), this;
    }
    scale(e5, t2, n2) {
      return Ki.makeScale(e5, t2, n2), this.applyMatrix4(Ki), this;
    }
    lookAt(e5) {
      return qi.lookAt(e5), qi.updateMatrix(), this.applyMatrix4(qi.matrix), this;
    }
    center() {
      return this.computeBoundingBox(), this.boundingBox.getCenter(Ji).negate(), this.translate(Ji.x, Ji.y, Ji.z), this;
    }
    setFromPoints(e5) {
      let t2 = this.getAttribute(`position`);
      if (t2 === void 0) {
        let t3 = [];
        for (let n2 = 0, r2 = e5.length; n2 < r2; n2++) {
          let r3 = e5[n2];
          t3.push(r3.x, r3.y, r3.z || 0);
        }
        this.setAttribute(`position`, new Bi(t3, 3));
      } else {
        let n2 = Math.min(e5.length, t2.count);
        for (let r2 = 0; r2 < n2; r2++) {
          let n3 = e5[r2];
          t2.setXYZ(r2, n3.x, n3.y, n3.z || 0);
        }
        e5.length > t2.count && l(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`), t2.needsUpdate = true;
      }
      return this;
    }
    computeBoundingBox() {
      this.boundingBox === null && (this.boundingBox = new bi());
      let e5 = this.attributes.position, t2 = this.morphAttributes.position;
      if (e5 && e5.isGLBufferAttribute) {
        u(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`, this), this.boundingBox.set(new N(-1 / 0, -1 / 0, -1 / 0), new N(1 / 0, 1 / 0, 1 / 0));
        return;
      }
      if (e5 !== void 0) {
        if (this.boundingBox.setFromBufferAttribute(e5), t2) for (let e6 = 0, n2 = t2.length; e6 < n2; e6++) {
          let n3 = t2[e6];
          Yi.setFromBufferAttribute(n3), this.morphTargetsRelative ? (Zi.addVectors(this.boundingBox.min, Yi.min), this.boundingBox.expandByPoint(Zi), Zi.addVectors(this.boundingBox.max, Yi.max), this.boundingBox.expandByPoint(Zi)) : (this.boundingBox.expandByPoint(Yi.min), this.boundingBox.expandByPoint(Yi.max));
        }
      } else this.boundingBox.makeEmpty();
      (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && u(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`, this);
    }
    computeBoundingSphere() {
      this.boundingSphere === null && (this.boundingSphere = new Wi());
      let e5 = this.attributes.position, t2 = this.morphAttributes.position;
      if (e5 && e5.isGLBufferAttribute) {
        u(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`, this), this.boundingSphere.set(new N(), 1 / 0);
        return;
      }
      if (e5) {
        let n2 = this.boundingSphere.center;
        if (Yi.setFromBufferAttribute(e5), t2) for (let e6 = 0, n3 = t2.length; e6 < n3; e6++) {
          let n4 = t2[e6];
          Xi.setFromBufferAttribute(n4), this.morphTargetsRelative ? (Zi.addVectors(Yi.min, Xi.min), Yi.expandByPoint(Zi), Zi.addVectors(Yi.max, Xi.max), Yi.expandByPoint(Zi)) : (Yi.expandByPoint(Xi.min), Yi.expandByPoint(Xi.max));
        }
        Yi.getCenter(n2);
        let r2 = 0;
        for (let t3 = 0, i2 = e5.count; t3 < i2; t3++) Zi.fromBufferAttribute(e5, t3), r2 = Math.max(r2, n2.distanceToSquared(Zi));
        if (t2) for (let i2 = 0, a2 = t2.length; i2 < a2; i2++) {
          let a3 = t2[i2], o2 = this.morphTargetsRelative;
          for (let t3 = 0, i3 = a3.count; t3 < i3; t3++) Zi.fromBufferAttribute(a3, t3), o2 && (Ji.fromBufferAttribute(e5, t3), Zi.add(Ji)), r2 = Math.max(r2, n2.distanceToSquared(Zi));
        }
        this.boundingSphere.radius = Math.sqrt(r2), isNaN(this.boundingSphere.radius) && u(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`, this);
      }
    }
    computeTangents() {
      let e5 = this.index, t2 = this.attributes;
      if (e5 === null || t2.position === void 0 || t2.normal === void 0 || t2.uv === void 0) {
        u(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);
        return;
      }
      let n2 = t2.position, r2 = t2.normal, i2 = t2.uv;
      this.hasAttribute(`tangent`) === false && this.setAttribute(`tangent`, new Li(new Float32Array(4 * n2.count), 4));
      let a2 = this.getAttribute(`tangent`), o2 = [], s2 = [];
      for (let e6 = 0; e6 < n2.count; e6++) o2[e6] = new N(), s2[e6] = new N();
      let c2 = new N(), l2 = new N(), d2 = new N(), f2 = new M(), p2 = new M(), m2 = new M(), h2 = new N(), g2 = new N();
      function _2(e6, t3, r3) {
        c2.fromBufferAttribute(n2, e6), l2.fromBufferAttribute(n2, t3), d2.fromBufferAttribute(n2, r3), f2.fromBufferAttribute(i2, e6), p2.fromBufferAttribute(i2, t3), m2.fromBufferAttribute(i2, r3), l2.sub(c2), d2.sub(c2), p2.sub(f2), m2.sub(f2);
        let a3 = 1 / (p2.x * m2.y - m2.x * p2.y);
        isFinite(a3) && (h2.copy(l2).multiplyScalar(m2.y).addScaledVector(d2, -p2.y).multiplyScalar(a3), g2.copy(d2).multiplyScalar(p2.x).addScaledVector(l2, -m2.x).multiplyScalar(a3), o2[e6].add(h2), o2[t3].add(h2), o2[r3].add(h2), s2[e6].add(g2), s2[t3].add(g2), s2[r3].add(g2));
      }
      let v2 = this.groups;
      v2.length === 0 && (v2 = [{ start: 0, count: e5.count }]);
      for (let t3 = 0, n3 = v2.length; t3 < n3; ++t3) {
        let n4 = v2[t3], r3 = n4.start, i3 = n4.count;
        for (let t4 = r3, n5 = r3 + i3; t4 < n5; t4 += 3) _2(e5.getX(t4 + 0), e5.getX(t4 + 1), e5.getX(t4 + 2));
      }
      let y2 = new N(), b2 = new N(), x2 = new N(), S2 = new N();
      function C2(e6) {
        x2.fromBufferAttribute(r2, e6), S2.copy(x2);
        let t3 = o2[e6];
        y2.copy(t3), y2.sub(x2.multiplyScalar(x2.dot(t3))).normalize(), b2.crossVectors(S2, t3);
        let n3 = b2.dot(s2[e6]) < 0 ? -1 : 1;
        a2.setXYZW(e6, y2.x, y2.y, y2.z, n3);
      }
      for (let t3 = 0, n3 = v2.length; t3 < n3; ++t3) {
        let n4 = v2[t3], r3 = n4.start, i3 = n4.count;
        for (let t4 = r3, n5 = r3 + i3; t4 < n5; t4 += 3) C2(e5.getX(t4 + 0)), C2(e5.getX(t4 + 1)), C2(e5.getX(t4 + 2));
      }
    }
    computeVertexNormals() {
      let e5 = this.index, t2 = this.getAttribute(`position`);
      if (t2 !== void 0) {
        let n2 = this.getAttribute(`normal`);
        if (n2 === void 0) n2 = new Li(new Float32Array(t2.count * 3), 3), this.setAttribute(`normal`, n2);
        else for (let e6 = 0, t3 = n2.count; e6 < t3; e6++) n2.setXYZ(e6, 0, 0, 0);
        let r2 = new N(), i2 = new N(), a2 = new N(), o2 = new N(), s2 = new N(), c2 = new N(), l2 = new N(), u2 = new N();
        if (e5) for (let d2 = 0, f2 = e5.count; d2 < f2; d2 += 3) {
          let f3 = e5.getX(d2 + 0), p2 = e5.getX(d2 + 1), m2 = e5.getX(d2 + 2);
          r2.fromBufferAttribute(t2, f3), i2.fromBufferAttribute(t2, p2), a2.fromBufferAttribute(t2, m2), l2.subVectors(a2, i2), u2.subVectors(r2, i2), l2.cross(u2), o2.fromBufferAttribute(n2, f3), s2.fromBufferAttribute(n2, p2), c2.fromBufferAttribute(n2, m2), o2.add(l2), s2.add(l2), c2.add(l2), n2.setXYZ(f3, o2.x, o2.y, o2.z), n2.setXYZ(p2, s2.x, s2.y, s2.z), n2.setXYZ(m2, c2.x, c2.y, c2.z);
        }
        else for (let e6 = 0, o3 = t2.count; e6 < o3; e6 += 3) r2.fromBufferAttribute(t2, e6 + 0), i2.fromBufferAttribute(t2, e6 + 1), a2.fromBufferAttribute(t2, e6 + 2), l2.subVectors(a2, i2), u2.subVectors(r2, i2), l2.cross(u2), n2.setXYZ(e6 + 0, l2.x, l2.y, l2.z), n2.setXYZ(e6 + 1, l2.x, l2.y, l2.z), n2.setXYZ(e6 + 2, l2.x, l2.y, l2.z);
        this.normalizeNormals(), n2.needsUpdate = true;
      }
    }
    normalizeNormals() {
      let e5 = this.attributes.normal;
      for (let t2 = 0, n2 = e5.count; t2 < n2; t2++) Zi.fromBufferAttribute(e5, t2), Zi.normalize(), e5.setXYZ(t2, Zi.x, Zi.y, Zi.z);
    }
    toNonIndexed() {
      function t2(e5, t3) {
        let n3 = e5.array, r3 = e5.itemSize, i3 = e5.normalized, a3 = new n3.constructor(t3.length * r3), o3 = 0, s2 = 0;
        for (let i4 = 0, c2 = t3.length; i4 < c2; i4++) {
          o3 = e5.isInterleavedBufferAttribute ? t3[i4] * e5.data.stride + e5.offset : t3[i4] * r3;
          for (let e6 = 0; e6 < r3; e6++) a3[s2++] = n3[o3++];
        }
        return new Li(a3, r3, i3);
      }
      if (this.index === null) return l(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`), this;
      let n2 = new e4(), r2 = this.index.array, i2 = this.attributes;
      for (let e5 in i2) {
        let a3 = i2[e5], o3 = t2(a3, r2);
        n2.setAttribute(e5, o3);
      }
      let a2 = this.morphAttributes;
      for (let e5 in a2) {
        let i3 = [], o3 = a2[e5];
        for (let e6 = 0, n3 = o3.length; e6 < n3; e6++) {
          let n4 = o3[e6], a3 = t2(n4, r2);
          i3.push(a3);
        }
        n2.morphAttributes[e5] = i3;
      }
      n2.morphTargetsRelative = this.morphTargetsRelative;
      let o2 = this.groups;
      for (let e5 = 0, t3 = o2.length; e5 < t3; e5++) {
        let t4 = o2[e5];
        n2.addGroup(t4.start, t4.count, t4.materialIndex);
      }
      return n2;
    }
    toJSON() {
      let e5 = { metadata: { version: 4.7, type: `BufferGeometry`, generator: `BufferGeometry.toJSON` } };
      if (e5.uuid = this.uuid, e5.type = this.type, this.name !== `` && (e5.name = this.name), Object.keys(this.userData).length > 0 && (e5.userData = this.userData), this.parameters !== void 0) {
        let t3 = this.parameters;
        for (let n3 in t3) t3[n3] !== void 0 && (e5[n3] = t3[n3]);
        return e5;
      }
      e5.data = { attributes: {} };
      let t2 = this.index;
      t2 !== null && (e5.data.index = { type: t2.array.constructor.name, array: Array.prototype.slice.call(t2.array) });
      let n2 = this.attributes;
      for (let t3 in n2) {
        let r3 = n2[t3];
        e5.data.attributes[t3] = r3.toJSON(e5.data);
      }
      let r2 = {}, i2 = false;
      for (let t3 in this.morphAttributes) {
        let n3 = this.morphAttributes[t3], a3 = [];
        for (let t4 = 0, r3 = n3.length; t4 < r3; t4++) {
          let r4 = n3[t4];
          a3.push(r4.toJSON(e5.data));
        }
        a3.length > 0 && (r2[t3] = a3, i2 = true);
      }
      i2 && (e5.data.morphAttributes = r2, e5.data.morphTargetsRelative = this.morphTargetsRelative);
      let a2 = this.groups;
      a2.length > 0 && (e5.data.groups = JSON.parse(JSON.stringify(a2)));
      let o2 = this.boundingSphere;
      return o2 !== null && (e5.data.boundingSphere = o2.toJSON()), e5;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e5) {
      this.index = null, this.attributes = {}, this.morphAttributes = {}, this.groups = [], this.boundingBox = null, this.boundingSphere = null;
      let t2 = {};
      this.name = e5.name;
      let n2 = e5.index;
      n2 !== null && this.setIndex(n2.clone());
      let r2 = e5.attributes;
      for (let e6 in r2) {
        let n3 = r2[e6];
        this.setAttribute(e6, n3.clone(t2));
      }
      let i2 = e5.morphAttributes;
      for (let e6 in i2) {
        let n3 = [], r3 = i2[e6];
        for (let e7 = 0, i3 = r3.length; e7 < i3; e7++) n3.push(r3[e7].clone(t2));
        this.morphAttributes[e6] = n3;
      }
      this.morphTargetsRelative = e5.morphTargetsRelative;
      let a2 = e5.groups;
      for (let e6 = 0, t3 = a2.length; e6 < t3; e6++) {
        let t4 = a2[e6];
        this.addGroup(t4.start, t4.count, t4.materialIndex);
      }
      let o2 = e5.boundingBox;
      o2 !== null && (this.boundingBox = o2.clone());
      let s2 = e5.boundingSphere;
      return s2 !== null && (this.boundingSphere = s2.clone()), this.drawRange.start = e5.drawRange.start, this.drawRange.count = e5.drawRange.count, this.userData = e5.userData, this;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
  }, $i = 0, ea = class extends Qn {
    constructor() {
      super(), this.isMaterial = true, Object.defineProperty(this, `id`, { value: $i++ }), this.uuid = p(), this.name = ``, this.type = `Material`, this.blending = 1, this.side = 0, this.vertexColors = false, this.opacity = 1, this.transparent = false, this.alphaHash = false, this.blendSrc = 204, this.blendDst = 205, this.blendEquation = 100, this.blendSrcAlpha = null, this.blendDstAlpha = null, this.blendEquationAlpha = null, this.blendColor = new P(0, 0, 0), this.blendAlpha = 0, this.depthFunc = 3, this.depthTest = true, this.depthWrite = true, this.stencilWriteMask = 255, this.stencilFunc = 519, this.stencilRef = 0, this.stencilFuncMask = 255, this.stencilFail = Gn, this.stencilZFail = Gn, this.stencilZPass = Gn, this.stencilWrite = false, this.clippingPlanes = null, this.clipIntersection = false, this.clipShadows = false, this.shadowSide = null, this.colorWrite = true, this.precision = null, this.polygonOffset = false, this.polygonOffsetFactor = 0, this.polygonOffsetUnits = 0, this.dithering = false, this.alphaToCoverage = false, this.premultipliedAlpha = false, this.forceSinglePass = false, this.allowOverride = true, this.visible = true, this.toneMapped = true, this.userData = {}, this.version = 0, this._alphaTest = 0;
    }
    get alphaTest() {
      return this._alphaTest;
    }
    set alphaTest(e4) {
      this._alphaTest > 0 != e4 > 0 && this.version++, this._alphaTest = e4;
    }
    onBeforeRender() {
    }
    onBeforeCompile() {
    }
    customProgramCacheKey() {
      return this.onBeforeCompile.toString();
    }
    setValues(e4) {
      if (e4 !== void 0) for (let t2 in e4) {
        let n2 = e4[t2];
        if (n2 === void 0) {
          l(`Material: parameter '${t2}' has value of undefined.`);
          continue;
        }
        let r2 = this[t2];
        if (r2 === void 0) {
          l(`Material: '${t2}' is not a property of THREE.${this.type}.`);
          continue;
        }
        r2 && r2.isColor ? r2.set(n2) : r2 && r2.isVector3 && n2 && n2.isVector3 ? r2.copy(n2) : this[t2] = n2;
      }
    }
    toJSON(e4) {
      let t2 = e4 === void 0 || typeof e4 == `string`;
      t2 && (e4 = { textures: {}, images: {} });
      let n2 = { metadata: { version: 4.7, type: `Material`, generator: `Material.toJSON` } };
      n2.uuid = this.uuid, n2.type = this.type, this.name !== `` && (n2.name = this.name), this.color && this.color.isColor && (n2.color = this.color.getHex()), this.roughness !== void 0 && (n2.roughness = this.roughness), this.metalness !== void 0 && (n2.metalness = this.metalness), this.sheen !== void 0 && (n2.sheen = this.sheen), this.sheenColor && this.sheenColor.isColor && (n2.sheenColor = this.sheenColor.getHex()), this.sheenRoughness !== void 0 && (n2.sheenRoughness = this.sheenRoughness), this.emissive && this.emissive.isColor && (n2.emissive = this.emissive.getHex()), this.emissiveIntensity !== void 0 && this.emissiveIntensity !== 1 && (n2.emissiveIntensity = this.emissiveIntensity), this.specular && this.specular.isColor && (n2.specular = this.specular.getHex()), this.specularIntensity !== void 0 && (n2.specularIntensity = this.specularIntensity), this.specularColor && this.specularColor.isColor && (n2.specularColor = this.specularColor.getHex()), this.shininess !== void 0 && (n2.shininess = this.shininess), this.clearcoat !== void 0 && (n2.clearcoat = this.clearcoat), this.clearcoatRoughness !== void 0 && (n2.clearcoatRoughness = this.clearcoatRoughness), this.clearcoatMap && this.clearcoatMap.isTexture && (n2.clearcoatMap = this.clearcoatMap.toJSON(e4).uuid), this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture && (n2.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(e4).uuid), this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture && (n2.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(e4).uuid, n2.clearcoatNormalScale = this.clearcoatNormalScale.toArray()), this.sheenColorMap && this.sheenColorMap.isTexture && (n2.sheenColorMap = this.sheenColorMap.toJSON(e4).uuid), this.sheenRoughnessMap && this.sheenRoughnessMap.isTexture && (n2.sheenRoughnessMap = this.sheenRoughnessMap.toJSON(e4).uuid), this.dispersion !== void 0 && (n2.dispersion = this.dispersion), this.iridescence !== void 0 && (n2.iridescence = this.iridescence), this.iridescenceIOR !== void 0 && (n2.iridescenceIOR = this.iridescenceIOR), this.iridescenceThicknessRange !== void 0 && (n2.iridescenceThicknessRange = this.iridescenceThicknessRange), this.iridescenceMap && this.iridescenceMap.isTexture && (n2.iridescenceMap = this.iridescenceMap.toJSON(e4).uuid), this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture && (n2.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(e4).uuid), this.anisotropy !== void 0 && (n2.anisotropy = this.anisotropy), this.anisotropyRotation !== void 0 && (n2.anisotropyRotation = this.anisotropyRotation), this.anisotropyMap && this.anisotropyMap.isTexture && (n2.anisotropyMap = this.anisotropyMap.toJSON(e4).uuid), this.map && this.map.isTexture && (n2.map = this.map.toJSON(e4).uuid), this.matcap && this.matcap.isTexture && (n2.matcap = this.matcap.toJSON(e4).uuid), this.alphaMap && this.alphaMap.isTexture && (n2.alphaMap = this.alphaMap.toJSON(e4).uuid), this.lightMap && this.lightMap.isTexture && (n2.lightMap = this.lightMap.toJSON(e4).uuid, n2.lightMapIntensity = this.lightMapIntensity), this.aoMap && this.aoMap.isTexture && (n2.aoMap = this.aoMap.toJSON(e4).uuid, n2.aoMapIntensity = this.aoMapIntensity), this.bumpMap && this.bumpMap.isTexture && (n2.bumpMap = this.bumpMap.toJSON(e4).uuid, n2.bumpScale = this.bumpScale), this.normalMap && this.normalMap.isTexture && (n2.normalMap = this.normalMap.toJSON(e4).uuid, n2.normalMapType = this.normalMapType, n2.normalScale = this.normalScale.toArray()), this.displacementMap && this.displacementMap.isTexture && (n2.displacementMap = this.displacementMap.toJSON(e4).uuid, n2.displacementScale = this.displacementScale, n2.displacementBias = this.displacementBias), this.roughnessMap && this.roughnessMap.isTexture && (n2.roughnessMap = this.roughnessMap.toJSON(e4).uuid), this.metalnessMap && this.metalnessMap.isTexture && (n2.metalnessMap = this.metalnessMap.toJSON(e4).uuid), this.emissiveMap && this.emissiveMap.isTexture && (n2.emissiveMap = this.emissiveMap.toJSON(e4).uuid), this.specularMap && this.specularMap.isTexture && (n2.specularMap = this.specularMap.toJSON(e4).uuid), this.specularIntensityMap && this.specularIntensityMap.isTexture && (n2.specularIntensityMap = this.specularIntensityMap.toJSON(e4).uuid), this.specularColorMap && this.specularColorMap.isTexture && (n2.specularColorMap = this.specularColorMap.toJSON(e4).uuid), this.envMap && this.envMap.isTexture && (n2.envMap = this.envMap.toJSON(e4).uuid, this.combine !== void 0 && (n2.combine = this.combine)), this.envMapRotation !== void 0 && (n2.envMapRotation = this.envMapRotation.toArray()), this.envMapIntensity !== void 0 && (n2.envMapIntensity = this.envMapIntensity), this.reflectivity !== void 0 && (n2.reflectivity = this.reflectivity), this.refractionRatio !== void 0 && (n2.refractionRatio = this.refractionRatio), this.gradientMap && this.gradientMap.isTexture && (n2.gradientMap = this.gradientMap.toJSON(e4).uuid), this.transmission !== void 0 && (n2.transmission = this.transmission), this.transmissionMap && this.transmissionMap.isTexture && (n2.transmissionMap = this.transmissionMap.toJSON(e4).uuid), this.thickness !== void 0 && (n2.thickness = this.thickness), this.thicknessMap && this.thicknessMap.isTexture && (n2.thicknessMap = this.thicknessMap.toJSON(e4).uuid), this.attenuationDistance !== void 0 && this.attenuationDistance !== 1 / 0 && (n2.attenuationDistance = this.attenuationDistance), this.attenuationColor !== void 0 && (n2.attenuationColor = this.attenuationColor.getHex()), this.size !== void 0 && (n2.size = this.size), this.shadowSide !== null && (n2.shadowSide = this.shadowSide), this.sizeAttenuation !== void 0 && (n2.sizeAttenuation = this.sizeAttenuation), this.blending !== 1 && (n2.blending = this.blending), this.side !== 0 && (n2.side = this.side), this.vertexColors === true && (n2.vertexColors = true), this.opacity < 1 && (n2.opacity = this.opacity), this.transparent === true && (n2.transparent = true), this.blendSrc !== 204 && (n2.blendSrc = this.blendSrc), this.blendDst !== 205 && (n2.blendDst = this.blendDst), this.blendEquation !== 100 && (n2.blendEquation = this.blendEquation), this.blendSrcAlpha !== null && (n2.blendSrcAlpha = this.blendSrcAlpha), this.blendDstAlpha !== null && (n2.blendDstAlpha = this.blendDstAlpha), this.blendEquationAlpha !== null && (n2.blendEquationAlpha = this.blendEquationAlpha), this.blendColor && this.blendColor.isColor && (n2.blendColor = this.blendColor.getHex()), this.blendAlpha !== 0 && (n2.blendAlpha = this.blendAlpha), this.depthFunc !== 3 && (n2.depthFunc = this.depthFunc), this.depthTest === false && (n2.depthTest = this.depthTest), this.depthWrite === false && (n2.depthWrite = this.depthWrite), this.colorWrite === false && (n2.colorWrite = this.colorWrite), this.stencilWriteMask !== 255 && (n2.stencilWriteMask = this.stencilWriteMask), this.stencilFunc !== 519 && (n2.stencilFunc = this.stencilFunc), this.stencilRef !== 0 && (n2.stencilRef = this.stencilRef), this.stencilFuncMask !== 255 && (n2.stencilFuncMask = this.stencilFuncMask), this.stencilFail !== 7680 && (n2.stencilFail = this.stencilFail), this.stencilZFail !== 7680 && (n2.stencilZFail = this.stencilZFail), this.stencilZPass !== 7680 && (n2.stencilZPass = this.stencilZPass), this.stencilWrite === true && (n2.stencilWrite = this.stencilWrite), this.rotation !== void 0 && this.rotation !== 0 && (n2.rotation = this.rotation), this.polygonOffset === true && (n2.polygonOffset = true), this.polygonOffsetFactor !== 0 && (n2.polygonOffsetFactor = this.polygonOffsetFactor), this.polygonOffsetUnits !== 0 && (n2.polygonOffsetUnits = this.polygonOffsetUnits), this.linewidth !== void 0 && this.linewidth !== 1 && (n2.linewidth = this.linewidth), this.dashSize !== void 0 && (n2.dashSize = this.dashSize), this.gapSize !== void 0 && (n2.gapSize = this.gapSize), this.scale !== void 0 && (n2.scale = this.scale), this.dithering === true && (n2.dithering = true), this.alphaTest > 0 && (n2.alphaTest = this.alphaTest), this.alphaHash === true && (n2.alphaHash = true), this.alphaToCoverage === true && (n2.alphaToCoverage = true), this.premultipliedAlpha === true && (n2.premultipliedAlpha = true), this.forceSinglePass === true && (n2.forceSinglePass = true), this.allowOverride === false && (n2.allowOverride = false), this.wireframe === true && (n2.wireframe = true), this.wireframeLinewidth > 1 && (n2.wireframeLinewidth = this.wireframeLinewidth), this.wireframeLinecap !== `round` && (n2.wireframeLinecap = this.wireframeLinecap), this.wireframeLinejoin !== `round` && (n2.wireframeLinejoin = this.wireframeLinejoin), this.flatShading === true && (n2.flatShading = true), this.visible === false && (n2.visible = false), this.toneMapped === false && (n2.toneMapped = false), this.fog === false && (n2.fog = false), Object.keys(this.userData).length > 0 && (n2.userData = this.userData);
      function r2(e5) {
        let t3 = [];
        for (let n3 in e5) {
          let r3 = e5[n3];
          delete r3.metadata, t3.push(r3);
        }
        return t3;
      }
      if (t2) {
        let t3 = r2(e4.textures), i2 = r2(e4.images);
        t3.length > 0 && (n2.textures = t3), i2.length > 0 && (n2.images = i2);
      }
      return n2;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e4) {
      this.name = e4.name, this.blending = e4.blending, this.side = e4.side, this.vertexColors = e4.vertexColors, this.opacity = e4.opacity, this.transparent = e4.transparent, this.blendSrc = e4.blendSrc, this.blendDst = e4.blendDst, this.blendEquation = e4.blendEquation, this.blendSrcAlpha = e4.blendSrcAlpha, this.blendDstAlpha = e4.blendDstAlpha, this.blendEquationAlpha = e4.blendEquationAlpha, this.blendColor.copy(e4.blendColor), this.blendAlpha = e4.blendAlpha, this.depthFunc = e4.depthFunc, this.depthTest = e4.depthTest, this.depthWrite = e4.depthWrite, this.stencilWriteMask = e4.stencilWriteMask, this.stencilFunc = e4.stencilFunc, this.stencilRef = e4.stencilRef, this.stencilFuncMask = e4.stencilFuncMask, this.stencilFail = e4.stencilFail, this.stencilZFail = e4.stencilZFail, this.stencilZPass = e4.stencilZPass, this.stencilWrite = e4.stencilWrite;
      let t2 = e4.clippingPlanes, n2 = null;
      if (t2 !== null) {
        let e5 = t2.length;
        n2 = Array(e5);
        for (let r2 = 0; r2 !== e5; ++r2) n2[r2] = t2[r2].clone();
      }
      return this.clippingPlanes = n2, this.clipIntersection = e4.clipIntersection, this.clipShadows = e4.clipShadows, this.shadowSide = e4.shadowSide, this.colorWrite = e4.colorWrite, this.precision = e4.precision, this.polygonOffset = e4.polygonOffset, this.polygonOffsetFactor = e4.polygonOffsetFactor, this.polygonOffsetUnits = e4.polygonOffsetUnits, this.dithering = e4.dithering, this.alphaTest = e4.alphaTest, this.alphaHash = e4.alphaHash, this.alphaToCoverage = e4.alphaToCoverage, this.premultipliedAlpha = e4.premultipliedAlpha, this.forceSinglePass = e4.forceSinglePass, this.allowOverride = e4.allowOverride, this.visible = e4.visible, this.toneMapped = e4.toneMapped, this.userData = JSON.parse(JSON.stringify(e4.userData)), this;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
    set needsUpdate(e4) {
      e4 === true && this.version++;
    }
  }, ta = new N(), na = new N(), ra = new N(), ia = new N(), aa = new N(), oa = new N(), sa = new N(), ca = class {
    constructor(e4 = new N(), t2 = new N(0, 0, -1)) {
      this.origin = e4, this.direction = t2;
    }
    set(e4, t2) {
      return this.origin.copy(e4), this.direction.copy(t2), this;
    }
    copy(e4) {
      return this.origin.copy(e4.origin), this.direction.copy(e4.direction), this;
    }
    at(e4, t2) {
      return t2.copy(this.origin).addScaledVector(this.direction, e4);
    }
    lookAt(e4) {
      return this.direction.copy(e4).sub(this.origin).normalize(), this;
    }
    recast(e4) {
      return this.origin.copy(this.at(e4, ta)), this;
    }
    closestPointToPoint(e4, t2) {
      t2.subVectors(e4, this.origin);
      let n2 = t2.dot(this.direction);
      return n2 < 0 ? t2.copy(this.origin) : t2.copy(this.origin).addScaledVector(this.direction, n2);
    }
    distanceToPoint(e4) {
      return Math.sqrt(this.distanceSqToPoint(e4));
    }
    distanceSqToPoint(e4) {
      let t2 = ta.subVectors(e4, this.origin).dot(this.direction);
      return t2 < 0 ? this.origin.distanceToSquared(e4) : (ta.copy(this.origin).addScaledVector(this.direction, t2), ta.distanceToSquared(e4));
    }
    distanceSqToSegment(e4, t2, n2, r2) {
      na.copy(e4).add(t2).multiplyScalar(0.5), ra.copy(t2).sub(e4).normalize(), ia.copy(this.origin).sub(na);
      let i2 = e4.distanceTo(t2) * 0.5, a2 = -this.direction.dot(ra), o2 = ia.dot(this.direction), s2 = -ia.dot(ra), c2 = ia.lengthSq(), l2 = Math.abs(1 - a2 * a2), u2, d2, f2, p2;
      if (l2 > 0) if (u2 = a2 * s2 - o2, d2 = a2 * o2 - s2, p2 = i2 * l2, u2 >= 0) if (d2 >= -p2) if (d2 <= p2) {
        let e5 = 1 / l2;
        u2 *= e5, d2 *= e5, f2 = u2 * (u2 + a2 * d2 + 2 * o2) + d2 * (a2 * u2 + d2 + 2 * s2) + c2;
      } else d2 = i2, u2 = Math.max(0, -(a2 * d2 + o2)), f2 = -u2 * u2 + d2 * (d2 + 2 * s2) + c2;
      else d2 = -i2, u2 = Math.max(0, -(a2 * d2 + o2)), f2 = -u2 * u2 + d2 * (d2 + 2 * s2) + c2;
      else d2 <= -p2 ? (u2 = Math.max(0, -(-a2 * i2 + o2)), d2 = u2 > 0 ? -i2 : Math.min(Math.max(-i2, -s2), i2), f2 = -u2 * u2 + d2 * (d2 + 2 * s2) + c2) : d2 <= p2 ? (u2 = 0, d2 = Math.min(Math.max(-i2, -s2), i2), f2 = d2 * (d2 + 2 * s2) + c2) : (u2 = Math.max(0, -(a2 * i2 + o2)), d2 = u2 > 0 ? i2 : Math.min(Math.max(-i2, -s2), i2), f2 = -u2 * u2 + d2 * (d2 + 2 * s2) + c2);
      else d2 = a2 > 0 ? -i2 : i2, u2 = Math.max(0, -(a2 * d2 + o2)), f2 = -u2 * u2 + d2 * (d2 + 2 * s2) + c2;
      return n2 && n2.copy(this.origin).addScaledVector(this.direction, u2), r2 && r2.copy(na).addScaledVector(ra, d2), f2;
    }
    intersectSphere(e4, t2) {
      ta.subVectors(e4.center, this.origin);
      let n2 = ta.dot(this.direction), r2 = ta.dot(ta) - n2 * n2, i2 = e4.radius * e4.radius;
      if (r2 > i2) return null;
      let a2 = Math.sqrt(i2 - r2), o2 = n2 - a2, s2 = n2 + a2;
      return s2 < 0 ? null : o2 < 0 ? this.at(s2, t2) : this.at(o2, t2);
    }
    intersectsSphere(e4) {
      return e4.radius < 0 ? false : this.distanceSqToPoint(e4.center) <= e4.radius * e4.radius;
    }
    distanceToPlane(e4) {
      let t2 = e4.normal.dot(this.direction);
      if (t2 === 0) return e4.distanceToPoint(this.origin) === 0 ? 0 : null;
      let n2 = -(this.origin.dot(e4.normal) + e4.constant) / t2;
      return n2 >= 0 ? n2 : null;
    }
    intersectPlane(e4, t2) {
      let n2 = this.distanceToPlane(e4);
      return n2 === null ? null : this.at(n2, t2);
    }
    intersectsPlane(e4) {
      let t2 = e4.distanceToPoint(this.origin);
      return t2 === 0 || e4.normal.dot(this.direction) * t2 < 0;
    }
    intersectBox(e4, t2) {
      let n2, r2, i2, a2, o2, s2, c2 = 1 / this.direction.x, l2 = 1 / this.direction.y, u2 = 1 / this.direction.z, d2 = this.origin;
      return c2 >= 0 ? (n2 = (e4.min.x - d2.x) * c2, r2 = (e4.max.x - d2.x) * c2) : (n2 = (e4.max.x - d2.x) * c2, r2 = (e4.min.x - d2.x) * c2), l2 >= 0 ? (i2 = (e4.min.y - d2.y) * l2, a2 = (e4.max.y - d2.y) * l2) : (i2 = (e4.max.y - d2.y) * l2, a2 = (e4.min.y - d2.y) * l2), n2 > a2 || i2 > r2 || ((i2 > n2 || isNaN(n2)) && (n2 = i2), (a2 < r2 || isNaN(r2)) && (r2 = a2), u2 >= 0 ? (o2 = (e4.min.z - d2.z) * u2, s2 = (e4.max.z - d2.z) * u2) : (o2 = (e4.max.z - d2.z) * u2, s2 = (e4.min.z - d2.z) * u2), n2 > s2 || o2 > r2) || ((o2 > n2 || n2 !== n2) && (n2 = o2), (s2 < r2 || r2 !== r2) && (r2 = s2), r2 < 0) ? null : this.at(n2 >= 0 ? n2 : r2, t2);
    }
    intersectsBox(e4) {
      return this.intersectBox(e4, ta) !== null;
    }
    intersectTriangle(e4, t2, n2, r2, i2) {
      aa.subVectors(t2, e4), oa.subVectors(n2, e4), sa.crossVectors(aa, oa);
      let a2 = this.direction.dot(sa), o2;
      if (a2 > 0) {
        if (r2) return null;
        o2 = 1;
      } else if (a2 < 0) o2 = -1, a2 = -a2;
      else return null;
      ia.subVectors(this.origin, e4);
      let s2 = o2 * this.direction.dot(oa.crossVectors(ia, oa));
      if (s2 < 0) return null;
      let c2 = o2 * this.direction.dot(aa.cross(ia));
      if (c2 < 0 || s2 + c2 > a2) return null;
      let l2 = -o2 * ia.dot(sa);
      return l2 < 0 ? null : this.at(l2 / a2, i2);
    }
    applyMatrix4(e4) {
      return this.origin.applyMatrix4(e4), this.direction.transformDirection(e4), this;
    }
    equals(e4) {
      return e4.origin.equals(this.origin) && e4.direction.equals(this.direction);
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }, la = class extends ea {
    constructor(e4) {
      super(), this.isMeshBasicMaterial = true, this.type = `MeshBasicMaterial`, this.color = new P(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new Pr(), this.combine = 0, this.reflectivity = 1, this.refractionRatio = 0.98, this.wireframe = false, this.wireframeLinewidth = 1, this.wireframeLinecap = `round`, this.wireframeLinejoin = `round`, this.fog = true, this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.color.copy(e4.color), this.map = e4.map, this.lightMap = e4.lightMap, this.lightMapIntensity = e4.lightMapIntensity, this.aoMap = e4.aoMap, this.aoMapIntensity = e4.aoMapIntensity, this.specularMap = e4.specularMap, this.alphaMap = e4.alphaMap, this.envMap = e4.envMap, this.envMapRotation.copy(e4.envMapRotation), this.combine = e4.combine, this.reflectivity = e4.reflectivity, this.refractionRatio = e4.refractionRatio, this.wireframe = e4.wireframe, this.wireframeLinewidth = e4.wireframeLinewidth, this.wireframeLinecap = e4.wireframeLinecap, this.wireframeLinejoin = e4.wireframeLinejoin, this.fog = e4.fog, this;
    }
  }, ua = new wr(), da = new ca(), fa = new Wi(), pa = new N(), ma = new N(), ha = new N(), ga = new N(), _a = new N(), va = new N(), ya = new N(), ba = new N(), xa = class extends Zr {
    constructor(e4 = new Qi(), t2 = new la()) {
      super(), this.isMesh = true, this.type = `Mesh`, this.geometry = e4, this.material = t2, this.morphTargetDictionary = void 0, this.morphTargetInfluences = void 0, this.count = 1, this.updateMorphTargets();
    }
    copy(e4, t2) {
      return super.copy(e4, t2), e4.morphTargetInfluences !== void 0 && (this.morphTargetInfluences = e4.morphTargetInfluences.slice()), e4.morphTargetDictionary !== void 0 && (this.morphTargetDictionary = Object.assign({}, e4.morphTargetDictionary)), this.material = Array.isArray(e4.material) ? e4.material.slice() : e4.material, this.geometry = e4.geometry, this;
    }
    updateMorphTargets() {
      let e4 = this.geometry.morphAttributes, t2 = Object.keys(e4);
      if (t2.length > 0) {
        let n2 = e4[t2[0]];
        if (n2 !== void 0) {
          this.morphTargetInfluences = [], this.morphTargetDictionary = {};
          for (let e5 = 0, t3 = n2.length; e5 < t3; e5++) {
            let t4 = n2[e5].name || String(e5);
            this.morphTargetInfluences.push(0), this.morphTargetDictionary[t4] = e5;
          }
        }
      }
    }
    getVertexPosition(e4, t2) {
      let n2 = this.geometry, r2 = n2.attributes.position, i2 = n2.morphAttributes.position, a2 = n2.morphTargetsRelative;
      t2.fromBufferAttribute(r2, e4);
      let o2 = this.morphTargetInfluences;
      if (i2 && o2) {
        va.set(0, 0, 0);
        for (let n3 = 0, r3 = i2.length; n3 < r3; n3++) {
          let r4 = o2[n3], s2 = i2[n3];
          r4 !== 0 && (_a.fromBufferAttribute(s2, e4), a2 ? va.addScaledVector(_a, r4) : va.addScaledVector(_a.sub(t2), r4));
        }
        t2.add(va);
      }
      return t2;
    }
    raycast(e4, t2) {
      let n2 = this.geometry, r2 = this.material, i2 = this.matrixWorld;
      r2 !== void 0 && (n2.boundingSphere === null && n2.computeBoundingSphere(), fa.copy(n2.boundingSphere), fa.applyMatrix4(i2), da.copy(e4.ray).recast(e4.near), !(fa.containsPoint(da.origin) === false && (da.intersectSphere(fa, pa) === null || da.origin.distanceToSquared(pa) > (e4.far - e4.near) ** 2)) && (ua.copy(i2).invert(), da.copy(e4.ray).applyMatrix4(ua), !(n2.boundingBox !== null && da.intersectsBox(n2.boundingBox) === false) && this._computeIntersections(e4, t2, da)));
    }
    _computeIntersections(e4, t2, n2) {
      let r2, i2 = this.geometry, a2 = this.material, o2 = i2.index, s2 = i2.attributes.position, c2 = i2.attributes.uv, l2 = i2.attributes.uv1, u2 = i2.attributes.normal, d2 = i2.groups, f2 = i2.drawRange;
      if (o2 !== null) if (Array.isArray(a2)) for (let i3 = 0, s3 = d2.length; i3 < s3; i3++) {
        let s4 = d2[i3], p2 = a2[s4.materialIndex], m2 = Math.max(s4.start, f2.start), h2 = Math.min(o2.count, Math.min(s4.start + s4.count, f2.start + f2.count));
        for (let i4 = m2, a3 = h2; i4 < a3; i4 += 3) {
          let a4 = o2.getX(i4), d3 = o2.getX(i4 + 1), f3 = o2.getX(i4 + 2);
          r2 = de(this, p2, e4, n2, c2, l2, u2, a4, d3, f3), r2 && (r2.faceIndex = Math.floor(i4 / 3), r2.face.materialIndex = s4.materialIndex, t2.push(r2));
        }
      }
      else {
        let i3 = Math.max(0, f2.start), s3 = Math.min(o2.count, f2.start + f2.count);
        for (let d3 = i3, f3 = s3; d3 < f3; d3 += 3) {
          let i4 = o2.getX(d3), s4 = o2.getX(d3 + 1), f4 = o2.getX(d3 + 2);
          r2 = de(this, a2, e4, n2, c2, l2, u2, i4, s4, f4), r2 && (r2.faceIndex = Math.floor(d3 / 3), t2.push(r2));
        }
      }
      else if (s2 !== void 0) if (Array.isArray(a2)) for (let i3 = 0, o3 = d2.length; i3 < o3; i3++) {
        let o4 = d2[i3], p2 = a2[o4.materialIndex], m2 = Math.max(o4.start, f2.start), h2 = Math.min(s2.count, Math.min(o4.start + o4.count, f2.start + f2.count));
        for (let i4 = m2, a3 = h2; i4 < a3; i4 += 3) {
          let a4 = i4, s3 = i4 + 1, d3 = i4 + 2;
          r2 = de(this, p2, e4, n2, c2, l2, u2, a4, s3, d3), r2 && (r2.faceIndex = Math.floor(i4 / 3), r2.face.materialIndex = o4.materialIndex, t2.push(r2));
        }
      }
      else {
        let i3 = Math.max(0, f2.start), o3 = Math.min(s2.count, f2.start + f2.count);
        for (let s3 = i3, d3 = o3; s3 < d3; s3 += 3) {
          let i4 = s3, o4 = s3 + 1, d4 = s3 + 2;
          r2 = de(this, a2, e4, n2, c2, l2, u2, i4, o4, d4), r2 && (r2.faceIndex = Math.floor(s3 / 3), t2.push(r2));
        }
      }
    }
  }, Sa = new yr(), Ca = new yr(), wa = new yr(), Ta = new yr(), Ea = new wr(), Da = new N(), Oa = new Wi(), ka = new wr(), Aa = new ca(), ja = class extends xa {
    constructor(e4, t2) {
      super(e4, t2), this.isSkinnedMesh = true, this.type = `SkinnedMesh`, this.bindMode = gt, this.bindMatrix = new wr(), this.bindMatrixInverse = new wr(), this.boundingBox = null, this.boundingSphere = null;
    }
    computeBoundingBox() {
      let e4 = this.geometry;
      this.boundingBox === null && (this.boundingBox = new bi()), this.boundingBox.makeEmpty();
      let t2 = e4.getAttribute(`position`);
      for (let e5 = 0; e5 < t2.count; e5++) this.getVertexPosition(e5, Da), this.boundingBox.expandByPoint(Da);
    }
    computeBoundingSphere() {
      let e4 = this.geometry;
      this.boundingSphere === null && (this.boundingSphere = new Wi()), this.boundingSphere.makeEmpty();
      let t2 = e4.getAttribute(`position`);
      for (let e5 = 0; e5 < t2.count; e5++) this.getVertexPosition(e5, Da), this.boundingSphere.expandByPoint(Da);
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.bindMode = e4.bindMode, this.bindMatrix.copy(e4.bindMatrix), this.bindMatrixInverse.copy(e4.bindMatrixInverse), this.skeleton = e4.skeleton, e4.boundingBox !== null && (this.boundingBox = e4.boundingBox.clone()), e4.boundingSphere !== null && (this.boundingSphere = e4.boundingSphere.clone()), this;
    }
    raycast(e4, t2) {
      let n2 = this.material, r2 = this.matrixWorld;
      n2 !== void 0 && (this.boundingSphere === null && this.computeBoundingSphere(), Oa.copy(this.boundingSphere), Oa.applyMatrix4(r2), e4.ray.intersectsSphere(Oa) !== false && (ka.copy(r2).invert(), Aa.copy(e4.ray).applyMatrix4(ka), !(this.boundingBox !== null && Aa.intersectsBox(this.boundingBox) === false) && this._computeIntersections(e4, t2, Aa)));
    }
    getVertexPosition(e4, t2) {
      return super.getVertexPosition(e4, t2), this.applyBoneTransform(e4, t2), t2;
    }
    bind(e4, t2) {
      this.skeleton = e4, t2 === void 0 && (this.updateMatrixWorld(true), this.skeleton.calculateInverses(), t2 = this.matrixWorld), this.bindMatrix.copy(t2), this.bindMatrixInverse.copy(t2).invert();
    }
    pose() {
      this.skeleton.pose();
    }
    normalizeSkinWeights() {
      let e4 = new yr(), t2 = this.geometry.attributes.skinWeight;
      for (let n2 = 0, r2 = t2.count; n2 < r2; n2++) {
        e4.fromBufferAttribute(t2, n2);
        let r3 = 1 / e4.manhattanLength();
        r3 === 1 / 0 ? e4.set(1, 0, 0, 0) : e4.multiplyScalar(r3), t2.setXYZW(n2, e4.x, e4.y, e4.z, e4.w);
      }
    }
    updateMatrixWorld(e4) {
      super.updateMatrixWorld(e4), this.bindMode === `attached` ? this.bindMatrixInverse.copy(this.matrixWorld).invert() : this.bindMode === `detached` ? this.bindMatrixInverse.copy(this.bindMatrix).invert() : l(`SkinnedMesh: Unrecognized bindMode: ` + this.bindMode);
    }
    applyBoneTransform(e4, t2) {
      let n2 = this.skeleton, r2 = this.geometry;
      Ca.fromBufferAttribute(r2.attributes.skinIndex, e4), wa.fromBufferAttribute(r2.attributes.skinWeight, e4), t2.isVector4 ? (Sa.copy(t2), t2.set(0, 0, 0, 0)) : (Sa.set(...t2, 1), t2.set(0, 0, 0)), Sa.applyMatrix4(this.bindMatrix);
      for (let e5 = 0; e5 < 4; e5++) {
        let r3 = wa.getComponent(e5);
        if (r3 !== 0) {
          let i2 = Ca.getComponent(e5);
          Ea.multiplyMatrices(n2.bones[i2].matrixWorld, n2.boneInverses[i2]), t2.addScaledVector(Ta.copy(Sa).applyMatrix4(Ea), r3);
        }
      }
      return t2.isVector4 && (t2.w = Sa.w), t2.applyMatrix4(this.bindMatrixInverse);
    }
  }, Ma = class extends Zr {
    constructor() {
      super(), this.isBone = true, this.type = `Bone`;
    }
  }, Na = class extends vr {
    constructor(e4 = null, t2 = 1, n2 = 1, r2, i2, a2, o2, s2, c2 = bt, l2 = bt, u2, d2) {
      super(null, a2, o2, s2, c2, l2, r2, i2, u2, d2), this.isDataTexture = true, this.image = { data: e4, width: t2, height: n2 }, this.generateMipmaps = false, this.flipY = false, this.unpackAlignment = 1;
    }
  }, Pa = new wr(), Fa = new wr(), Ia = class e4 {
    constructor(e5 = [], t2 = []) {
      this.uuid = p(), this.bones = e5.slice(0), this.boneInverses = t2, this.boneMatrices = null, this.previousBoneMatrices = null, this.boneTexture = null, this.init();
    }
    init() {
      let e5 = this.bones, t2 = this.boneInverses;
      if (this.boneMatrices = new Float32Array(e5.length * 16), t2.length === 0) this.calculateInverses();
      else if (e5.length !== t2.length) {
        l(`Skeleton: Number of inverse bone matrices does not match amount of bones.`), this.boneInverses = [];
        for (let e6 = 0, t3 = this.bones.length; e6 < t3; e6++) this.boneInverses.push(new wr());
      }
    }
    calculateInverses() {
      this.boneInverses.length = 0;
      for (let e5 = 0, t2 = this.bones.length; e5 < t2; e5++) {
        let t3 = new wr();
        this.bones[e5] && t3.copy(this.bones[e5].matrixWorld).invert(), this.boneInverses.push(t3);
      }
    }
    pose() {
      for (let e5 = 0, t2 = this.bones.length; e5 < t2; e5++) {
        let t3 = this.bones[e5];
        t3 && t3.matrixWorld.copy(this.boneInverses[e5]).invert();
      }
      for (let e5 = 0, t2 = this.bones.length; e5 < t2; e5++) {
        let t3 = this.bones[e5];
        t3 && (t3.parent && t3.parent.isBone ? (t3.matrix.copy(t3.parent.matrixWorld).invert(), t3.matrix.multiply(t3.matrixWorld)) : t3.matrix.copy(t3.matrixWorld), t3.matrix.decompose(t3.position, t3.quaternion, t3.scale));
      }
    }
    update() {
      let e5 = this.bones, t2 = this.boneInverses, n2 = this.boneMatrices, r2 = this.boneTexture;
      for (let r3 = 0, i2 = e5.length; r3 < i2; r3++) {
        let i3 = e5[r3] ? e5[r3].matrixWorld : Fa;
        Pa.multiplyMatrices(i3, t2[r3]), Pa.toArray(n2, r3 * 16);
      }
      r2 !== null && (r2.needsUpdate = true);
    }
    clone() {
      return new e4(this.bones, this.boneInverses);
    }
    computeBoneTexture() {
      let e5 = Math.sqrt(this.bones.length * 4);
      e5 = Math.ceil(e5 / 4) * 4, e5 = Math.max(e5, 4);
      let t2 = new Float32Array(e5 * e5 * 4);
      t2.set(this.boneMatrices);
      let n2 = new Na(t2, e5, e5, Vt, Mt);
      return n2.needsUpdate = true, this.boneMatrices = t2, this.boneTexture = n2, this;
    }
    getBoneByName(e5) {
      for (let t2 = 0, n2 = this.bones.length; t2 < n2; t2++) {
        let n3 = this.bones[t2];
        if (n3.name === e5) return n3;
      }
    }
    dispose() {
      this.boneTexture !== null && (this.boneTexture.dispose(), this.boneTexture = null);
    }
    fromJSON(e5, t2) {
      this.uuid = e5.uuid;
      for (let n2 = 0, r2 = e5.bones.length; n2 < r2; n2++) {
        let r3 = e5.bones[n2], i2 = t2[r3];
        i2 === void 0 && (l(`Skeleton: No bone found with UUID:`, r3), i2 = new Ma()), this.bones.push(i2), this.boneInverses.push(new wr().fromArray(e5.boneInverses[n2]));
      }
      return this.init(), this;
    }
    toJSON() {
      let e5 = { metadata: { version: 4.7, type: `Skeleton`, generator: `Skeleton.toJSON` }, bones: [], boneInverses: [] };
      e5.uuid = this.uuid;
      let t2 = this.bones, n2 = this.boneInverses;
      for (let r2 = 0, i2 = t2.length; r2 < i2; r2++) {
        let i3 = t2[r2];
        e5.bones.push(i3.uuid);
        let a2 = n2[r2];
        e5.boneInverses.push(a2.toArray());
      }
      return e5;
    }
  }, La = class extends Li {
    constructor(e4, t2, n2, r2 = 1) {
      super(e4, t2, n2), this.isInstancedBufferAttribute = true, this.meshPerAttribute = r2;
    }
    copy(e4) {
      return super.copy(e4), this.meshPerAttribute = e4.meshPerAttribute, this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.meshPerAttribute = this.meshPerAttribute, e4.isInstancedBufferAttribute = true, e4;
    }
  }, Ra = new wr(), za = new wr(), Ba = [], Va = new bi(), Ha = new wr(), Ua = new xa(), Wa = new Wi(), Ga = class extends xa {
    constructor(e4, t2, n2) {
      super(e4, t2), this.isInstancedMesh = true, this.instanceMatrix = new La(new Float32Array(n2 * 16), 16), this.previousInstanceMatrix = null, this.instanceColor = null, this.morphTexture = null, this.count = n2, this.boundingBox = null, this.boundingSphere = null;
      for (let e5 = 0; e5 < n2; e5++) this.setMatrixAt(e5, Ha);
    }
    computeBoundingBox() {
      let e4 = this.geometry, t2 = this.count;
      this.boundingBox === null && (this.boundingBox = new bi()), e4.boundingBox === null && e4.computeBoundingBox(), this.boundingBox.makeEmpty();
      for (let n2 = 0; n2 < t2; n2++) this.getMatrixAt(n2, Ra), Va.copy(e4.boundingBox).applyMatrix4(Ra), this.boundingBox.union(Va);
    }
    computeBoundingSphere() {
      let e4 = this.geometry, t2 = this.count;
      this.boundingSphere === null && (this.boundingSphere = new Wi()), e4.boundingSphere === null && e4.computeBoundingSphere(), this.boundingSphere.makeEmpty();
      for (let n2 = 0; n2 < t2; n2++) this.getMatrixAt(n2, Ra), Wa.copy(e4.boundingSphere).applyMatrix4(Ra), this.boundingSphere.union(Wa);
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.instanceMatrix.copy(e4.instanceMatrix), e4.previousInstanceMatrix !== null && (this.previousInstanceMatrix = e4.previousInstanceMatrix.clone()), e4.morphTexture !== null && (this.morphTexture = e4.morphTexture.clone()), e4.instanceColor !== null && (this.instanceColor = e4.instanceColor.clone()), this.count = e4.count, e4.boundingBox !== null && (this.boundingBox = e4.boundingBox.clone()), e4.boundingSphere !== null && (this.boundingSphere = e4.boundingSphere.clone()), this;
    }
    getColorAt(e4, t2) {
      return this.instanceColor === null ? t2.setRGB(1, 1, 1) : t2.fromArray(this.instanceColor.array, e4 * 3);
    }
    getMatrixAt(e4, t2) {
      return t2.fromArray(this.instanceMatrix.array, e4 * 16);
    }
    getMorphAt(e4, t2) {
      let n2 = t2.morphTargetInfluences, r2 = this.morphTexture.source.data.data, i2 = e4 * (n2.length + 1) + 1;
      for (let e5 = 0; e5 < n2.length; e5++) n2[e5] = r2[i2 + e5];
    }
    raycast(e4, t2) {
      let n2 = this.matrixWorld, r2 = this.count;
      if (Ua.geometry = this.geometry, Ua.material = this.material, Ua.material !== void 0 && (this.boundingSphere === null && this.computeBoundingSphere(), Wa.copy(this.boundingSphere), Wa.applyMatrix4(n2), e4.ray.intersectsSphere(Wa) !== false)) for (let i2 = 0; i2 < r2; i2++) {
        this.getMatrixAt(i2, Ra), za.multiplyMatrices(n2, Ra), Ua.matrixWorld = za, Ua.raycast(e4, Ba);
        for (let e5 = 0, n3 = Ba.length; e5 < n3; e5++) {
          let n4 = Ba[e5];
          n4.instanceId = i2, n4.object = this, t2.push(n4);
        }
        Ba.length = 0;
      }
    }
    setColorAt(e4, t2) {
      return this.instanceColor === null && (this.instanceColor = new La(new Float32Array(this.instanceMatrix.count * 3).fill(1), 3)), t2.toArray(this.instanceColor.array, e4 * 3), this;
    }
    setMatrixAt(e4, t2) {
      return t2.toArray(this.instanceMatrix.array, e4 * 16), this;
    }
    setMorphAt(e4, t2) {
      let n2 = t2.morphTargetInfluences, r2 = n2.length + 1;
      this.morphTexture === null && (this.morphTexture = new Na(new Float32Array(r2 * this.count), r2, this.count, Wt, Mt));
      let i2 = this.morphTexture.source.data.data, a2 = 0;
      for (let e5 = 0; e5 < n2.length; e5++) a2 += n2[e5];
      let o2 = this.geometry.morphTargetsRelative ? 1 : 1 - a2, s2 = r2 * e4;
      return i2[s2] = o2, i2.set(n2, s2 + 1), this;
    }
    updateMorphTargets() {
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` }), this.morphTexture !== null && (this.morphTexture.dispose(), this.morphTexture = null);
    }
  }, Ka = new N(), qa = new N(), Ja = new sr(), Ya = class {
    constructor(e4 = new N(1, 0, 0), t2 = 0) {
      this.isPlane = true, this.normal = e4, this.constant = t2;
    }
    set(e4, t2) {
      return this.normal.copy(e4), this.constant = t2, this;
    }
    setComponents(e4, t2, n2, r2) {
      return this.normal.set(e4, t2, n2), this.constant = r2, this;
    }
    setFromNormalAndCoplanarPoint(e4, t2) {
      return this.normal.copy(e4), this.constant = -t2.dot(this.normal), this;
    }
    setFromCoplanarPoints(e4, t2, n2) {
      let r2 = Ka.subVectors(n2, t2).cross(qa.subVectors(e4, t2)).normalize();
      return this.setFromNormalAndCoplanarPoint(r2, e4), this;
    }
    copy(e4) {
      return this.normal.copy(e4.normal), this.constant = e4.constant, this;
    }
    normalize() {
      let e4 = 1 / this.normal.length();
      return this.normal.multiplyScalar(e4), this.constant *= e4, this;
    }
    negate() {
      return this.constant *= -1, this.normal.negate(), this;
    }
    distanceToPoint(e4) {
      return this.normal.dot(e4) + this.constant;
    }
    distanceToSphere(e4) {
      return this.distanceToPoint(e4.center) - e4.radius;
    }
    projectPoint(e4, t2) {
      return t2.copy(e4).addScaledVector(this.normal, -this.distanceToPoint(e4));
    }
    intersectLine(e4, t2, n2 = true) {
      let r2 = e4.delta(Ka), i2 = this.normal.dot(r2);
      if (i2 === 0) return this.distanceToPoint(e4.start) === 0 ? t2.copy(e4.start) : null;
      let a2 = -(e4.start.dot(this.normal) + this.constant) / i2;
      return n2 === true && (a2 < 0 || a2 > 1) ? null : t2.copy(e4.start).addScaledVector(r2, a2);
    }
    intersectsLine(e4) {
      let t2 = this.distanceToPoint(e4.start), n2 = this.distanceToPoint(e4.end);
      return t2 < 0 && n2 > 0 || n2 < 0 && t2 > 0;
    }
    intersectsBox(e4) {
      return e4.intersectsPlane(this);
    }
    intersectsSphere(e4) {
      return e4.intersectsPlane(this);
    }
    coplanarPoint(e4) {
      return e4.copy(this.normal).multiplyScalar(-this.constant);
    }
    applyMatrix4(e4, t2) {
      let n2 = t2 || Ja.getNormalMatrix(e4), r2 = this.coplanarPoint(Ka).applyMatrix4(e4), i2 = this.normal.applyMatrix3(n2).normalize();
      return this.constant = -r2.dot(i2), this;
    }
    translate(e4) {
      return this.constant -= e4.dot(this.normal), this;
    }
    equals(e4) {
      return e4.normal.equals(this.normal) && e4.constant === this.constant;
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }, Xa = new Wi(), Za = new M(0.5, 0.5), Qa = new N(), $a = class {
    constructor(e4 = new Ya(), t2 = new Ya(), n2 = new Ya(), r2 = new Ya(), i2 = new Ya(), a2 = new Ya()) {
      this.planes = [e4, t2, n2, r2, i2, a2];
    }
    set(e4, t2, n2, r2, i2, a2) {
      let o2 = this.planes;
      return o2[0].copy(e4), o2[1].copy(t2), o2[2].copy(n2), o2[3].copy(r2), o2[4].copy(i2), o2[5].copy(a2), this;
    }
    copy(e4) {
      let t2 = this.planes;
      for (let n2 = 0; n2 < 6; n2++) t2[n2].copy(e4.planes[n2]);
      return this;
    }
    setFromProjectionMatrix(e4, t2 = Jn, n2 = false) {
      let r2 = this.planes, i2 = e4.elements, a2 = i2[0], o2 = i2[1], s2 = i2[2], c2 = i2[3], l2 = i2[4], u2 = i2[5], d2 = i2[6], f2 = i2[7], p2 = i2[8], m2 = i2[9], h2 = i2[10], g2 = i2[11], _2 = i2[12], v2 = i2[13], y2 = i2[14], b2 = i2[15];
      if (r2[0].setComponents(c2 - a2, f2 - l2, g2 - p2, b2 - _2).normalize(), r2[1].setComponents(c2 + a2, f2 + l2, g2 + p2, b2 + _2).normalize(), r2[2].setComponents(c2 + o2, f2 + u2, g2 + m2, b2 + v2).normalize(), r2[3].setComponents(c2 - o2, f2 - u2, g2 - m2, b2 - v2).normalize(), n2) r2[4].setComponents(s2, d2, h2, y2).normalize(), r2[5].setComponents(c2 - s2, f2 - d2, g2 - h2, b2 - y2).normalize();
      else if (r2[4].setComponents(c2 - s2, f2 - d2, g2 - h2, b2 - y2).normalize(), t2 === 2e3) r2[5].setComponents(c2 + s2, f2 + d2, g2 + h2, b2 + y2).normalize();
      else if (t2 === 2001) r2[5].setComponents(s2, d2, h2, y2).normalize();
      else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: ` + t2);
      return this;
    }
    intersectsObject(e4) {
      if (e4.boundingSphere !== void 0) e4.boundingSphere === null && e4.computeBoundingSphere(), Xa.copy(e4.boundingSphere).applyMatrix4(e4.matrixWorld);
      else {
        let t2 = e4.geometry;
        t2.boundingSphere === null && t2.computeBoundingSphere(), Xa.copy(t2.boundingSphere).applyMatrix4(e4.matrixWorld);
      }
      return this.intersectsSphere(Xa);
    }
    intersectsSprite(e4) {
      return Xa.center.set(0, 0, 0), Xa.radius = 0.7071067811865476 + Za.distanceTo(e4.center), Xa.applyMatrix4(e4.matrixWorld), this.intersectsSphere(Xa);
    }
    intersectsSphere(e4) {
      let t2 = this.planes, n2 = e4.center, r2 = -e4.radius;
      for (let e5 = 0; e5 < 6; e5++) if (t2[e5].distanceToPoint(n2) < r2) return false;
      return true;
    }
    intersectsBox(e4) {
      let t2 = this.planes;
      for (let n2 = 0; n2 < 6; n2++) {
        let r2 = t2[n2];
        if (Qa.x = r2.normal.x > 0 ? e4.max.x : e4.min.x, Qa.y = r2.normal.y > 0 ? e4.max.y : e4.min.y, Qa.z = r2.normal.z > 0 ? e4.max.z : e4.min.z, r2.distanceToPoint(Qa) < 0) return false;
      }
      return true;
    }
    containsPoint(e4) {
      let t2 = this.planes;
      for (let n2 = 0; n2 < 6; n2++) if (t2[n2].distanceToPoint(e4) < 0) return false;
      return true;
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }, eo = class extends vr {
    constructor(e4 = [], t2 = 301, n2, r2, i2, a2, o2, s2, c2, l2) {
      super(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2), this.isCubeTexture = true, this.flipY = false;
    }
    get images() {
      return this.image;
    }
    set images(e4) {
      this.image = e4;
    }
  }, to = class extends vr {
    constructor(e4, t2, n2, r2, i2, a2, o2, s2, c2) {
      super(e4, t2, n2, r2, i2, a2, o2, s2, c2), this.isCanvasTexture = true, this.needsUpdate = true;
    }
  }, no = class extends vr {
    constructor(e4, t2, n2 = jt, r2, i2, a2, o2 = bt, s2 = bt, c2, l2 = Ht, u2 = 1) {
      if (l2 !== 1026 && l2 !== 1027) throw Error(`DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);
      super({ width: e4, height: t2, depth: u2 }, r2, i2, a2, o2, s2, l2, n2, c2), this.isDepthTexture = true, this.flipY = false, this.generateMipmaps = false, this.compareFunction = null;
    }
    copy(e4) {
      return super.copy(e4), this.source = new hr(Object.assign({}, e4.image)), this.compareFunction = e4.compareFunction, this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return this.compareFunction !== null && (t2.compareFunction = this.compareFunction), t2;
    }
  }, ro = class extends no {
    constructor(e4, t2 = jt, n2 = 301, r2, i2, a2 = bt, o2 = bt, s2, c2 = Ht) {
      let l2 = { width: e4, height: e4, depth: 1 }, u2 = [l2, l2, l2, l2, l2, l2];
      super(e4, e4, t2, n2, r2, i2, a2, o2, s2, c2), this.image = u2, this.isCubeDepthTexture = true, this.isCubeTexture = true;
    }
    get images() {
      return this.image;
    }
    set images(e4) {
      this.image = e4;
    }
  }, io = class extends vr {
    constructor(e4 = null) {
      super(), this.sourceTexture = e4, this.isExternalTexture = true;
    }
    copy(e4) {
      return super.copy(e4), this.sourceTexture = e4.sourceTexture, this;
    }
  }, ao = class e4 extends Qi {
    constructor(e5 = 1, t2 = 1, n2 = 1, r2 = 1, i2 = 1, a2 = 1) {
      super(), this.type = `BoxGeometry`, this.parameters = { width: e5, height: t2, depth: n2, widthSegments: r2, heightSegments: i2, depthSegments: a2 };
      let o2 = this;
      r2 = Math.floor(r2), i2 = Math.floor(i2), a2 = Math.floor(a2);
      let s2 = [], c2 = [], l2 = [], u2 = [], d2 = 0, f2 = 0;
      p2(`z`, `y`, `x`, -1, -1, n2, t2, e5, a2, i2, 0), p2(`z`, `y`, `x`, 1, -1, n2, t2, -e5, a2, i2, 1), p2(`x`, `z`, `y`, 1, 1, e5, n2, t2, r2, a2, 2), p2(`x`, `z`, `y`, 1, -1, e5, n2, -t2, r2, a2, 3), p2(`x`, `y`, `z`, 1, -1, e5, t2, n2, r2, i2, 4), p2(`x`, `y`, `z`, -1, -1, e5, t2, -n2, r2, i2, 5), this.setIndex(s2), this.setAttribute(`position`, new Bi(c2, 3)), this.setAttribute(`normal`, new Bi(l2, 3)), this.setAttribute(`uv`, new Bi(u2, 2));
      function p2(e6, t3, n3, r3, i3, a3, p3, m2, h2, g2, _2) {
        let v2 = a3 / h2, y2 = p3 / g2, b2 = a3 / 2, x2 = p3 / 2, S2 = m2 / 2, C2 = h2 + 1, w2 = g2 + 1, T2 = 0, E2 = 0, D2 = new N();
        for (let a4 = 0; a4 < w2; a4++) {
          let o3 = a4 * y2 - x2;
          for (let s3 = 0; s3 < C2; s3++) D2[e6] = (s3 * v2 - b2) * r3, D2[t3] = o3 * i3, D2[n3] = S2, c2.push(D2.x, D2.y, D2.z), D2[e6] = 0, D2[t3] = 0, D2[n3] = m2 > 0 ? 1 : -1, l2.push(D2.x, D2.y, D2.z), u2.push(s3 / h2), u2.push(1 - a4 / g2), T2 += 1;
        }
        for (let e7 = 0; e7 < g2; e7++) for (let t4 = 0; t4 < h2; t4++) {
          let n4 = d2 + t4 + C2 * e7, r4 = d2 + t4 + C2 * (e7 + 1), i4 = d2 + (t4 + 1) + C2 * (e7 + 1), a4 = d2 + (t4 + 1) + C2 * e7;
          s2.push(n4, r4, a4), s2.push(r4, i4, a4), E2 += 6;
        }
        o2.addGroup(f2, E2, _2), f2 += E2, d2 += T2;
      }
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.width, t2.height, t2.depth, t2.widthSegments, t2.heightSegments, t2.depthSegments);
    }
  }, oo = class e4 extends Qi {
    constructor(e5 = 1, t2 = 1, n2 = 4, r2 = 8, i2 = 1) {
      super(), this.type = `CapsuleGeometry`, this.parameters = { radius: e5, height: t2, capSegments: n2, radialSegments: r2, heightSegments: i2 }, t2 = Math.max(0, t2), n2 = Math.max(1, Math.floor(n2)), r2 = Math.max(3, Math.floor(r2)), i2 = Math.max(1, Math.floor(i2));
      let a2 = [], o2 = [], s2 = [], c2 = [], l2 = t2 / 2, u2 = Math.PI / 2 * e5, d2 = t2, f2 = 2 * u2 + d2, p2 = n2 * 2 + i2, m2 = r2 + 1, h2 = new N(), g2 = new N();
      for (let _2 = 0; _2 <= p2; _2++) {
        let v2 = 0, y2 = 0, b2 = 0, x2 = 0;
        if (_2 <= n2) {
          let t3 = _2 / n2, r3 = t3 * Math.PI / 2;
          y2 = -l2 - e5 * Math.cos(r3), b2 = e5 * Math.sin(r3), x2 = -e5 * Math.cos(r3), v2 = t3 * u2;
        } else if (_2 <= n2 + i2) {
          let r3 = (_2 - n2) / i2;
          y2 = -l2 + r3 * t2, b2 = e5, x2 = 0, v2 = u2 + r3 * d2;
        } else {
          let t3 = (_2 - n2 - i2) / n2, r3 = t3 * Math.PI / 2;
          y2 = l2 + e5 * Math.sin(r3), b2 = e5 * Math.cos(r3), x2 = e5 * Math.sin(r3), v2 = u2 + d2 + t3 * u2;
        }
        let S2 = Math.max(0, Math.min(1, v2 / f2)), C2 = 0;
        _2 === 0 ? C2 = 0.5 / r2 : _2 === p2 && (C2 = -0.5 / r2);
        for (let e6 = 0; e6 <= r2; e6++) {
          let t3 = e6 / r2, n3 = t3 * Math.PI * 2, i3 = Math.sin(n3), a3 = Math.cos(n3);
          g2.x = -b2 * a3, g2.y = y2, g2.z = b2 * i3, o2.push(g2.x, g2.y, g2.z), h2.set(-b2 * a3, x2, b2 * i3), h2.normalize(), s2.push(h2.x, h2.y, h2.z), c2.push(t3 + C2, S2);
        }
        if (_2 > 0) {
          let e6 = (_2 - 1) * m2;
          for (let t3 = 0; t3 < r2; t3++) {
            let n3 = e6 + t3, r3 = e6 + t3 + 1, i3 = _2 * m2 + t3, o3 = _2 * m2 + t3 + 1;
            a2.push(n3, r3, i3), a2.push(r3, o3, i3);
          }
        }
      }
      this.setIndex(a2), this.setAttribute(`position`, new Bi(o2, 3)), this.setAttribute(`normal`, new Bi(s2, 3)), this.setAttribute(`uv`, new Bi(c2, 2));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.height, t2.capSegments, t2.radialSegments, t2.heightSegments);
    }
  }, so = class e4 extends Qi {
    constructor(e5 = 1, t2 = 32, n2 = 0, r2 = Math.PI * 2) {
      super(), this.type = `CircleGeometry`, this.parameters = { radius: e5, segments: t2, thetaStart: n2, thetaLength: r2 }, t2 = Math.max(3, t2);
      let i2 = [], a2 = [], o2 = [], s2 = [], c2 = new N(), l2 = new M();
      a2.push(0, 0, 0), o2.push(0, 0, 1), s2.push(0.5, 0.5);
      for (let i3 = 0, u2 = 3; i3 <= t2; i3++, u2 += 3) {
        let d2 = n2 + i3 / t2 * r2;
        c2.x = e5 * Math.cos(d2), c2.y = e5 * Math.sin(d2), a2.push(c2.x, c2.y, c2.z), o2.push(0, 0, 1), l2.x = (a2[u2] / e5 + 1) / 2, l2.y = (a2[u2 + 1] / e5 + 1) / 2, s2.push(l2.x, l2.y);
      }
      for (let e6 = 1; e6 <= t2; e6++) i2.push(e6, e6 + 1, 0);
      this.setIndex(i2), this.setAttribute(`position`, new Bi(a2, 3)), this.setAttribute(`normal`, new Bi(o2, 3)), this.setAttribute(`uv`, new Bi(s2, 2));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.segments, t2.thetaStart, t2.thetaLength);
    }
  }, co = class e4 extends Qi {
    constructor(e5 = 1, t2 = 1, n2 = 1, r2 = 32, i2 = 1, a2 = false, o2 = 0, s2 = Math.PI * 2) {
      super(), this.type = `CylinderGeometry`, this.parameters = { radiusTop: e5, radiusBottom: t2, height: n2, radialSegments: r2, heightSegments: i2, openEnded: a2, thetaStart: o2, thetaLength: s2 };
      let c2 = this;
      r2 = Math.floor(r2), i2 = Math.floor(i2);
      let l2 = [], u2 = [], d2 = [], f2 = [], p2 = 0, m2 = [], h2 = n2 / 2, g2 = 0;
      _2(), a2 === false && (e5 > 0 && v2(true), t2 > 0 && v2(false)), this.setIndex(l2), this.setAttribute(`position`, new Bi(u2, 3)), this.setAttribute(`normal`, new Bi(d2, 3)), this.setAttribute(`uv`, new Bi(f2, 2));
      function _2() {
        let a3 = new N(), _3 = new N(), v3 = 0, y2 = (t2 - e5) / n2;
        for (let c3 = 0; c3 <= i2; c3++) {
          let l3 = [], g3 = c3 / i2, v4 = g3 * (t2 - e5) + e5;
          for (let e6 = 0; e6 <= r2; e6++) {
            let t3 = e6 / r2, i3 = t3 * s2 + o2, c4 = Math.sin(i3), m3 = Math.cos(i3);
            _3.x = v4 * c4, _3.y = -g3 * n2 + h2, _3.z = v4 * m3, u2.push(_3.x, _3.y, _3.z), a3.set(c4, y2, m3).normalize(), d2.push(a3.x, a3.y, a3.z), f2.push(t3, 1 - g3), l3.push(p2++);
          }
          m2.push(l3);
        }
        for (let n3 = 0; n3 < r2; n3++) for (let r3 = 0; r3 < i2; r3++) {
          let a4 = m2[r3][n3], o3 = m2[r3 + 1][n3], s3 = m2[r3 + 1][n3 + 1], c3 = m2[r3][n3 + 1];
          (e5 > 0 || r3 !== 0) && (l2.push(a4, o3, c3), v3 += 3), (t2 > 0 || r3 !== i2 - 1) && (l2.push(o3, s3, c3), v3 += 3);
        }
        c2.addGroup(g2, v3, 0), g2 += v3;
      }
      function v2(n3) {
        let i3 = p2, a3 = new M(), m3 = new N(), _3 = 0, v3 = n3 === true ? e5 : t2, y2 = n3 === true ? 1 : -1;
        for (let e6 = 1; e6 <= r2; e6++) u2.push(0, h2 * y2, 0), d2.push(0, y2, 0), f2.push(0.5, 0.5), p2++;
        let b2 = p2;
        for (let e6 = 0; e6 <= r2; e6++) {
          let t3 = e6 / r2 * s2 + o2, n4 = Math.cos(t3), i4 = Math.sin(t3);
          m3.x = v3 * i4, m3.y = h2 * y2, m3.z = v3 * n4, u2.push(m3.x, m3.y, m3.z), d2.push(0, y2, 0), a3.x = n4 * 0.5 + 0.5, a3.y = i4 * 0.5 * y2 + 0.5, f2.push(a3.x, a3.y), p2++;
        }
        for (let e6 = 0; e6 < r2; e6++) {
          let t3 = i3 + e6, r3 = b2 + e6;
          n3 === true ? l2.push(r3, r3 + 1, t3) : l2.push(r3 + 1, r3, t3), _3 += 3;
        }
        c2.addGroup(g2, _3, n3 === true ? 1 : 2), g2 += _3;
      }
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.radiusTop, t2.radiusBottom, t2.height, t2.radialSegments, t2.heightSegments, t2.openEnded, t2.thetaStart, t2.thetaLength);
    }
  }, lo = class e4 extends co {
    constructor(e5 = 1, t2 = 1, n2 = 32, r2 = 1, i2 = false, a2 = 0, o2 = Math.PI * 2) {
      super(0, e5, t2, n2, r2, i2, a2, o2), this.type = `ConeGeometry`, this.parameters = { radius: e5, height: t2, radialSegments: n2, heightSegments: r2, openEnded: i2, thetaStart: a2, thetaLength: o2 };
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.height, t2.radialSegments, t2.heightSegments, t2.openEnded, t2.thetaStart, t2.thetaLength);
    }
  }, uo = class e4 extends Qi {
    constructor(e5 = [], t2 = [], n2 = 1, r2 = 0) {
      super(), this.type = `PolyhedronGeometry`, this.parameters = { vertices: e5, indices: t2, radius: n2, detail: r2 };
      let i2 = [], a2 = [];
      o2(r2), c2(n2), l2(), this.setAttribute(`position`, new Bi(i2, 3)), this.setAttribute(`normal`, new Bi(i2.slice(), 3)), this.setAttribute(`uv`, new Bi(a2, 2)), r2 === 0 ? this.computeVertexNormals() : this.normalizeNormals();
      function o2(e6) {
        let n3 = new N(), r3 = new N(), i3 = new N();
        for (let a3 = 0; a3 < t2.length; a3 += 3) f2(t2[a3 + 0], n3), f2(t2[a3 + 1], r3), f2(t2[a3 + 2], i3), s2(n3, r3, i3, e6);
      }
      function s2(e6, t3, n3, r3) {
        let i3 = r3 + 1, a3 = [];
        for (let r4 = 0; r4 <= i3; r4++) {
          a3[r4] = [];
          let o3 = e6.clone().lerp(n3, r4 / i3), s3 = t3.clone().lerp(n3, r4 / i3), c3 = i3 - r4;
          for (let e7 = 0; e7 <= c3; e7++) e7 === 0 && r4 === i3 ? a3[r4][e7] = o3 : a3[r4][e7] = o3.clone().lerp(s3, e7 / c3);
        }
        for (let e7 = 0; e7 < i3; e7++) for (let t4 = 0; t4 < 2 * (i3 - e7) - 1; t4++) {
          let n4 = Math.floor(t4 / 2);
          t4 % 2 == 0 ? (d2(a3[e7][n4 + 1]), d2(a3[e7 + 1][n4]), d2(a3[e7][n4])) : (d2(a3[e7][n4 + 1]), d2(a3[e7 + 1][n4 + 1]), d2(a3[e7 + 1][n4]));
        }
      }
      function c2(e6) {
        let t3 = new N();
        for (let n3 = 0; n3 < i2.length; n3 += 3) t3.x = i2[n3 + 0], t3.y = i2[n3 + 1], t3.z = i2[n3 + 2], t3.normalize().multiplyScalar(e6), i2[n3 + 0] = t3.x, i2[n3 + 1] = t3.y, i2[n3 + 2] = t3.z;
      }
      function l2() {
        let e6 = new N();
        for (let t3 = 0; t3 < i2.length; t3 += 3) {
          e6.x = i2[t3 + 0], e6.y = i2[t3 + 1], e6.z = i2[t3 + 2];
          let n3 = h2(e6) / 2 / Math.PI + 0.5, r3 = g2(e6) / Math.PI + 0.5;
          a2.push(n3, 1 - r3);
        }
        p2(), u2();
      }
      function u2() {
        for (let e6 = 0; e6 < a2.length; e6 += 6) {
          let t3 = a2[e6 + 0], n3 = a2[e6 + 2], r3 = a2[e6 + 4];
          Math.max(t3, n3, r3) > 0.9 && Math.min(t3, n3, r3) < 0.1 && (t3 < 0.2 && (a2[e6 + 0] += 1), n3 < 0.2 && (a2[e6 + 2] += 1), r3 < 0.2 && (a2[e6 + 4] += 1));
        }
      }
      function d2(e6) {
        i2.push(e6.x, e6.y, e6.z);
      }
      function f2(t3, n3) {
        let r3 = t3 * 3;
        n3.x = e5[r3 + 0], n3.y = e5[r3 + 1], n3.z = e5[r3 + 2];
      }
      function p2() {
        let e6 = new N(), t3 = new N(), n3 = new N(), r3 = new N(), o3 = new M(), s3 = new M(), c3 = new M();
        for (let l3 = 0, u3 = 0; l3 < i2.length; l3 += 9, u3 += 6) {
          e6.set(i2[l3 + 0], i2[l3 + 1], i2[l3 + 2]), t3.set(i2[l3 + 3], i2[l3 + 4], i2[l3 + 5]), n3.set(i2[l3 + 6], i2[l3 + 7], i2[l3 + 8]), o3.set(a2[u3 + 0], a2[u3 + 1]), s3.set(a2[u3 + 2], a2[u3 + 3]), c3.set(a2[u3 + 4], a2[u3 + 5]), r3.copy(e6).add(t3).add(n3).divideScalar(3);
          let d3 = h2(r3);
          m2(o3, u3 + 0, e6, d3), m2(s3, u3 + 2, t3, d3), m2(c3, u3 + 4, n3, d3);
        }
      }
      function m2(e6, t3, n3, r3) {
        r3 < 0 && e6.x === 1 && (a2[t3] = e6.x - 1), n3.x === 0 && n3.z === 0 && (a2[t3] = r3 / 2 / Math.PI + 0.5);
      }
      function h2(e6) {
        return Math.atan2(e6.z, -e6.x);
      }
      function g2(e6) {
        return Math.atan2(-e6.y, Math.sqrt(e6.x * e6.x + e6.z * e6.z));
      }
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.vertices, t2.indices, t2.radius, t2.detail);
    }
  }, fo = class e4 extends uo {
    constructor(e5 = 1, t2 = 0) {
      let n2 = (1 + Math.sqrt(5)) / 2, r2 = 1 / n2, i2 = [-1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 0, -r2, -n2, 0, -r2, n2, 0, r2, -n2, 0, r2, n2, -r2, -n2, 0, -r2, n2, 0, r2, -n2, 0, r2, n2, 0, -n2, 0, -r2, n2, 0, -r2, -n2, 0, r2, n2, 0, r2];
      super(i2, [3, 11, 7, 3, 7, 15, 3, 15, 13, 7, 19, 17, 7, 17, 6, 7, 6, 15, 17, 4, 8, 17, 8, 10, 17, 10, 6, 8, 0, 16, 8, 16, 2, 8, 2, 10, 0, 12, 1, 0, 1, 18, 0, 18, 16, 6, 10, 2, 6, 2, 13, 6, 13, 15, 2, 16, 18, 2, 18, 3, 2, 3, 13, 18, 1, 9, 18, 9, 11, 18, 11, 3, 4, 14, 12, 4, 12, 0, 4, 0, 8, 11, 9, 5, 11, 5, 19, 11, 19, 7, 19, 5, 14, 19, 14, 4, 19, 4, 17, 1, 12, 14, 1, 14, 5, 1, 5, 9], e5, t2), this.type = `DodecahedronGeometry`, this.parameters = { radius: e5, detail: t2 };
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.detail);
    }
  }, po = class {
    constructor() {
      this.type = `Curve`, this.arcLengthDivisions = 200, this.needsUpdate = false, this.cacheArcLengths = null;
    }
    getPoint() {
      l(`Curve: .getPoint() not implemented.`);
    }
    getPointAt(e4, t2) {
      let n2 = this.getUtoTmapping(e4);
      return this.getPoint(n2, t2);
    }
    getPoints(e4 = 5) {
      let t2 = [];
      for (let n2 = 0; n2 <= e4; n2++) t2.push(this.getPoint(n2 / e4));
      return t2;
    }
    getSpacedPoints(e4 = 5) {
      let t2 = [];
      for (let n2 = 0; n2 <= e4; n2++) t2.push(this.getPointAt(n2 / e4));
      return t2;
    }
    getLength() {
      let e4 = this.getLengths();
      return e4[e4.length - 1];
    }
    getLengths(e4 = this.arcLengthDivisions) {
      if (this.cacheArcLengths && this.cacheArcLengths.length === e4 + 1 && !this.needsUpdate) return this.cacheArcLengths;
      this.needsUpdate = false;
      let t2 = [], n2, r2 = this.getPoint(0), i2 = 0;
      t2.push(0);
      for (let a2 = 1; a2 <= e4; a2++) n2 = this.getPoint(a2 / e4), i2 += n2.distanceTo(r2), t2.push(i2), r2 = n2;
      return this.cacheArcLengths = t2, t2;
    }
    updateArcLengths() {
      this.needsUpdate = true, this.getLengths();
    }
    getUtoTmapping(e4, t2 = null) {
      let n2 = this.getLengths(), r2 = 0, i2 = n2.length, a2;
      a2 = t2 || e4 * n2[i2 - 1];
      let o2 = 0, s2 = i2 - 1, c2;
      for (; o2 <= s2; ) if (r2 = Math.floor(o2 + (s2 - o2) / 2), c2 = n2[r2] - a2, c2 < 0) o2 = r2 + 1;
      else if (c2 > 0) s2 = r2 - 1;
      else {
        s2 = r2;
        break;
      }
      if (r2 = s2, n2[r2] === a2) return r2 / (i2 - 1);
      let l2 = n2[r2], u2 = n2[r2 + 1] - l2, d2 = (a2 - l2) / u2;
      return (r2 + d2) / (i2 - 1);
    }
    getTangent(e4, t2) {
      let n2 = 1e-4, r2 = e4 - n2, i2 = e4 + n2;
      r2 < 0 && (r2 = 0), i2 > 1 && (i2 = 1);
      let a2 = this.getPoint(r2), o2 = this.getPoint(i2), s2 = t2 || (a2.isVector2 ? new M() : new N());
      return s2.copy(o2).sub(a2).normalize(), s2;
    }
    getTangentAt(e4, t2) {
      let n2 = this.getUtoTmapping(e4);
      return this.getTangent(n2, t2);
    }
    computeFrenetFrames(e4, t2 = false) {
      let n2 = new N(), r2 = [], i2 = [], a2 = [], o2 = new N(), s2 = new wr();
      for (let t3 = 0; t3 <= e4; t3++) {
        let n3 = t3 / e4;
        r2[t3] = this.getTangentAt(n3, new N());
      }
      i2[0] = new N(), a2[0] = new N();
      let c2 = Number.MAX_VALUE, l2 = Math.abs(r2[0].x), u2 = Math.abs(r2[0].y), d2 = Math.abs(r2[0].z);
      l2 <= c2 && (c2 = l2, n2.set(1, 0, 0)), u2 <= c2 && (c2 = u2, n2.set(0, 1, 0)), d2 <= c2 && n2.set(0, 0, 1), o2.crossVectors(r2[0], n2).normalize(), i2[0].crossVectors(r2[0], o2), a2[0].crossVectors(r2[0], i2[0]);
      for (let t3 = 1; t3 <= e4; t3++) {
        if (i2[t3] = i2[t3 - 1].clone(), a2[t3] = a2[t3 - 1].clone(), o2.crossVectors(r2[t3 - 1], r2[t3]), o2.length() > 2 ** -52) {
          o2.normalize();
          let e5 = Math.acos(m(r2[t3 - 1].dot(r2[t3]), -1, 1));
          i2[t3].applyMatrix4(s2.makeRotationAxis(o2, e5));
        }
        a2[t3].crossVectors(r2[t3], i2[t3]);
      }
      if (t2 === true) {
        let t3 = Math.acos(m(i2[0].dot(i2[e4]), -1, 1));
        t3 /= e4, r2[0].dot(o2.crossVectors(i2[0], i2[e4])) > 0 && (t3 = -t3);
        for (let n3 = 1; n3 <= e4; n3++) i2[n3].applyMatrix4(s2.makeRotationAxis(r2[n3], t3 * n3)), a2[n3].crossVectors(r2[n3], i2[n3]);
      }
      return { tangents: r2, normals: i2, binormals: a2 };
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e4) {
      return this.arcLengthDivisions = e4.arcLengthDivisions, this;
    }
    toJSON() {
      let e4 = { metadata: { version: 4.7, type: `Curve`, generator: `Curve.toJSON` } };
      return e4.arcLengthDivisions = this.arcLengthDivisions, e4.type = this.type, e4;
    }
    fromJSON(e4) {
      return this.arcLengthDivisions = e4.arcLengthDivisions, this;
    }
  }, mo = class extends po {
    constructor(e4 = 0, t2 = 0, n2 = 1, r2 = 1, i2 = 0, a2 = Math.PI * 2, o2 = false, s2 = 0) {
      super(), this.isEllipseCurve = true, this.type = `EllipseCurve`, this.aX = e4, this.aY = t2, this.xRadius = n2, this.yRadius = r2, this.aStartAngle = i2, this.aEndAngle = a2, this.aClockwise = o2, this.aRotation = s2;
    }
    getPoint(e4, t2 = new M()) {
      let n2 = t2, r2 = Math.PI * 2, i2 = this.aEndAngle - this.aStartAngle, a2 = Math.abs(i2) < 2 ** -52;
      for (; i2 < 0; ) i2 += r2;
      for (; i2 > r2; ) i2 -= r2;
      i2 < 2 ** -52 && (i2 = a2 ? 0 : r2), this.aClockwise === true && !a2 && (i2 === r2 ? i2 = -r2 : i2 -= r2);
      let o2 = this.aStartAngle + e4 * i2, s2 = this.aX + this.xRadius * Math.cos(o2), c2 = this.aY + this.yRadius * Math.sin(o2);
      if (this.aRotation !== 0) {
        let e5 = Math.cos(this.aRotation), t3 = Math.sin(this.aRotation), n3 = s2 - this.aX, r3 = c2 - this.aY;
        s2 = n3 * e5 - r3 * t3 + this.aX, c2 = n3 * t3 + r3 * e5 + this.aY;
      }
      return n2.set(s2, c2);
    }
    copy(e4) {
      return super.copy(e4), this.aX = e4.aX, this.aY = e4.aY, this.xRadius = e4.xRadius, this.yRadius = e4.yRadius, this.aStartAngle = e4.aStartAngle, this.aEndAngle = e4.aEndAngle, this.aClockwise = e4.aClockwise, this.aRotation = e4.aRotation, this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.aX = this.aX, e4.aY = this.aY, e4.xRadius = this.xRadius, e4.yRadius = this.yRadius, e4.aStartAngle = this.aStartAngle, e4.aEndAngle = this.aEndAngle, e4.aClockwise = this.aClockwise, e4.aRotation = this.aRotation, e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.aX = e4.aX, this.aY = e4.aY, this.xRadius = e4.xRadius, this.yRadius = e4.yRadius, this.aStartAngle = e4.aStartAngle, this.aEndAngle = e4.aEndAngle, this.aClockwise = e4.aClockwise, this.aRotation = e4.aRotation, this;
    }
  }, ho = class extends mo {
    constructor(e4, t2, n2, r2, i2, a2) {
      super(e4, t2, n2, n2, r2, i2, a2), this.isArcCurve = true, this.type = `ArcCurve`;
    }
  }, go = new N(), _o = new N(), vo = new fe(), yo = new fe(), bo = new fe(), xo = class extends po {
    constructor(e4 = [], t2 = false, n2 = `centripetal`, r2 = 0.5) {
      super(), this.isCatmullRomCurve3 = true, this.type = `CatmullRomCurve3`, this.points = e4, this.closed = t2, this.curveType = n2, this.tension = r2;
    }
    getPoint(e4, t2 = new N()) {
      let n2 = t2, r2 = this.points, i2 = r2.length, a2 = (i2 - +!this.closed) * e4, o2 = Math.floor(a2), s2 = a2 - o2;
      this.closed ? o2 += o2 > 0 ? 0 : (Math.floor(Math.abs(o2) / i2) + 1) * i2 : s2 === 0 && o2 === i2 - 1 && (o2 = i2 - 2, s2 = 1);
      let c2, l2;
      this.closed || o2 > 0 ? c2 = r2[(o2 - 1) % i2] : (_o.subVectors(r2[0], r2[1]).add(r2[0]), c2 = _o);
      let u2 = r2[o2 % i2], d2 = r2[(o2 + 1) % i2];
      if (this.closed || o2 + 2 < i2 ? l2 = r2[(o2 + 2) % i2] : (go.subVectors(r2[i2 - 1], r2[i2 - 2]).add(r2[i2 - 1]), l2 = go), this.curveType === `centripetal` || this.curveType === `chordal`) {
        let e5 = this.curveType === `chordal` ? 0.5 : 0.25, t3 = c2.distanceToSquared(u2) ** +e5, n3 = u2.distanceToSquared(d2) ** +e5, r3 = d2.distanceToSquared(l2) ** +e5;
        n3 < 1e-4 && (n3 = 1), t3 < 1e-4 && (t3 = n3), r3 < 1e-4 && (r3 = n3), vo.initNonuniformCatmullRom(c2.x, u2.x, d2.x, l2.x, t3, n3, r3), yo.initNonuniformCatmullRom(c2.y, u2.y, d2.y, l2.y, t3, n3, r3), bo.initNonuniformCatmullRom(c2.z, u2.z, d2.z, l2.z, t3, n3, r3);
      } else this.curveType === `catmullrom` && (vo.initCatmullRom(c2.x, u2.x, d2.x, l2.x, this.tension), yo.initCatmullRom(c2.y, u2.y, d2.y, l2.y, this.tension), bo.initCatmullRom(c2.z, u2.z, d2.z, l2.z, this.tension));
      return n2.set(vo.calc(s2), yo.calc(s2), bo.calc(s2)), n2;
    }
    copy(e4) {
      super.copy(e4), this.points = [];
      for (let t2 = 0, n2 = e4.points.length; t2 < n2; t2++) {
        let n3 = e4.points[t2];
        this.points.push(n3.clone());
      }
      return this.closed = e4.closed, this.curveType = e4.curveType, this.tension = e4.tension, this;
    }
    toJSON() {
      let e4 = super.toJSON();
      e4.points = [];
      for (let t2 = 0, n2 = this.points.length; t2 < n2; t2++) {
        let n3 = this.points[t2];
        e4.points.push(n3.toArray());
      }
      return e4.closed = this.closed, e4.curveType = this.curveType, e4.tension = this.tension, e4;
    }
    fromJSON(e4) {
      super.fromJSON(e4), this.points = [];
      for (let t2 = 0, n2 = e4.points.length; t2 < n2; t2++) {
        let n3 = e4.points[t2];
        this.points.push(new N().fromArray(n3));
      }
      return this.closed = e4.closed, this.curveType = e4.curveType, this.tension = e4.tension, this;
    }
  }, So = class extends po {
    constructor(e4 = new M(), t2 = new M(), n2 = new M(), r2 = new M()) {
      super(), this.isCubicBezierCurve = true, this.type = `CubicBezierCurve`, this.v0 = e4, this.v1 = t2, this.v2 = n2, this.v3 = r2;
    }
    getPoint(e4, t2 = new M()) {
      let n2 = t2, r2 = this.v0, i2 = this.v1, a2 = this.v2, o2 = this.v3;
      return n2.set(Se(e4, r2.x, i2.x, a2.x, o2.x), Se(e4, r2.y, i2.y, a2.y, o2.y)), n2;
    }
    copy(e4) {
      return super.copy(e4), this.v0.copy(e4.v0), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this.v3.copy(e4.v3), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v0 = this.v0.toArray(), e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4.v3 = this.v3.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v0.fromArray(e4.v0), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this.v3.fromArray(e4.v3), this;
    }
  }, Co = class extends po {
    constructor(e4 = new N(), t2 = new N(), n2 = new N(), r2 = new N()) {
      super(), this.isCubicBezierCurve3 = true, this.type = `CubicBezierCurve3`, this.v0 = e4, this.v1 = t2, this.v2 = n2, this.v3 = r2;
    }
    getPoint(e4, t2 = new N()) {
      let n2 = t2, r2 = this.v0, i2 = this.v1, a2 = this.v2, o2 = this.v3;
      return n2.set(Se(e4, r2.x, i2.x, a2.x, o2.x), Se(e4, r2.y, i2.y, a2.y, o2.y), Se(e4, r2.z, i2.z, a2.z, o2.z)), n2;
    }
    copy(e4) {
      return super.copy(e4), this.v0.copy(e4.v0), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this.v3.copy(e4.v3), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v0 = this.v0.toArray(), e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4.v3 = this.v3.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v0.fromArray(e4.v0), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this.v3.fromArray(e4.v3), this;
    }
  }, wo = class extends po {
    constructor(e4 = new M(), t2 = new M()) {
      super(), this.isLineCurve = true, this.type = `LineCurve`, this.v1 = e4, this.v2 = t2;
    }
    getPoint(e4, t2 = new M()) {
      let n2 = t2;
      return e4 === 1 ? n2.copy(this.v2) : (n2.copy(this.v2).sub(this.v1), n2.multiplyScalar(e4).add(this.v1)), n2;
    }
    getPointAt(e4, t2) {
      return this.getPoint(e4, t2);
    }
    getTangent(e4, t2 = new M()) {
      return t2.subVectors(this.v2, this.v1).normalize();
    }
    getTangentAt(e4, t2) {
      return this.getTangent(e4, t2);
    }
    copy(e4) {
      return super.copy(e4), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this;
    }
  }, To = class extends po {
    constructor(e4 = new N(), t2 = new N()) {
      super(), this.isLineCurve3 = true, this.type = `LineCurve3`, this.v1 = e4, this.v2 = t2;
    }
    getPoint(e4, t2 = new N()) {
      let n2 = t2;
      return e4 === 1 ? n2.copy(this.v2) : (n2.copy(this.v2).sub(this.v1), n2.multiplyScalar(e4).add(this.v1)), n2;
    }
    getPointAt(e4, t2) {
      return this.getPoint(e4, t2);
    }
    getTangent(e4, t2 = new N()) {
      return t2.subVectors(this.v2, this.v1).normalize();
    }
    getTangentAt(e4, t2) {
      return this.getTangent(e4, t2);
    }
    copy(e4) {
      return super.copy(e4), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this;
    }
  }, Eo = class extends po {
    constructor(e4 = new M(), t2 = new M(), n2 = new M()) {
      super(), this.isQuadraticBezierCurve = true, this.type = `QuadraticBezierCurve`, this.v0 = e4, this.v1 = t2, this.v2 = n2;
    }
    getPoint(e4, t2 = new M()) {
      let n2 = t2, r2 = this.v0, i2 = this.v1, a2 = this.v2;
      return n2.set(_e(e4, r2.x, i2.x, a2.x), _e(e4, r2.y, i2.y, a2.y)), n2;
    }
    copy(e4) {
      return super.copy(e4), this.v0.copy(e4.v0), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v0 = this.v0.toArray(), e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v0.fromArray(e4.v0), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this;
    }
  }, Do = class extends po {
    constructor(e4 = new N(), t2 = new N(), n2 = new N()) {
      super(), this.isQuadraticBezierCurve3 = true, this.type = `QuadraticBezierCurve3`, this.v0 = e4, this.v1 = t2, this.v2 = n2;
    }
    getPoint(e4, t2 = new N()) {
      let n2 = t2, r2 = this.v0, i2 = this.v1, a2 = this.v2;
      return n2.set(_e(e4, r2.x, i2.x, a2.x), _e(e4, r2.y, i2.y, a2.y), _e(e4, r2.z, i2.z, a2.z)), n2;
    }
    copy(e4) {
      return super.copy(e4), this.v0.copy(e4.v0), this.v1.copy(e4.v1), this.v2.copy(e4.v2), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.v0 = this.v0.toArray(), e4.v1 = this.v1.toArray(), e4.v2 = this.v2.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.v0.fromArray(e4.v0), this.v1.fromArray(e4.v1), this.v2.fromArray(e4.v2), this;
    }
  }, Oo = class extends po {
    constructor(e4 = []) {
      super(), this.isSplineCurve = true, this.type = `SplineCurve`, this.points = e4;
    }
    getPoint(e4, t2 = new M()) {
      let n2 = t2, r2 = this.points, i2 = (r2.length - 1) * e4, a2 = Math.floor(i2), o2 = i2 - a2, s2 = r2[a2 === 0 ? a2 : a2 - 1], c2 = r2[a2], l2 = r2[a2 > r2.length - 2 ? r2.length - 1 : a2 + 1], u2 = r2[a2 > r2.length - 3 ? r2.length - 1 : a2 + 2];
      return n2.set(pe(o2, s2.x, c2.x, l2.x, u2.x), pe(o2, s2.y, c2.y, l2.y, u2.y)), n2;
    }
    copy(e4) {
      super.copy(e4), this.points = [];
      for (let t2 = 0, n2 = e4.points.length; t2 < n2; t2++) {
        let n3 = e4.points[t2];
        this.points.push(n3.clone());
      }
      return this;
    }
    toJSON() {
      let e4 = super.toJSON();
      e4.points = [];
      for (let t2 = 0, n2 = this.points.length; t2 < n2; t2++) {
        let n3 = this.points[t2];
        e4.points.push(n3.toArray());
      }
      return e4;
    }
    fromJSON(e4) {
      super.fromJSON(e4), this.points = [];
      for (let t2 = 0, n2 = e4.points.length; t2 < n2; t2++) {
        let n3 = e4.points[t2];
        this.points.push(new M().fromArray(n3));
      }
      return this;
    }
  }, ko = Object.freeze({ __proto__: null, ArcCurve: ho, CatmullRomCurve3: xo, CubicBezierCurve: So, CubicBezierCurve3: Co, EllipseCurve: mo, LineCurve: wo, LineCurve3: To, QuadraticBezierCurve: Eo, QuadraticBezierCurve3: Do, SplineCurve: Oo }), Ao = class extends po {
    constructor() {
      super(), this.type = `CurvePath`, this.curves = [], this.autoClose = false;
    }
    add(e4) {
      this.curves.push(e4);
    }
    closePath() {
      let e4 = this.curves[0].getPoint(0), t2 = this.curves[this.curves.length - 1].getPoint(1);
      if (!e4.equals(t2)) {
        let n2 = e4.isVector2 === true ? `LineCurve` : `LineCurve3`;
        this.curves.push(new ko[n2](t2, e4));
      }
      return this;
    }
    getPoint(e4, t2) {
      let n2 = e4 * this.getLength(), r2 = this.getCurveLengths(), i2 = 0;
      for (; i2 < r2.length; ) {
        if (r2[i2] >= n2) {
          let e5 = r2[i2] - n2, a2 = this.curves[i2], o2 = a2.getLength(), s2 = o2 === 0 ? 0 : 1 - e5 / o2;
          return a2.getPointAt(s2, t2);
        }
        i2++;
      }
      return null;
    }
    getLength() {
      let e4 = this.getCurveLengths();
      return e4[e4.length - 1];
    }
    updateArcLengths() {
      this.needsUpdate = true, this.cacheLengths = null, this.getCurveLengths();
    }
    getCurveLengths() {
      if (this.cacheLengths && this.cacheLengths.length === this.curves.length) return this.cacheLengths;
      let e4 = [], t2 = 0;
      for (let n2 = 0, r2 = this.curves.length; n2 < r2; n2++) t2 += this.curves[n2].getLength(), e4.push(t2);
      return this.cacheLengths = e4, e4;
    }
    getSpacedPoints(e4 = 40) {
      let t2 = [];
      for (let n2 = 0; n2 <= e4; n2++) t2.push(this.getPoint(n2 / e4));
      return this.autoClose && t2.push(t2[0]), t2;
    }
    getPoints(e4 = 12) {
      let t2 = [], n2;
      for (let r2 = 0, i2 = this.curves; r2 < i2.length; r2++) {
        let a2 = i2[r2], o2 = a2.isEllipseCurve ? e4 * 2 : a2.isLineCurve || a2.isLineCurve3 ? 1 : a2.isSplineCurve ? e4 * a2.points.length : e4, s2 = a2.getPoints(o2);
        for (let e5 = 0; e5 < s2.length; e5++) {
          let r3 = s2[e5];
          n2 && n2.equals(r3) || (t2.push(r3), n2 = r3);
        }
      }
      return this.autoClose && t2.length > 1 && !t2[t2.length - 1].equals(t2[0]) && t2.push(t2[0]), t2;
    }
    copy(e4) {
      super.copy(e4), this.curves = [];
      for (let t2 = 0, n2 = e4.curves.length; t2 < n2; t2++) {
        let n3 = e4.curves[t2];
        this.curves.push(n3.clone());
      }
      return this.autoClose = e4.autoClose, this;
    }
    toJSON() {
      let e4 = super.toJSON();
      e4.autoClose = this.autoClose, e4.curves = [];
      for (let t2 = 0, n2 = this.curves.length; t2 < n2; t2++) {
        let n3 = this.curves[t2];
        e4.curves.push(n3.toJSON());
      }
      return e4;
    }
    fromJSON(e4) {
      super.fromJSON(e4), this.autoClose = e4.autoClose, this.curves = [];
      for (let t2 = 0, n2 = e4.curves.length; t2 < n2; t2++) {
        let n3 = e4.curves[t2];
        this.curves.push(new ko[n3.type]().fromJSON(n3));
      }
      return this;
    }
  }, jo = class extends Ao {
    constructor(e4) {
      super(), this.type = `Path`, this.currentPoint = new M(), e4 && this.setFromPoints(e4);
    }
    setFromPoints(e4) {
      this.moveTo(e4[0].x, e4[0].y);
      for (let t2 = 1, n2 = e4.length; t2 < n2; t2++) this.lineTo(e4[t2].x, e4[t2].y);
      return this;
    }
    moveTo(e4, t2) {
      return this.currentPoint.set(e4, t2), this;
    }
    lineTo(e4, t2) {
      let n2 = new wo(this.currentPoint.clone(), new M(e4, t2));
      return this.curves.push(n2), this.currentPoint.set(e4, t2), this;
    }
    quadraticCurveTo(e4, t2, n2, r2) {
      let i2 = new Eo(this.currentPoint.clone(), new M(e4, t2), new M(n2, r2));
      return this.curves.push(i2), this.currentPoint.set(n2, r2), this;
    }
    bezierCurveTo(e4, t2, n2, r2, i2, a2) {
      let o2 = new So(this.currentPoint.clone(), new M(e4, t2), new M(n2, r2), new M(i2, a2));
      return this.curves.push(o2), this.currentPoint.set(i2, a2), this;
    }
    splineThru(e4) {
      let t2 = new Oo([this.currentPoint.clone()].concat(e4));
      return this.curves.push(t2), this.currentPoint.copy(e4[e4.length - 1]), this;
    }
    arc(e4, t2, n2, r2, i2, a2) {
      let o2 = this.currentPoint.x, s2 = this.currentPoint.y;
      return this.absarc(e4 + o2, t2 + s2, n2, r2, i2, a2), this;
    }
    absarc(e4, t2, n2, r2, i2, a2) {
      return this.absellipse(e4, t2, n2, n2, r2, i2, a2), this;
    }
    ellipse(e4, t2, n2, r2, i2, a2, o2, s2) {
      let c2 = this.currentPoint.x, l2 = this.currentPoint.y;
      return this.absellipse(e4 + c2, t2 + l2, n2, r2, i2, a2, o2, s2), this;
    }
    absellipse(e4, t2, n2, r2, i2, a2, o2, s2) {
      let c2 = new mo(e4, t2, n2, r2, i2, a2, o2, s2);
      if (this.curves.length > 0) {
        let e5 = c2.getPoint(0);
        e5.equals(this.currentPoint) || this.lineTo(e5.x, e5.y);
      }
      this.curves.push(c2);
      let l2 = c2.getPoint(1);
      return this.currentPoint.copy(l2), this;
    }
    copy(e4) {
      return super.copy(e4), this.currentPoint.copy(e4.currentPoint), this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.currentPoint = this.currentPoint.toArray(), e4;
    }
    fromJSON(e4) {
      return super.fromJSON(e4), this.currentPoint.fromArray(e4.currentPoint), this;
    }
  }, Mo = class extends jo {
    constructor(e4) {
      super(e4), this.uuid = p(), this.type = `Shape`, this.holes = [];
    }
    getPointsHoles(e4) {
      let t2 = [];
      for (let n2 = 0, r2 = this.holes.length; n2 < r2; n2++) t2[n2] = this.holes[n2].getPoints(e4);
      return t2;
    }
    extractPoints(e4) {
      return { shape: this.getPoints(e4), holes: this.getPointsHoles(e4) };
    }
    copy(e4) {
      super.copy(e4), this.holes = [];
      for (let t2 = 0, n2 = e4.holes.length; t2 < n2; t2++) {
        let n3 = e4.holes[t2];
        this.holes.push(n3.clone());
      }
      return this;
    }
    toJSON() {
      let e4 = super.toJSON();
      e4.uuid = this.uuid, e4.holes = [];
      for (let t2 = 0, n2 = this.holes.length; t2 < n2; t2++) {
        let n3 = this.holes[t2];
        e4.holes.push(n3.toJSON());
      }
      return e4;
    }
    fromJSON(e4) {
      super.fromJSON(e4), this.uuid = e4.uuid, this.holes = [];
      for (let t2 = 0, n2 = e4.holes.length; t2 < n2; t2++) {
        let n3 = e4.holes[t2];
        this.holes.push(new jo().fromJSON(n3));
      }
      return this;
    }
  }, No = class {
    static triangulate(e4, t2, n2 = 2) {
      return Ce(e4, t2, n2);
    }
  }, Po = class e4 {
    static area(e5) {
      let t2 = e5.length, n2 = 0;
      for (let r2 = t2 - 1, i2 = 0; i2 < t2; r2 = i2++) n2 += e5[r2].x * e5[i2].y - e5[i2].x * e5[r2].y;
      return n2 * 0.5;
    }
    static isClockWise(t2) {
      return e4.area(t2) < 0;
    }
    static triangulateShape(e5, t2) {
      let n2 = [], r2 = [], i2 = [];
      tt(e5), nt(n2, e5);
      let a2 = e5.length;
      t2.forEach(tt);
      for (let e6 = 0; e6 < t2.length; e6++) r2.push(a2), a2 += t2[e6].length, nt(n2, t2[e6]);
      let o2 = No.triangulate(n2, r2);
      for (let e6 = 0; e6 < o2.length; e6 += 3) i2.push(o2.slice(e6, e6 + 3));
      return i2;
    }
  }, Fo = class e4 extends Qi {
    constructor(e5 = new Mo([new M(0.5, 0.5), new M(-0.5, 0.5), new M(-0.5, -0.5), new M(0.5, -0.5)]), t2 = {}) {
      super(), this.type = `ExtrudeGeometry`, this.parameters = { shapes: e5, options: t2 }, e5 = Array.isArray(e5) ? e5 : [e5];
      let n2 = this, r2 = [], i2 = [];
      for (let t3 = 0, n3 = e5.length; t3 < n3; t3++) {
        let n4 = e5[t3];
        a2(n4);
      }
      this.setAttribute(`position`, new Bi(r2, 3)), this.setAttribute(`uv`, new Bi(i2, 2)), this.computeVertexNormals();
      function a2(e6) {
        let a3 = [], o2 = t2.curveSegments === void 0 ? 12 : t2.curveSegments, s2 = t2.steps === void 0 ? 1 : t2.steps, c2 = t2.depth === void 0 ? 1 : t2.depth, l2 = t2.bevelEnabled === void 0 ? true : t2.bevelEnabled, d2 = t2.bevelThickness === void 0 ? 0.2 : t2.bevelThickness, f2 = t2.bevelSize === void 0 ? d2 - 0.1 : t2.bevelSize, p2 = t2.bevelOffset === void 0 ? 0 : t2.bevelOffset, m2 = t2.bevelSegments === void 0 ? 3 : t2.bevelSegments, h2 = t2.extrudePath, g2 = t2.UVGenerator === void 0 ? Io : t2.UVGenerator, _2, v2 = false, y2, b2, x2, S2;
        if (h2) {
          _2 = h2.getSpacedPoints(s2), v2 = true, l2 = false;
          let e7 = h2.isCatmullRomCurve3 ? h2.closed : false;
          y2 = h2.computeFrenetFrames(s2, e7), b2 = new N(), x2 = new N(), S2 = new N();
        }
        l2 || (m2 = 0, d2 = 0, f2 = 0, p2 = 0);
        let C2 = e6.extractPoints(o2), w2 = C2.shape, T2 = C2.holes;
        if (!Po.isClockWise(w2)) {
          w2 = w2.reverse();
          for (let e7 = 0, t3 = T2.length; e7 < t3; e7++) {
            let t4 = T2[e7];
            Po.isClockWise(t4) && (T2[e7] = t4.reverse());
          }
        }
        function E2(e7) {
          let t3 = 1e-10;
          t3 * t3;
          let n3 = e7[0];
          for (let t4 = 1; t4 <= e7.length; t4++) {
            let r3 = t4 % e7.length, i3 = e7[r3], a4 = i3.x - n3.x, o3 = i3.y - n3.y, s3 = a4 * a4 + o3 * o3, c3 = Math.max(Math.abs(i3.x), Math.abs(i3.y), Math.abs(n3.x), Math.abs(n3.y));
            if (s3 <= 10000000000000001e-36 * c3 * c3) {
              e7.splice(r3, 1), t4--;
              continue;
            }
            n3 = i3;
          }
        }
        E2(w2), T2.forEach(E2);
        let D2 = T2.length, O2 = w2;
        for (let e7 = 0; e7 < D2; e7++) {
          let t3 = T2[e7];
          w2 = w2.concat(t3);
        }
        function k2(e7, t3, n3) {
          return t3 || u(`ExtrudeGeometry: vec does not exist`), e7.clone().addScaledVector(t3, n3);
        }
        let A2 = w2.length;
        function ee2(e7, t3, n3) {
          let r3, i3, a4, o3 = e7.x - t3.x, s3 = e7.y - t3.y, c3 = n3.x - e7.x, l3 = n3.y - e7.y, u2 = o3 * o3 + s3 * s3, d3 = o3 * l3 - s3 * c3;
          if (Math.abs(d3) > 2 ** -52) {
            let d4 = Math.sqrt(u2), f3 = Math.sqrt(c3 * c3 + l3 * l3), p3 = t3.x - s3 / d4, m3 = t3.y + o3 / d4, h3 = n3.x - l3 / f3, g3 = n3.y + c3 / f3, _3 = ((h3 - p3) * l3 - (g3 - m3) * c3) / (o3 * l3 - s3 * c3);
            r3 = p3 + o3 * _3 - e7.x, i3 = m3 + s3 * _3 - e7.y;
            let v3 = r3 * r3 + i3 * i3;
            if (v3 <= 2) return new M(r3, i3);
            a4 = Math.sqrt(v3 / 2);
          } else {
            let e8 = false;
            o3 > 2 ** -52 ? c3 > 2 ** -52 && (e8 = true) : o3 < -(2 ** -52) ? c3 < -(2 ** -52) && (e8 = true) : Math.sign(s3) === Math.sign(l3) && (e8 = true), e8 ? (r3 = -s3, i3 = o3, a4 = Math.sqrt(u2)) : (r3 = o3, i3 = s3, a4 = Math.sqrt(u2 / 2));
          }
          return new M(r3 / a4, i3 / a4);
        }
        let te2 = [];
        for (let e7 = 0, t3 = O2.length, n3 = t3 - 1, r3 = e7 + 1; e7 < t3; e7++, n3++, r3++) n3 === t3 && (n3 = 0), r3 === t3 && (r3 = 0), te2[e7] = ee2(O2[e7], O2[n3], O2[r3]);
        let ne2 = [], re2, ie2 = te2.concat();
        for (let e7 = 0, t3 = D2; e7 < t3; e7++) {
          let t4 = T2[e7];
          re2 = [];
          for (let e8 = 0, n3 = t4.length, r3 = n3 - 1, i3 = e8 + 1; e8 < n3; e8++, r3++, i3++) r3 === n3 && (r3 = 0), i3 === n3 && (i3 = 0), re2[e8] = ee2(t4[e8], t4[r3], t4[i3]);
          ne2.push(re2), ie2 = ie2.concat(re2);
        }
        let ae2;
        if (m2 === 0) ae2 = Po.triangulateShape(O2, T2);
        else {
          let e7 = [], t3 = [];
          for (let n3 = 0; n3 < m2; n3++) {
            let r3 = n3 / m2, i3 = d2 * Math.cos(r3 * Math.PI / 2), a4 = f2 * Math.sin(r3 * Math.PI / 2) + p2;
            for (let t4 = 0, n4 = O2.length; t4 < n4; t4++) {
              let n5 = k2(O2[t4], te2[t4], a4);
              de2(n5.x, n5.y, -i3), r3 === 0 && e7.push(n5);
            }
            for (let e8 = 0, n4 = D2; e8 < n4; e8++) {
              let n5 = T2[e8];
              re2 = ne2[e8];
              let o3 = [];
              for (let e9 = 0, t4 = n5.length; e9 < t4; e9++) {
                let t5 = k2(n5[e9], re2[e9], a4);
                de2(t5.x, t5.y, -i3), r3 === 0 && o3.push(t5);
              }
              r3 === 0 && t3.push(o3);
            }
          }
          ae2 = Po.triangulateShape(e7, t3);
        }
        let oe2 = ae2.length, se2 = f2 + p2;
        for (let e7 = 0; e7 < A2; e7++) {
          let t3 = l2 ? k2(w2[e7], ie2[e7], se2) : w2[e7];
          v2 ? (x2.copy(y2.normals[0]).multiplyScalar(t3.x), b2.copy(y2.binormals[0]).multiplyScalar(t3.y), S2.copy(_2[0]).add(x2).add(b2), de2(S2.x, S2.y, S2.z)) : de2(t3.x, t3.y, 0);
        }
        for (let e7 = 1; e7 <= s2; e7++) for (let t3 = 0; t3 < A2; t3++) {
          let n3 = l2 ? k2(w2[t3], ie2[t3], se2) : w2[t3];
          v2 ? (x2.copy(y2.normals[e7]).multiplyScalar(n3.x), b2.copy(y2.binormals[e7]).multiplyScalar(n3.y), S2.copy(_2[e7]).add(x2).add(b2), de2(S2.x, S2.y, S2.z)) : de2(n3.x, n3.y, c2 / s2 * e7);
        }
        for (let e7 = m2 - 1; e7 >= 0; e7--) {
          let t3 = e7 / m2, n3 = d2 * Math.cos(t3 * Math.PI / 2), r3 = f2 * Math.sin(t3 * Math.PI / 2) + p2;
          for (let e8 = 0, t4 = O2.length; e8 < t4; e8++) {
            let t5 = k2(O2[e8], te2[e8], r3);
            de2(t5.x, t5.y, c2 + n3);
          }
          for (let e8 = 0, t4 = T2.length; e8 < t4; e8++) {
            let t5 = T2[e8];
            re2 = ne2[e8];
            for (let e9 = 0, i3 = t5.length; e9 < i3; e9++) {
              let i4 = k2(t5[e9], re2[e9], r3);
              v2 ? de2(i4.x, i4.y + _2[s2 - 1].y, _2[s2 - 1].x + n3) : de2(i4.x, i4.y, c2 + n3);
            }
          }
        }
        ce2(), le2();
        function ce2() {
          let e7 = r2.length / 3;
          if (l2) {
            let e8 = 0, t3 = A2 * e8;
            for (let e9 = 0; e9 < oe2; e9++) {
              let n3 = ae2[e9];
              fe2(n3[2] + t3, n3[1] + t3, n3[0] + t3);
            }
            e8 = s2 + m2 * 2, t3 = A2 * e8;
            for (let e9 = 0; e9 < oe2; e9++) {
              let n3 = ae2[e9];
              fe2(n3[0] + t3, n3[1] + t3, n3[2] + t3);
            }
          } else {
            for (let e8 = 0; e8 < oe2; e8++) {
              let t3 = ae2[e8];
              fe2(t3[2], t3[1], t3[0]);
            }
            for (let e8 = 0; e8 < oe2; e8++) {
              let t3 = ae2[e8];
              fe2(t3[0] + A2 * s2, t3[1] + A2 * s2, t3[2] + A2 * s2);
            }
          }
          n2.addGroup(e7, r2.length / 3 - e7, 0);
        }
        function le2() {
          let e7 = r2.length / 3, t3 = 0;
          ue2(O2, t3), t3 += O2.length;
          for (let e8 = 0, n3 = T2.length; e8 < n3; e8++) {
            let n4 = T2[e8];
            ue2(n4, t3), t3 += n4.length;
          }
          n2.addGroup(e7, r2.length / 3 - e7, 1);
        }
        function ue2(e7, t3) {
          let n3 = e7.length;
          for (; --n3 >= 0; ) {
            let r3 = n3, i3 = n3 - 1;
            i3 < 0 && (i3 = e7.length - 1);
            for (let e8 = 0, n4 = s2 + m2 * 2; e8 < n4; e8++) {
              let n5 = A2 * e8, a4 = A2 * (e8 + 1);
              pe2(t3 + r3 + n5, t3 + i3 + n5, t3 + i3 + a4, t3 + r3 + a4);
            }
          }
        }
        function de2(e7, t3, n3) {
          a3.push(e7), a3.push(t3), a3.push(n3);
        }
        function fe2(e7, t3, i3) {
          me2(e7), me2(t3), me2(i3);
          let a4 = r2.length / 3, o3 = g2.generateTopUV(n2, r2, a4 - 3, a4 - 2, a4 - 1);
          he2(o3[0]), he2(o3[1]), he2(o3[2]);
        }
        function pe2(e7, t3, i3, a4) {
          me2(e7), me2(t3), me2(a4), me2(t3), me2(i3), me2(a4);
          let o3 = r2.length / 3, s3 = g2.generateSideWallUV(n2, r2, o3 - 6, o3 - 3, o3 - 2, o3 - 1);
          he2(s3[0]), he2(s3[1]), he2(s3[3]), he2(s3[1]), he2(s3[2]), he2(s3[3]);
        }
        function me2(e7) {
          r2.push(a3[e7 * 3 + 0]), r2.push(a3[e7 * 3 + 1]), r2.push(a3[e7 * 3 + 2]);
        }
        function he2(e7) {
          i2.push(e7.x), i2.push(e7.y);
        }
      }
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    toJSON() {
      let e5 = super.toJSON(), t2 = this.parameters.shapes, n2 = this.parameters.options;
      return rt(t2, n2, e5);
    }
    static fromJSON(t2, n2) {
      let r2 = [];
      for (let e5 = 0, i3 = t2.shapes.length; e5 < i3; e5++) {
        let i4 = n2[t2.shapes[e5]];
        r2.push(i4);
      }
      let i2 = t2.options.extrudePath;
      return i2 !== void 0 && (t2.options.extrudePath = new ko[i2.type]().fromJSON(i2)), new e4(r2, t2.options);
    }
  }, Io = { generateTopUV: function(e4, t2, n2, r2, i2) {
    let a2 = t2[n2 * 3], o2 = t2[n2 * 3 + 1], s2 = t2[r2 * 3], c2 = t2[r2 * 3 + 1], l2 = t2[i2 * 3], u2 = t2[i2 * 3 + 1];
    return [new M(a2, o2), new M(s2, c2), new M(l2, u2)];
  }, generateSideWallUV: function(e4, t2, n2, r2, i2, a2) {
    let o2 = t2[n2 * 3], s2 = t2[n2 * 3 + 1], c2 = t2[n2 * 3 + 2], l2 = t2[r2 * 3], u2 = t2[r2 * 3 + 1], d2 = t2[r2 * 3 + 2], f2 = t2[i2 * 3], p2 = t2[i2 * 3 + 1], m2 = t2[i2 * 3 + 2], h2 = t2[a2 * 3], g2 = t2[a2 * 3 + 1], _2 = t2[a2 * 3 + 2];
    return Math.abs(s2 - u2) < Math.abs(o2 - l2) ? [new M(o2, 1 - c2), new M(l2, 1 - d2), new M(f2, 1 - m2), new M(h2, 1 - _2)] : [new M(s2, 1 - c2), new M(u2, 1 - d2), new M(p2, 1 - m2), new M(g2, 1 - _2)];
  } }, Lo = class e4 extends uo {
    constructor(e5 = 1, t2 = 0) {
      let n2 = (1 + Math.sqrt(5)) / 2, r2 = [-1, n2, 0, 1, n2, 0, -1, -n2, 0, 1, -n2, 0, 0, -1, n2, 0, 1, n2, 0, -1, -n2, 0, 1, -n2, n2, 0, -1, n2, 0, 1, -n2, 0, -1, -n2, 0, 1];
      super(r2, [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1], e5, t2), this.type = `IcosahedronGeometry`, this.parameters = { radius: e5, detail: t2 };
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.detail);
    }
  }, Ro = class e4 extends Qi {
    constructor(e5 = [new M(0, -0.5), new M(0.5, 0), new M(0, 0.5)], t2 = 12, n2 = 0, r2 = Math.PI * 2) {
      super(), this.type = `LatheGeometry`, this.parameters = { points: e5, segments: t2, phiStart: n2, phiLength: r2 }, t2 = Math.floor(t2), r2 = m(r2, 0, Math.PI * 2);
      let i2 = [], a2 = [], o2 = [], s2 = [], c2 = [], l2 = 1 / t2, u2 = new N(), d2 = new M(), f2 = new N(), p2 = new N(), h2 = new N(), g2 = 0, _2 = 0;
      for (let t3 = 0; t3 <= e5.length - 1; t3++) switch (t3) {
        case 0:
          g2 = e5[t3 + 1].x - e5[t3].x, _2 = e5[t3 + 1].y - e5[t3].y, f2.x = _2 * 1, f2.y = -g2, f2.z = _2 * 0, h2.copy(f2), f2.normalize(), s2.push(f2.x, f2.y, f2.z);
          break;
        case e5.length - 1:
          s2.push(h2.x, h2.y, h2.z);
          break;
        default:
          g2 = e5[t3 + 1].x - e5[t3].x, _2 = e5[t3 + 1].y - e5[t3].y, f2.x = _2 * 1, f2.y = -g2, f2.z = _2 * 0, p2.copy(f2), f2.x += h2.x, f2.y += h2.y, f2.z += h2.z, f2.normalize(), s2.push(f2.x, f2.y, f2.z), h2.copy(p2);
      }
      for (let i3 = 0; i3 <= t2; i3++) {
        let f3 = n2 + i3 * l2 * r2, p3 = Math.sin(f3), m2 = Math.cos(f3);
        for (let n3 = 0; n3 <= e5.length - 1; n3++) {
          u2.x = e5[n3].x * p3, u2.y = e5[n3].y, u2.z = e5[n3].x * m2, a2.push(u2.x, u2.y, u2.z), d2.x = i3 / t2, d2.y = n3 / (e5.length - 1), o2.push(d2.x, d2.y);
          let r3 = s2[3 * n3 + 0] * p3, l3 = s2[3 * n3 + 1], f4 = s2[3 * n3 + 0] * m2;
          c2.push(r3, l3, f4);
        }
      }
      for (let n3 = 0; n3 < t2; n3++) for (let t3 = 0; t3 < e5.length - 1; t3++) {
        let r3 = t3 + n3 * e5.length, a3 = r3, o3 = r3 + e5.length, s3 = r3 + e5.length + 1, c3 = r3 + 1;
        i2.push(a3, o3, c3), i2.push(s3, c3, o3);
      }
      this.setIndex(i2), this.setAttribute(`position`, new Bi(a2, 3)), this.setAttribute(`uv`, new Bi(o2, 2)), this.setAttribute(`normal`, new Bi(c2, 3));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.points, t2.segments, t2.phiStart, t2.phiLength);
    }
  }, zo = class e4 extends uo {
    constructor(e5 = 1, t2 = 0) {
      super([1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1], [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2], e5, t2), this.type = `OctahedronGeometry`, this.parameters = { radius: e5, detail: t2 };
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.detail);
    }
  }, Bo = class e4 extends Qi {
    constructor(e5 = 1, t2 = 1, n2 = 1, r2 = 1) {
      super(), this.type = `PlaneGeometry`, this.parameters = { width: e5, height: t2, widthSegments: n2, heightSegments: r2 };
      let i2 = e5 / 2, a2 = t2 / 2, o2 = Math.floor(n2), s2 = Math.floor(r2), c2 = o2 + 1, l2 = s2 + 1, u2 = e5 / o2, d2 = t2 / s2, f2 = [], p2 = [], m2 = [], h2 = [];
      for (let e6 = 0; e6 < l2; e6++) {
        let t3 = e6 * d2 - a2;
        for (let n3 = 0; n3 < c2; n3++) {
          let r3 = n3 * u2 - i2;
          p2.push(r3, -t3, 0), m2.push(0, 0, 1), h2.push(n3 / o2), h2.push(1 - e6 / s2);
        }
      }
      for (let e6 = 0; e6 < s2; e6++) for (let t3 = 0; t3 < o2; t3++) {
        let n3 = t3 + c2 * e6, r3 = t3 + c2 * (e6 + 1), i3 = t3 + 1 + c2 * (e6 + 1), a3 = t3 + 1 + c2 * e6;
        f2.push(n3, r3, a3), f2.push(r3, i3, a3);
      }
      this.setIndex(f2), this.setAttribute(`position`, new Bi(p2, 3)), this.setAttribute(`normal`, new Bi(m2, 3)), this.setAttribute(`uv`, new Bi(h2, 2));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.width, t2.height, t2.widthSegments, t2.heightSegments);
    }
  }, Vo = class e4 extends Qi {
    constructor(e5 = new Mo([new M(0, 0.5), new M(-0.5, -0.5), new M(0.5, -0.5)]), t2 = 12) {
      super(), this.type = `ShapeGeometry`, this.parameters = { shapes: e5, curveSegments: t2 };
      let n2 = [], r2 = [], i2 = [], a2 = [], o2 = 0, s2 = 0;
      if (Array.isArray(e5) === false) c2(e5);
      else for (let t3 = 0; t3 < e5.length; t3++) c2(e5[t3]), this.addGroup(o2, s2, t3), o2 += s2, s2 = 0;
      this.setIndex(n2), this.setAttribute(`position`, new Bi(r2, 3)), this.setAttribute(`normal`, new Bi(i2, 3)), this.setAttribute(`uv`, new Bi(a2, 2));
      function c2(e6) {
        let o3 = r2.length / 3, c3 = e6.extractPoints(t2), l2 = c3.shape, u2 = c3.holes;
        Po.isClockWise(l2) === false && (l2 = l2.reverse());
        for (let e7 = 0, t3 = u2.length; e7 < t3; e7++) {
          let t4 = u2[e7];
          Po.isClockWise(t4) === true && (u2[e7] = t4.reverse());
        }
        let d2 = Po.triangulateShape(l2, u2);
        for (let e7 = 0, t3 = u2.length; e7 < t3; e7++) {
          let t4 = u2[e7];
          l2 = l2.concat(t4);
        }
        for (let e7 = 0, t3 = l2.length; e7 < t3; e7++) {
          let t4 = l2[e7];
          r2.push(t4.x, t4.y, 0), i2.push(0, 0, 1), a2.push(t4.x, t4.y);
        }
        for (let e7 = 0, t3 = d2.length; e7 < t3; e7++) {
          let t4 = d2[e7], r3 = t4[0] + o3, i3 = t4[1] + o3, a3 = t4[2] + o3;
          n2.push(r3, i3, a3), s2 += 3;
        }
      }
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    toJSON() {
      let e5 = super.toJSON(), t2 = this.parameters.shapes;
      return it(t2, e5);
    }
    static fromJSON(t2, n2) {
      let r2 = [];
      for (let e5 = 0, i2 = t2.shapes.length; e5 < i2; e5++) {
        let i3 = n2[t2.shapes[e5]];
        r2.push(i3);
      }
      return new e4(r2, t2.curveSegments);
    }
  }, Ho = class e4 extends Qi {
    constructor(e5 = 1, t2 = 32, n2 = 16, r2 = 0, i2 = Math.PI * 2, a2 = 0, o2 = Math.PI) {
      super(), this.type = `SphereGeometry`, this.parameters = { radius: e5, widthSegments: t2, heightSegments: n2, phiStart: r2, phiLength: i2, thetaStart: a2, thetaLength: o2 }, t2 = Math.max(3, Math.floor(t2)), n2 = Math.max(2, Math.floor(n2));
      let s2 = Math.min(a2 + o2, Math.PI), c2 = 0, l2 = [], u2 = new N(), d2 = new N(), f2 = [], p2 = [], m2 = [], h2 = [];
      for (let f3 = 0; f3 <= n2; f3++) {
        let g2 = [], _2 = f3 / n2, v2 = 0;
        f3 === 0 && a2 === 0 ? v2 = 0.5 / t2 : f3 === n2 && s2 === Math.PI && (v2 = -0.5 / t2);
        for (let n3 = 0; n3 <= t2; n3++) {
          let s3 = n3 / t2;
          u2.x = -e5 * Math.cos(r2 + s3 * i2) * Math.sin(a2 + _2 * o2), u2.y = e5 * Math.cos(a2 + _2 * o2), u2.z = e5 * Math.sin(r2 + s3 * i2) * Math.sin(a2 + _2 * o2), p2.push(u2.x, u2.y, u2.z), d2.copy(u2).normalize(), m2.push(d2.x, d2.y, d2.z), h2.push(s3 + v2, 1 - _2), g2.push(c2++);
        }
        l2.push(g2);
      }
      for (let e6 = 0; e6 < n2; e6++) for (let r3 = 0; r3 < t2; r3++) {
        let t3 = l2[e6][r3 + 1], i3 = l2[e6][r3], o3 = l2[e6 + 1][r3], c3 = l2[e6 + 1][r3 + 1];
        (e6 !== 0 || a2 > 0) && f2.push(t3, i3, c3), (e6 !== n2 - 1 || s2 < Math.PI) && f2.push(i3, o3, c3);
      }
      this.setIndex(f2), this.setAttribute(`position`, new Bi(p2, 3)), this.setAttribute(`normal`, new Bi(m2, 3)), this.setAttribute(`uv`, new Bi(h2, 2));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.widthSegments, t2.heightSegments, t2.phiStart, t2.phiLength, t2.thetaStart, t2.thetaLength);
    }
  }, Uo = class e4 extends Qi {
    constructor(e5 = 1, t2 = 0.4, n2 = 12, r2 = 48, i2 = Math.PI * 2, a2 = 0, o2 = Math.PI * 2) {
      super(), this.type = `TorusGeometry`, this.parameters = { radius: e5, tube: t2, radialSegments: n2, tubularSegments: r2, arc: i2, thetaStart: a2, thetaLength: o2 }, n2 = Math.floor(n2), r2 = Math.floor(r2);
      let s2 = [], c2 = [], l2 = [], u2 = [], d2 = new N(), f2 = new N(), p2 = new N();
      for (let s3 = 0; s3 <= n2; s3++) {
        let m2 = a2 + s3 / n2 * o2;
        for (let a3 = 0; a3 <= r2; a3++) {
          let o3 = a3 / r2 * i2;
          f2.x = (e5 + t2 * Math.cos(m2)) * Math.cos(o3), f2.y = (e5 + t2 * Math.cos(m2)) * Math.sin(o3), f2.z = t2 * Math.sin(m2), c2.push(f2.x, f2.y, f2.z), d2.x = e5 * Math.cos(o3), d2.y = e5 * Math.sin(o3), p2.subVectors(f2, d2).normalize(), l2.push(p2.x, p2.y, p2.z), u2.push(a3 / r2), u2.push(s3 / n2);
        }
      }
      for (let e6 = 1; e6 <= n2; e6++) for (let t3 = 1; t3 <= r2; t3++) {
        let n3 = (r2 + 1) * e6 + t3 - 1, i3 = (r2 + 1) * (e6 - 1) + t3 - 1, a3 = (r2 + 1) * (e6 - 1) + t3, o3 = (r2 + 1) * e6 + t3;
        s2.push(n3, i3, o3), s2.push(i3, a3, o3);
      }
      this.setIndex(s2), this.setAttribute(`position`, new Bi(c2, 3)), this.setAttribute(`normal`, new Bi(l2, 3)), this.setAttribute(`uv`, new Bi(u2, 2));
    }
    copy(e5) {
      return super.copy(e5), this.parameters = Object.assign({}, e5.parameters), this;
    }
    static fromJSON(t2) {
      return new e4(t2.radius, t2.tube, t2.radialSegments, t2.tubularSegments, t2.arc);
    }
  }, Wo = { clone: at, merge: ot }, Go = `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`, Ko = `void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`, qo = class extends ea {
    constructor(e4) {
      super(), this.isShaderMaterial = true, this.type = `ShaderMaterial`, this.defines = {}, this.uniforms = {}, this.uniformsGroups = [], this.vertexShader = Go, this.fragmentShader = Ko, this.linewidth = 1, this.wireframe = false, this.wireframeLinewidth = 1, this.fog = false, this.lights = false, this.clipping = false, this.forceSinglePass = true, this.extensions = { clipCullDistance: false, multiDraw: false }, this.defaultAttributeValues = { color: [1, 1, 1], uv: [0, 0], uv1: [0, 0] }, this.index0AttributeName = void 0, this.uniformsNeedUpdate = false, this.glslVersion = null, e4 !== void 0 && this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.fragmentShader = e4.fragmentShader, this.vertexShader = e4.vertexShader, this.uniforms = at(e4.uniforms), this.uniformsGroups = ct(e4.uniformsGroups), this.defines = Object.assign({}, e4.defines), this.wireframe = e4.wireframe, this.wireframeLinewidth = e4.wireframeLinewidth, this.fog = e4.fog, this.lights = e4.lights, this.clipping = e4.clipping, this.extensions = Object.assign({}, e4.extensions), this.glslVersion = e4.glslVersion, this.defaultAttributeValues = Object.assign({}, e4.defaultAttributeValues), this.index0AttributeName = e4.index0AttributeName, this.uniformsNeedUpdate = e4.uniformsNeedUpdate, this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      t2.glslVersion = this.glslVersion, t2.uniforms = {};
      for (let n3 in this.uniforms) {
        let r2 = this.uniforms[n3].value;
        r2 && r2.isTexture ? t2.uniforms[n3] = { type: `t`, value: r2.toJSON(e4).uuid } : r2 && r2.isColor ? t2.uniforms[n3] = { type: `c`, value: r2.getHex() } : r2 && r2.isVector2 ? t2.uniforms[n3] = { type: `v2`, value: r2.toArray() } : r2 && r2.isVector3 ? t2.uniforms[n3] = { type: `v3`, value: r2.toArray() } : r2 && r2.isVector4 ? t2.uniforms[n3] = { type: `v4`, value: r2.toArray() } : r2 && r2.isMatrix3 ? t2.uniforms[n3] = { type: `m3`, value: r2.toArray() } : r2 && r2.isMatrix4 ? t2.uniforms[n3] = { type: `m4`, value: r2.toArray() } : t2.uniforms[n3] = { value: r2 };
      }
      Object.keys(this.defines).length > 0 && (t2.defines = this.defines), t2.vertexShader = this.vertexShader, t2.fragmentShader = this.fragmentShader, t2.lights = this.lights, t2.clipping = this.clipping;
      let n2 = {};
      for (let e5 in this.extensions) this.extensions[e5] === true && (n2[e5] = true);
      return Object.keys(n2).length > 0 && (t2.extensions = n2), t2;
    }
  }, Jo = class extends qo {
    constructor(e4) {
      super(e4), this.isRawShaderMaterial = true, this.type = `RawShaderMaterial`;
    }
  }, Yo = class extends ea {
    constructor(e4) {
      super(), this.isMeshStandardMaterial = true, this.type = `MeshStandardMaterial`, this.defines = { STANDARD: `` }, this.color = new P(16777215), this.roughness = 1, this.metalness = 0, this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.emissive = new P(0), this.emissiveIntensity = 1, this.emissiveMap = null, this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = 0, this.normalScale = new M(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.roughnessMap = null, this.metalnessMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new Pr(), this.envMapIntensity = 1, this.wireframe = false, this.wireframeLinewidth = 1, this.wireframeLinecap = `round`, this.wireframeLinejoin = `round`, this.flatShading = false, this.fog = true, this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.defines = { STANDARD: `` }, this.color.copy(e4.color), this.roughness = e4.roughness, this.metalness = e4.metalness, this.map = e4.map, this.lightMap = e4.lightMap, this.lightMapIntensity = e4.lightMapIntensity, this.aoMap = e4.aoMap, this.aoMapIntensity = e4.aoMapIntensity, this.emissive.copy(e4.emissive), this.emissiveMap = e4.emissiveMap, this.emissiveIntensity = e4.emissiveIntensity, this.bumpMap = e4.bumpMap, this.bumpScale = e4.bumpScale, this.normalMap = e4.normalMap, this.normalMapType = e4.normalMapType, this.normalScale.copy(e4.normalScale), this.displacementMap = e4.displacementMap, this.displacementScale = e4.displacementScale, this.displacementBias = e4.displacementBias, this.roughnessMap = e4.roughnessMap, this.metalnessMap = e4.metalnessMap, this.alphaMap = e4.alphaMap, this.envMap = e4.envMap, this.envMapRotation.copy(e4.envMapRotation), this.envMapIntensity = e4.envMapIntensity, this.wireframe = e4.wireframe, this.wireframeLinewidth = e4.wireframeLinewidth, this.wireframeLinecap = e4.wireframeLinecap, this.wireframeLinejoin = e4.wireframeLinejoin, this.flatShading = e4.flatShading, this.fog = e4.fog, this;
    }
  }, Xo = class extends ea {
    constructor(e4) {
      super(), this.isMeshLambertMaterial = true, this.type = `MeshLambertMaterial`, this.color = new P(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.emissive = new P(0), this.emissiveIntensity = 1, this.emissiveMap = null, this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = 0, this.normalScale = new M(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.envMapRotation = new Pr(), this.combine = 0, this.reflectivity = 1, this.envMapIntensity = 1, this.refractionRatio = 0.98, this.wireframe = false, this.wireframeLinewidth = 1, this.wireframeLinecap = `round`, this.wireframeLinejoin = `round`, this.flatShading = false, this.fog = true, this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.color.copy(e4.color), this.map = e4.map, this.lightMap = e4.lightMap, this.lightMapIntensity = e4.lightMapIntensity, this.aoMap = e4.aoMap, this.aoMapIntensity = e4.aoMapIntensity, this.emissive.copy(e4.emissive), this.emissiveMap = e4.emissiveMap, this.emissiveIntensity = e4.emissiveIntensity, this.bumpMap = e4.bumpMap, this.bumpScale = e4.bumpScale, this.normalMap = e4.normalMap, this.normalMapType = e4.normalMapType, this.normalScale.copy(e4.normalScale), this.displacementMap = e4.displacementMap, this.displacementScale = e4.displacementScale, this.displacementBias = e4.displacementBias, this.specularMap = e4.specularMap, this.alphaMap = e4.alphaMap, this.envMap = e4.envMap, this.envMapRotation.copy(e4.envMapRotation), this.combine = e4.combine, this.reflectivity = e4.reflectivity, this.envMapIntensity = e4.envMapIntensity, this.refractionRatio = e4.refractionRatio, this.wireframe = e4.wireframe, this.wireframeLinewidth = e4.wireframeLinewidth, this.wireframeLinecap = e4.wireframeLinecap, this.wireframeLinejoin = e4.wireframeLinejoin, this.flatShading = e4.flatShading, this.fog = e4.fog, this;
    }
  }, Zo = class extends ea {
    constructor(e4) {
      super(), this.isMeshDepthMaterial = true, this.type = `MeshDepthMaterial`, this.depthPacking = zn, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.wireframe = false, this.wireframeLinewidth = 1, this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.depthPacking = e4.depthPacking, this.map = e4.map, this.alphaMap = e4.alphaMap, this.displacementMap = e4.displacementMap, this.displacementScale = e4.displacementScale, this.displacementBias = e4.displacementBias, this.wireframe = e4.wireframe, this.wireframeLinewidth = e4.wireframeLinewidth, this;
    }
  }, Qo = class extends ea {
    constructor(e4) {
      super(), this.isMeshDistanceMaterial = true, this.type = `MeshDistanceMaterial`, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.setValues(e4);
    }
    copy(e4) {
      return super.copy(e4), this.map = e4.map, this.alphaMap = e4.alphaMap, this.displacementMap = e4.displacementMap, this.displacementScale = e4.displacementScale, this.displacementBias = e4.displacementBias, this;
    }
  }, $o = class {
    constructor(e4, t2, n2, r2) {
      this.parameterPositions = e4, this._cachedIndex = 0, this.resultBuffer = r2 === void 0 ? new t2.constructor(n2) : r2, this.sampleValues = t2, this.valueSize = n2, this.settings = null, this.DefaultSettings_ = {};
    }
    evaluate(e4) {
      let t2 = this.parameterPositions, n2 = this._cachedIndex, r2 = t2[n2], i2 = t2[n2 - 1];
      validate_interval: {
        seek: {
          let a2;
          linear_scan: {
            forward_scan: if (!(e4 < r2)) {
              for (let a3 = n2 + 2; ; ) {
                if (r2 === void 0) {
                  if (e4 < i2) break forward_scan;
                  return n2 = t2.length, this._cachedIndex = n2, this.copySampleValue_(n2 - 1);
                }
                if (n2 === a3) break;
                if (i2 = r2, r2 = t2[++n2], e4 < r2) break seek;
              }
              a2 = t2.length;
              break linear_scan;
            }
            if (!(e4 >= i2)) {
              let o2 = t2[1];
              e4 < o2 && (n2 = 2, i2 = o2);
              for (let a3 = n2 - 2; ; ) {
                if (i2 === void 0) return this._cachedIndex = 0, this.copySampleValue_(0);
                if (n2 === a3) break;
                if (r2 = i2, i2 = t2[--n2 - 1], e4 >= i2) break seek;
              }
              a2 = n2, n2 = 0;
              break linear_scan;
            }
            break validate_interval;
          }
          for (; n2 < a2; ) {
            let r3 = n2 + a2 >>> 1;
            e4 < t2[r3] ? a2 = r3 : n2 = r3 + 1;
          }
          if (r2 = t2[n2], i2 = t2[n2 - 1], i2 === void 0) return this._cachedIndex = 0, this.copySampleValue_(0);
          if (r2 === void 0) return n2 = t2.length, this._cachedIndex = n2, this.copySampleValue_(n2 - 1);
        }
        this._cachedIndex = n2, this.intervalChanged_(n2, i2, r2);
      }
      return this.interpolate_(n2, i2, e4, r2);
    }
    getSettings_() {
      return this.settings || this.DefaultSettings_;
    }
    copySampleValue_(e4) {
      let t2 = this.resultBuffer, n2 = this.sampleValues, r2 = this.valueSize, i2 = e4 * r2;
      for (let e5 = 0; e5 !== r2; ++e5) t2[e5] = n2[i2 + e5];
      return t2;
    }
    interpolate_() {
      throw Error(`call to abstract method`);
    }
    intervalChanged_() {
    }
  }, es = class extends $o {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2), this._weightPrev = -0, this._offsetPrev = -0, this._weightNext = -0, this._offsetNext = -0, this.DefaultSettings_ = { endingStart: In, endingEnd: In };
    }
    intervalChanged_(e4, t2, n2) {
      let r2 = this.parameterPositions, i2 = e4 - 2, a2 = e4 + 1, o2 = r2[i2], s2 = r2[a2];
      if (o2 === void 0) switch (this.getSettings_().endingStart) {
        case Ln:
          i2 = e4, o2 = 2 * t2 - n2;
          break;
        case Rn:
          i2 = r2.length - 2, o2 = t2 + r2[i2] - r2[i2 + 1];
          break;
        default:
          i2 = e4, o2 = n2;
      }
      if (s2 === void 0) switch (this.getSettings_().endingEnd) {
        case Ln:
          a2 = e4, s2 = 2 * n2 - t2;
          break;
        case Rn:
          a2 = 1, s2 = n2 + r2[1] - r2[0];
          break;
        default:
          a2 = e4 - 1, s2 = t2;
      }
      let c2 = (n2 - t2) * 0.5, l2 = this.valueSize;
      this._weightPrev = c2 / (t2 - o2), this._weightNext = c2 / (s2 - n2), this._offsetPrev = i2 * l2, this._offsetNext = a2 * l2;
    }
    interpolate_(e4, t2, n2, r2) {
      let i2 = this.resultBuffer, a2 = this.sampleValues, o2 = this.valueSize, s2 = e4 * o2, c2 = s2 - o2, l2 = this._offsetPrev, u2 = this._offsetNext, d2 = this._weightPrev, f2 = this._weightNext, p2 = (n2 - t2) / (r2 - t2), m2 = p2 * p2, h2 = m2 * p2, g2 = -d2 * h2 + 2 * d2 * m2 - d2 * p2, _2 = (1 + d2) * h2 + (-1.5 - 2 * d2) * m2 + (-0.5 + d2) * p2 + 1, v2 = (-1 - f2) * h2 + (1.5 + f2) * m2 + 0.5 * p2, y2 = f2 * h2 - f2 * m2;
      for (let e5 = 0; e5 !== o2; ++e5) i2[e5] = g2 * a2[l2 + e5] + _2 * a2[c2 + e5] + v2 * a2[s2 + e5] + y2 * a2[u2 + e5];
      return i2;
    }
  }, ts = class extends $o {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
    interpolate_(e4, t2, n2, r2) {
      let i2 = this.resultBuffer, a2 = this.sampleValues, o2 = this.valueSize, s2 = e4 * o2, c2 = s2 - o2, l2 = (n2 - t2) / (r2 - t2), u2 = 1 - l2;
      for (let e5 = 0; e5 !== o2; ++e5) i2[e5] = a2[c2 + e5] * u2 + a2[s2 + e5] * l2;
      return i2;
    }
  }, ns = class extends $o {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
    interpolate_(e4) {
      return this.copySampleValue_(e4 - 1);
    }
  }, rs = class extends $o {
    interpolate_(e4, t2, n2, r2) {
      let i2 = this.resultBuffer, a2 = this.sampleValues, o2 = this.valueSize, s2 = e4 * o2, c2 = s2 - o2, l2 = this.settings || this.DefaultSettings_, u2 = l2.inTangents, d2 = l2.outTangents;
      if (!u2 || !d2) {
        let e5 = (n2 - t2) / (r2 - t2), l3 = 1 - e5;
        for (let t3 = 0; t3 !== o2; ++t3) i2[t3] = a2[c2 + t3] * l3 + a2[s2 + t3] * e5;
        return i2;
      }
      let f2 = o2 * 2, p2 = e4 - 1;
      for (let l3 = 0; l3 !== o2; ++l3) {
        let o3 = a2[c2 + l3], m2 = a2[s2 + l3], h2 = p2 * f2 + l3 * 2, g2 = d2[h2], _2 = d2[h2 + 1], v2 = e4 * f2 + l3 * 2, y2 = u2[v2], b2 = u2[v2 + 1], x2 = (n2 - t2) / (r2 - t2), S2, C2, w2, T2, E2;
        for (let e5 = 0; e5 < 8; e5++) {
          S2 = x2 * x2, C2 = S2 * x2, w2 = 1 - x2, T2 = w2 * w2, E2 = T2 * w2;
          let e6 = E2 * t2 + 3 * T2 * x2 * g2 + 3 * w2 * S2 * y2 + C2 * r2 - n2;
          if (Math.abs(e6) < 1e-10) break;
          let i3 = 3 * T2 * (g2 - t2) + 6 * w2 * x2 * (y2 - g2) + 3 * S2 * (r2 - y2);
          if (Math.abs(i3) < 1e-10) break;
          x2 -= e6 / i3, x2 = Math.max(0, Math.min(1, x2));
        }
        i2[l3] = E2 * o3 + 3 * T2 * x2 * _2 + 3 * w2 * S2 * b2 + C2 * m2;
      }
      return i2;
    }
  }, is = class {
    constructor(e4, t2, n2, r2) {
      if (e4 === void 0) throw Error(`THREE.KeyframeTrack: track name is undefined`);
      if (t2 === void 0 || t2.length === 0) throw Error(`THREE.KeyframeTrack: no keyframes in track named ` + e4);
      this.name = e4, this.times = ut(t2, this.TimeBufferType), this.values = ut(n2, this.ValueBufferType), this.setInterpolation(r2 || this.DefaultInterpolation);
    }
    static toJSON(e4) {
      let t2 = e4.constructor, n2;
      if (t2.toJSON !== this.toJSON) n2 = t2.toJSON(e4);
      else {
        n2 = { name: e4.name, times: ut(e4.times, Array), values: ut(e4.values, Array) };
        let t3 = e4.getInterpolation();
        t3 !== e4.DefaultInterpolation && (n2.interpolation = t3);
      }
      return n2.type = e4.ValueTypeName, n2;
    }
    InterpolantFactoryMethodDiscrete(e4) {
      return new ns(this.times, this.values, this.getValueSize(), e4);
    }
    InterpolantFactoryMethodLinear(e4) {
      return new ts(this.times, this.values, this.getValueSize(), e4);
    }
    InterpolantFactoryMethodSmooth(e4) {
      return new es(this.times, this.values, this.getValueSize(), e4);
    }
    InterpolantFactoryMethodBezier(e4) {
      let t2 = new rs(this.times, this.values, this.getValueSize(), e4);
      return this.settings && (t2.settings = this.settings), t2;
    }
    setInterpolation(e4) {
      let t2;
      switch (e4) {
        case Mn:
          t2 = this.InterpolantFactoryMethodDiscrete;
          break;
        case Nn:
          t2 = this.InterpolantFactoryMethodLinear;
          break;
        case Pn:
          t2 = this.InterpolantFactoryMethodSmooth;
          break;
        case Fn:
          t2 = this.InterpolantFactoryMethodBezier;
          break;
      }
      if (t2 === void 0) {
        let t3 = `unsupported interpolation for ` + this.ValueTypeName + ` keyframe track named ` + this.name;
        if (this.createInterpolant === void 0) if (e4 !== this.DefaultInterpolation) this.setInterpolation(this.DefaultInterpolation);
        else throw Error(t3);
        return l(`KeyframeTrack:`, t3), this;
      }
      return this.createInterpolant = t2, this;
    }
    getInterpolation() {
      switch (this.createInterpolant) {
        case this.InterpolantFactoryMethodDiscrete:
          return Mn;
        case this.InterpolantFactoryMethodLinear:
          return Nn;
        case this.InterpolantFactoryMethodSmooth:
          return Pn;
        case this.InterpolantFactoryMethodBezier:
          return Fn;
      }
    }
    getValueSize() {
      return this.values.length / this.times.length;
    }
    shift(e4) {
      if (e4 !== 0) {
        let t2 = this.times;
        for (let n2 = 0, r2 = t2.length; n2 !== r2; ++n2) t2[n2] += e4;
      }
      return this;
    }
    scale(e4) {
      if (e4 !== 1) {
        let t2 = this.times;
        for (let n2 = 0, r2 = t2.length; n2 !== r2; ++n2) t2[n2] *= e4;
      }
      return this;
    }
    trim(e4, t2) {
      let n2 = this.times, r2 = n2.length, i2 = 0, a2 = r2 - 1;
      for (; i2 !== r2 && n2[i2] < e4; ) ++i2;
      for (; a2 !== -1 && n2[a2] > t2; ) --a2;
      if (++a2, i2 !== 0 || a2 !== r2) {
        i2 >= a2 && (a2 = Math.max(a2, 1), i2 = a2 - 1);
        let e5 = this.getValueSize();
        this.times = n2.slice(i2, a2), this.values = this.values.slice(i2 * e5, a2 * e5);
      }
      return this;
    }
    validate() {
      let e4 = true, t2 = this.getValueSize();
      t2 - Math.floor(t2) !== 0 && (u(`KeyframeTrack: Invalid value size in track.`, this), e4 = false);
      let n2 = this.times, r2 = this.values, a2 = n2.length;
      a2 === 0 && (u(`KeyframeTrack: Track is empty.`, this), e4 = false);
      let o2 = null;
      for (let t3 = 0; t3 !== a2; t3++) {
        let r3 = n2[t3];
        if (typeof r3 == `number` && isNaN(r3)) {
          u(`KeyframeTrack: Time is not a valid number.`, this, t3, r3), e4 = false;
          break;
        }
        if (o2 !== null && o2 > r3) {
          u(`KeyframeTrack: Out of order keys.`, this, t3, r3, o2), e4 = false;
          break;
        }
        o2 = r3;
      }
      if (r2 !== void 0 && i(r2)) for (let t3 = 0, n3 = r2.length; t3 !== n3; ++t3) {
        let n4 = r2[t3];
        if (isNaN(n4)) {
          u(`KeyframeTrack: Value is not a valid number.`, this, t3, n4), e4 = false;
          break;
        }
      }
      return e4;
    }
    optimize() {
      let e4 = this.times.slice(), t2 = this.values.slice(), n2 = this.getValueSize(), r2 = this.getInterpolation() === Pn, i2 = e4.length - 1, a2 = 1;
      for (let o2 = 1; o2 < i2; ++o2) {
        let i3 = false, s2 = e4[o2];
        if (s2 !== e4[o2 + 1] && (o2 !== 1 || s2 !== e4[0])) if (r2) i3 = true;
        else {
          let e5 = o2 * n2, r3 = e5 - n2, a3 = e5 + n2;
          for (let o3 = 0; o3 !== n2; ++o3) {
            let n3 = t2[e5 + o3];
            if (n3 !== t2[r3 + o3] || n3 !== t2[a3 + o3]) {
              i3 = true;
              break;
            }
          }
        }
        if (i3) {
          if (o2 !== a2) {
            e4[a2] = e4[o2];
            let r3 = o2 * n2, i4 = a2 * n2;
            for (let e5 = 0; e5 !== n2; ++e5) t2[i4 + e5] = t2[r3 + e5];
          }
          ++a2;
        }
      }
      if (i2 > 0) {
        e4[a2] = e4[i2];
        for (let e5 = i2 * n2, r3 = a2 * n2, o2 = 0; o2 !== n2; ++o2) t2[r3 + o2] = t2[e5 + o2];
        ++a2;
      }
      return a2 === e4.length ? (this.times = e4, this.values = t2) : (this.times = e4.slice(0, a2), this.values = t2.slice(0, a2 * n2)), this;
    }
    clone() {
      let e4 = this.times.slice(), t2 = this.values.slice(), n2 = this.constructor, r2 = new n2(this.name, e4, t2);
      return r2.createInterpolant = this.createInterpolant, r2;
    }
  }, is.prototype.ValueTypeName = ``, is.prototype.TimeBufferType = Float32Array, is.prototype.ValueBufferType = Float32Array, is.prototype.DefaultInterpolation = Nn, as = class extends is {
    constructor(e4, t2, n2) {
      super(e4, t2, n2);
    }
  }, as.prototype.ValueTypeName = `bool`, as.prototype.ValueBufferType = Array, as.prototype.DefaultInterpolation = Mn, as.prototype.InterpolantFactoryMethodLinear = void 0, as.prototype.InterpolantFactoryMethodSmooth = void 0, os = class extends is {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
  }, os.prototype.ValueTypeName = `color`, ss = class extends is {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
  }, ss.prototype.ValueTypeName = `number`, cs = class extends $o {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
    interpolate_(e4, t2, n2, r2) {
      let i2 = this.resultBuffer, a2 = this.sampleValues, o2 = this.valueSize, s2 = (n2 - t2) / (r2 - t2), c2 = e4 * o2;
      for (let e5 = c2 + o2; c2 !== e5; c2 += 4) ir.slerpFlat(i2, 0, a2, c2 - o2, a2, c2, s2);
      return i2;
    }
  }, ls = class extends is {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
    InterpolantFactoryMethodLinear(e4) {
      return new cs(this.times, this.values, this.getValueSize(), e4);
    }
  }, ls.prototype.ValueTypeName = `quaternion`, ls.prototype.InterpolantFactoryMethodSmooth = void 0, us = class extends is {
    constructor(e4, t2, n2) {
      super(e4, t2, n2);
    }
  }, us.prototype.ValueTypeName = `string`, us.prototype.ValueBufferType = Array, us.prototype.DefaultInterpolation = Mn, us.prototype.InterpolantFactoryMethodLinear = void 0, us.prototype.InterpolantFactoryMethodSmooth = void 0, ds = class extends is {
    constructor(e4, t2, n2, r2) {
      super(e4, t2, n2, r2);
    }
  }, ds.prototype.ValueTypeName = `vector`, fs = class {
    constructor(e4, t2, n2) {
      let r2 = this, i2 = false, a2 = 0, o2 = 0, s2, c2 = [];
      this.onStart = void 0, this.onLoad = e4, this.onProgress = t2, this.onError = n2, this._abortController = null, this.itemStart = function(e5) {
        o2++, i2 === false && r2.onStart !== void 0 && r2.onStart(e5, a2, o2), i2 = true;
      }, this.itemEnd = function(e5) {
        a2++, r2.onProgress !== void 0 && r2.onProgress(e5, a2, o2), a2 === o2 && (i2 = false, r2.onLoad !== void 0 && r2.onLoad());
      }, this.itemError = function(e5) {
        r2.onError !== void 0 && r2.onError(e5);
      }, this.resolveURL = function(e5) {
        return s2 ? s2(e5) : e5;
      }, this.setURLModifier = function(e5) {
        return s2 = e5, this;
      }, this.addHandler = function(e5, t3) {
        return c2.push(e5, t3), this;
      }, this.removeHandler = function(e5) {
        let t3 = c2.indexOf(e5);
        return t3 !== -1 && c2.splice(t3, 2), this;
      }, this.getHandler = function(e5) {
        for (let t3 = 0, n3 = c2.length; t3 < n3; t3 += 2) {
          let n4 = c2[t3], r3 = c2[t3 + 1];
          if (n4.global && (n4.lastIndex = 0), n4.test(e5)) return r3;
        }
        return null;
      }, this.abort = function() {
        return this.abortController.abort(), this._abortController = null, this;
      };
    }
    get abortController() {
      return this._abortController ||= new AbortController(), this._abortController;
    }
  }, ps = new fs(), ms = class {
    constructor(e4) {
      this.manager = e4 === void 0 ? ps : e4, this.crossOrigin = `anonymous`, this.withCredentials = false, this.path = ``, this.resourcePath = ``, this.requestHeader = {}, typeof __THREE_DEVTOOLS__ < `u` && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`, { detail: this }));
    }
    load() {
    }
    loadAsync(e4, t2) {
      let n2 = this;
      return new Promise(function(r2, i2) {
        n2.load(e4, r2, t2, i2);
      });
    }
    parse() {
    }
    setCrossOrigin(e4) {
      return this.crossOrigin = e4, this;
    }
    setWithCredentials(e4) {
      return this.withCredentials = e4, this;
    }
    setPath(e4) {
      return this.path = e4, this;
    }
    setResourcePath(e4) {
      return this.resourcePath = e4, this;
    }
    setRequestHeader(e4) {
      return this.requestHeader = e4, this;
    }
    abort() {
      return this;
    }
  }, ms.DEFAULT_MATERIAL_NAME = `__DEFAULT`, hs = class extends Zr {
    constructor(e4, t2 = 1) {
      super(), this.isLight = true, this.type = `Light`, this.color = new P(e4), this.intensity = t2;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.color.copy(e4.color), this.intensity = e4.intensity, this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.color = this.color.getHex(), t2.object.intensity = this.intensity, t2;
    }
  }, gs = class extends hs {
    constructor(e4, t2, n2) {
      super(e4, n2), this.isHemisphereLight = true, this.type = `HemisphereLight`, this.position.copy(Zr.DEFAULT_UP), this.updateMatrix(), this.groundColor = new P(t2);
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.groundColor.copy(e4.groundColor), this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.groundColor = this.groundColor.getHex(), t2;
    }
  }, _s = new wr(), vs = new N(), ys = new N(), bs = class {
    constructor(e4) {
      this.camera = e4, this.intensity = 1, this.bias = 0, this.biasNode = null, this.normalBias = 0, this.radius = 1, this.blurSamples = 8, this.mapSize = new M(512, 512), this.mapType = Et, this.map = null, this.mapPass = null, this.matrix = new wr(), this.autoUpdate = true, this.needsUpdate = false, this._frustum = new $a(), this._frameExtents = new M(1, 1), this._viewportCount = 1, this._viewports = [new yr(0, 0, 1, 1)];
    }
    getViewportCount() {
      return this._viewportCount;
    }
    getFrustum() {
      return this._frustum;
    }
    updateMatrices(e4) {
      let t2 = this.camera, n2 = this.matrix;
      vs.setFromMatrixPosition(e4.matrixWorld), t2.position.copy(vs), ys.setFromMatrixPosition(e4.target.matrixWorld), t2.lookAt(ys), t2.updateMatrixWorld(), _s.multiplyMatrices(t2.projectionMatrix, t2.matrixWorldInverse), this._frustum.setFromProjectionMatrix(_s, t2.coordinateSystem, t2.reversedDepth), t2.coordinateSystem === 2001 || t2.reversedDepth ? n2.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1) : n2.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1), n2.multiply(_s);
    }
    getViewport(e4) {
      return this._viewports[e4];
    }
    getFrameExtents() {
      return this._frameExtents;
    }
    dispose() {
      this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose();
    }
    copy(e4) {
      return this.camera = e4.camera.clone(), this.intensity = e4.intensity, this.bias = e4.bias, this.radius = e4.radius, this.autoUpdate = e4.autoUpdate, this.needsUpdate = e4.needsUpdate, this.normalBias = e4.normalBias, this.blurSamples = e4.blurSamples, this.mapSize.copy(e4.mapSize), this.biasNode = e4.biasNode, this;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    toJSON() {
      let e4 = {};
      return this.intensity !== 1 && (e4.intensity = this.intensity), this.bias !== 0 && (e4.bias = this.bias), this.normalBias !== 0 && (e4.normalBias = this.normalBias), this.radius !== 1 && (e4.radius = this.radius), (this.mapSize.x !== 512 || this.mapSize.y !== 512) && (e4.mapSize = this.mapSize.toArray()), e4.camera = this.camera.toJSON(false).object, delete e4.camera.matrix, e4;
    }
  }, xs = new N(), Ss = new ir(), Cs = new N(), ws = class extends Zr {
    constructor() {
      super(), this.isCamera = true, this.type = `Camera`, this.matrixWorldInverse = new wr(), this.projectionMatrix = new wr(), this.projectionMatrixInverse = new wr(), this.coordinateSystem = Jn, this._reversedDepth = false;
    }
    get reversedDepth() {
      return this._reversedDepth;
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.matrixWorldInverse.copy(e4.matrixWorldInverse), this.projectionMatrix.copy(e4.projectionMatrix), this.projectionMatrixInverse.copy(e4.projectionMatrixInverse), this.coordinateSystem = e4.coordinateSystem, this;
    }
    getWorldDirection(e4) {
      return super.getWorldDirection(e4).negate();
    }
    updateMatrixWorld(e4) {
      super.updateMatrixWorld(e4), this.matrixWorld.decompose(xs, Ss, Cs), Cs.x === 1 && Cs.y === 1 && Cs.z === 1 ? this.matrixWorldInverse.copy(this.matrixWorld).invert() : this.matrixWorldInverse.compose(xs, Ss, Cs.set(1, 1, 1)).invert();
    }
    updateWorldMatrix(e4, t2) {
      super.updateWorldMatrix(e4, t2), this.matrixWorld.decompose(xs, Ss, Cs), Cs.x === 1 && Cs.y === 1 && Cs.z === 1 ? this.matrixWorldInverse.copy(this.matrixWorld).invert() : this.matrixWorldInverse.compose(xs, Ss, Cs.set(1, 1, 1)).invert();
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }, Ts = new N(), Es = new M(), Ds = new M(), Os = class extends ws {
    constructor(e4 = 50, t2 = 1, n2 = 0.1, r2 = 2e3) {
      super(), this.isPerspectiveCamera = true, this.type = `PerspectiveCamera`, this.fov = e4, this.zoom = 1, this.near = n2, this.far = r2, this.focus = 10, this.aspect = t2, this.view = null, this.filmGauge = 35, this.filmOffset = 0, this.updateProjectionMatrix();
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.fov = e4.fov, this.zoom = e4.zoom, this.near = e4.near, this.far = e4.far, this.focus = e4.focus, this.aspect = e4.aspect, this.view = e4.view === null ? null : Object.assign({}, e4.view), this.filmGauge = e4.filmGauge, this.filmOffset = e4.filmOffset, this;
    }
    setFocalLength(e4) {
      let t2 = 0.5 * this.getFilmHeight() / e4;
      this.fov = nr * 2 * Math.atan(t2), this.updateProjectionMatrix();
    }
    getFocalLength() {
      let e4 = Math.tan(tr * 0.5 * this.fov);
      return 0.5 * this.getFilmHeight() / e4;
    }
    getEffectiveFOV() {
      return nr * 2 * Math.atan(Math.tan(tr * 0.5 * this.fov) / this.zoom);
    }
    getFilmWidth() {
      return this.filmGauge * Math.min(this.aspect, 1);
    }
    getFilmHeight() {
      return this.filmGauge / Math.max(this.aspect, 1);
    }
    getViewBounds(e4, t2, n2) {
      Ts.set(-1, -1, 0.5).applyMatrix4(this.projectionMatrixInverse), t2.set(Ts.x, Ts.y).multiplyScalar(-e4 / Ts.z), Ts.set(1, 1, 0.5).applyMatrix4(this.projectionMatrixInverse), n2.set(Ts.x, Ts.y).multiplyScalar(-e4 / Ts.z);
    }
    getViewSize(e4, t2) {
      return this.getViewBounds(e4, Es, Ds), t2.subVectors(Ds, Es);
    }
    setViewOffset(e4, t2, n2, r2, i2, a2) {
      this.aspect = e4 / t2, this.view === null && (this.view = { enabled: true, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 }), this.view.enabled = true, this.view.fullWidth = e4, this.view.fullHeight = t2, this.view.offsetX = n2, this.view.offsetY = r2, this.view.width = i2, this.view.height = a2, this.updateProjectionMatrix();
    }
    clearViewOffset() {
      this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      let e4 = this.near, t2 = e4 * Math.tan(tr * 0.5 * this.fov) / this.zoom, n2 = 2 * t2, r2 = this.aspect * n2, i2 = -0.5 * r2, a2 = this.view;
      if (this.view !== null && this.view.enabled) {
        let e5 = a2.fullWidth, o3 = a2.fullHeight;
        i2 += a2.offsetX * r2 / e5, t2 -= a2.offsetY * n2 / o3, r2 *= a2.width / e5, n2 *= a2.height / o3;
      }
      let o2 = this.filmOffset;
      o2 !== 0 && (i2 += e4 * o2 / this.getFilmWidth()), this.projectionMatrix.makePerspective(i2, i2 + r2, t2, t2 - n2, e4, this.far, this.coordinateSystem, this.reversedDepth), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.fov = this.fov, t2.object.zoom = this.zoom, t2.object.near = this.near, t2.object.far = this.far, t2.object.focus = this.focus, t2.object.aspect = this.aspect, this.view !== null && (t2.object.view = Object.assign({}, this.view)), t2.object.filmGauge = this.filmGauge, t2.object.filmOffset = this.filmOffset, t2;
    }
  }, ks = class extends bs {
    constructor() {
      super(new Os(90, 1, 0.5, 500)), this.isPointLightShadow = true;
    }
  }, As = class extends hs {
    constructor(e4, t2, n2 = 0, r2 = 2) {
      super(e4, t2), this.isPointLight = true, this.type = `PointLight`, this.distance = n2, this.decay = r2, this.shadow = new ks();
    }
    get power() {
      return this.intensity * 4 * Math.PI;
    }
    set power(e4) {
      this.intensity = e4 / (4 * Math.PI);
    }
    dispose() {
      super.dispose(), this.shadow.dispose();
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.distance = e4.distance, this.decay = e4.decay, this.shadow = e4.shadow.clone(), this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.distance = this.distance, t2.object.decay = this.decay, t2.object.shadow = this.shadow.toJSON(), t2;
    }
  }, js = class extends ws {
    constructor(e4 = -1, t2 = 1, n2 = 1, r2 = -1, i2 = 0.1, a2 = 2e3) {
      super(), this.isOrthographicCamera = true, this.type = `OrthographicCamera`, this.zoom = 1, this.view = null, this.left = e4, this.right = t2, this.top = n2, this.bottom = r2, this.near = i2, this.far = a2, this.updateProjectionMatrix();
    }
    copy(e4, t2) {
      return super.copy(e4, t2), this.left = e4.left, this.right = e4.right, this.top = e4.top, this.bottom = e4.bottom, this.near = e4.near, this.far = e4.far, this.zoom = e4.zoom, this.view = e4.view === null ? null : Object.assign({}, e4.view), this;
    }
    setViewOffset(e4, t2, n2, r2, i2, a2) {
      this.view === null && (this.view = { enabled: true, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 }), this.view.enabled = true, this.view.fullWidth = e4, this.view.fullHeight = t2, this.view.offsetX = n2, this.view.offsetY = r2, this.view.width = i2, this.view.height = a2, this.updateProjectionMatrix();
    }
    clearViewOffset() {
      this.view !== null && (this.view.enabled = false), this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      let e4 = (this.right - this.left) / (2 * this.zoom), t2 = (this.top - this.bottom) / (2 * this.zoom), n2 = (this.right + this.left) / 2, r2 = (this.top + this.bottom) / 2, i2 = n2 - e4, a2 = n2 + e4, o2 = r2 + t2, s2 = r2 - t2;
      if (this.view !== null && this.view.enabled) {
        let e5 = (this.right - this.left) / this.view.fullWidth / this.zoom, t3 = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
        i2 += e5 * this.view.offsetX, a2 = i2 + e5 * this.view.width, o2 -= t3 * this.view.offsetY, s2 = o2 - t3 * this.view.height;
      }
      this.projectionMatrix.makeOrthographic(i2, a2, o2, s2, this.near, this.far, this.coordinateSystem, this.reversedDepth), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.zoom = this.zoom, t2.object.left = this.left, t2.object.right = this.right, t2.object.top = this.top, t2.object.bottom = this.bottom, t2.object.near = this.near, t2.object.far = this.far, this.view !== null && (t2.object.view = Object.assign({}, this.view)), t2;
    }
  }, Ms = class extends bs {
    constructor() {
      super(new js(-5, 5, 5, -5, 0.5, 500)), this.isDirectionalLightShadow = true;
    }
  }, Ns = class extends hs {
    constructor(e4, t2) {
      super(e4, t2), this.isDirectionalLight = true, this.type = `DirectionalLight`, this.position.copy(Zr.DEFAULT_UP), this.updateMatrix(), this.target = new Zr(), this.shadow = new Ms();
    }
    dispose() {
      super.dispose(), this.shadow.dispose();
    }
    copy(e4) {
      return super.copy(e4), this.target = e4.target.clone(), this.shadow = e4.shadow.clone(), this;
    }
    toJSON(e4) {
      let t2 = super.toJSON(e4);
      return t2.object.shadow = this.shadow.toJSON(), t2.object.target = this.target.uuid, t2;
    }
  }, Ps = class extends Qi {
    constructor() {
      super(), this.isInstancedBufferGeometry = true, this.type = `InstancedBufferGeometry`, this.instanceCount = 1 / 0;
    }
    copy(e4) {
      return super.copy(e4), this.instanceCount = e4.instanceCount, this;
    }
    toJSON() {
      let e4 = super.toJSON();
      return e4.instanceCount = this.instanceCount, e4.isInstancedBufferGeometry = true, e4;
    }
  }, Fs = -90, Is = 1, Ls = class extends Zr {
    constructor(e4, t2, n2) {
      super(), this.type = `CubeCamera`, this.renderTarget = n2, this.coordinateSystem = null, this.activeMipmapLevel = 0;
      let r2 = new Os(Fs, Is, e4, t2);
      r2.layers = this.layers, this.add(r2);
      let i2 = new Os(Fs, Is, e4, t2);
      i2.layers = this.layers, this.add(i2);
      let a2 = new Os(Fs, Is, e4, t2);
      a2.layers = this.layers, this.add(a2);
      let o2 = new Os(Fs, Is, e4, t2);
      o2.layers = this.layers, this.add(o2);
      let s2 = new Os(Fs, Is, e4, t2);
      s2.layers = this.layers, this.add(s2);
      let c2 = new Os(Fs, Is, e4, t2);
      c2.layers = this.layers, this.add(c2);
    }
    updateCoordinateSystem() {
      let e4 = this.coordinateSystem, t2 = this.children.concat(), [n2, r2, i2, a2, o2, s2] = t2;
      for (let e5 of t2) this.remove(e5);
      if (e4 === 2e3) n2.up.set(0, 1, 0), n2.lookAt(1, 0, 0), r2.up.set(0, 1, 0), r2.lookAt(-1, 0, 0), i2.up.set(0, 0, -1), i2.lookAt(0, 1, 0), a2.up.set(0, 0, 1), a2.lookAt(0, -1, 0), o2.up.set(0, 1, 0), o2.lookAt(0, 0, 1), s2.up.set(0, 1, 0), s2.lookAt(0, 0, -1);
      else if (e4 === 2001) n2.up.set(0, -1, 0), n2.lookAt(-1, 0, 0), r2.up.set(0, -1, 0), r2.lookAt(1, 0, 0), i2.up.set(0, 0, 1), i2.lookAt(0, 1, 0), a2.up.set(0, 0, -1), a2.lookAt(0, -1, 0), o2.up.set(0, -1, 0), o2.lookAt(0, 0, 1), s2.up.set(0, -1, 0), s2.lookAt(0, 0, -1);
      else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: ` + e4);
      for (let e5 of t2) this.add(e5), e5.updateMatrixWorld();
    }
    update(e4, t2) {
      this.parent === null && this.updateMatrixWorld();
      let { renderTarget: n2, activeMipmapLevel: r2 } = this;
      this.coordinateSystem !== e4.coordinateSystem && (this.coordinateSystem = e4.coordinateSystem, this.updateCoordinateSystem());
      let [i2, a2, o2, s2, c2, l2] = this.children, u2 = e4.getRenderTarget(), d2 = e4.getActiveCubeFace(), f2 = e4.getActiveMipmapLevel(), p2 = e4.xr.enabled;
      e4.xr.enabled = false;
      let m2 = n2.texture.generateMipmaps;
      n2.texture.generateMipmaps = false;
      let h2 = false;
      h2 = e4.isWebGLRenderer === true ? e4.state.buffers.depth.getReversed() : e4.reversedDepthBuffer, e4.setRenderTarget(n2, 0, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, i2), e4.setRenderTarget(n2, 1, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, a2), e4.setRenderTarget(n2, 2, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, o2), e4.setRenderTarget(n2, 3, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, s2), e4.setRenderTarget(n2, 4, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, c2), n2.texture.generateMipmaps = m2, e4.setRenderTarget(n2, 5, r2), h2 && e4.autoClear === false && e4.clearDepth(), e4.render(t2, l2), e4.setRenderTarget(u2, d2, f2), e4.xr.enabled = p2, n2.texture.needsPMREMUpdate = true;
    }
  }, Rs = class extends Os {
    constructor(e4 = []) {
      super(), this.isArrayCamera = true, this.isMultiViewCamera = false, this.cameras = e4;
    }
  }, zs = class {
    constructor() {
      this._previousTime = 0, this._currentTime = 0, this._startTime = performance.now(), this._delta = 0, this._elapsed = 0, this._timescale = 1, this._document = null, this._pageVisibilityHandler = null;
    }
    connect(e4) {
      this._document = e4, e4.hidden !== void 0 && (this._pageVisibilityHandler = dt.bind(this), e4.addEventListener(`visibilitychange`, this._pageVisibilityHandler, false));
    }
    disconnect() {
      this._pageVisibilityHandler !== null && (this._document.removeEventListener(`visibilitychange`, this._pageVisibilityHandler), this._pageVisibilityHandler = null), this._document = null;
    }
    getDelta() {
      return this._delta / 1e3;
    }
    getElapsed() {
      return this._elapsed / 1e3;
    }
    getTimescale() {
      return this._timescale;
    }
    setTimescale(e4) {
      return this._timescale = e4, this;
    }
    reset() {
      return this._currentTime = performance.now() - this._startTime, this;
    }
    dispose() {
      this.disconnect();
    }
    update(e4) {
      return this._pageVisibilityHandler !== null && this._document.hidden === true ? this._delta = 0 : (this._previousTime = this._currentTime, this._currentTime = (e4 === void 0 ? performance.now() : e4) - this._startTime, this._delta = (this._currentTime - this._previousTime) * this._timescale, this._elapsed += this._delta), this;
    }
  }, Bs = `\\[\\]\\.:\\/`, Vs = RegExp(`[` + Bs + `]`, `g`), Hs = `[^` + Bs + `]`, Us = `[^` + Bs.replace(`\\.`, ``) + `]`, Ws = `((?:WC+[\\/:])*)`.replace(`WC`, Hs), Gs = `(WCOD+)?`.replace(`WCOD`, Us), Ks = `(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`, Hs), qs = `\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`, Hs), Js = RegExp(`^` + Ws + Gs + Ks + qs + `$`), Ys = [`material`, `materials`, `bones`, `map`], Xs = class {
    constructor(e4, t2, n2) {
      let r2 = n2 || Zs.parseTrackName(t2);
      this._targetGroup = e4, this._bindings = e4.subscribe_(t2, r2);
    }
    getValue(e4, t2) {
      this.bind();
      let n2 = this._targetGroup.nCachedObjects_, r2 = this._bindings[n2];
      r2 !== void 0 && r2.getValue(e4, t2);
    }
    setValue(e4, t2) {
      let n2 = this._bindings;
      for (let r2 = this._targetGroup.nCachedObjects_, i2 = n2.length; r2 !== i2; ++r2) n2[r2].setValue(e4, t2);
    }
    bind() {
      let e4 = this._bindings;
      for (let t2 = this._targetGroup.nCachedObjects_, n2 = e4.length; t2 !== n2; ++t2) e4[t2].bind();
    }
    unbind() {
      let e4 = this._bindings;
      for (let t2 = this._targetGroup.nCachedObjects_, n2 = e4.length; t2 !== n2; ++t2) e4[t2].unbind();
    }
  }, Zs = class e4 {
    constructor(t2, n2, r2) {
      this.path = n2, this.parsedPath = r2 || e4.parseTrackName(n2), this.node = e4.findNode(t2, this.parsedPath.nodeName), this.rootNode = t2, this.getValue = this._getValue_unbound, this.setValue = this._setValue_unbound;
    }
    static create(t2, n2, r2) {
      return t2 && t2.isAnimationObjectGroup ? new e4.Composite(t2, n2, r2) : new e4(t2, n2, r2);
    }
    static sanitizeNodeName(e5) {
      return e5.replace(/\s/g, `_`).replace(Vs, ``);
    }
    static parseTrackName(e5) {
      let t2 = Js.exec(e5);
      if (t2 === null) throw Error(`PropertyBinding: Cannot parse trackName: ` + e5);
      let n2 = { nodeName: t2[2], objectName: t2[3], objectIndex: t2[4], propertyName: t2[5], propertyIndex: t2[6] }, r2 = n2.nodeName && n2.nodeName.lastIndexOf(`.`);
      if (r2 !== void 0 && r2 !== -1) {
        let e6 = n2.nodeName.substring(r2 + 1);
        Ys.indexOf(e6) !== -1 && (n2.nodeName = n2.nodeName.substring(0, r2), n2.objectName = e6);
      }
      if (n2.propertyName === null || n2.propertyName.length === 0) throw Error(`PropertyBinding: can not parse propertyName from trackName: ` + e5);
      return n2;
    }
    static findNode(e5, t2) {
      if (t2 === void 0 || t2 === `` || t2 === `.` || t2 === -1 || t2 === e5.name || t2 === e5.uuid) return e5;
      if (e5.skeleton) {
        let n2 = e5.skeleton.getBoneByName(t2);
        if (n2 !== void 0) return n2;
      }
      if (e5.children) {
        let n2 = function(e6) {
          for (let r3 = 0; r3 < e6.length; r3++) {
            let i2 = e6[r3];
            if (i2.name === t2 || i2.uuid === t2) return i2;
            let a2 = n2(i2.children);
            if (a2) return a2;
          }
          return null;
        }, r2 = n2(e5.children);
        if (r2) return r2;
      }
      return null;
    }
    _getValue_unavailable() {
    }
    _setValue_unavailable() {
    }
    _getValue_direct(e5, t2) {
      e5[t2] = this.targetObject[this.propertyName];
    }
    _getValue_array(e5, t2) {
      let n2 = this.resolvedProperty;
      for (let r2 = 0, i2 = n2.length; r2 !== i2; ++r2) e5[t2++] = n2[r2];
    }
    _getValue_arrayElement(e5, t2) {
      e5[t2] = this.resolvedProperty[this.propertyIndex];
    }
    _getValue_toArray(e5, t2) {
      this.resolvedProperty.toArray(e5, t2);
    }
    _setValue_direct(e5, t2) {
      this.targetObject[this.propertyName] = e5[t2];
    }
    _setValue_direct_setNeedsUpdate(e5, t2) {
      this.targetObject[this.propertyName] = e5[t2], this.targetObject.needsUpdate = true;
    }
    _setValue_direct_setMatrixWorldNeedsUpdate(e5, t2) {
      this.targetObject[this.propertyName] = e5[t2], this.targetObject.matrixWorldNeedsUpdate = true;
    }
    _setValue_array(e5, t2) {
      let n2 = this.resolvedProperty;
      for (let r2 = 0, i2 = n2.length; r2 !== i2; ++r2) n2[r2] = e5[t2++];
    }
    _setValue_array_setNeedsUpdate(e5, t2) {
      let n2 = this.resolvedProperty;
      for (let r2 = 0, i2 = n2.length; r2 !== i2; ++r2) n2[r2] = e5[t2++];
      this.targetObject.needsUpdate = true;
    }
    _setValue_array_setMatrixWorldNeedsUpdate(e5, t2) {
      let n2 = this.resolvedProperty;
      for (let r2 = 0, i2 = n2.length; r2 !== i2; ++r2) n2[r2] = e5[t2++];
      this.targetObject.matrixWorldNeedsUpdate = true;
    }
    _setValue_arrayElement(e5, t2) {
      this.resolvedProperty[this.propertyIndex] = e5[t2];
    }
    _setValue_arrayElement_setNeedsUpdate(e5, t2) {
      this.resolvedProperty[this.propertyIndex] = e5[t2], this.targetObject.needsUpdate = true;
    }
    _setValue_arrayElement_setMatrixWorldNeedsUpdate(e5, t2) {
      this.resolvedProperty[this.propertyIndex] = e5[t2], this.targetObject.matrixWorldNeedsUpdate = true;
    }
    _setValue_fromArray(e5, t2) {
      this.resolvedProperty.fromArray(e5, t2);
    }
    _setValue_fromArray_setNeedsUpdate(e5, t2) {
      this.resolvedProperty.fromArray(e5, t2), this.targetObject.needsUpdate = true;
    }
    _setValue_fromArray_setMatrixWorldNeedsUpdate(e5, t2) {
      this.resolvedProperty.fromArray(e5, t2), this.targetObject.matrixWorldNeedsUpdate = true;
    }
    _getValue_unbound(e5, t2) {
      this.bind(), this.getValue(e5, t2);
    }
    _setValue_unbound(e5, t2) {
      this.bind(), this.setValue(e5, t2);
    }
    bind() {
      let t2 = this.node, n2 = this.parsedPath, r2 = n2.objectName, i2 = n2.propertyName, a2 = n2.propertyIndex;
      if (t2 || (t2 = e4.findNode(this.rootNode, n2.nodeName), this.node = t2), this.getValue = this._getValue_unavailable, this.setValue = this._setValue_unavailable, !t2) {
        l(`PropertyBinding: No target node found for track: ` + this.path + `.`);
        return;
      }
      if (r2) {
        let e5 = n2.objectIndex;
        switch (r2) {
          case `materials`:
            if (!t2.material) {
              u(`PropertyBinding: Can not bind to material as node does not have a material.`, this);
              return;
            }
            if (!t2.material.materials) {
              u(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`, this);
              return;
            }
            t2 = t2.material.materials;
            break;
          case `bones`:
            if (!t2.skeleton) {
              u(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`, this);
              return;
            }
            t2 = t2.skeleton.bones;
            for (let n3 = 0; n3 < t2.length; n3++) if (t2[n3].name === e5) {
              e5 = n3;
              break;
            }
            break;
          case `map`:
            if (`map` in t2) {
              t2 = t2.map;
              break;
            }
            if (!t2.material) {
              u(`PropertyBinding: Can not bind to material as node does not have a material.`, this);
              return;
            }
            if (!t2.material.map) {
              u(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`, this);
              return;
            }
            t2 = t2.material.map;
            break;
          default:
            if (t2[r2] === void 0) {
              u(`PropertyBinding: Can not bind to objectName of node undefined.`, this);
              return;
            }
            t2 = t2[r2];
        }
        if (e5 !== void 0) {
          if (t2[e5] === void 0) {
            u(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`, this, t2);
            return;
          }
          t2 = t2[e5];
        }
      }
      let o2 = t2[i2];
      if (o2 === void 0) {
        let e5 = n2.nodeName;
        u(`PropertyBinding: Trying to update property for track: ` + e5 + `.` + i2 + ` but it wasn't found.`, t2);
        return;
      }
      let s2 = this.Versioning.None;
      this.targetObject = t2, t2.isMaterial === true ? s2 = this.Versioning.NeedsUpdate : t2.isObject3D === true && (s2 = this.Versioning.MatrixWorldNeedsUpdate);
      let c2 = this.BindingType.Direct;
      if (a2 !== void 0) {
        if (i2 === `morphTargetInfluences`) {
          if (!t2.geometry) {
            u(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`, this);
            return;
          }
          if (!t2.geometry.morphAttributes) {
            u(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`, this);
            return;
          }
          t2.morphTargetDictionary[a2] !== void 0 && (a2 = t2.morphTargetDictionary[a2]);
        }
        c2 = this.BindingType.ArrayElement, this.resolvedProperty = o2, this.propertyIndex = a2;
      } else o2.fromArray !== void 0 && o2.toArray !== void 0 ? (c2 = this.BindingType.HasFromToArray, this.resolvedProperty = o2) : Array.isArray(o2) ? (c2 = this.BindingType.EntireArray, this.resolvedProperty = o2) : this.propertyName = i2;
      this.getValue = this.GetterByBindingType[c2], this.setValue = this.SetterByBindingTypeAndVersioning[c2][s2];
    }
    unbind() {
      this.node = null, this.getValue = this._getValue_unbound, this.setValue = this._setValue_unbound;
    }
  }, Zs.Composite = Xs, Zs.prototype.BindingType = { Direct: 0, EntireArray: 1, ArrayElement: 2, HasFromToArray: 3 }, Zs.prototype.Versioning = { None: 0, NeedsUpdate: 1, MatrixWorldNeedsUpdate: 2 }, Zs.prototype.GetterByBindingType = [Zs.prototype._getValue_direct, Zs.prototype._getValue_array, Zs.prototype._getValue_arrayElement, Zs.prototype._getValue_toArray], Zs.prototype.SetterByBindingTypeAndVersioning = [[Zs.prototype._setValue_direct, Zs.prototype._setValue_direct_setNeedsUpdate, Zs.prototype._setValue_direct_setMatrixWorldNeedsUpdate], [Zs.prototype._setValue_array, Zs.prototype._setValue_array_setNeedsUpdate, Zs.prototype._setValue_array_setMatrixWorldNeedsUpdate], [Zs.prototype._setValue_arrayElement, Zs.prototype._setValue_arrayElement_setNeedsUpdate, Zs.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate], [Zs.prototype._setValue_fromArray, Zs.prototype._setValue_fromArray_setNeedsUpdate, Zs.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]], Qs = new wr(), $s = class {
    constructor(e4, t2, n2 = 0, r2 = 1 / 0) {
      this.ray = new ca(e4, t2), this.near = n2, this.far = r2, this.camera = null, this.layers = new Fr(), this.params = { Mesh: {}, Line: { threshold: 1 }, LOD: {}, Points: { threshold: 1 }, Sprite: {} };
    }
    set(e4, t2) {
      this.ray.set(e4, t2);
    }
    setFromCamera(e4, t2) {
      t2.isPerspectiveCamera ? (this.ray.origin.setFromMatrixPosition(t2.matrixWorld), this.ray.direction.set(e4.x, e4.y, 0.5).unproject(t2).sub(this.ray.origin).normalize(), this.camera = t2) : t2.isOrthographicCamera ? (this.ray.origin.set(e4.x, e4.y, (t2.near + t2.far) / (t2.near - t2.far)).unproject(t2), this.ray.direction.set(0, 0, -1).transformDirection(t2.matrixWorld), this.camera = t2) : u(`Raycaster: Unsupported camera type: ` + t2.type);
    }
    setFromXRController(e4) {
      return Qs.identity().extractRotation(e4.matrixWorld), this.ray.origin.setFromMatrixPosition(e4.matrixWorld), this.ray.direction.set(0, 0, -1).applyMatrix4(Qs), this;
    }
    intersectObject(e4, t2 = true, n2 = []) {
      return pt(e4, this, n2, t2), n2.sort(ft), n2;
    }
    intersectObjects(e4, t2 = true, n2 = []) {
      for (let r2 = 0, i2 = e4.length; r2 < i2; r2++) pt(e4[r2], this, n2, t2);
      return n2.sort(ft), n2;
    }
  }, class e4 {
    static {
      e4.prototype.isMatrix2 = true;
    }
    constructor(e5, t2, n2, r2) {
      this.elements = [1, 0, 0, 1], e5 !== void 0 && this.set(e5, t2, n2, r2);
    }
    identity() {
      return this.set(1, 0, 0, 1), this;
    }
    fromArray(e5, t2 = 0) {
      for (let n2 = 0; n2 < 4; n2++) this.elements[n2] = e5[n2 + t2];
      return this;
    }
    set(e5, t2, n2, r2) {
      let i2 = this.elements;
      return i2[0] = e5, i2[2] = t2, i2[1] = n2, i2[3] = r2, this;
    }
  }, ec = new N(), tc = new N(), nc = new N(), rc = new N(), ic = new N(), ac = new N(), oc = new N(), sc = class {
    constructor(e4 = new N(), t2 = new N()) {
      this.start = e4, this.end = t2;
    }
    set(e4, t2) {
      return this.start.copy(e4), this.end.copy(t2), this;
    }
    copy(e4) {
      return this.start.copy(e4.start), this.end.copy(e4.end), this;
    }
    getCenter(e4) {
      return e4.addVectors(this.start, this.end).multiplyScalar(0.5);
    }
    delta(e4) {
      return e4.subVectors(this.end, this.start);
    }
    distanceSq() {
      return this.start.distanceToSquared(this.end);
    }
    distance() {
      return this.start.distanceTo(this.end);
    }
    at(e4, t2) {
      return this.delta(t2).multiplyScalar(e4).add(this.start);
    }
    closestPointToPointParameter(e4, t2) {
      ec.subVectors(e4, this.start), tc.subVectors(this.end, this.start);
      let n2 = tc.dot(tc);
      if (n2 === 0) return 0;
      let r2 = tc.dot(ec) / n2;
      return t2 && (r2 = m(r2, 0, 1)), r2;
    }
    closestPointToPoint(e4, t2, n2) {
      let r2 = this.closestPointToPointParameter(e4, t2);
      return this.delta(n2).multiplyScalar(r2).add(this.start);
    }
    distanceSqToLine3(e4, t2 = ac, n2 = oc) {
      let r2 = 1e-8 * 1e-8, i2, a2, o2 = this.start, s2 = e4.start, c2 = this.end, l2 = e4.end;
      nc.subVectors(c2, o2), rc.subVectors(l2, s2), ic.subVectors(o2, s2);
      let u2 = nc.dot(nc), d2 = rc.dot(rc), f2 = rc.dot(ic);
      if (u2 <= r2 && d2 <= r2) return t2.copy(o2), n2.copy(s2), t2.sub(n2), t2.dot(t2);
      if (u2 <= r2) i2 = 0, a2 = f2 / d2, a2 = m(a2, 0, 1);
      else {
        let e5 = nc.dot(ic);
        if (d2 <= r2) a2 = 0, i2 = m(-e5 / u2, 0, 1);
        else {
          let t3 = nc.dot(rc), n3 = u2 * d2 - t3 * t3;
          i2 = n3 === 0 ? 0 : m((t3 * f2 - e5 * d2) / n3, 0, 1), a2 = (t3 * i2 + f2) / d2, a2 < 0 ? (a2 = 0, i2 = m(-e5 / u2, 0, 1)) : a2 > 1 && (a2 = 1, i2 = m((t3 - e5) / u2, 0, 1));
        }
      }
      return t2.copy(o2).addScaledVector(nc, i2), n2.copy(s2).addScaledVector(rc, a2), t2.distanceToSquared(n2);
    }
    applyMatrix4(e4) {
      return this.start.applyMatrix4(e4), this.end.applyMatrix4(e4), this;
    }
    equals(e4) {
      return e4.start.equals(this.start) && e4.end.equals(this.end);
    }
    clone() {
      return new this.constructor().copy(this);
    }
  }, typeof __THREE_DEVTOOLS__ < `u` && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`, { detail: { revision: `184` } })), typeof window < `u` && (window.__THREE__ ? l(`WARNING: Multiple instances of Three.js being imported.`) : window.__THREE__ = `184`);
}));
function lc() {
  let e4 = null, t2 = false, n2 = null, r2 = null;
  function i2(t3, a2) {
    n2(t3, a2), r2 = e4.requestAnimationFrame(i2);
  }
  return { start: function() {
    t2 !== true && n2 !== null && e4 !== null && (r2 = e4.requestAnimationFrame(i2), t2 = true);
  }, stop: function() {
    e4 !== null && e4.cancelAnimationFrame(r2), t2 = false;
  }, setAnimationLoop: function(e5) {
    n2 = e5;
  }, setContext: function(t3) {
    e4 = t3;
  } };
}
function uc(e4) {
  let t2 = /* @__PURE__ */ new WeakMap();
  function n2(t3, n3) {
    let r3 = t3.array, i3 = t3.usage, a3 = r3.byteLength, o3 = e4.createBuffer();
    e4.bindBuffer(n3, o3), e4.bufferData(n3, r3, i3), t3.onUploadCallback();
    let s2;
    if (r3 instanceof Float32Array) s2 = e4.FLOAT;
    else if (typeof Float16Array < `u` && r3 instanceof Float16Array) s2 = e4.HALF_FLOAT;
    else if (r3 instanceof Uint16Array) s2 = t3.isFloat16BufferAttribute ? e4.HALF_FLOAT : e4.UNSIGNED_SHORT;
    else if (r3 instanceof Int16Array) s2 = e4.SHORT;
    else if (r3 instanceof Uint32Array) s2 = e4.UNSIGNED_INT;
    else if (r3 instanceof Int32Array) s2 = e4.INT;
    else if (r3 instanceof Int8Array) s2 = e4.BYTE;
    else if (r3 instanceof Uint8Array) s2 = e4.UNSIGNED_BYTE;
    else if (r3 instanceof Uint8ClampedArray) s2 = e4.UNSIGNED_BYTE;
    else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: ` + r3);
    return { buffer: o3, type: s2, bytesPerElement: r3.BYTES_PER_ELEMENT, version: t3.version, size: a3 };
  }
  function r2(t3, n3, r3) {
    let i3 = n3.array, a3 = n3.updateRanges;
    if (e4.bindBuffer(r3, t3), a3.length === 0) e4.bufferSubData(r3, 0, i3);
    else {
      a3.sort((e5, t5) => e5.start - t5.start);
      let t4 = 0;
      for (let e5 = 1; e5 < a3.length; e5++) {
        let n4 = a3[t4], r4 = a3[e5];
        r4.start <= n4.start + n4.count + 1 ? n4.count = Math.max(n4.count, r4.start + r4.count - n4.start) : (++t4, a3[t4] = r4);
      }
      a3.length = t4 + 1;
      for (let t5 = 0, n4 = a3.length; t5 < n4; t5++) {
        let n5 = a3[t5];
        e4.bufferSubData(r3, n5.start * i3.BYTES_PER_ELEMENT, i3, n5.start, n5.count);
      }
      n3.clearUpdateRanges();
    }
    n3.onUploadCallback();
  }
  function i2(e5) {
    return e5.isInterleavedBufferAttribute && (e5 = e5.data), t2.get(e5);
  }
  function a2(n3) {
    n3.isInterleavedBufferAttribute && (n3 = n3.data);
    let r3 = t2.get(n3);
    r3 && (e4.deleteBuffer(r3.buffer), t2.delete(n3));
  }
  function o2(e5, i3) {
    if (e5.isInterleavedBufferAttribute && (e5 = e5.data), e5.isGLBufferAttribute) {
      let n3 = t2.get(e5);
      (!n3 || n3.version < e5.version) && t2.set(e5, { buffer: e5.buffer, type: e5.type, bytesPerElement: e5.elementSize, version: e5.version });
      return;
    }
    let a3 = t2.get(e5);
    if (a3 === void 0) t2.set(e5, n2(e5, i3));
    else if (a3.version < e5.version) {
      if (a3.size !== e5.array.byteLength) throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);
      r2(a3.buffer, e5, i3), a3.version = e5.version;
    }
  }
  return { get: i2, remove: a2, update: o2 };
}
function dc(e4, t2, n2, r2, i2, a2) {
  let o2 = new P(0), s2 = i2 === true ? 0 : 1, c2, l2, u2 = null, d2 = 0, f2 = null;
  function p2(e5) {
    let n3 = e5.isScene === true ? e5.background : null;
    if (n3 && n3.isTexture) {
      let r3 = e5.backgroundBlurriness > 0;
      n3 = t2.get(n3, r3);
    }
    return n3;
  }
  function m2(t3) {
    let r3 = false, i3 = p2(t3);
    i3 === null ? g2(o2, s2) : i3 && i3.isColor && (g2(i3, 1), r3 = true);
    let c3 = e4.xr.getEnvironmentBlendMode();
    c3 === `additive` ? n2.buffers.color.setClear(0, 0, 0, 1, a2) : c3 === `alpha-blend` && n2.buffers.color.setClear(0, 0, 0, 0, a2), (e4.autoClear || r3) && (n2.buffers.depth.setTest(true), n2.buffers.depth.setMask(true), n2.buffers.color.setMask(true), e4.clear(e4.autoClearColor, e4.autoClearDepth, e4.autoClearStencil));
  }
  function h2(t3, n3) {
    let i3 = p2(n3);
    i3 && (i3.isCubeTexture || i3.mapping === 306) ? (l2 === void 0 && (l2 = new xa(new ao(1, 1, 1), new qo({ name: `BackgroundCubeMaterial`, uniforms: at(hu.backgroundCube.uniforms), vertexShader: hu.backgroundCube.vertexShader, fragmentShader: hu.backgroundCube.fragmentShader, side: 1, depthTest: false, depthWrite: false, fog: false, allowOverride: false })), l2.geometry.deleteAttribute(`normal`), l2.geometry.deleteAttribute(`uv`), l2.onBeforeRender = function(e5, t4, n4) {
      this.matrixWorld.copyPosition(n4.matrixWorld);
    }, Object.defineProperty(l2.material, `envMap`, { get: function() {
      return this.uniforms.envMap.value;
    } }), r2.update(l2)), l2.material.uniforms.envMap.value = i3, l2.material.uniforms.backgroundBlurriness.value = n3.backgroundBlurriness, l2.material.uniforms.backgroundIntensity.value = n3.backgroundIntensity, l2.material.uniforms.backgroundRotation.value.setFromMatrix4(_u.makeRotationFromEuler(n3.backgroundRotation)).transpose(), i3.isCubeTexture && i3.isRenderTargetTexture === false && l2.material.uniforms.backgroundRotation.value.premultiply(vu), l2.material.toneMapped = dr.getTransfer(i3.colorSpace) !== Wn, (u2 !== i3 || d2 !== i3.version || f2 !== e4.toneMapping) && (l2.material.needsUpdate = true, u2 = i3, d2 = i3.version, f2 = e4.toneMapping), l2.layers.enableAll(), t3.unshift(l2, l2.geometry, l2.material, 0, 0, null)) : i3 && i3.isTexture && (c2 === void 0 && (c2 = new xa(new Bo(2, 2), new qo({ name: `BackgroundMaterial`, uniforms: at(hu.background.uniforms), vertexShader: hu.background.vertexShader, fragmentShader: hu.background.fragmentShader, side: 0, depthTest: false, depthWrite: false, fog: false, allowOverride: false })), c2.geometry.deleteAttribute(`normal`), Object.defineProperty(c2.material, `map`, { get: function() {
      return this.uniforms.t2D.value;
    } }), r2.update(c2)), c2.material.uniforms.t2D.value = i3, c2.material.uniforms.backgroundIntensity.value = n3.backgroundIntensity, c2.material.toneMapped = dr.getTransfer(i3.colorSpace) !== Wn, i3.matrixAutoUpdate === true && i3.updateMatrix(), c2.material.uniforms.uvTransform.value.copy(i3.matrix), (u2 !== i3 || d2 !== i3.version || f2 !== e4.toneMapping) && (c2.material.needsUpdate = true, u2 = i3, d2 = i3.version, f2 = e4.toneMapping), c2.layers.enableAll(), t3.unshift(c2, c2.geometry, c2.material, 0, 0, null));
  }
  function g2(t3, r3) {
    t3.getRGB(gu, lt(e4)), n2.buffers.color.setClear(gu.r, gu.g, gu.b, r3, a2);
  }
  function _2() {
    l2 !== void 0 && (l2.geometry.dispose(), l2.material.dispose(), l2 = void 0), c2 !== void 0 && (c2.geometry.dispose(), c2.material.dispose(), c2 = void 0);
  }
  return { getClearColor: function() {
    return o2;
  }, setClearColor: function(e5, t3 = 1) {
    o2.set(e5), s2 = t3, g2(o2, s2);
  }, getClearAlpha: function() {
    return s2;
  }, setClearAlpha: function(e5) {
    s2 = e5, g2(o2, s2);
  }, render: m2, addToRenderList: h2, dispose: _2 };
}
function fc(e4, t2) {
  let n2 = e4.getParameter(e4.MAX_VERTEX_ATTRIBS), r2 = {}, i2 = f2(null), a2 = i2, o2 = false;
  function s2(n3, r3, i3, s3, c3) {
    let u3 = false, f3 = d2(n3, s3, i3, r3);
    a2 !== f3 && (a2 = f3, l2(a2.object)), u3 = p2(n3, s3, i3, c3), u3 && m2(n3, s3, i3, c3), c3 !== null && t2.update(c3, e4.ELEMENT_ARRAY_BUFFER), (u3 || o2) && (o2 = false, b2(n3, r3, i3, s3), c3 !== null && e4.bindBuffer(e4.ELEMENT_ARRAY_BUFFER, t2.get(c3).buffer));
  }
  function c2() {
    return e4.createVertexArray();
  }
  function l2(t3) {
    return e4.bindVertexArray(t3);
  }
  function u2(t3) {
    return e4.deleteVertexArray(t3);
  }
  function d2(e5, t3, n3, i3) {
    let a3 = i3.wireframe === true, o3 = r2[t3.id];
    o3 === void 0 && (o3 = {}, r2[t3.id] = o3);
    let s3 = e5.isInstancedMesh === true ? e5.id : 0, l3 = o3[s3];
    l3 === void 0 && (l3 = {}, o3[s3] = l3);
    let u3 = l3[n3.id];
    u3 === void 0 && (u3 = {}, l3[n3.id] = u3);
    let d3 = u3[a3];
    return d3 === void 0 && (d3 = f2(c2()), u3[a3] = d3), d3;
  }
  function f2(e5) {
    let t3 = [], r3 = [], i3 = [];
    for (let e6 = 0; e6 < n2; e6++) t3[e6] = 0, r3[e6] = 0, i3[e6] = 0;
    return { geometry: null, program: null, wireframe: false, newAttributes: t3, enabledAttributes: r3, attributeDivisors: i3, object: e5, attributes: {}, index: null };
  }
  function p2(e5, t3, n3, r3) {
    let i3 = a2.attributes, o3 = t3.attributes, s3 = 0, c3 = n3.getAttributes();
    for (let t4 in c3) if (c3[t4].location >= 0) {
      let n4 = i3[t4], r4 = o3[t4];
      if (r4 === void 0 && (t4 === `instanceMatrix` && e5.instanceMatrix && (r4 = e5.instanceMatrix), t4 === `instanceColor` && e5.instanceColor && (r4 = e5.instanceColor)), n4 === void 0 || n4.attribute !== r4 || r4 && n4.data !== r4.data) return true;
      s3++;
    }
    return a2.attributesNum !== s3 || a2.index !== r3;
  }
  function m2(e5, t3, n3, r3) {
    let i3 = {}, o3 = t3.attributes, s3 = 0, c3 = n3.getAttributes();
    for (let t4 in c3) if (c3[t4].location >= 0) {
      let n4 = o3[t4];
      n4 === void 0 && (t4 === `instanceMatrix` && e5.instanceMatrix && (n4 = e5.instanceMatrix), t4 === `instanceColor` && e5.instanceColor && (n4 = e5.instanceColor));
      let r4 = {};
      r4.attribute = n4, n4 && n4.data && (r4.data = n4.data), i3[t4] = r4, s3++;
    }
    a2.attributes = i3, a2.attributesNum = s3, a2.index = r3;
  }
  function h2() {
    let e5 = a2.newAttributes;
    for (let t3 = 0, n3 = e5.length; t3 < n3; t3++) e5[t3] = 0;
  }
  function g2(e5) {
    _2(e5, 0);
  }
  function _2(t3, n3) {
    let r3 = a2.newAttributes, i3 = a2.enabledAttributes, o3 = a2.attributeDivisors;
    r3[t3] = 1, i3[t3] === 0 && (e4.enableVertexAttribArray(t3), i3[t3] = 1), o3[t3] !== n3 && (e4.vertexAttribDivisor(t3, n3), o3[t3] = n3);
  }
  function v2() {
    let t3 = a2.newAttributes, n3 = a2.enabledAttributes;
    for (let r3 = 0, i3 = n3.length; r3 < i3; r3++) n3[r3] !== t3[r3] && (e4.disableVertexAttribArray(r3), n3[r3] = 0);
  }
  function y2(t3, n3, r3, i3, a3, o3, s3) {
    s3 === true ? e4.vertexAttribIPointer(t3, n3, r3, a3, o3) : e4.vertexAttribPointer(t3, n3, r3, i3, a3, o3);
  }
  function b2(n3, r3, i3, a3) {
    h2();
    let o3 = a3.attributes, s3 = i3.getAttributes(), c3 = r3.defaultAttributeValues;
    for (let r4 in s3) {
      let i4 = s3[r4];
      if (i4.location >= 0) {
        let s4 = o3[r4];
        if (s4 === void 0 && (r4 === `instanceMatrix` && n3.instanceMatrix && (s4 = n3.instanceMatrix), r4 === `instanceColor` && n3.instanceColor && (s4 = n3.instanceColor)), s4 !== void 0) {
          let r5 = s4.normalized, o4 = s4.itemSize, c4 = t2.get(s4);
          if (c4 === void 0) continue;
          let l3 = c4.buffer, u3 = c4.type, d3 = c4.bytesPerElement, f3 = u3 === e4.INT || u3 === e4.UNSIGNED_INT || s4.gpuType === 1013;
          if (s4.isInterleavedBufferAttribute) {
            let t3 = s4.data, c5 = t3.stride, p3 = s4.offset;
            if (t3.isInstancedInterleavedBuffer) {
              for (let e5 = 0; e5 < i4.locationSize; e5++) _2(i4.location + e5, t3.meshPerAttribute);
              n3.isInstancedMesh !== true && a3._maxInstanceCount === void 0 && (a3._maxInstanceCount = t3.meshPerAttribute * t3.count);
            } else for (let e5 = 0; e5 < i4.locationSize; e5++) g2(i4.location + e5);
            e4.bindBuffer(e4.ARRAY_BUFFER, l3);
            for (let e5 = 0; e5 < i4.locationSize; e5++) y2(i4.location + e5, o4 / i4.locationSize, u3, r5, c5 * d3, (p3 + o4 / i4.locationSize * e5) * d3, f3);
          } else {
            if (s4.isInstancedBufferAttribute) {
              for (let e5 = 0; e5 < i4.locationSize; e5++) _2(i4.location + e5, s4.meshPerAttribute);
              n3.isInstancedMesh !== true && a3._maxInstanceCount === void 0 && (a3._maxInstanceCount = s4.meshPerAttribute * s4.count);
            } else for (let e5 = 0; e5 < i4.locationSize; e5++) g2(i4.location + e5);
            e4.bindBuffer(e4.ARRAY_BUFFER, l3);
            for (let e5 = 0; e5 < i4.locationSize; e5++) y2(i4.location + e5, o4 / i4.locationSize, u3, r5, o4 * d3, o4 / i4.locationSize * e5 * d3, f3);
          }
        } else if (c3 !== void 0) {
          let t3 = c3[r4];
          if (t3 !== void 0) switch (t3.length) {
            case 2:
              e4.vertexAttrib2fv(i4.location, t3);
              break;
            case 3:
              e4.vertexAttrib3fv(i4.location, t3);
              break;
            case 4:
              e4.vertexAttrib4fv(i4.location, t3);
              break;
            default:
              e4.vertexAttrib1fv(i4.location, t3);
          }
        }
      }
    }
    v2();
  }
  function x2() {
    T2();
    for (let e5 in r2) {
      let t3 = r2[e5];
      for (let e6 in t3) {
        let n3 = t3[e6];
        for (let e7 in n3) {
          let t4 = n3[e7];
          for (let e8 in t4) u2(t4[e8].object), delete t4[e8];
          delete n3[e7];
        }
      }
      delete r2[e5];
    }
  }
  function S2(e5) {
    if (r2[e5.id] === void 0) return;
    let t3 = r2[e5.id];
    for (let e6 in t3) {
      let n3 = t3[e6];
      for (let e7 in n3) {
        let t4 = n3[e7];
        for (let e8 in t4) u2(t4[e8].object), delete t4[e8];
        delete n3[e7];
      }
    }
    delete r2[e5.id];
  }
  function C2(e5) {
    for (let t3 in r2) {
      let n3 = r2[t3];
      for (let t4 in n3) {
        let r3 = n3[t4];
        if (r3[e5.id] === void 0) continue;
        let i3 = r3[e5.id];
        for (let e6 in i3) u2(i3[e6].object), delete i3[e6];
        delete r3[e5.id];
      }
    }
  }
  function w2(e5) {
    for (let t3 in r2) {
      let n3 = r2[t3], i3 = e5.isInstancedMesh === true ? e5.id : 0, a3 = n3[i3];
      if (a3 !== void 0) {
        for (let e6 in a3) {
          let t4 = a3[e6];
          for (let e7 in t4) u2(t4[e7].object), delete t4[e7];
          delete a3[e6];
        }
        delete n3[i3], Object.keys(n3).length === 0 && delete r2[t3];
      }
    }
  }
  function T2() {
    E2(), o2 = true, a2 !== i2 && (a2 = i2, l2(a2.object));
  }
  function E2() {
    i2.geometry = null, i2.program = null, i2.wireframe = false;
  }
  return { setup: s2, reset: T2, resetDefaultState: E2, dispose: x2, releaseStatesOfGeometry: S2, releaseStatesOfObject: w2, releaseStatesOfProgram: C2, initAttributes: h2, enableAttribute: g2, disableUnusedAttributes: v2 };
}
function pc(e4, t2, n2) {
  let r2;
  function i2(e5) {
    r2 = e5;
  }
  function a2(t3, i3) {
    e4.drawArrays(r2, t3, i3), n2.update(i3, r2, 1);
  }
  function o2(t3, i3, a3) {
    a3 !== 0 && (e4.drawArraysInstanced(r2, t3, i3, a3), n2.update(i3, r2, a3));
  }
  function s2(e5, i3, a3) {
    if (a3 === 0) return;
    t2.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r2, e5, 0, i3, 0, a3);
    let o3 = 0;
    for (let e6 = 0; e6 < a3; e6++) o3 += i3[e6];
    n2.update(o3, r2, 1);
  }
  this.setMode = i2, this.render = a2, this.renderInstances = o2, this.renderMultiDraw = s2;
}
function mc(e4, t2, n2, r2) {
  let i2;
  function a2() {
    if (i2 !== void 0) return i2;
    if (t2.has(`EXT_texture_filter_anisotropic`) === true) {
      let n3 = t2.get(`EXT_texture_filter_anisotropic`);
      i2 = e4.getParameter(n3.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    } else i2 = 0;
    return i2;
  }
  function o2(t3) {
    return !(t3 !== 1023 && r2.convert(t3) !== e4.getParameter(e4.IMPLEMENTATION_COLOR_READ_FORMAT));
  }
  function s2(n3) {
    let i3 = n3 === 1016 && (t2.has(`EXT_color_buffer_half_float`) || t2.has(`EXT_color_buffer_float`));
    return !(n3 !== 1009 && r2.convert(n3) !== e4.getParameter(e4.IMPLEMENTATION_COLOR_READ_TYPE) && n3 !== 1015 && !i3);
  }
  function c2(t3) {
    if (t3 === `highp`) {
      if (e4.getShaderPrecisionFormat(e4.VERTEX_SHADER, e4.HIGH_FLOAT).precision > 0 && e4.getShaderPrecisionFormat(e4.FRAGMENT_SHADER, e4.HIGH_FLOAT).precision > 0) return `highp`;
      t3 = `mediump`;
    }
    return t3 === `mediump` && e4.getShaderPrecisionFormat(e4.VERTEX_SHADER, e4.MEDIUM_FLOAT).precision > 0 && e4.getShaderPrecisionFormat(e4.FRAGMENT_SHADER, e4.MEDIUM_FLOAT).precision > 0 ? `mediump` : `lowp`;
  }
  let u2 = n2.precision === void 0 ? `highp` : n2.precision, d2 = c2(u2);
  d2 !== u2 && (l(`WebGLRenderer:`, u2, `not supported, using`, d2, `instead.`), u2 = d2);
  let f2 = n2.logarithmicDepthBuffer === true, p2 = n2.reversedDepthBuffer === true && t2.has(`EXT_clip_control`);
  n2.reversedDepthBuffer === true && p2 === false && l(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);
  let m2 = e4.getParameter(e4.MAX_TEXTURE_IMAGE_UNITS), h2 = e4.getParameter(e4.MAX_VERTEX_TEXTURE_IMAGE_UNITS), g2 = e4.getParameter(e4.MAX_TEXTURE_SIZE), _2 = e4.getParameter(e4.MAX_CUBE_MAP_TEXTURE_SIZE), v2 = e4.getParameter(e4.MAX_VERTEX_ATTRIBS), y2 = e4.getParameter(e4.MAX_VERTEX_UNIFORM_VECTORS), b2 = e4.getParameter(e4.MAX_VARYING_VECTORS), x2 = e4.getParameter(e4.MAX_FRAGMENT_UNIFORM_VECTORS), S2 = e4.getParameter(e4.MAX_SAMPLES), C2 = e4.getParameter(e4.SAMPLES);
  return { isWebGL2: true, getMaxAnisotropy: a2, getMaxPrecision: c2, textureFormatReadable: o2, textureTypeReadable: s2, precision: u2, logarithmicDepthBuffer: f2, reversedDepthBuffer: p2, maxTextures: m2, maxVertexTextures: h2, maxTextureSize: g2, maxCubemapSize: _2, maxAttributes: v2, maxVertexUniforms: y2, maxVaryings: b2, maxFragmentUniforms: x2, maxSamples: S2, samples: C2 };
}
function hc(e4) {
  let t2 = this, n2 = null, r2 = 0, i2 = false, a2 = false, o2 = new Ya(), s2 = new sr(), c2 = { value: null, needsUpdate: false };
  this.uniform = c2, this.numPlanes = 0, this.numIntersection = 0, this.init = function(e5, t3) {
    let n3 = e5.length !== 0 || t3 || r2 !== 0 || i2;
    return i2 = t3, r2 = e5.length, n3;
  }, this.beginShadows = function() {
    a2 = true, u2(null);
  }, this.endShadows = function() {
    a2 = false;
  }, this.setGlobalState = function(e5, t3) {
    n2 = u2(e5, t3, 0);
  }, this.setState = function(t3, o3, s3) {
    let d2 = t3.clippingPlanes, f2 = t3.clipIntersection, p2 = t3.clipShadows, m2 = e4.get(t3);
    if (!i2 || d2 === null || d2.length === 0 || a2 && !p2) a2 ? u2(null) : l2();
    else {
      let e5 = a2 ? 0 : r2, t4 = e5 * 4, i3 = m2.clippingState || null;
      c2.value = i3, i3 = u2(d2, o3, t4, s3);
      for (let e6 = 0; e6 !== t4; ++e6) i3[e6] = n2[e6];
      m2.clippingState = i3, this.numIntersection = f2 ? this.numPlanes : 0, this.numPlanes += e5;
    }
  };
  function l2() {
    c2.value !== n2 && (c2.value = n2, c2.needsUpdate = r2 > 0), t2.numPlanes = r2, t2.numIntersection = 0;
  }
  function u2(e5, n3, r3, i3) {
    let a3 = e5 === null ? 0 : e5.length, l3 = null;
    if (a3 !== 0) {
      if (l3 = c2.value, i3 !== true || l3 === null) {
        let t3 = r3 + a3 * 4, i4 = n3.matrixWorldInverse;
        s2.getNormalMatrix(i4), (l3 === null || l3.length < t3) && (l3 = new Float32Array(t3));
        for (let t4 = 0, n4 = r3; t4 !== a3; ++t4, n4 += 4) o2.copy(e5[t4]).applyMatrix4(i4, s2), o2.normal.toArray(l3, n4), l3[n4 + 3] = o2.constant;
      }
      c2.value = l3, c2.needsUpdate = true;
    }
    return t2.numPlanes = a3, t2.numIntersection = 0, l3;
  }
}
function gc(e4) {
  let t2 = [], n2 = [], r2 = [], i2 = e4, a2 = e4 - yu + 1 + bu.length;
  for (let o2 = 0; o2 < a2; o2++) {
    let a3 = 2 ** i2;
    t2.push(a3);
    let s2 = 1 / a3;
    o2 > e4 - yu ? s2 = bu[o2 - e4 + yu - 1] : o2 === 0 && (s2 = 0), n2.push(s2);
    let c2 = 1 / (a3 - 2), l2 = -c2, u2 = 1 + c2, d2 = [l2, l2, u2, l2, u2, u2, l2, l2, u2, u2, l2, u2], f2 = new Float32Array(108), p2 = new Float32Array(72), m2 = new Float32Array(36);
    for (let e5 = 0; e5 < 6; e5++) {
      let t3 = e5 % 3 * 2 / 3 - 1, n3 = e5 > 2 ? 0 : -1, r3 = [t3, n3, 0, t3 + 2 / 3, n3, 0, t3 + 2 / 3, n3 + 1, 0, t3, n3, 0, t3 + 2 / 3, n3 + 1, 0, t3, n3 + 1, 0];
      f2.set(r3, 18 * e5), p2.set(d2, 12 * e5);
      let i3 = [e5, e5, e5, e5, e5, e5];
      m2.set(i3, 6 * e5);
    }
    let h2 = new Qi();
    h2.setAttribute(`position`, new Li(f2, 3)), h2.setAttribute(`uv`, new Li(p2, 2)), h2.setAttribute(`faceIndex`, new Li(m2, 1)), r2.push(new xa(h2, null)), i2 > yu && i2--;
  }
  return { lodMeshes: r2, sizeLods: t2, sigmas: n2 };
}
function _c(e4, t2, n2) {
  let r2 = new xr(e4, t2, n2);
  return r2.texture.mapping = 306, r2.texture.name = `PMREM.cubeUv`, r2.scissorTest = true, r2;
}
function vc(e4, t2, n2, r2, i2) {
  e4.viewport.set(t2, n2, r2, i2), e4.scissor.set(t2, n2, r2, i2);
}
function yc(e4, t2, n2) {
  return new qo({ name: `PMREMGGXConvolution`, defines: { GGX_SAMPLES: Su, CUBEUV_TEXEL_WIDTH: 1 / t2, CUBEUV_TEXEL_HEIGHT: 1 / n2, CUBEUV_MAX_MIP: `${e4}.0` }, uniforms: { envMap: { value: null }, roughness: { value: 0 }, mipInt: { value: 0 } }, vertexShader: Cc(), fragmentShader: `

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`, blending: 0, depthTest: false, depthWrite: false });
}
function bc(e4, t2, n2) {
  let r2 = new Float32Array(xu), i2 = new N(0, 1, 0);
  return new qo({ name: `SphericalGaussianBlur`, defines: { n: xu, CUBEUV_TEXEL_WIDTH: 1 / t2, CUBEUV_TEXEL_HEIGHT: 1 / n2, CUBEUV_MAX_MIP: `${e4}.0` }, uniforms: { envMap: { value: null }, samples: { value: 1 }, weights: { value: r2 }, latitudinal: { value: false }, dTheta: { value: 0 }, mipInt: { value: 0 }, poleAxis: { value: i2 } }, vertexShader: Cc(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`, blending: 0, depthTest: false, depthWrite: false });
}
function xc() {
  return new qo({ name: `EquirectangularToCubeUV`, uniforms: { envMap: { value: null } }, vertexShader: Cc(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`, blending: 0, depthTest: false, depthWrite: false });
}
function Sc() {
  return new qo({ name: `CubemapToCubeUV`, uniforms: { envMap: { value: null }, flipEnvMap: { value: -1 } }, vertexShader: Cc(), fragmentShader: `

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`, blending: 0, depthTest: false, depthWrite: false });
}
function Cc() {
  return `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`;
}
function wc(e4) {
  let t2 = /* @__PURE__ */ new WeakMap(), n2 = /* @__PURE__ */ new WeakMap(), r2 = null;
  function i2(e5, t3 = false) {
    return e5 == null ? null : t3 ? o2(e5) : a2(e5);
  }
  function a2(n3) {
    if (n3 && n3.isTexture) {
      let r3 = n3.mapping;
      if (r3 === 303 || r3 === 304) if (t2.has(n3)) {
        let e5 = t2.get(n3).texture;
        return s2(e5, n3.mapping);
      } else {
        let r4 = n3.image;
        if (r4 && r4.height > 0) {
          let i3 = new ju(r4.height);
          return i3.fromEquirectangularTexture(e4, n3), t2.set(n3, i3), n3.addEventListener(`dispose`, l2), s2(i3.texture, n3.mapping);
        } else return null;
      }
    }
    return n3;
  }
  function o2(t3) {
    if (t3 && t3.isTexture) {
      let i3 = t3.mapping, a3 = i3 === 303 || i3 === 304, o3 = i3 === 301 || i3 === 302;
      if (a3 || o3) {
        let i4 = n2.get(t3), s3 = i4 === void 0 ? 0 : i4.texture.pmremVersion;
        if (t3.isRenderTargetTexture && t3.pmremVersion !== s3) return r2 === null && (r2 = new Au(e4)), i4 = a3 ? r2.fromEquirectangular(t3, i4) : r2.fromCubemap(t3, i4), i4.texture.pmremVersion = t3.pmremVersion, n2.set(t3, i4), i4.texture;
        if (i4 !== void 0) return i4.texture;
        {
          let s4 = t3.image;
          return a3 && s4 && s4.height > 0 || o3 && s4 && c2(s4) ? (r2 === null && (r2 = new Au(e4)), i4 = a3 ? r2.fromEquirectangular(t3) : r2.fromCubemap(t3), i4.texture.pmremVersion = t3.pmremVersion, n2.set(t3, i4), t3.addEventListener(`dispose`, u2), i4.texture) : null;
        }
      }
    }
    return t3;
  }
  function s2(e5, t3) {
    return t3 === 303 ? e5.mapping = 301 : t3 === 304 && (e5.mapping = 302), e5;
  }
  function c2(e5) {
    let t3 = 0;
    for (let n3 = 0; n3 < 6; n3++) e5[n3] !== void 0 && t3++;
    return t3 === 6;
  }
  function l2(e5) {
    let n3 = e5.target;
    n3.removeEventListener(`dispose`, l2);
    let r3 = t2.get(n3);
    r3 !== void 0 && (t2.delete(n3), r3.dispose());
  }
  function u2(e5) {
    let t3 = e5.target;
    t3.removeEventListener(`dispose`, u2);
    let r3 = n2.get(t3);
    r3 !== void 0 && (n2.delete(t3), r3.dispose());
  }
  function d2() {
    t2 = /* @__PURE__ */ new WeakMap(), n2 = /* @__PURE__ */ new WeakMap(), r2 !== null && (r2.dispose(), r2 = null);
  }
  return { get: i2, dispose: d2 };
}
function Tc(e4) {
  let t2 = {};
  function n2(n3) {
    if (t2[n3] !== void 0) return t2[n3];
    let r2 = e4.getExtension(n3);
    return t2[n3] = r2, r2;
  }
  return { has: function(e5) {
    return n2(e5) !== null;
  }, init: function() {
    n2(`EXT_color_buffer_float`), n2(`WEBGL_clip_cull_distance`), n2(`OES_texture_float_linear`), n2(`EXT_color_buffer_half_float`), n2(`WEBGL_multisampled_render_to_texture`), n2(`WEBGL_render_shared_exponent`);
  }, get: function(e5) {
    let t3 = n2(e5);
    return t3 === null && d(`WebGLRenderer: ` + e5 + ` extension not supported.`), t3;
  } };
}
function Ec(e4, t2, n2, r2) {
  let i2 = {}, a2 = /* @__PURE__ */ new WeakMap();
  function o2(e5) {
    let s3 = e5.target;
    s3.index !== null && t2.remove(s3.index);
    for (let e6 in s3.attributes) t2.remove(s3.attributes[e6]);
    s3.removeEventListener(`dispose`, o2), delete i2[s3.id];
    let c3 = a2.get(s3);
    c3 && (t2.remove(c3), a2.delete(s3)), r2.releaseStatesOfGeometry(s3), s3.isInstancedBufferGeometry === true && delete s3._maxInstanceCount, n2.memory.geometries--;
  }
  function s2(e5, t3) {
    return i2[t3.id] === true ? t3 : (t3.addEventListener(`dispose`, o2), i2[t3.id] = true, n2.memory.geometries++, t3);
  }
  function c2(n3) {
    let r3 = n3.attributes;
    for (let n4 in r3) t2.update(r3[n4], e4.ARRAY_BUFFER);
  }
  function l2(e5) {
    let n3 = [], r3 = e5.index, i3 = e5.attributes.position, o3 = 0;
    if (i3 === void 0) return;
    if (r3 !== null) {
      let e6 = r3.array;
      o3 = r3.version;
      for (let t3 = 0, r4 = e6.length; t3 < r4; t3 += 3) {
        let r5 = e6[t3 + 0], i4 = e6[t3 + 1], a3 = e6[t3 + 2];
        n3.push(r5, i4, i4, a3, a3, r5);
      }
    } else {
      let e6 = i3.array;
      o3 = i3.version;
      for (let t3 = 0, r4 = e6.length / 3 - 1; t3 < r4; t3 += 3) {
        let e7 = t3 + 0, r5 = t3 + 1, i4 = t3 + 2;
        n3.push(e7, r5, r5, i4, i4, e7);
      }
    }
    let s3 = new (i3.count >= 65535 ? zi : Ri)(n3, 1);
    s3.version = o3;
    let c3 = a2.get(e5);
    c3 && t2.remove(c3), a2.set(e5, s3);
  }
  function u2(e5) {
    let t3 = a2.get(e5);
    if (t3) {
      let n3 = e5.index;
      n3 !== null && t3.version < n3.version && l2(e5);
    } else l2(e5);
    return a2.get(e5);
  }
  return { get: s2, update: c2, getWireframeAttribute: u2 };
}
function Dc(e4, t2, n2) {
  let r2;
  function i2(e5) {
    r2 = e5;
  }
  let a2, o2;
  function s2(e5) {
    a2 = e5.type, o2 = e5.bytesPerElement;
  }
  function c2(t3, i3) {
    e4.drawElements(r2, i3, a2, t3 * o2), n2.update(i3, r2, 1);
  }
  function l2(t3, i3, s3) {
    s3 !== 0 && (e4.drawElementsInstanced(r2, i3, a2, t3 * o2, s3), n2.update(i3, r2, s3));
  }
  function u2(e5, i3, o3) {
    if (o3 === 0) return;
    t2.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r2, i3, 0, a2, e5, 0, o3);
    let s3 = 0;
    for (let e6 = 0; e6 < o3; e6++) s3 += i3[e6];
    n2.update(s3, r2, 1);
  }
  this.setMode = i2, this.setIndex = s2, this.render = c2, this.renderInstances = l2, this.renderMultiDraw = u2;
}
function Oc(e4) {
  let t2 = { geometries: 0, textures: 0 }, n2 = { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 };
  function r2(t3, r3, i3) {
    switch (n2.calls++, r3) {
      case e4.TRIANGLES:
        n2.triangles += t3 / 3 * i3;
        break;
      case e4.LINES:
        n2.lines += t3 / 2 * i3;
        break;
      case e4.LINE_STRIP:
        n2.lines += i3 * (t3 - 1);
        break;
      case e4.LINE_LOOP:
        n2.lines += i3 * t3;
        break;
      case e4.POINTS:
        n2.points += i3 * t3;
        break;
      default:
        u(`WebGLInfo: Unknown draw mode:`, r3);
        break;
    }
  }
  function i2() {
    n2.calls = 0, n2.triangles = 0, n2.points = 0, n2.lines = 0;
  }
  return { memory: t2, render: n2, programs: null, autoReset: true, reset: i2, update: r2 };
}
function kc(e4, t2, n2) {
  let r2 = /* @__PURE__ */ new WeakMap(), i2 = new yr();
  function a2(a3, o2, s2) {
    let c2 = a3.morphTargetInfluences, l2 = o2.morphAttributes.position || o2.morphAttributes.normal || o2.morphAttributes.color, u2 = l2 === void 0 ? 0 : l2.length, d2 = r2.get(o2);
    if (d2 === void 0 || d2.count !== u2) {
      let v2 = function() {
        g2.dispose(), r2.delete(o2), o2.removeEventListener(`dispose`, v2);
      };
      d2 !== void 0 && d2.texture.dispose();
      let e5 = o2.morphAttributes.position !== void 0, n3 = o2.morphAttributes.normal !== void 0, a4 = o2.morphAttributes.color !== void 0, s3 = o2.morphAttributes.position || [], c3 = o2.morphAttributes.normal || [], l3 = o2.morphAttributes.color || [], f2 = 0;
      e5 === true && (f2 = 1), n3 === true && (f2 = 2), a4 === true && (f2 = 3);
      let p2 = o2.attributes.position.count * f2, m2 = 1;
      p2 > t2.maxTextureSize && (m2 = Math.ceil(p2 / t2.maxTextureSize), p2 = t2.maxTextureSize);
      let h2 = new Float32Array(p2 * m2 * 4 * u2), g2 = new Sr(h2, p2, m2, u2);
      g2.type = Mt, g2.needsUpdate = true;
      let _2 = f2 * 4;
      for (let t3 = 0; t3 < u2; t3++) {
        let r3 = s3[t3], o3 = c3[t3], u3 = l3[t3], d3 = p2 * m2 * 4 * t3;
        for (let t4 = 0; t4 < r3.count; t4++) {
          let s4 = t4 * _2;
          e5 === true && (i2.fromBufferAttribute(r3, t4), h2[d3 + s4 + 0] = i2.x, h2[d3 + s4 + 1] = i2.y, h2[d3 + s4 + 2] = i2.z, h2[d3 + s4 + 3] = 0), n3 === true && (i2.fromBufferAttribute(o3, t4), h2[d3 + s4 + 4] = i2.x, h2[d3 + s4 + 5] = i2.y, h2[d3 + s4 + 6] = i2.z, h2[d3 + s4 + 7] = 0), a4 === true && (i2.fromBufferAttribute(u3, t4), h2[d3 + s4 + 8] = i2.x, h2[d3 + s4 + 9] = i2.y, h2[d3 + s4 + 10] = i2.z, h2[d3 + s4 + 11] = u3.itemSize === 4 ? i2.w : 1);
        }
      }
      d2 = { count: u2, texture: g2, size: new M(p2, m2) }, r2.set(o2, d2);
      o2.addEventListener(`dispose`, v2);
    }
    if (a3.isInstancedMesh === true && a3.morphTexture !== null) s2.getUniforms().setValue(e4, `morphTexture`, a3.morphTexture, n2);
    else {
      let t3 = 0;
      for (let e5 = 0; e5 < c2.length; e5++) t3 += c2[e5];
      let n3 = o2.morphTargetsRelative ? 1 : 1 - t3;
      s2.getUniforms().setValue(e4, `morphTargetBaseInfluence`, n3), s2.getUniforms().setValue(e4, `morphTargetInfluences`, c2);
    }
    s2.getUniforms().setValue(e4, `morphTargetsTexture`, d2.texture, n2), s2.getUniforms().setValue(e4, `morphTargetsTextureSize`, d2.size);
  }
  return { update: a2 };
}
function Ac(e4, t2, n2, r2, i2) {
  let a2 = /* @__PURE__ */ new WeakMap();
  function o2(r3) {
    let o3 = i2.render.frame, s3 = r3.geometry, l2 = t2.get(r3, s3);
    if (a2.get(l2) !== o3 && (t2.update(l2), a2.set(l2, o3)), r3.isInstancedMesh && (r3.hasEventListener(`dispose`, c2) === false && r3.addEventListener(`dispose`, c2), a2.get(r3) !== o3 && (n2.update(r3.instanceMatrix, e4.ARRAY_BUFFER), r3.instanceColor !== null && n2.update(r3.instanceColor, e4.ARRAY_BUFFER), a2.set(r3, o3))), r3.isSkinnedMesh) {
      let e5 = r3.skeleton;
      a2.get(e5) !== o3 && (e5.update(), a2.set(e5, o3));
    }
    return l2;
  }
  function s2() {
    a2 = /* @__PURE__ */ new WeakMap();
  }
  function c2(e5) {
    let t3 = e5.target;
    t3.removeEventListener(`dispose`, c2), r2.releaseStatesOfObject(t3), n2.remove(t3.instanceMatrix), t3.instanceColor !== null && n2.remove(t3.instanceColor);
  }
  return { update: o2, dispose: s2 };
}
function jc(e4, t2, n2, r2, i2) {
  let a2 = new xr(t2, n2, { type: e4, depthBuffer: r2, stencilBuffer: i2, depthTexture: r2 ? new no(t2, n2) : void 0 }), o2 = new xr(t2, n2, { type: Nt, depthBuffer: false, stencilBuffer: false }), s2 = new Qi();
  s2.setAttribute(`position`, new Bi([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)), s2.setAttribute(`uv`, new Bi([0, 2, 0, 0, 2, 0], 2));
  let c2 = new Jo({ uniforms: { tDiffuse: { value: null } }, vertexShader: `
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`, fragmentShader: `
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`, depthTest: false, depthWrite: false }), l2 = new xa(s2, c2), u2 = new js(-1, 1, 1, -1, 0, 1), d2 = null, f2 = null, p2 = false, m2, h2 = null, g2 = [], _2 = false;
  this.setSize = function(e5, t3) {
    a2.setSize(e5, t3), o2.setSize(e5, t3);
    for (let n3 = 0; n3 < g2.length; n3++) {
      let r3 = g2[n3];
      r3.setSize && r3.setSize(e5, t3);
    }
  }, this.setEffects = function(e5) {
    g2 = e5, _2 = g2.length > 0 && g2[0].isRenderPass === true;
    let t3 = a2.width, n3 = a2.height;
    for (let e6 = 0; e6 < g2.length; e6++) {
      let r3 = g2[e6];
      r3.setSize && r3.setSize(t3, n3);
    }
  }, this.begin = function(e5, t3) {
    if (p2 || e5.toneMapping === 0 && g2.length === 0) return false;
    if (h2 = t3, t3 !== null) {
      let e6 = t3.width, n3 = t3.height;
      (a2.width !== e6 || a2.height !== n3) && this.setSize(e6, n3);
    }
    return _2 === false && e5.setRenderTarget(a2), m2 = e5.toneMapping, e5.toneMapping = 0, true;
  }, this.hasRenderPass = function() {
    return _2;
  }, this.end = function(e5, t3) {
    e5.toneMapping = m2, p2 = true;
    let n3 = a2, r3 = o2;
    for (let i3 = 0; i3 < g2.length; i3++) {
      let a3 = g2[i3];
      if (a3.enabled !== false && (a3.render(e5, r3, n3, t3), a3.needsSwap !== false)) {
        let e6 = n3;
        n3 = r3, r3 = e6;
      }
    }
    if (d2 !== e5.outputColorSpace || f2 !== e5.toneMapping) {
      d2 = e5.outputColorSpace, f2 = e5.toneMapping, c2.defines = {}, dr.getTransfer(d2) === `srgb` && (c2.defines.SRGB_TRANSFER = ``);
      let t4 = Mu[f2];
      t4 && (c2.defines[t4] = ``), c2.needsUpdate = true;
    }
    c2.uniforms.tDiffuse.value = n3.texture, e5.setRenderTarget(h2), e5.render(l2, u2), h2 = null, p2 = false;
  }, this.isCompositing = function() {
    return p2;
  }, this.dispose = function() {
    a2.depthTexture && a2.depthTexture.dispose(), a2.dispose(), o2.dispose(), s2.dispose(), c2.dispose();
  };
}
function Mc(e4, t2, n2) {
  let r2 = e4[0];
  if (r2 <= 0 || r2 > 0) return e4;
  let i2 = t2 * n2, a2 = Ru[i2];
  if (a2 === void 0 && (a2 = new Float32Array(i2), Ru[i2] = a2), t2 !== 0) {
    r2.toArray(a2, 0);
    for (let r3 = 1, i3 = 0; r3 !== t2; ++r3) i3 += n2, e4[r3].toArray(a2, i3);
  }
  return a2;
}
function Nc(e4, t2) {
  if (e4.length !== t2.length) return false;
  for (let n2 = 0, r2 = e4.length; n2 < r2; n2++) if (e4[n2] !== t2[n2]) return false;
  return true;
}
function Pc(e4, t2) {
  for (let n2 = 0, r2 = t2.length; n2 < r2; n2++) e4[n2] = t2[n2];
}
function Fc(e4, t2) {
  let n2 = zu[t2];
  n2 === void 0 && (n2 = new Int32Array(t2), zu[t2] = n2);
  for (let r2 = 0; r2 !== t2; ++r2) n2[r2] = e4.allocateTextureUnit();
  return n2;
}
function Ic(e4, t2) {
  let n2 = this.cache;
  n2[0] !== t2 && (e4.uniform1f(this.addr, t2), n2[0] = t2);
}
function Lc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y) && (e4.uniform2f(this.addr, t2.x, t2.y), n2[0] = t2.x, n2[1] = t2.y);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform2fv(this.addr, t2), Pc(n2, t2);
  }
}
function Rc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z) && (e4.uniform3f(this.addr, t2.x, t2.y, t2.z), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z);
  else if (t2.r !== void 0) (n2[0] !== t2.r || n2[1] !== t2.g || n2[2] !== t2.b) && (e4.uniform3f(this.addr, t2.r, t2.g, t2.b), n2[0] = t2.r, n2[1] = t2.g, n2[2] = t2.b);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform3fv(this.addr, t2), Pc(n2, t2);
  }
}
function zc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z || n2[3] !== t2.w) && (e4.uniform4f(this.addr, t2.x, t2.y, t2.z, t2.w), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z, n2[3] = t2.w);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform4fv(this.addr, t2), Pc(n2, t2);
  }
}
function Bc(e4, t2) {
  let n2 = this.cache, r2 = t2.elements;
  if (r2 === void 0) {
    if (Nc(n2, t2)) return;
    e4.uniformMatrix2fv(this.addr, false, t2), Pc(n2, t2);
  } else {
    if (Nc(n2, r2)) return;
    Hu.set(r2), e4.uniformMatrix2fv(this.addr, false, Hu), Pc(n2, r2);
  }
}
function Vc(e4, t2) {
  let n2 = this.cache, r2 = t2.elements;
  if (r2 === void 0) {
    if (Nc(n2, t2)) return;
    e4.uniformMatrix3fv(this.addr, false, t2), Pc(n2, t2);
  } else {
    if (Nc(n2, r2)) return;
    Vu.set(r2), e4.uniformMatrix3fv(this.addr, false, Vu), Pc(n2, r2);
  }
}
function Hc(e4, t2) {
  let n2 = this.cache, r2 = t2.elements;
  if (r2 === void 0) {
    if (Nc(n2, t2)) return;
    e4.uniformMatrix4fv(this.addr, false, t2), Pc(n2, t2);
  } else {
    if (Nc(n2, r2)) return;
    Bu.set(r2), e4.uniformMatrix4fv(this.addr, false, Bu), Pc(n2, r2);
  }
}
function Uc(e4, t2) {
  let n2 = this.cache;
  n2[0] !== t2 && (e4.uniform1i(this.addr, t2), n2[0] = t2);
}
function Wc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y) && (e4.uniform2i(this.addr, t2.x, t2.y), n2[0] = t2.x, n2[1] = t2.y);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform2iv(this.addr, t2), Pc(n2, t2);
  }
}
function Gc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z) && (e4.uniform3i(this.addr, t2.x, t2.y, t2.z), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform3iv(this.addr, t2), Pc(n2, t2);
  }
}
function Kc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z || n2[3] !== t2.w) && (e4.uniform4i(this.addr, t2.x, t2.y, t2.z, t2.w), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z, n2[3] = t2.w);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform4iv(this.addr, t2), Pc(n2, t2);
  }
}
function qc(e4, t2) {
  let n2 = this.cache;
  n2[0] !== t2 && (e4.uniform1ui(this.addr, t2), n2[0] = t2);
}
function Jc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y) && (e4.uniform2ui(this.addr, t2.x, t2.y), n2[0] = t2.x, n2[1] = t2.y);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform2uiv(this.addr, t2), Pc(n2, t2);
  }
}
function Yc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z) && (e4.uniform3ui(this.addr, t2.x, t2.y, t2.z), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform3uiv(this.addr, t2), Pc(n2, t2);
  }
}
function Xc(e4, t2) {
  let n2 = this.cache;
  if (t2.x !== void 0) (n2[0] !== t2.x || n2[1] !== t2.y || n2[2] !== t2.z || n2[3] !== t2.w) && (e4.uniform4ui(this.addr, t2.x, t2.y, t2.z, t2.w), n2[0] = t2.x, n2[1] = t2.y, n2[2] = t2.z, n2[3] = t2.w);
  else {
    if (Nc(n2, t2)) return;
    e4.uniform4uiv(this.addr, t2), Pc(n2, t2);
  }
}
function Zc(e4, t2, n2) {
  let r2 = this.cache, i2 = n2.allocateTextureUnit();
  r2[0] !== i2 && (e4.uniform1i(this.addr, i2), r2[0] = i2);
  let a2;
  this.type === e4.SAMPLER_2D_SHADOW ? (Pu.compareFunction = n2.isReversedDepthBuffer() ? 518 : 515, a2 = Pu) : a2 = Nu, n2.setTexture2D(t2 || a2, i2);
}
function Qc(e4, t2, n2) {
  let r2 = this.cache, i2 = n2.allocateTextureUnit();
  r2[0] !== i2 && (e4.uniform1i(this.addr, i2), r2[0] = i2), n2.setTexture3D(t2 || Iu, i2);
}
function $c(e4, t2, n2) {
  let r2 = this.cache, i2 = n2.allocateTextureUnit();
  r2[0] !== i2 && (e4.uniform1i(this.addr, i2), r2[0] = i2), n2.setTextureCube(t2 || Lu, i2);
}
function el(e4, t2, n2) {
  let r2 = this.cache, i2 = n2.allocateTextureUnit();
  r2[0] !== i2 && (e4.uniform1i(this.addr, i2), r2[0] = i2), n2.setTexture2DArray(t2 || Fu, i2);
}
function tl(e4) {
  switch (e4) {
    case 5126:
      return Ic;
    case 35664:
      return Lc;
    case 35665:
      return Rc;
    case 35666:
      return zc;
    case 35674:
      return Bc;
    case 35675:
      return Vc;
    case 35676:
      return Hc;
    case 5124:
    case 35670:
      return Uc;
    case 35667:
    case 35671:
      return Wc;
    case 35668:
    case 35672:
      return Gc;
    case 35669:
    case 35673:
      return Kc;
    case 5125:
      return qc;
    case 36294:
      return Jc;
    case 36295:
      return Yc;
    case 36296:
      return Xc;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return Zc;
    case 35679:
    case 36299:
    case 36307:
      return Qc;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return $c;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return el;
  }
}
function nl(e4, t2) {
  e4.uniform1fv(this.addr, t2);
}
function rl(e4, t2) {
  let n2 = Mc(t2, this.size, 2);
  e4.uniform2fv(this.addr, n2);
}
function il(e4, t2) {
  let n2 = Mc(t2, this.size, 3);
  e4.uniform3fv(this.addr, n2);
}
function al(e4, t2) {
  let n2 = Mc(t2, this.size, 4);
  e4.uniform4fv(this.addr, n2);
}
function ol(e4, t2) {
  let n2 = Mc(t2, this.size, 4);
  e4.uniformMatrix2fv(this.addr, false, n2);
}
function sl(e4, t2) {
  let n2 = Mc(t2, this.size, 9);
  e4.uniformMatrix3fv(this.addr, false, n2);
}
function cl(e4, t2) {
  let n2 = Mc(t2, this.size, 16);
  e4.uniformMatrix4fv(this.addr, false, n2);
}
function ll(e4, t2) {
  e4.uniform1iv(this.addr, t2);
}
function ul(e4, t2) {
  e4.uniform2iv(this.addr, t2);
}
function dl(e4, t2) {
  e4.uniform3iv(this.addr, t2);
}
function fl(e4, t2) {
  e4.uniform4iv(this.addr, t2);
}
function pl(e4, t2) {
  e4.uniform1uiv(this.addr, t2);
}
function ml(e4, t2) {
  e4.uniform2uiv(this.addr, t2);
}
function hl(e4, t2) {
  e4.uniform3uiv(this.addr, t2);
}
function gl(e4, t2) {
  e4.uniform4uiv(this.addr, t2);
}
function _l(e4, t2, n2) {
  let r2 = this.cache, i2 = t2.length, a2 = Fc(n2, i2);
  Nc(r2, a2) || (e4.uniform1iv(this.addr, a2), Pc(r2, a2));
  let o2;
  o2 = this.type === e4.SAMPLER_2D_SHADOW ? Pu : Nu;
  for (let e5 = 0; e5 !== i2; ++e5) n2.setTexture2D(t2[e5] || o2, a2[e5]);
}
function vl(e4, t2, n2) {
  let r2 = this.cache, i2 = t2.length, a2 = Fc(n2, i2);
  Nc(r2, a2) || (e4.uniform1iv(this.addr, a2), Pc(r2, a2));
  for (let e5 = 0; e5 !== i2; ++e5) n2.setTexture3D(t2[e5] || Iu, a2[e5]);
}
function yl(e4, t2, n2) {
  let r2 = this.cache, i2 = t2.length, a2 = Fc(n2, i2);
  Nc(r2, a2) || (e4.uniform1iv(this.addr, a2), Pc(r2, a2));
  for (let e5 = 0; e5 !== i2; ++e5) n2.setTextureCube(t2[e5] || Lu, a2[e5]);
}
function bl(e4, t2, n2) {
  let r2 = this.cache, i2 = t2.length, a2 = Fc(n2, i2);
  Nc(r2, a2) || (e4.uniform1iv(this.addr, a2), Pc(r2, a2));
  for (let e5 = 0; e5 !== i2; ++e5) n2.setTexture2DArray(t2[e5] || Fu, a2[e5]);
}
function xl(e4) {
  switch (e4) {
    case 5126:
      return nl;
    case 35664:
      return rl;
    case 35665:
      return il;
    case 35666:
      return al;
    case 35674:
      return ol;
    case 35675:
      return sl;
    case 35676:
      return cl;
    case 5124:
    case 35670:
      return ll;
    case 35667:
    case 35671:
      return ul;
    case 35668:
    case 35672:
      return dl;
    case 35669:
    case 35673:
      return fl;
    case 5125:
      return pl;
    case 36294:
      return ml;
    case 36295:
      return hl;
    case 36296:
      return gl;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return _l;
    case 35679:
    case 36299:
    case 36307:
      return vl;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return yl;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return bl;
  }
}
function Sl(e4, t2) {
  e4.seq.push(t2), e4.map[t2.id] = t2;
}
function Cl(e4, t2, n2) {
  let r2 = e4.name, i2 = r2.length;
  for (Ku.lastIndex = 0; ; ) {
    let a2 = Ku.exec(r2), o2 = Ku.lastIndex, s2 = a2[1], c2 = a2[2] === `]`, l2 = a2[3];
    if (c2 && (s2 |= 0), l2 === void 0 || l2 === `[` && o2 + 2 === i2) {
      Sl(n2, l2 === void 0 ? new Uu(s2, e4, t2) : new Wu(s2, e4, t2));
      break;
    } else {
      let e5 = n2.map[s2];
      e5 === void 0 && (e5 = new Gu(s2), Sl(n2, e5)), n2 = e5;
    }
  }
}
function wl(e4, t2, n2) {
  let r2 = e4.createShader(t2);
  return e4.shaderSource(r2, n2), e4.compileShader(r2), r2;
}
function Tl(e4, t2) {
  let n2 = e4.split(`
`), r2 = [], i2 = Math.max(t2 - 6, 0), a2 = Math.min(t2 + 6, n2.length);
  for (let e5 = i2; e5 < a2; e5++) {
    let i3 = e5 + 1;
    r2.push(`${i3 === t2 ? `>` : ` `} ${i3}: ${n2[e5]}`);
  }
  return r2.join(`
`);
}
function El(e4) {
  dr._getMatrix(Xu, dr.workingColorSpace, e4);
  let t2 = `mat3( ${Xu.elements.map((e5) => e5.toFixed(4))} )`;
  switch (dr.getTransfer(e4)) {
    case Un:
      return [t2, `LinearTransferOETF`];
    case Wn:
      return [t2, `sRGBTransferOETF`];
    default:
      return l(`WebGLProgram: Unsupported color space: `, e4), [t2, `LinearTransferOETF`];
  }
}
function Dl(e4, t2, n2) {
  let r2 = e4.getShaderParameter(t2, e4.COMPILE_STATUS), i2 = (e4.getShaderInfoLog(t2) || ``).trim();
  if (r2 && i2 === ``) return ``;
  let a2 = /ERROR: 0:(\d+)/.exec(i2);
  if (a2) {
    let r3 = parseInt(a2[1]);
    return n2.toUpperCase() + `

` + i2 + `

` + Tl(e4.getShaderSource(t2), r3);
  } else return i2;
}
function Ol(e4, t2) {
  let n2 = El(t2);
  return [`vec4 ${e4}( vec4 value ) {`, `	return ${n2[1]}( vec4( value.rgb * ${n2[0]}, value.a ) );`, `}`].join(`
`);
}
function kl(e4, t2) {
  let n2 = Zu[t2];
  return n2 === void 0 ? (l(`WebGLProgram: Unsupported toneMapping:`, t2), `vec3 ` + e4 + `( vec3 color ) { return LinearToneMapping( color ); }`) : `vec3 ` + e4 + `( vec3 color ) { return ` + n2 + `ToneMapping( color ); }`;
}
function Al() {
  return dr.getLuminanceCoefficients(Qu), [`float luminance( const in vec3 rgb ) {`, `	const vec3 weights = vec3( ${Qu.x.toFixed(4)}, ${Qu.y.toFixed(4)}, ${Qu.z.toFixed(4)} );`, `	return dot( weights, rgb );`, `}`].join(`
`);
}
function jl(e4) {
  return [e4.extensionClipCullDistance ? `#extension GL_ANGLE_clip_cull_distance : require` : ``, e4.extensionMultiDraw ? `#extension GL_ANGLE_multi_draw : require` : ``].filter(Pl).join(`
`);
}
function Ml(e4) {
  let t2 = [];
  for (let n2 in e4) {
    let r2 = e4[n2];
    r2 !== false && t2.push(`#define ` + n2 + ` ` + r2);
  }
  return t2.join(`
`);
}
function Nl(e4, t2) {
  let n2 = {}, r2 = e4.getProgramParameter(t2, e4.ACTIVE_ATTRIBUTES);
  for (let i2 = 0; i2 < r2; i2++) {
    let r3 = e4.getActiveAttrib(t2, i2), a2 = r3.name, o2 = 1;
    r3.type === e4.FLOAT_MAT2 && (o2 = 2), r3.type === e4.FLOAT_MAT3 && (o2 = 3), r3.type === e4.FLOAT_MAT4 && (o2 = 4), n2[a2] = { type: r3.type, location: e4.getAttribLocation(t2, a2), locationSize: o2 };
  }
  return n2;
}
function Pl(e4) {
  return e4 !== ``;
}
function Fl(e4, t2) {
  let n2 = t2.numSpotLightShadows + t2.numSpotLightMaps - t2.numSpotLightShadowsWithMaps;
  return e4.replace(/NUM_DIR_LIGHTS/g, t2.numDirLights).replace(/NUM_SPOT_LIGHTS/g, t2.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g, t2.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g, n2).replace(/NUM_RECT_AREA_LIGHTS/g, t2.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g, t2.numPointLights).replace(/NUM_HEMI_LIGHTS/g, t2.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g, t2.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, t2.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g, t2.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g, t2.numPointLightShadows);
}
function Il(e4, t2) {
  return e4.replace(/NUM_CLIPPING_PLANES/g, t2.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g, t2.numClippingPlanes - t2.numClipIntersection);
}
function Ll(e4) {
  return e4.replace($u, Rl);
}
function Rl(e4, t2) {
  let n2 = mu[t2];
  if (n2 === void 0) {
    let e5 = ed.get(t2);
    if (e5 !== void 0) n2 = mu[e5], l(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`, t2, e5);
    else throw Error(`Can not resolve #include <` + t2 + `>`);
  }
  return Ll(n2);
}
function zl(e4) {
  return e4.replace(td, Bl);
}
function Bl(e4, t2, n2, r2) {
  let i2 = ``;
  for (let e5 = parseInt(t2); e5 < parseInt(n2); e5++) i2 += r2.replace(/\[\s*i\s*\]/g, `[ ` + e5 + ` ]`).replace(/UNROLLED_LOOP_INDEX/g, e5);
  return i2;
}
function Vl(e4) {
  let t2 = `precision ${e4.precision} float;
	precision ${e4.precision} int;
	precision ${e4.precision} sampler2D;
	precision ${e4.precision} samplerCube;
	precision ${e4.precision} sampler3D;
	precision ${e4.precision} sampler2DArray;
	precision ${e4.precision} sampler2DShadow;
	precision ${e4.precision} samplerCubeShadow;
	precision ${e4.precision} sampler2DArrayShadow;
	precision ${e4.precision} isampler2D;
	precision ${e4.precision} isampler3D;
	precision ${e4.precision} isamplerCube;
	precision ${e4.precision} isampler2DArray;
	precision ${e4.precision} usampler2D;
	precision ${e4.precision} usampler3D;
	precision ${e4.precision} usamplerCube;
	precision ${e4.precision} usampler2DArray;
	`;
  return e4.precision === `highp` ? t2 += `
#define HIGH_PRECISION` : e4.precision === `mediump` ? t2 += `
#define MEDIUM_PRECISION` : e4.precision === `lowp` && (t2 += `
#define LOW_PRECISION`), t2;
}
function Hl(e4) {
  return nd[e4.shadowMapType] || `SHADOWMAP_TYPE_BASIC`;
}
function Ul(e4) {
  return e4.envMap === false ? `ENVMAP_TYPE_CUBE` : rd[e4.envMapMode] || `ENVMAP_TYPE_CUBE`;
}
function Wl(e4) {
  return e4.envMap === false ? `ENVMAP_MODE_REFLECTION` : id[e4.envMapMode] || `ENVMAP_MODE_REFLECTION`;
}
function Gl(e4) {
  return e4.envMap === false ? `ENVMAP_BLENDING_NONE` : ad[e4.combine] || `ENVMAP_BLENDING_NONE`;
}
function Kl(e4) {
  let t2 = e4.envMapCubeUVHeight;
  if (t2 === null) return null;
  let n2 = Math.log2(t2) - 2, r2 = 1 / t2;
  return { texelWidth: 1 / (3 * Math.max(2 ** n2, 112)), texelHeight: r2, maxMip: n2 };
}
function ql(e4, t2, n2, r2) {
  let i2 = e4.getContext(), a2 = n2.defines, o2 = n2.vertexShader, s2 = n2.fragmentShader, c2 = Hl(n2), d2 = Ul(n2), f2 = Wl(n2), p2 = Gl(n2), m2 = Kl(n2), h2 = jl(n2), g2 = Ml(a2), _2 = i2.createProgram(), v2, y2, b2 = n2.glslVersion ? `#version ` + n2.glslVersion + `
` : ``;
  n2.isRawShaderMaterial ? (v2 = [`#define SHADER_TYPE ` + n2.shaderType, `#define SHADER_NAME ` + n2.shaderName, g2].filter(Pl).join(`
`), v2.length > 0 && (v2 += `
`), y2 = [`#define SHADER_TYPE ` + n2.shaderType, `#define SHADER_NAME ` + n2.shaderName, g2].filter(Pl).join(`
`), y2.length > 0 && (y2 += `
`)) : (v2 = [Vl(n2), `#define SHADER_TYPE ` + n2.shaderType, `#define SHADER_NAME ` + n2.shaderName, g2, n2.extensionClipCullDistance ? `#define USE_CLIP_DISTANCE` : ``, n2.batching ? `#define USE_BATCHING` : ``, n2.batchingColor ? `#define USE_BATCHING_COLOR` : ``, n2.instancing ? `#define USE_INSTANCING` : ``, n2.instancingColor ? `#define USE_INSTANCING_COLOR` : ``, n2.instancingMorph ? `#define USE_INSTANCING_MORPH` : ``, n2.useFog && n2.fog ? `#define USE_FOG` : ``, n2.useFog && n2.fogExp2 ? `#define FOG_EXP2` : ``, n2.map ? `#define USE_MAP` : ``, n2.envMap ? `#define USE_ENVMAP` : ``, n2.envMap ? `#define ` + f2 : ``, n2.lightMap ? `#define USE_LIGHTMAP` : ``, n2.aoMap ? `#define USE_AOMAP` : ``, n2.bumpMap ? `#define USE_BUMPMAP` : ``, n2.normalMap ? `#define USE_NORMALMAP` : ``, n2.normalMapObjectSpace ? `#define USE_NORMALMAP_OBJECTSPACE` : ``, n2.normalMapTangentSpace ? `#define USE_NORMALMAP_TANGENTSPACE` : ``, n2.displacementMap ? `#define USE_DISPLACEMENTMAP` : ``, n2.emissiveMap ? `#define USE_EMISSIVEMAP` : ``, n2.anisotropy ? `#define USE_ANISOTROPY` : ``, n2.anisotropyMap ? `#define USE_ANISOTROPYMAP` : ``, n2.clearcoatMap ? `#define USE_CLEARCOATMAP` : ``, n2.clearcoatRoughnessMap ? `#define USE_CLEARCOAT_ROUGHNESSMAP` : ``, n2.clearcoatNormalMap ? `#define USE_CLEARCOAT_NORMALMAP` : ``, n2.iridescenceMap ? `#define USE_IRIDESCENCEMAP` : ``, n2.iridescenceThicknessMap ? `#define USE_IRIDESCENCE_THICKNESSMAP` : ``, n2.specularMap ? `#define USE_SPECULARMAP` : ``, n2.specularColorMap ? `#define USE_SPECULAR_COLORMAP` : ``, n2.specularIntensityMap ? `#define USE_SPECULAR_INTENSITYMAP` : ``, n2.roughnessMap ? `#define USE_ROUGHNESSMAP` : ``, n2.metalnessMap ? `#define USE_METALNESSMAP` : ``, n2.alphaMap ? `#define USE_ALPHAMAP` : ``, n2.alphaHash ? `#define USE_ALPHAHASH` : ``, n2.transmission ? `#define USE_TRANSMISSION` : ``, n2.transmissionMap ? `#define USE_TRANSMISSIONMAP` : ``, n2.thicknessMap ? `#define USE_THICKNESSMAP` : ``, n2.sheenColorMap ? `#define USE_SHEEN_COLORMAP` : ``, n2.sheenRoughnessMap ? `#define USE_SHEEN_ROUGHNESSMAP` : ``, n2.mapUv ? `#define MAP_UV ` + n2.mapUv : ``, n2.alphaMapUv ? `#define ALPHAMAP_UV ` + n2.alphaMapUv : ``, n2.lightMapUv ? `#define LIGHTMAP_UV ` + n2.lightMapUv : ``, n2.aoMapUv ? `#define AOMAP_UV ` + n2.aoMapUv : ``, n2.emissiveMapUv ? `#define EMISSIVEMAP_UV ` + n2.emissiveMapUv : ``, n2.bumpMapUv ? `#define BUMPMAP_UV ` + n2.bumpMapUv : ``, n2.normalMapUv ? `#define NORMALMAP_UV ` + n2.normalMapUv : ``, n2.displacementMapUv ? `#define DISPLACEMENTMAP_UV ` + n2.displacementMapUv : ``, n2.metalnessMapUv ? `#define METALNESSMAP_UV ` + n2.metalnessMapUv : ``, n2.roughnessMapUv ? `#define ROUGHNESSMAP_UV ` + n2.roughnessMapUv : ``, n2.anisotropyMapUv ? `#define ANISOTROPYMAP_UV ` + n2.anisotropyMapUv : ``, n2.clearcoatMapUv ? `#define CLEARCOATMAP_UV ` + n2.clearcoatMapUv : ``, n2.clearcoatNormalMapUv ? `#define CLEARCOAT_NORMALMAP_UV ` + n2.clearcoatNormalMapUv : ``, n2.clearcoatRoughnessMapUv ? `#define CLEARCOAT_ROUGHNESSMAP_UV ` + n2.clearcoatRoughnessMapUv : ``, n2.iridescenceMapUv ? `#define IRIDESCENCEMAP_UV ` + n2.iridescenceMapUv : ``, n2.iridescenceThicknessMapUv ? `#define IRIDESCENCE_THICKNESSMAP_UV ` + n2.iridescenceThicknessMapUv : ``, n2.sheenColorMapUv ? `#define SHEEN_COLORMAP_UV ` + n2.sheenColorMapUv : ``, n2.sheenRoughnessMapUv ? `#define SHEEN_ROUGHNESSMAP_UV ` + n2.sheenRoughnessMapUv : ``, n2.specularMapUv ? `#define SPECULARMAP_UV ` + n2.specularMapUv : ``, n2.specularColorMapUv ? `#define SPECULAR_COLORMAP_UV ` + n2.specularColorMapUv : ``, n2.specularIntensityMapUv ? `#define SPECULAR_INTENSITYMAP_UV ` + n2.specularIntensityMapUv : ``, n2.transmissionMapUv ? `#define TRANSMISSIONMAP_UV ` + n2.transmissionMapUv : ``, n2.thicknessMapUv ? `#define THICKNESSMAP_UV ` + n2.thicknessMapUv : ``, n2.vertexTangents && n2.flatShading === false ? `#define USE_TANGENT` : ``, n2.vertexNormals ? `#define HAS_NORMAL` : ``, n2.vertexColors ? `#define USE_COLOR` : ``, n2.vertexAlphas ? `#define USE_COLOR_ALPHA` : ``, n2.vertexUv1s ? `#define USE_UV1` : ``, n2.vertexUv2s ? `#define USE_UV2` : ``, n2.vertexUv3s ? `#define USE_UV3` : ``, n2.pointsUvs ? `#define USE_POINTS_UV` : ``, n2.flatShading ? `#define FLAT_SHADED` : ``, n2.skinning ? `#define USE_SKINNING` : ``, n2.morphTargets ? `#define USE_MORPHTARGETS` : ``, n2.morphNormals && n2.flatShading === false ? `#define USE_MORPHNORMALS` : ``, n2.morphColors ? `#define USE_MORPHCOLORS` : ``, n2.morphTargetsCount > 0 ? `#define MORPHTARGETS_TEXTURE_STRIDE ` + n2.morphTextureStride : ``, n2.morphTargetsCount > 0 ? `#define MORPHTARGETS_COUNT ` + n2.morphTargetsCount : ``, n2.doubleSided ? `#define DOUBLE_SIDED` : ``, n2.flipSided ? `#define FLIP_SIDED` : ``, n2.shadowMapEnabled ? `#define USE_SHADOWMAP` : ``, n2.shadowMapEnabled ? `#define ` + c2 : ``, n2.sizeAttenuation ? `#define USE_SIZEATTENUATION` : ``, n2.numLightProbes > 0 ? `#define USE_LIGHT_PROBES` : ``, n2.logarithmicDepthBuffer ? `#define USE_LOGARITHMIC_DEPTH_BUFFER` : ``, n2.reversedDepthBuffer ? `#define USE_REVERSED_DEPTH_BUFFER` : ``, `uniform mat4 modelMatrix;`, `uniform mat4 modelViewMatrix;`, `uniform mat4 projectionMatrix;`, `uniform mat4 viewMatrix;`, `uniform mat3 normalMatrix;`, `uniform vec3 cameraPosition;`, `uniform bool isOrthographic;`, `#ifdef USE_INSTANCING`, `	attribute mat4 instanceMatrix;`, `#endif`, `#ifdef USE_INSTANCING_COLOR`, `	attribute vec3 instanceColor;`, `#endif`, `#ifdef USE_INSTANCING_MORPH`, `	uniform sampler2D morphTexture;`, `#endif`, `attribute vec3 position;`, `attribute vec3 normal;`, `attribute vec2 uv;`, `#ifdef USE_UV1`, `	attribute vec2 uv1;`, `#endif`, `#ifdef USE_UV2`, `	attribute vec2 uv2;`, `#endif`, `#ifdef USE_UV3`, `	attribute vec2 uv3;`, `#endif`, `#ifdef USE_TANGENT`, `	attribute vec4 tangent;`, `#endif`, `#if defined( USE_COLOR_ALPHA )`, `	attribute vec4 color;`, `#elif defined( USE_COLOR )`, `	attribute vec3 color;`, `#endif`, `#ifdef USE_SKINNING`, `	attribute vec4 skinIndex;`, `	attribute vec4 skinWeight;`, `#endif`, `
`].filter(Pl).join(`
`), y2 = [Vl(n2), `#define SHADER_TYPE ` + n2.shaderType, `#define SHADER_NAME ` + n2.shaderName, g2, n2.useFog && n2.fog ? `#define USE_FOG` : ``, n2.useFog && n2.fogExp2 ? `#define FOG_EXP2` : ``, n2.alphaToCoverage ? `#define ALPHA_TO_COVERAGE` : ``, n2.map ? `#define USE_MAP` : ``, n2.matcap ? `#define USE_MATCAP` : ``, n2.envMap ? `#define USE_ENVMAP` : ``, n2.envMap ? `#define ` + d2 : ``, n2.envMap ? `#define ` + f2 : ``, n2.envMap ? `#define ` + p2 : ``, m2 ? `#define CUBEUV_TEXEL_WIDTH ` + m2.texelWidth : ``, m2 ? `#define CUBEUV_TEXEL_HEIGHT ` + m2.texelHeight : ``, m2 ? `#define CUBEUV_MAX_MIP ` + m2.maxMip + `.0` : ``, n2.lightMap ? `#define USE_LIGHTMAP` : ``, n2.aoMap ? `#define USE_AOMAP` : ``, n2.bumpMap ? `#define USE_BUMPMAP` : ``, n2.normalMap ? `#define USE_NORMALMAP` : ``, n2.normalMapObjectSpace ? `#define USE_NORMALMAP_OBJECTSPACE` : ``, n2.normalMapTangentSpace ? `#define USE_NORMALMAP_TANGENTSPACE` : ``, n2.packedNormalMap ? `#define USE_PACKED_NORMALMAP` : ``, n2.emissiveMap ? `#define USE_EMISSIVEMAP` : ``, n2.anisotropy ? `#define USE_ANISOTROPY` : ``, n2.anisotropyMap ? `#define USE_ANISOTROPYMAP` : ``, n2.clearcoat ? `#define USE_CLEARCOAT` : ``, n2.clearcoatMap ? `#define USE_CLEARCOATMAP` : ``, n2.clearcoatRoughnessMap ? `#define USE_CLEARCOAT_ROUGHNESSMAP` : ``, n2.clearcoatNormalMap ? `#define USE_CLEARCOAT_NORMALMAP` : ``, n2.dispersion ? `#define USE_DISPERSION` : ``, n2.iridescence ? `#define USE_IRIDESCENCE` : ``, n2.iridescenceMap ? `#define USE_IRIDESCENCEMAP` : ``, n2.iridescenceThicknessMap ? `#define USE_IRIDESCENCE_THICKNESSMAP` : ``, n2.specularMap ? `#define USE_SPECULARMAP` : ``, n2.specularColorMap ? `#define USE_SPECULAR_COLORMAP` : ``, n2.specularIntensityMap ? `#define USE_SPECULAR_INTENSITYMAP` : ``, n2.roughnessMap ? `#define USE_ROUGHNESSMAP` : ``, n2.metalnessMap ? `#define USE_METALNESSMAP` : ``, n2.alphaMap ? `#define USE_ALPHAMAP` : ``, n2.alphaTest ? `#define USE_ALPHATEST` : ``, n2.alphaHash ? `#define USE_ALPHAHASH` : ``, n2.sheen ? `#define USE_SHEEN` : ``, n2.sheenColorMap ? `#define USE_SHEEN_COLORMAP` : ``, n2.sheenRoughnessMap ? `#define USE_SHEEN_ROUGHNESSMAP` : ``, n2.transmission ? `#define USE_TRANSMISSION` : ``, n2.transmissionMap ? `#define USE_TRANSMISSIONMAP` : ``, n2.thicknessMap ? `#define USE_THICKNESSMAP` : ``, n2.vertexTangents && n2.flatShading === false ? `#define USE_TANGENT` : ``, n2.vertexColors || n2.instancingColor ? `#define USE_COLOR` : ``, n2.vertexAlphas || n2.batchingColor ? `#define USE_COLOR_ALPHA` : ``, n2.vertexUv1s ? `#define USE_UV1` : ``, n2.vertexUv2s ? `#define USE_UV2` : ``, n2.vertexUv3s ? `#define USE_UV3` : ``, n2.pointsUvs ? `#define USE_POINTS_UV` : ``, n2.gradientMap ? `#define USE_GRADIENTMAP` : ``, n2.flatShading ? `#define FLAT_SHADED` : ``, n2.doubleSided ? `#define DOUBLE_SIDED` : ``, n2.flipSided ? `#define FLIP_SIDED` : ``, n2.shadowMapEnabled ? `#define USE_SHADOWMAP` : ``, n2.shadowMapEnabled ? `#define ` + c2 : ``, n2.premultipliedAlpha ? `#define PREMULTIPLIED_ALPHA` : ``, n2.numLightProbes > 0 ? `#define USE_LIGHT_PROBES` : ``, n2.numLightProbeGrids > 0 ? `#define USE_LIGHT_PROBES_GRID` : ``, n2.decodeVideoTexture ? `#define DECODE_VIDEO_TEXTURE` : ``, n2.decodeVideoTextureEmissive ? `#define DECODE_VIDEO_TEXTURE_EMISSIVE` : ``, n2.logarithmicDepthBuffer ? `#define USE_LOGARITHMIC_DEPTH_BUFFER` : ``, n2.reversedDepthBuffer ? `#define USE_REVERSED_DEPTH_BUFFER` : ``, `uniform mat4 viewMatrix;`, `uniform vec3 cameraPosition;`, `uniform bool isOrthographic;`, n2.toneMapping === 0 ? `` : `#define TONE_MAPPING`, n2.toneMapping === 0 ? `` : mu.tonemapping_pars_fragment, n2.toneMapping === 0 ? `` : kl(`toneMapping`, n2.toneMapping), n2.dithering ? `#define DITHERING` : ``, n2.opaque ? `#define OPAQUE` : ``, mu.colorspace_pars_fragment, Ol(`linearToOutputTexel`, n2.outputColorSpace), Al(), n2.useDepthPacking ? `#define DEPTH_PACKING ` + n2.depthPacking : ``, `
`].filter(Pl).join(`
`)), o2 = Ll(o2), o2 = Fl(o2, n2), o2 = Il(o2, n2), s2 = Ll(s2), s2 = Fl(s2, n2), s2 = Il(s2, n2), o2 = zl(o2), s2 = zl(s2), n2.isRawShaderMaterial !== true && (b2 = `#version 300 es
`, v2 = [h2, `#define attribute in`, `#define varying out`, `#define texture2D texture`].join(`
`) + `
` + v2, y2 = [`#define varying in`, n2.glslVersion === `300 es` ? `` : `layout(location = 0) out highp vec4 pc_fragColor;`, n2.glslVersion === `300 es` ? `` : `#define gl_FragColor pc_fragColor`, `#define gl_FragDepthEXT gl_FragDepth`, `#define texture2D texture`, `#define textureCube texture`, `#define texture2DProj textureProj`, `#define texture2DLodEXT textureLod`, `#define texture2DProjLodEXT textureProjLod`, `#define textureCubeLodEXT textureLod`, `#define texture2DGradEXT textureGrad`, `#define texture2DProjGradEXT textureProjGrad`, `#define textureCubeGradEXT textureGrad`].join(`
`) + `
` + y2);
  let x2 = b2 + v2 + o2, S2 = b2 + y2 + s2, C2 = wl(i2, i2.VERTEX_SHADER, x2), w2 = wl(i2, i2.FRAGMENT_SHADER, S2);
  i2.attachShader(_2, C2), i2.attachShader(_2, w2), n2.index0AttributeName === void 0 ? n2.morphTargets === true && i2.bindAttribLocation(_2, 0, `position`) : i2.bindAttribLocation(_2, 0, n2.index0AttributeName), i2.linkProgram(_2);
  function T2(t3) {
    if (e4.debug.checkShaderErrors) {
      let n3 = i2.getProgramInfoLog(_2) || ``, r3 = i2.getShaderInfoLog(C2) || ``, a3 = i2.getShaderInfoLog(w2) || ``, o3 = n3.trim(), s3 = r3.trim(), c3 = a3.trim(), d3 = true, f3 = true;
      if (i2.getProgramParameter(_2, i2.LINK_STATUS) === false) if (d3 = false, typeof e4.debug.onShaderError == `function`) e4.debug.onShaderError(i2, _2, C2, w2);
      else {
        let e5 = Dl(i2, C2, `vertex`), n4 = Dl(i2, w2, `fragment`);
        u(`THREE.WebGLProgram: Shader Error ` + i2.getError() + ` - VALIDATE_STATUS ` + i2.getProgramParameter(_2, i2.VALIDATE_STATUS) + `

Material Name: ` + t3.name + `
Material Type: ` + t3.type + `

Program Info Log: ` + o3 + `
` + e5 + `
` + n4);
      }
      else o3 === `` ? (s3 === `` || c3 === ``) && (f3 = false) : l(`WebGLProgram: Program Info Log:`, o3);
      f3 && (t3.diagnostics = { runnable: d3, programLog: o3, vertexShader: { log: s3, prefix: v2 }, fragmentShader: { log: c3, prefix: y2 } });
    }
    i2.deleteShader(C2), i2.deleteShader(w2), E2 = new qu(i2, _2), D2 = Nl(i2, _2);
  }
  let E2;
  this.getUniforms = function() {
    return E2 === void 0 && T2(this), E2;
  };
  let D2;
  this.getAttributes = function() {
    return D2 === void 0 && T2(this), D2;
  };
  let O2 = n2.rendererExtensionParallelShaderCompile === false;
  return this.isReady = function() {
    return O2 === false && (O2 = i2.getProgramParameter(_2, Ju)), O2;
  }, this.destroy = function() {
    r2.releaseStatesOfProgram(this), i2.deleteProgram(_2), this.program = void 0;
  }, this.type = n2.shaderType, this.name = n2.shaderName, this.id = Yu++, this.cacheKey = t2, this.usedTimes = 1, this.program = _2, this.vertexShader = C2, this.fragmentShader = w2, this;
}
function Jl(e4) {
  return e4 === 1030 || e4 === 37490 || e4 === 36285;
}
function Yl(e4, t2, n2, r2, i2, a2) {
  let o2 = new Fr(), s2 = new sd(), c2 = /* @__PURE__ */ new Set(), u2 = [], d2 = /* @__PURE__ */ new Map(), f2 = r2.logarithmicDepthBuffer, p2 = r2.precision, m2 = { MeshDepthMaterial: `depth`, MeshDistanceMaterial: `distance`, MeshNormalMaterial: `normal`, MeshBasicMaterial: `basic`, MeshLambertMaterial: `lambert`, MeshPhongMaterial: `phong`, MeshToonMaterial: `toon`, MeshStandardMaterial: `physical`, MeshPhysicalMaterial: `physical`, MeshMatcapMaterial: `matcap`, LineBasicMaterial: `basic`, LineDashedMaterial: `dashed`, PointsMaterial: `points`, ShadowMaterial: `shadow`, SpriteMaterial: `sprite` };
  function h2(e5) {
    return c2.add(e5), e5 === 0 ? `uv` : `uv${e5}`;
  }
  function g2(i3, o3, u3, d3, g3, _3) {
    let v3 = d3.fog, y3 = g3.geometry, b3 = i3.isMeshStandardMaterial || i3.isMeshLambertMaterial || i3.isMeshPhongMaterial ? d3.environment : null, x3 = i3.isMeshStandardMaterial || i3.isMeshLambertMaterial && !i3.envMap || i3.isMeshPhongMaterial && !i3.envMap, S3 = t2.get(i3.envMap || b3, x3), C3 = S3 && S3.mapping === 306 ? S3.image.height : null, w3 = m2[i3.type];
    i3.precision !== null && (p2 = r2.getMaxPrecision(i3.precision), p2 !== i3.precision && l(`WebGLProgram.getParameters:`, i3.precision, `not supported, using`, p2, `instead.`));
    let T2 = y3.morphAttributes.position || y3.morphAttributes.normal || y3.morphAttributes.color, E2 = T2 === void 0 ? 0 : T2.length, D2 = 0;
    y3.morphAttributes.position !== void 0 && (D2 = 1), y3.morphAttributes.normal !== void 0 && (D2 = 2), y3.morphAttributes.color !== void 0 && (D2 = 3);
    let O2, k2, A2, ee2;
    if (w3) {
      let e5 = hu[w3];
      O2 = e5.vertexShader, k2 = e5.fragmentShader;
    } else O2 = i3.vertexShader, k2 = i3.fragmentShader, s2.update(i3), A2 = s2.getVertexShaderID(i3), ee2 = s2.getFragmentShaderID(i3);
    let te2 = e4.getRenderTarget(), ne2 = e4.state.buffers.depth.getReversed(), re2 = g3.isInstancedMesh === true, ie2 = g3.isBatchedMesh === true, ae2 = !!i3.map, oe2 = !!i3.matcap, se2 = !!S3, ce2 = !!i3.aoMap, le2 = !!i3.lightMap, ue2 = !!i3.bumpMap, de2 = !!i3.normalMap, fe2 = !!i3.displacementMap, pe2 = !!i3.emissiveMap, me2 = !!i3.metalnessMap, he2 = !!i3.roughnessMap, ge2 = i3.anisotropy > 0, _e2 = i3.clearcoat > 0, ve2 = i3.dispersion > 0, ye2 = i3.iridescence > 0, be2 = i3.sheen > 0, xe2 = i3.transmission > 0, Se2 = ge2 && !!i3.anisotropyMap, Ce2 = _e2 && !!i3.clearcoatMap, we2 = _e2 && !!i3.clearcoatNormalMap, Te2 = _e2 && !!i3.clearcoatRoughnessMap, Ee2 = ye2 && !!i3.iridescenceMap, De2 = ye2 && !!i3.iridescenceThicknessMap, Oe2 = be2 && !!i3.sheenColorMap, j2 = be2 && !!i3.sheenRoughnessMap, ke2 = !!i3.specularMap, Ae2 = !!i3.specularColorMap, je2 = !!i3.specularIntensityMap, Me2 = xe2 && !!i3.transmissionMap, Ne2 = xe2 && !!i3.thicknessMap, Pe2 = !!i3.gradientMap, Fe2 = !!i3.alphaMap, Ie2 = i3.alphaTest > 0, Le2 = !!i3.alphaHash, Re2 = !!i3.extensions, ze2 = 0;
    i3.toneMapped && (te2 === null || te2.isXRRenderTarget === true) && (ze2 = e4.toneMapping);
    let Be2 = { shaderID: w3, shaderType: i3.type, shaderName: i3.name, vertexShader: O2, fragmentShader: k2, defines: i3.defines, customVertexShaderID: A2, customFragmentShaderID: ee2, isRawShaderMaterial: i3.isRawShaderMaterial === true, glslVersion: i3.glslVersion, precision: p2, batching: ie2, batchingColor: ie2 && g3._colorsTexture !== null, instancing: re2, instancingColor: re2 && g3.instanceColor !== null, instancingMorph: re2 && g3.morphTexture !== null, outputColorSpace: te2 === null ? e4.outputColorSpace : te2.isXRRenderTarget === true ? te2.texture.colorSpace : dr.workingColorSpace, alphaToCoverage: !!i3.alphaToCoverage, map: ae2, matcap: oe2, envMap: se2, envMapMode: se2 && S3.mapping, envMapCubeUVHeight: C3, aoMap: ce2, lightMap: le2, bumpMap: ue2, normalMap: de2, displacementMap: fe2, emissiveMap: pe2, normalMapObjectSpace: de2 && i3.normalMapType === 1, normalMapTangentSpace: de2 && i3.normalMapType === 0, packedNormalMap: de2 && i3.normalMapType === 0 && Jl(i3.normalMap.format), metalnessMap: me2, roughnessMap: he2, anisotropy: ge2, anisotropyMap: Se2, clearcoat: _e2, clearcoatMap: Ce2, clearcoatNormalMap: we2, clearcoatRoughnessMap: Te2, dispersion: ve2, iridescence: ye2, iridescenceMap: Ee2, iridescenceThicknessMap: De2, sheen: be2, sheenColorMap: Oe2, sheenRoughnessMap: j2, specularMap: ke2, specularColorMap: Ae2, specularIntensityMap: je2, transmission: xe2, transmissionMap: Me2, thicknessMap: Ne2, gradientMap: Pe2, opaque: i3.transparent === false && i3.blending === 1 && i3.alphaToCoverage === false, alphaMap: Fe2, alphaTest: Ie2, alphaHash: Le2, combine: i3.combine, mapUv: ae2 && h2(i3.map.channel), aoMapUv: ce2 && h2(i3.aoMap.channel), lightMapUv: le2 && h2(i3.lightMap.channel), bumpMapUv: ue2 && h2(i3.bumpMap.channel), normalMapUv: de2 && h2(i3.normalMap.channel), displacementMapUv: fe2 && h2(i3.displacementMap.channel), emissiveMapUv: pe2 && h2(i3.emissiveMap.channel), metalnessMapUv: me2 && h2(i3.metalnessMap.channel), roughnessMapUv: he2 && h2(i3.roughnessMap.channel), anisotropyMapUv: Se2 && h2(i3.anisotropyMap.channel), clearcoatMapUv: Ce2 && h2(i3.clearcoatMap.channel), clearcoatNormalMapUv: we2 && h2(i3.clearcoatNormalMap.channel), clearcoatRoughnessMapUv: Te2 && h2(i3.clearcoatRoughnessMap.channel), iridescenceMapUv: Ee2 && h2(i3.iridescenceMap.channel), iridescenceThicknessMapUv: De2 && h2(i3.iridescenceThicknessMap.channel), sheenColorMapUv: Oe2 && h2(i3.sheenColorMap.channel), sheenRoughnessMapUv: j2 && h2(i3.sheenRoughnessMap.channel), specularMapUv: ke2 && h2(i3.specularMap.channel), specularColorMapUv: Ae2 && h2(i3.specularColorMap.channel), specularIntensityMapUv: je2 && h2(i3.specularIntensityMap.channel), transmissionMapUv: Me2 && h2(i3.transmissionMap.channel), thicknessMapUv: Ne2 && h2(i3.thicknessMap.channel), alphaMapUv: Fe2 && h2(i3.alphaMap.channel), vertexTangents: !!y3.attributes.tangent && (de2 || ge2), vertexNormals: !!y3.attributes.normal, vertexColors: i3.vertexColors, vertexAlphas: i3.vertexColors === true && !!y3.attributes.color && y3.attributes.color.itemSize === 4, pointsUvs: g3.isPoints === true && !!y3.attributes.uv && (ae2 || Fe2), fog: !!v3, useFog: i3.fog === true, fogExp2: !!v3 && v3.isFogExp2, flatShading: i3.wireframe === false && (i3.flatShading === true || y3.attributes.normal === void 0 && de2 === false && (i3.isMeshLambertMaterial || i3.isMeshPhongMaterial || i3.isMeshStandardMaterial || i3.isMeshPhysicalMaterial)), sizeAttenuation: i3.sizeAttenuation === true, logarithmicDepthBuffer: f2, reversedDepthBuffer: ne2, skinning: g3.isSkinnedMesh === true, morphTargets: y3.morphAttributes.position !== void 0, morphNormals: y3.morphAttributes.normal !== void 0, morphColors: y3.morphAttributes.color !== void 0, morphTargetsCount: E2, morphTextureStride: D2, numDirLights: o3.directional.length, numPointLights: o3.point.length, numSpotLights: o3.spot.length, numSpotLightMaps: o3.spotLightMap.length, numRectAreaLights: o3.rectArea.length, numHemiLights: o3.hemi.length, numDirLightShadows: o3.directionalShadowMap.length, numPointLightShadows: o3.pointShadowMap.length, numSpotLightShadows: o3.spotShadowMap.length, numSpotLightShadowsWithMaps: o3.numSpotLightShadowsWithMaps, numLightProbes: o3.numLightProbes, numLightProbeGrids: _3.length, numClippingPlanes: a2.numPlanes, numClipIntersection: a2.numIntersection, dithering: i3.dithering, shadowMapEnabled: e4.shadowMap.enabled && u3.length > 0, shadowMapType: e4.shadowMap.type, toneMapping: ze2, decodeVideoTexture: ae2 && i3.map.isVideoTexture === true && dr.getTransfer(i3.map.colorSpace) === `srgb`, decodeVideoTextureEmissive: pe2 && i3.emissiveMap.isVideoTexture === true && dr.getTransfer(i3.emissiveMap.colorSpace) === `srgb`, premultipliedAlpha: i3.premultipliedAlpha, doubleSided: i3.side === 2, flipSided: i3.side === 1, useDepthPacking: i3.depthPacking >= 0, depthPacking: i3.depthPacking || 0, index0AttributeName: i3.index0AttributeName, extensionClipCullDistance: Re2 && i3.extensions.clipCullDistance === true && n2.has(`WEBGL_clip_cull_distance`), extensionMultiDraw: (Re2 && i3.extensions.multiDraw === true || ie2) && n2.has(`WEBGL_multi_draw`), rendererExtensionParallelShaderCompile: n2.has(`KHR_parallel_shader_compile`), customProgramCacheKey: i3.customProgramCacheKey() };
    return Be2.vertexUv1s = c2.has(1), Be2.vertexUv2s = c2.has(2), Be2.vertexUv3s = c2.has(3), c2.clear(), Be2;
  }
  function _2(t3) {
    let n3 = [];
    if (t3.shaderID ? n3.push(t3.shaderID) : (n3.push(t3.customVertexShaderID), n3.push(t3.customFragmentShaderID)), t3.defines !== void 0) for (let e5 in t3.defines) n3.push(e5), n3.push(t3.defines[e5]);
    return t3.isRawShaderMaterial === false && (v2(n3, t3), y2(n3, t3), n3.push(e4.outputColorSpace)), n3.push(t3.customProgramCacheKey), n3.join();
  }
  function v2(e5, t3) {
    e5.push(t3.precision), e5.push(t3.outputColorSpace), e5.push(t3.envMapMode), e5.push(t3.envMapCubeUVHeight), e5.push(t3.mapUv), e5.push(t3.alphaMapUv), e5.push(t3.lightMapUv), e5.push(t3.aoMapUv), e5.push(t3.bumpMapUv), e5.push(t3.normalMapUv), e5.push(t3.displacementMapUv), e5.push(t3.emissiveMapUv), e5.push(t3.metalnessMapUv), e5.push(t3.roughnessMapUv), e5.push(t3.anisotropyMapUv), e5.push(t3.clearcoatMapUv), e5.push(t3.clearcoatNormalMapUv), e5.push(t3.clearcoatRoughnessMapUv), e5.push(t3.iridescenceMapUv), e5.push(t3.iridescenceThicknessMapUv), e5.push(t3.sheenColorMapUv), e5.push(t3.sheenRoughnessMapUv), e5.push(t3.specularMapUv), e5.push(t3.specularColorMapUv), e5.push(t3.specularIntensityMapUv), e5.push(t3.transmissionMapUv), e5.push(t3.thicknessMapUv), e5.push(t3.combine), e5.push(t3.fogExp2), e5.push(t3.sizeAttenuation), e5.push(t3.morphTargetsCount), e5.push(t3.morphAttributeCount), e5.push(t3.numDirLights), e5.push(t3.numPointLights), e5.push(t3.numSpotLights), e5.push(t3.numSpotLightMaps), e5.push(t3.numHemiLights), e5.push(t3.numRectAreaLights), e5.push(t3.numDirLightShadows), e5.push(t3.numPointLightShadows), e5.push(t3.numSpotLightShadows), e5.push(t3.numSpotLightShadowsWithMaps), e5.push(t3.numLightProbes), e5.push(t3.shadowMapType), e5.push(t3.toneMapping), e5.push(t3.numClippingPlanes), e5.push(t3.numClipIntersection), e5.push(t3.depthPacking);
  }
  function y2(e5, t3) {
    o2.disableAll(), t3.instancing && o2.enable(0), t3.instancingColor && o2.enable(1), t3.instancingMorph && o2.enable(2), t3.matcap && o2.enable(3), t3.envMap && o2.enable(4), t3.normalMapObjectSpace && o2.enable(5), t3.normalMapTangentSpace && o2.enable(6), t3.clearcoat && o2.enable(7), t3.iridescence && o2.enable(8), t3.alphaTest && o2.enable(9), t3.vertexColors && o2.enable(10), t3.vertexAlphas && o2.enable(11), t3.vertexUv1s && o2.enable(12), t3.vertexUv2s && o2.enable(13), t3.vertexUv3s && o2.enable(14), t3.vertexTangents && o2.enable(15), t3.anisotropy && o2.enable(16), t3.alphaHash && o2.enable(17), t3.batching && o2.enable(18), t3.dispersion && o2.enable(19), t3.batchingColor && o2.enable(20), t3.gradientMap && o2.enable(21), t3.packedNormalMap && o2.enable(22), t3.vertexNormals && o2.enable(23), e5.push(o2.mask), o2.disableAll(), t3.fog && o2.enable(0), t3.useFog && o2.enable(1), t3.flatShading && o2.enable(2), t3.logarithmicDepthBuffer && o2.enable(3), t3.reversedDepthBuffer && o2.enable(4), t3.skinning && o2.enable(5), t3.morphTargets && o2.enable(6), t3.morphNormals && o2.enable(7), t3.morphColors && o2.enable(8), t3.premultipliedAlpha && o2.enable(9), t3.shadowMapEnabled && o2.enable(10), t3.doubleSided && o2.enable(11), t3.flipSided && o2.enable(12), t3.useDepthPacking && o2.enable(13), t3.dithering && o2.enable(14), t3.transmission && o2.enable(15), t3.sheen && o2.enable(16), t3.opaque && o2.enable(17), t3.pointsUvs && o2.enable(18), t3.decodeVideoTexture && o2.enable(19), t3.decodeVideoTextureEmissive && o2.enable(20), t3.alphaToCoverage && o2.enable(21), t3.numLightProbeGrids > 0 && o2.enable(22), e5.push(o2.mask);
  }
  function b2(e5) {
    let t3 = m2[e5.type], n3;
    if (t3) {
      let e6 = hu[t3];
      n3 = Wo.clone(e6.uniforms);
    } else n3 = e5.uniforms;
    return n3;
  }
  function x2(t3, n3) {
    let r3 = d2.get(n3);
    return r3 === void 0 ? (r3 = new ql(e4, n3, t3, i2), u2.push(r3), d2.set(n3, r3)) : ++r3.usedTimes, r3;
  }
  function S2(e5) {
    if (--e5.usedTimes === 0) {
      let t3 = u2.indexOf(e5);
      u2[t3] = u2[u2.length - 1], u2.pop(), d2.delete(e5.cacheKey), e5.destroy();
    }
  }
  function C2(e5) {
    s2.remove(e5);
  }
  function w2() {
    s2.dispose();
  }
  return { getParameters: g2, getProgramCacheKey: _2, getUniforms: b2, acquireProgram: x2, releaseProgram: S2, releaseShaderCache: C2, programs: u2, dispose: w2 };
}
function Xl() {
  let e4 = /* @__PURE__ */ new WeakMap();
  function t2(t3) {
    return e4.has(t3);
  }
  function n2(t3) {
    let n3 = e4.get(t3);
    return n3 === void 0 && (n3 = {}, e4.set(t3, n3)), n3;
  }
  function r2(t3) {
    e4.delete(t3);
  }
  function i2(t3, n3, r3) {
    e4.get(t3)[n3] = r3;
  }
  function a2() {
    e4 = /* @__PURE__ */ new WeakMap();
  }
  return { has: t2, get: n2, remove: r2, update: i2, dispose: a2 };
}
function Zl(e4, t2) {
  return e4.groupOrder === t2.groupOrder ? e4.renderOrder === t2.renderOrder ? e4.material.id === t2.material.id ? e4.materialVariant === t2.materialVariant ? e4.z === t2.z ? e4.id - t2.id : e4.z - t2.z : e4.materialVariant - t2.materialVariant : e4.material.id - t2.material.id : e4.renderOrder - t2.renderOrder : e4.groupOrder - t2.groupOrder;
}
function Ql(e4, t2) {
  return e4.groupOrder === t2.groupOrder ? e4.renderOrder === t2.renderOrder ? e4.z === t2.z ? e4.id - t2.id : t2.z - e4.z : e4.renderOrder - t2.renderOrder : e4.groupOrder - t2.groupOrder;
}
function $l() {
  let e4 = [], t2 = 0, n2 = [], r2 = [], i2 = [];
  function a2() {
    t2 = 0, n2.length = 0, r2.length = 0, i2.length = 0;
  }
  function o2(e5) {
    let t3 = 0;
    return e5.isInstancedMesh && (t3 += 2), e5.isSkinnedMesh && (t3 += 1), t3;
  }
  function s2(n3, r3, i3, a3, s3, c3) {
    let l3 = e4[t2];
    return l3 === void 0 ? (l3 = { id: n3.id, object: n3, geometry: r3, material: i3, materialVariant: o2(n3), groupOrder: a3, renderOrder: n3.renderOrder, z: s3, group: c3 }, e4[t2] = l3) : (l3.id = n3.id, l3.object = n3, l3.geometry = r3, l3.material = i3, l3.materialVariant = o2(n3), l3.groupOrder = a3, l3.renderOrder = n3.renderOrder, l3.z = s3, l3.group = c3), t2++, l3;
  }
  function c2(e5, t3, a3, o3, c3, l3) {
    let u3 = s2(e5, t3, a3, o3, c3, l3);
    a3.transmission > 0 ? r2.push(u3) : a3.transparent === true ? i2.push(u3) : n2.push(u3);
  }
  function l2(e5, t3, a3, o3, c3, l3) {
    let u3 = s2(e5, t3, a3, o3, c3, l3);
    a3.transmission > 0 ? r2.unshift(u3) : a3.transparent === true ? i2.unshift(u3) : n2.unshift(u3);
  }
  function u2(e5, t3) {
    n2.length > 1 && n2.sort(e5 || Zl), r2.length > 1 && r2.sort(t3 || Ql), i2.length > 1 && i2.sort(t3 || Ql);
  }
  function d2() {
    for (let n3 = t2, r3 = e4.length; n3 < r3; n3++) {
      let t3 = e4[n3];
      if (t3.id === null) break;
      t3.id = null, t3.object = null, t3.geometry = null, t3.material = null, t3.group = null;
    }
  }
  return { opaque: n2, transmissive: r2, transparent: i2, init: a2, push: c2, unshift: l2, finish: d2, sort: u2 };
}
function eu() {
  let e4 = /* @__PURE__ */ new WeakMap();
  function t2(t3, n3) {
    let r2 = e4.get(t3), i2;
    return r2 === void 0 ? (i2 = new $l(), e4.set(t3, [i2])) : n3 >= r2.length ? (i2 = new $l(), r2.push(i2)) : i2 = r2[n3], i2;
  }
  function n2() {
    e4 = /* @__PURE__ */ new WeakMap();
  }
  return { get: t2, dispose: n2 };
}
function tu() {
  let e4 = {};
  return { get: function(t2) {
    if (e4[t2.id] !== void 0) return e4[t2.id];
    let n2;
    switch (t2.type) {
      case `DirectionalLight`:
        n2 = { direction: new N(), color: new P() };
        break;
      case `SpotLight`:
        n2 = { position: new N(), direction: new N(), color: new P(), distance: 0, coneCos: 0, penumbraCos: 0, decay: 0 };
        break;
      case `PointLight`:
        n2 = { position: new N(), color: new P(), distance: 0, decay: 0 };
        break;
      case `HemisphereLight`:
        n2 = { direction: new N(), skyColor: new P(), groundColor: new P() };
        break;
      case `RectAreaLight`:
        n2 = { color: new P(), position: new N(), halfWidth: new N(), halfHeight: new N() };
        break;
    }
    return e4[t2.id] = n2, n2;
  } };
}
function nu() {
  let e4 = {};
  return { get: function(t2) {
    if (e4[t2.id] !== void 0) return e4[t2.id];
    let n2;
    switch (t2.type) {
      case `DirectionalLight`:
        n2 = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new M() };
        break;
      case `SpotLight`:
        n2 = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new M() };
        break;
      case `PointLight`:
        n2 = { shadowIntensity: 1, shadowBias: 0, shadowNormalBias: 0, shadowRadius: 1, shadowMapSize: new M(), shadowCameraNear: 1, shadowCameraFar: 1e3 };
        break;
    }
    return e4[t2.id] = n2, n2;
  } };
}
function ru(e4, t2) {
  return (t2.castShadow ? 2 : 0) - (e4.castShadow ? 2 : 0) + +!!t2.map - !!e4.map;
}
function iu(e4) {
  let t2 = new tu(), n2 = nu(), r2 = { version: 0, hash: { directionalLength: -1, pointLength: -1, spotLength: -1, rectAreaLength: -1, hemiLength: -1, numDirectionalShadows: -1, numPointShadows: -1, numSpotShadows: -1, numSpotMaps: -1, numLightProbes: -1 }, ambient: [0, 0, 0], probe: [], directional: [], directionalShadow: [], directionalShadowMap: [], directionalShadowMatrix: [], spot: [], spotLightMap: [], spotShadow: [], spotShadowMap: [], spotLightMatrix: [], rectArea: [], rectAreaLTC1: null, rectAreaLTC2: null, point: [], pointShadow: [], pointShadowMap: [], pointShadowMatrix: [], hemi: [], numSpotLightShadowsWithMaps: 0, numLightProbes: 0 };
  for (let e5 = 0; e5 < 9; e5++) r2.probe.push(new N());
  let i2 = new N(), a2 = new wr(), o2 = new wr();
  function s2(i3) {
    let a3 = 0, o3 = 0, s3 = 0;
    for (let e5 = 0; e5 < 9; e5++) r2.probe[e5].set(0, 0, 0);
    let c3 = 0, l2 = 0, u2 = 0, d2 = 0, f2 = 0, p2 = 0, m2 = 0, h2 = 0, g2 = 0, _2 = 0, v2 = 0;
    i3.sort(ru);
    for (let e5 = 0, y3 = i3.length; e5 < y3; e5++) {
      let y4 = i3[e5], b2 = y4.color, x2 = y4.intensity, S2 = y4.distance, C2 = null;
      if (y4.shadow && y4.shadow.map && (C2 = y4.shadow.map.texture.format === 1030 ? y4.shadow.map.texture : y4.shadow.map.depthTexture || y4.shadow.map.texture), y4.isAmbientLight) a3 += b2.r * x2, o3 += b2.g * x2, s3 += b2.b * x2;
      else if (y4.isLightProbe) {
        for (let e6 = 0; e6 < 9; e6++) r2.probe[e6].addScaledVector(y4.sh.coefficients[e6], x2);
        v2++;
      } else if (y4.isDirectionalLight) {
        let e6 = t2.get(y4);
        if (e6.color.copy(y4.color).multiplyScalar(y4.intensity), y4.castShadow) {
          let e7 = y4.shadow, t3 = n2.get(y4);
          t3.shadowIntensity = e7.intensity, t3.shadowBias = e7.bias, t3.shadowNormalBias = e7.normalBias, t3.shadowRadius = e7.radius, t3.shadowMapSize = e7.mapSize, r2.directionalShadow[c3] = t3, r2.directionalShadowMap[c3] = C2, r2.directionalShadowMatrix[c3] = y4.shadow.matrix, p2++;
        }
        r2.directional[c3] = e6, c3++;
      } else if (y4.isSpotLight) {
        let e6 = t2.get(y4);
        e6.position.setFromMatrixPosition(y4.matrixWorld), e6.color.copy(b2).multiplyScalar(x2), e6.distance = S2, e6.coneCos = Math.cos(y4.angle), e6.penumbraCos = Math.cos(y4.angle * (1 - y4.penumbra)), e6.decay = y4.decay, r2.spot[u2] = e6;
        let i4 = y4.shadow;
        if (y4.map && (r2.spotLightMap[g2] = y4.map, g2++, i4.updateMatrices(y4), y4.castShadow && _2++), r2.spotLightMatrix[u2] = i4.matrix, y4.castShadow) {
          let e7 = n2.get(y4);
          e7.shadowIntensity = i4.intensity, e7.shadowBias = i4.bias, e7.shadowNormalBias = i4.normalBias, e7.shadowRadius = i4.radius, e7.shadowMapSize = i4.mapSize, r2.spotShadow[u2] = e7, r2.spotShadowMap[u2] = C2, h2++;
        }
        u2++;
      } else if (y4.isRectAreaLight) {
        let e6 = t2.get(y4);
        e6.color.copy(b2).multiplyScalar(x2), e6.halfWidth.set(y4.width * 0.5, 0, 0), e6.halfHeight.set(0, y4.height * 0.5, 0), r2.rectArea[d2] = e6, d2++;
      } else if (y4.isPointLight) {
        let e6 = t2.get(y4);
        if (e6.color.copy(y4.color).multiplyScalar(y4.intensity), e6.distance = y4.distance, e6.decay = y4.decay, y4.castShadow) {
          let e7 = y4.shadow, t3 = n2.get(y4);
          t3.shadowIntensity = e7.intensity, t3.shadowBias = e7.bias, t3.shadowNormalBias = e7.normalBias, t3.shadowRadius = e7.radius, t3.shadowMapSize = e7.mapSize, t3.shadowCameraNear = e7.camera.near, t3.shadowCameraFar = e7.camera.far, r2.pointShadow[l2] = t3, r2.pointShadowMap[l2] = C2, r2.pointShadowMatrix[l2] = y4.shadow.matrix, m2++;
        }
        r2.point[l2] = e6, l2++;
      } else if (y4.isHemisphereLight) {
        let e6 = t2.get(y4);
        e6.skyColor.copy(y4.color).multiplyScalar(x2), e6.groundColor.copy(y4.groundColor).multiplyScalar(x2), r2.hemi[f2] = e6, f2++;
      }
    }
    d2 > 0 && (e4.has(`OES_texture_float_linear`) === true ? (r2.rectAreaLTC1 = F.LTC_FLOAT_1, r2.rectAreaLTC2 = F.LTC_FLOAT_2) : (r2.rectAreaLTC1 = F.LTC_HALF_1, r2.rectAreaLTC2 = F.LTC_HALF_2)), r2.ambient[0] = a3, r2.ambient[1] = o3, r2.ambient[2] = s3;
    let y2 = r2.hash;
    (y2.directionalLength !== c3 || y2.pointLength !== l2 || y2.spotLength !== u2 || y2.rectAreaLength !== d2 || y2.hemiLength !== f2 || y2.numDirectionalShadows !== p2 || y2.numPointShadows !== m2 || y2.numSpotShadows !== h2 || y2.numSpotMaps !== g2 || y2.numLightProbes !== v2) && (r2.directional.length = c3, r2.spot.length = u2, r2.rectArea.length = d2, r2.point.length = l2, r2.hemi.length = f2, r2.directionalShadow.length = p2, r2.directionalShadowMap.length = p2, r2.pointShadow.length = m2, r2.pointShadowMap.length = m2, r2.spotShadow.length = h2, r2.spotShadowMap.length = h2, r2.directionalShadowMatrix.length = p2, r2.pointShadowMatrix.length = m2, r2.spotLightMatrix.length = h2 + g2 - _2, r2.spotLightMap.length = g2, r2.numSpotLightShadowsWithMaps = _2, r2.numLightProbes = v2, y2.directionalLength = c3, y2.pointLength = l2, y2.spotLength = u2, y2.rectAreaLength = d2, y2.hemiLength = f2, y2.numDirectionalShadows = p2, y2.numPointShadows = m2, y2.numSpotShadows = h2, y2.numSpotMaps = g2, y2.numLightProbes = v2, r2.version = ld++);
  }
  function c2(e5, t3) {
    let n3 = 0, s3 = 0, c3 = 0, l2 = 0, u2 = 0, d2 = t3.matrixWorldInverse;
    for (let t4 = 0, f2 = e5.length; t4 < f2; t4++) {
      let f3 = e5[t4];
      if (f3.isDirectionalLight) {
        let e6 = r2.directional[n3];
        e6.direction.setFromMatrixPosition(f3.matrixWorld), i2.setFromMatrixPosition(f3.target.matrixWorld), e6.direction.sub(i2), e6.direction.transformDirection(d2), n3++;
      } else if (f3.isSpotLight) {
        let e6 = r2.spot[c3];
        e6.position.setFromMatrixPosition(f3.matrixWorld), e6.position.applyMatrix4(d2), e6.direction.setFromMatrixPosition(f3.matrixWorld), i2.setFromMatrixPosition(f3.target.matrixWorld), e6.direction.sub(i2), e6.direction.transformDirection(d2), c3++;
      } else if (f3.isRectAreaLight) {
        let e6 = r2.rectArea[l2];
        e6.position.setFromMatrixPosition(f3.matrixWorld), e6.position.applyMatrix4(d2), o2.identity(), a2.copy(f3.matrixWorld), a2.premultiply(d2), o2.extractRotation(a2), e6.halfWidth.set(f3.width * 0.5, 0, 0), e6.halfHeight.set(0, f3.height * 0.5, 0), e6.halfWidth.applyMatrix4(o2), e6.halfHeight.applyMatrix4(o2), l2++;
      } else if (f3.isPointLight) {
        let e6 = r2.point[s3];
        e6.position.setFromMatrixPosition(f3.matrixWorld), e6.position.applyMatrix4(d2), s3++;
      } else if (f3.isHemisphereLight) {
        let e6 = r2.hemi[u2];
        e6.direction.setFromMatrixPosition(f3.matrixWorld), e6.direction.transformDirection(d2), u2++;
      }
    }
  }
  return { setup: s2, setupView: c2, state: r2 };
}
function au(e4) {
  let t2 = new iu(e4), n2 = [], r2 = [], i2 = [];
  function a2(e5) {
    d2.camera = e5, n2.length = 0, r2.length = 0, i2.length = 0;
  }
  function o2(e5) {
    n2.push(e5);
  }
  function s2(e5) {
    r2.push(e5);
  }
  function c2(e5) {
    i2.push(e5);
  }
  function l2() {
    t2.setup(n2);
  }
  function u2(e5) {
    t2.setupView(n2, e5);
  }
  let d2 = { lightsArray: n2, shadowsArray: r2, lightProbeGridArray: i2, camera: null, lights: t2, transmissionRenderTarget: {}, textureUnits: 0 };
  return { init: a2, state: d2, setupLights: l2, setupLightsView: u2, pushLight: o2, pushShadow: s2, pushLightProbeGrid: c2 };
}
function ou(e4) {
  let t2 = /* @__PURE__ */ new WeakMap();
  function n2(n3, r3 = 0) {
    let i2 = t2.get(n3), a2;
    return i2 === void 0 ? (a2 = new au(e4), t2.set(n3, [a2])) : r3 >= i2.length ? (a2 = new au(e4), i2.push(a2)) : a2 = i2[r3], a2;
  }
  function r2() {
    t2 = /* @__PURE__ */ new WeakMap();
  }
  return { get: n2, dispose: r2 };
}
function su(e4, t2, n2) {
  let r2 = new $a(), i2 = new M(), a2 = new M(), o2 = new yr(), s2 = new Zo(), c2 = new Qo(), u2 = {}, d2 = n2.maxTextureSize, f2 = { 0: 1, 1: 0, 2: 2 }, p2 = new qo({ defines: { VSM_SAMPLES: 8 }, uniforms: { shadow_pass: { value: null }, resolution: { value: new M() }, radius: { value: 4 } }, vertexShader: ud, fragmentShader: dd }), m2 = p2.clone();
  m2.defines.HORIZONTAL_PASS = 1;
  let h2 = new Qi();
  h2.setAttribute(`position`, new Li(new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]), 3));
  let g2 = new xa(h2, p2), _2 = this;
  this.enabled = false, this.autoUpdate = true, this.needsUpdate = false, this.type = 1;
  let v2 = this.type;
  this.render = function(t3, n3, s3) {
    if (_2.enabled === false || _2.autoUpdate === false && _2.needsUpdate === false || t3.length === 0) return;
    this.type === 2 && (l(`WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.`), this.type = 1);
    let c3 = e4.getRenderTarget(), u3 = e4.getActiveCubeFace(), f3 = e4.getActiveMipmapLevel(), p3 = e4.state;
    p3.setBlending(0), p3.buffers.depth.getReversed() === true ? p3.buffers.color.setClear(0, 0, 0, 0) : p3.buffers.color.setClear(1, 1, 1, 1), p3.buffers.depth.setTest(true), p3.setScissorTest(false);
    let m3 = v2 !== this.type;
    m3 && n3.traverse(function(e5) {
      e5.material && (Array.isArray(e5.material) ? e5.material.forEach((e6) => e6.needsUpdate = true) : e5.material.needsUpdate = true);
    });
    for (let c4 = 0, u4 = t3.length; c4 < u4; c4++) {
      let u5 = t3[c4], f4 = u5.shadow;
      if (f4 === void 0) {
        l(`WebGLShadowMap:`, u5, `has no shadow.`);
        continue;
      }
      if (f4.autoUpdate === false && f4.needsUpdate === false) continue;
      i2.copy(f4.mapSize);
      let h3 = f4.getFrameExtents();
      i2.multiply(h3), a2.copy(f4.mapSize), (i2.x > d2 || i2.y > d2) && (i2.x > d2 && (a2.x = Math.floor(d2 / h3.x), i2.x = a2.x * h3.x, f4.mapSize.x = a2.x), i2.y > d2 && (a2.y = Math.floor(d2 / h3.y), i2.y = a2.y * h3.y, f4.mapSize.y = a2.y));
      let g3 = e4.state.buffers.depth.getReversed();
      if (f4.camera._reversedDepth = g3, f4.map === null || m3 === true) {
        if (f4.map !== null && (f4.map.depthTexture !== null && (f4.map.depthTexture.dispose(), f4.map.depthTexture = null), f4.map.dispose()), this.type === 3) {
          if (u5.isPointLight) {
            l(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);
            continue;
          }
          f4.map = new xr(i2.x, i2.y, { format: Kt, type: Nt, minFilter: Ct, magFilter: Ct, generateMipmaps: false }), f4.map.texture.name = u5.name + `.shadowMap`, f4.map.depthTexture = new no(i2.x, i2.y, Mt), f4.map.depthTexture.name = u5.name + `.shadowMapDepth`, f4.map.depthTexture.format = Ht, f4.map.depthTexture.compareFunction = null, f4.map.depthTexture.minFilter = bt, f4.map.depthTexture.magFilter = bt;
        } else u5.isPointLight ? (f4.map = new ju(i2.x), f4.map.depthTexture = new ro(i2.x, jt)) : (f4.map = new xr(i2.x, i2.y), f4.map.depthTexture = new no(i2.x, i2.y, jt)), f4.map.depthTexture.name = u5.name + `.shadowMap`, f4.map.depthTexture.format = Ht, this.type === 1 ? (f4.map.depthTexture.compareFunction = g3 ? 518 : 515, f4.map.depthTexture.minFilter = Ct, f4.map.depthTexture.magFilter = Ct) : (f4.map.depthTexture.compareFunction = null, f4.map.depthTexture.minFilter = bt, f4.map.depthTexture.magFilter = bt);
        f4.camera.updateProjectionMatrix();
      }
      let _3 = f4.map.isWebGLCubeRenderTarget ? 6 : 1;
      for (let t4 = 0; t4 < _3; t4++) {
        if (f4.map.isWebGLCubeRenderTarget) e4.setRenderTarget(f4.map, t4), e4.clear();
        else {
          t4 === 0 && (e4.setRenderTarget(f4.map), e4.clear());
          let n4 = f4.getViewport(t4);
          o2.set(a2.x * n4.x, a2.y * n4.y, a2.x * n4.z, a2.y * n4.w), p3.viewport(o2);
        }
        if (u5.isPointLight) {
          let e5 = f4.camera, n4 = f4.matrix, r3 = u5.distance || e5.far;
          r3 !== e5.far && (e5.far = r3, e5.updateProjectionMatrix()), hd.setFromMatrixPosition(u5.matrixWorld), e5.position.copy(hd), gd.copy(e5.position), gd.add(fd[t4]), e5.up.copy(pd[t4]), e5.lookAt(gd), e5.updateMatrixWorld(), n4.makeTranslation(-hd.x, -hd.y, -hd.z), md.multiplyMatrices(e5.projectionMatrix, e5.matrixWorldInverse), f4._frustum.setFromProjectionMatrix(md, e5.coordinateSystem, e5.reversedDepth);
        } else f4.updateMatrices(u5);
        r2 = f4.getFrustum(), x2(n3, s3, f4.camera, u5, this.type);
      }
      f4.isPointLightShadow !== true && this.type === 3 && y2(f4, s3), f4.needsUpdate = false;
    }
    v2 = this.type, _2.needsUpdate = false, e4.setRenderTarget(c3, u3, f3);
  };
  function y2(n3, r3) {
    let a3 = t2.update(g2);
    p2.defines.VSM_SAMPLES !== n3.blurSamples && (p2.defines.VSM_SAMPLES = n3.blurSamples, m2.defines.VSM_SAMPLES = n3.blurSamples, p2.needsUpdate = true, m2.needsUpdate = true), n3.mapPass === null && (n3.mapPass = new xr(i2.x, i2.y, { format: Kt, type: Nt })), p2.uniforms.shadow_pass.value = n3.map.depthTexture, p2.uniforms.resolution.value = n3.mapSize, p2.uniforms.radius.value = n3.radius, e4.setRenderTarget(n3.mapPass), e4.clear(), e4.renderBufferDirect(r3, null, a3, p2, g2, null), m2.uniforms.shadow_pass.value = n3.mapPass.texture, m2.uniforms.resolution.value = n3.mapSize, m2.uniforms.radius.value = n3.radius, e4.setRenderTarget(n3.map), e4.clear(), e4.renderBufferDirect(r3, null, a3, m2, g2, null);
  }
  function b2(t3, n3, r3, i3) {
    let a3 = null, o3 = r3.isPointLight === true ? t3.customDistanceMaterial : t3.customDepthMaterial;
    if (o3 !== void 0) a3 = o3;
    else if (a3 = r3.isPointLight === true ? c2 : s2, e4.localClippingEnabled && n3.clipShadows === true && Array.isArray(n3.clippingPlanes) && n3.clippingPlanes.length !== 0 || n3.displacementMap && n3.displacementScale !== 0 || n3.alphaMap && n3.alphaTest > 0 || n3.map && n3.alphaTest > 0 || n3.alphaToCoverage === true) {
      let e5 = a3.uuid, t4 = n3.uuid, r4 = u2[e5];
      r4 === void 0 && (r4 = {}, u2[e5] = r4);
      let i4 = r4[t4];
      i4 === void 0 && (i4 = a3.clone(), r4[t4] = i4, n3.addEventListener(`dispose`, S2)), a3 = i4;
    }
    if (a3.visible = n3.visible, a3.wireframe = n3.wireframe, i3 === 3 ? a3.side = n3.shadowSide === null ? n3.side : n3.shadowSide : a3.side = n3.shadowSide === null ? f2[n3.side] : n3.shadowSide, a3.alphaMap = n3.alphaMap, a3.alphaTest = n3.alphaToCoverage === true ? 0.5 : n3.alphaTest, a3.map = n3.map, a3.clipShadows = n3.clipShadows, a3.clippingPlanes = n3.clippingPlanes, a3.clipIntersection = n3.clipIntersection, a3.displacementMap = n3.displacementMap, a3.displacementScale = n3.displacementScale, a3.displacementBias = n3.displacementBias, a3.wireframeLinewidth = n3.wireframeLinewidth, a3.linewidth = n3.linewidth, r3.isPointLight === true && a3.isMeshDistanceMaterial === true) {
      let t4 = e4.properties.get(a3);
      t4.light = r3;
    }
    return a3;
  }
  function x2(n3, i3, a3, o3, s3) {
    if (n3.visible === false) return;
    if (n3.layers.test(i3.layers) && (n3.isMesh || n3.isLine || n3.isPoints) && (n3.castShadow || n3.receiveShadow && s3 === 3) && (!n3.frustumCulled || r2.intersectsObject(n3))) {
      n3.modelViewMatrix.multiplyMatrices(a3.matrixWorldInverse, n3.matrixWorld);
      let r3 = t2.update(n3), c4 = n3.material;
      if (Array.isArray(c4)) {
        let t3 = r3.groups;
        for (let l2 = 0, u3 = t3.length; l2 < u3; l2++) {
          let u4 = t3[l2], d3 = c4[u4.materialIndex];
          if (d3 && d3.visible) {
            let t4 = b2(n3, d3, o3, s3);
            n3.onBeforeShadow(e4, n3, i3, a3, r3, t4, u4), e4.renderBufferDirect(a3, null, r3, t4, n3, u4), n3.onAfterShadow(e4, n3, i3, a3, r3, t4, u4);
          }
        }
      } else if (c4.visible) {
        let t3 = b2(n3, c4, o3, s3);
        n3.onBeforeShadow(e4, n3, i3, a3, r3, t3, null), e4.renderBufferDirect(a3, null, r3, t3, n3, null), n3.onAfterShadow(e4, n3, i3, a3, r3, t3, null);
      }
    }
    let c3 = n3.children;
    for (let e5 = 0, t3 = c3.length; e5 < t3; e5++) x2(c3[e5], i3, a3, o3, s3);
  }
  function S2(e5) {
    e5.target.removeEventListener(`dispose`, S2);
    for (let t3 in u2) {
      let n3 = u2[t3], r3 = e5.target.uuid;
      r3 in n3 && (n3[r3].dispose(), delete n3[r3]);
    }
  }
}
function cu(e4, t2) {
  function n2() {
    let t3 = false, n3 = new yr(), r3 = null, i3 = new yr(0, 0, 0, 0);
    return { setMask: function(n4) {
      r3 !== n4 && !t3 && (e4.colorMask(n4, n4, n4, n4), r3 = n4);
    }, setLocked: function(e5) {
      t3 = e5;
    }, setClear: function(t4, r4, a3, o3, s3) {
      s3 === true && (t4 *= o3, r4 *= o3, a3 *= o3), n3.set(t4, r4, a3, o3), i3.equals(n3) === false && (e4.clearColor(t4, r4, a3, o3), i3.copy(n3));
    }, reset: function() {
      t3 = false, r3 = null, i3.set(-1, 0, 0, 0);
    } };
  }
  function r2() {
    let n3 = false, r3 = false, i3 = null, a3 = null, o3 = null;
    return { setReversed: function(e5) {
      if (r3 !== e5) {
        let n4 = t2.get(`EXT_clip_control`);
        e5 ? n4.clipControlEXT(n4.LOWER_LEFT_EXT, n4.ZERO_TO_ONE_EXT) : n4.clipControlEXT(n4.LOWER_LEFT_EXT, n4.NEGATIVE_ONE_TO_ONE_EXT), r3 = e5;
        let i4 = o3;
        o3 = null, this.setClear(i4);
      }
    }, getReversed: function() {
      return r3;
    }, setTest: function(t3) {
      t3 ? me2(e4.DEPTH_TEST) : he2(e4.DEPTH_TEST);
    }, setMask: function(t3) {
      i3 !== t3 && !n3 && (e4.depthMask(t3), i3 = t3);
    }, setFunc: function(t3) {
      if (r3 && (t3 = Zn[t3]), a3 !== t3) {
        switch (t3) {
          case 0:
            e4.depthFunc(e4.NEVER);
            break;
          case 1:
            e4.depthFunc(e4.ALWAYS);
            break;
          case 2:
            e4.depthFunc(e4.LESS);
            break;
          case 3:
            e4.depthFunc(e4.LEQUAL);
            break;
          case 4:
            e4.depthFunc(e4.EQUAL);
            break;
          case 5:
            e4.depthFunc(e4.GEQUAL);
            break;
          case 6:
            e4.depthFunc(e4.GREATER);
            break;
          case 7:
            e4.depthFunc(e4.NOTEQUAL);
            break;
          default:
            e4.depthFunc(e4.LEQUAL);
        }
        a3 = t3;
      }
    }, setLocked: function(e5) {
      n3 = e5;
    }, setClear: function(t3) {
      o3 !== t3 && (o3 = t3, r3 && (t3 = 1 - t3), e4.clearDepth(t3));
    }, reset: function() {
      n3 = false, i3 = null, a3 = null, o3 = null, r3 = false;
    } };
  }
  function i2() {
    let t3 = false, n3 = null, r3 = null, i3 = null, a3 = null, o3 = null, s3 = null, c3 = null, l3 = null;
    return { setTest: function(n4) {
      t3 || (n4 ? me2(e4.STENCIL_TEST) : he2(e4.STENCIL_TEST));
    }, setMask: function(r4) {
      n3 !== r4 && !t3 && (e4.stencilMask(r4), n3 = r4);
    }, setFunc: function(t4, n4, o4) {
      (r3 !== t4 || i3 !== n4 || a3 !== o4) && (e4.stencilFunc(t4, n4, o4), r3 = t4, i3 = n4, a3 = o4);
    }, setOp: function(t4, n4, r4) {
      (o3 !== t4 || s3 !== n4 || c3 !== r4) && (e4.stencilOp(t4, n4, r4), o3 = t4, s3 = n4, c3 = r4);
    }, setLocked: function(e5) {
      t3 = e5;
    }, setClear: function(t4) {
      l3 !== t4 && (e4.clearStencil(t4), l3 = t4);
    }, reset: function() {
      t3 = false, n3 = null, r3 = null, i3 = null, a3 = null, o3 = null, s3 = null, c3 = null, l3 = null;
    } };
  }
  let a2 = new n2(), o2 = new r2(), s2 = new i2(), c2 = /* @__PURE__ */ new WeakMap(), l2 = /* @__PURE__ */ new WeakMap(), d2 = {}, f2 = {}, p2 = {}, m2 = /* @__PURE__ */ new WeakMap(), h2 = [], g2 = null, _2 = false, v2 = null, y2 = null, b2 = null, x2 = null, S2 = null, C2 = null, w2 = null, T2 = new P(0, 0, 0), E2 = 0, D2 = false, O2 = null, k2 = null, A2 = null, ee2 = null, te2 = null, ne2 = e4.getParameter(e4.MAX_COMBINED_TEXTURE_IMAGE_UNITS), re2 = false, ie2 = 0, ae2 = e4.getParameter(e4.VERSION);
  ae2.indexOf(`WebGL`) === -1 ? ae2.indexOf(`OpenGL ES`) !== -1 && (ie2 = parseFloat(/^OpenGL ES (\d)/.exec(ae2)[1]), re2 = ie2 >= 2) : (ie2 = parseFloat(/^WebGL (\d)/.exec(ae2)[1]), re2 = ie2 >= 1);
  let oe2 = null, se2 = {}, ce2 = e4.getParameter(e4.SCISSOR_BOX), le2 = e4.getParameter(e4.VIEWPORT), ue2 = new yr().fromArray(ce2), de2 = new yr().fromArray(le2);
  function fe2(t3, n3, r3, i3) {
    let a3 = new Uint8Array(4), o3 = e4.createTexture();
    e4.bindTexture(t3, o3), e4.texParameteri(t3, e4.TEXTURE_MIN_FILTER, e4.NEAREST), e4.texParameteri(t3, e4.TEXTURE_MAG_FILTER, e4.NEAREST);
    for (let o4 = 0; o4 < r3; o4++) t3 === e4.TEXTURE_3D || t3 === e4.TEXTURE_2D_ARRAY ? e4.texImage3D(n3, 0, e4.RGBA, 1, 1, i3, 0, e4.RGBA, e4.UNSIGNED_BYTE, a3) : e4.texImage2D(n3 + o4, 0, e4.RGBA, 1, 1, 0, e4.RGBA, e4.UNSIGNED_BYTE, a3);
    return o3;
  }
  let pe2 = {};
  pe2[e4.TEXTURE_2D] = fe2(e4.TEXTURE_2D, e4.TEXTURE_2D, 1), pe2[e4.TEXTURE_CUBE_MAP] = fe2(e4.TEXTURE_CUBE_MAP, e4.TEXTURE_CUBE_MAP_POSITIVE_X, 6), pe2[e4.TEXTURE_2D_ARRAY] = fe2(e4.TEXTURE_2D_ARRAY, e4.TEXTURE_2D_ARRAY, 1, 1), pe2[e4.TEXTURE_3D] = fe2(e4.TEXTURE_3D, e4.TEXTURE_3D, 1, 1), a2.setClear(0, 0, 0, 1), o2.setClear(1), s2.setClear(0), me2(e4.DEPTH_TEST), o2.setFunc(3), Ce2(false), we2(1), me2(e4.CULL_FACE), xe2(0);
  function me2(t3) {
    d2[t3] !== true && (e4.enable(t3), d2[t3] = true);
  }
  function he2(t3) {
    d2[t3] !== false && (e4.disable(t3), d2[t3] = false);
  }
  function ge2(t3, n3) {
    return p2[t3] === n3 ? false : (e4.bindFramebuffer(t3, n3), p2[t3] = n3, t3 === e4.DRAW_FRAMEBUFFER && (p2[e4.FRAMEBUFFER] = n3), t3 === e4.FRAMEBUFFER && (p2[e4.DRAW_FRAMEBUFFER] = n3), true);
  }
  function _e2(t3, n3) {
    let r3 = h2, i3 = false;
    if (t3) {
      r3 = m2.get(n3), r3 === void 0 && (r3 = [], m2.set(n3, r3));
      let a3 = t3.textures;
      if (r3.length !== a3.length || r3[0] !== e4.COLOR_ATTACHMENT0) {
        for (let t4 = 0, n4 = a3.length; t4 < n4; t4++) r3[t4] = e4.COLOR_ATTACHMENT0 + t4;
        r3.length = a3.length, i3 = true;
      }
    } else r3[0] !== e4.BACK && (r3[0] = e4.BACK, i3 = true);
    i3 && e4.drawBuffers(r3);
  }
  function ve2(t3) {
    return g2 === t3 ? false : (e4.useProgram(t3), g2 = t3, true);
  }
  let ye2 = { 100: e4.FUNC_ADD, 101: e4.FUNC_SUBTRACT, 102: e4.FUNC_REVERSE_SUBTRACT };
  ye2[103] = e4.MIN, ye2[104] = e4.MAX;
  let be2 = { 200: e4.ZERO, 201: e4.ONE, 202: e4.SRC_COLOR, 204: e4.SRC_ALPHA, 210: e4.SRC_ALPHA_SATURATE, 208: e4.DST_COLOR, 206: e4.DST_ALPHA, 203: e4.ONE_MINUS_SRC_COLOR, 205: e4.ONE_MINUS_SRC_ALPHA, 209: e4.ONE_MINUS_DST_COLOR, 207: e4.ONE_MINUS_DST_ALPHA, 211: e4.CONSTANT_COLOR, 212: e4.ONE_MINUS_CONSTANT_COLOR, 213: e4.CONSTANT_ALPHA, 214: e4.ONE_MINUS_CONSTANT_ALPHA };
  function xe2(t3, n3, r3, i3, a3, o3, s3, c3, l3, d3) {
    if (t3 === 0) {
      _2 === true && (he2(e4.BLEND), _2 = false);
      return;
    }
    if (_2 === false && (me2(e4.BLEND), _2 = true), t3 !== 5) {
      if (t3 !== v2 || d3 !== D2) {
        if ((y2 !== 100 || S2 !== 100) && (e4.blendEquation(e4.FUNC_ADD), y2 = 100, S2 = 100), d3) switch (t3) {
          case 1:
            e4.blendFuncSeparate(e4.ONE, e4.ONE_MINUS_SRC_ALPHA, e4.ONE, e4.ONE_MINUS_SRC_ALPHA);
            break;
          case 2:
            e4.blendFunc(e4.ONE, e4.ONE);
            break;
          case 3:
            e4.blendFuncSeparate(e4.ZERO, e4.ONE_MINUS_SRC_COLOR, e4.ZERO, e4.ONE);
            break;
          case 4:
            e4.blendFuncSeparate(e4.DST_COLOR, e4.ONE_MINUS_SRC_ALPHA, e4.ZERO, e4.ONE);
            break;
          default:
            u(`WebGLState: Invalid blending: `, t3);
            break;
        }
        else switch (t3) {
          case 1:
            e4.blendFuncSeparate(e4.SRC_ALPHA, e4.ONE_MINUS_SRC_ALPHA, e4.ONE, e4.ONE_MINUS_SRC_ALPHA);
            break;
          case 2:
            e4.blendFuncSeparate(e4.SRC_ALPHA, e4.ONE, e4.ONE, e4.ONE);
            break;
          case 3:
            u(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);
            break;
          case 4:
            u(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);
            break;
          default:
            u(`WebGLState: Invalid blending: `, t3);
            break;
        }
        b2 = null, x2 = null, C2 = null, w2 = null, T2.set(0, 0, 0), E2 = 0, v2 = t3, D2 = d3;
      }
      return;
    }
    a3 ||= n3, o3 ||= r3, s3 ||= i3, (n3 !== y2 || a3 !== S2) && (e4.blendEquationSeparate(ye2[n3], ye2[a3]), y2 = n3, S2 = a3), (r3 !== b2 || i3 !== x2 || o3 !== C2 || s3 !== w2) && (e4.blendFuncSeparate(be2[r3], be2[i3], be2[o3], be2[s3]), b2 = r3, x2 = i3, C2 = o3, w2 = s3), (c3.equals(T2) === false || l3 !== E2) && (e4.blendColor(c3.r, c3.g, c3.b, l3), T2.copy(c3), E2 = l3), v2 = t3, D2 = false;
  }
  function Se2(t3, n3) {
    t3.side === 2 ? he2(e4.CULL_FACE) : me2(e4.CULL_FACE);
    let r3 = t3.side === 1;
    n3 && (r3 = !r3), Ce2(r3), t3.blending === 1 && t3.transparent === false ? xe2(0) : xe2(t3.blending, t3.blendEquation, t3.blendSrc, t3.blendDst, t3.blendEquationAlpha, t3.blendSrcAlpha, t3.blendDstAlpha, t3.blendColor, t3.blendAlpha, t3.premultipliedAlpha), o2.setFunc(t3.depthFunc), o2.setTest(t3.depthTest), o2.setMask(t3.depthWrite), a2.setMask(t3.colorWrite);
    let i3 = t3.stencilWrite;
    s2.setTest(i3), i3 && (s2.setMask(t3.stencilWriteMask), s2.setFunc(t3.stencilFunc, t3.stencilRef, t3.stencilFuncMask), s2.setOp(t3.stencilFail, t3.stencilZFail, t3.stencilZPass)), Ee2(t3.polygonOffset, t3.polygonOffsetFactor, t3.polygonOffsetUnits), t3.alphaToCoverage === true ? me2(e4.SAMPLE_ALPHA_TO_COVERAGE) : he2(e4.SAMPLE_ALPHA_TO_COVERAGE);
  }
  function Ce2(t3) {
    O2 !== t3 && (t3 ? e4.frontFace(e4.CW) : e4.frontFace(e4.CCW), O2 = t3);
  }
  function we2(t3) {
    t3 === 0 ? he2(e4.CULL_FACE) : (me2(e4.CULL_FACE), t3 !== k2 && (t3 === 1 ? e4.cullFace(e4.BACK) : t3 === 2 ? e4.cullFace(e4.FRONT) : e4.cullFace(e4.FRONT_AND_BACK))), k2 = t3;
  }
  function Te2(t3) {
    t3 !== A2 && (re2 && e4.lineWidth(t3), A2 = t3);
  }
  function Ee2(t3, n3, r3) {
    t3 ? (me2(e4.POLYGON_OFFSET_FILL), (ee2 !== n3 || te2 !== r3) && (ee2 = n3, te2 = r3, o2.getReversed() && (n3 = -n3), e4.polygonOffset(n3, r3))) : he2(e4.POLYGON_OFFSET_FILL);
  }
  function De2(t3) {
    t3 ? me2(e4.SCISSOR_TEST) : he2(e4.SCISSOR_TEST);
  }
  function Oe2(t3) {
    t3 === void 0 && (t3 = e4.TEXTURE0 + ne2 - 1), oe2 !== t3 && (e4.activeTexture(t3), oe2 = t3);
  }
  function j2(t3, n3, r3) {
    r3 === void 0 && (r3 = oe2 === null ? e4.TEXTURE0 + ne2 - 1 : oe2);
    let i3 = se2[r3];
    i3 === void 0 && (i3 = { type: void 0, texture: void 0 }, se2[r3] = i3), (i3.type !== t3 || i3.texture !== n3) && (oe2 !== r3 && (e4.activeTexture(r3), oe2 = r3), e4.bindTexture(t3, n3 || pe2[t3]), i3.type = t3, i3.texture = n3);
  }
  function ke2() {
    let t3 = se2[oe2];
    t3 !== void 0 && t3.type !== void 0 && (e4.bindTexture(t3.type, null), t3.type = void 0, t3.texture = void 0);
  }
  function Ae2() {
    try {
      e4.compressedTexImage2D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function je2() {
    try {
      e4.compressedTexImage3D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Me2() {
    try {
      e4.texSubImage2D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Ne2() {
    try {
      e4.texSubImage3D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Pe2() {
    try {
      e4.compressedTexSubImage2D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Fe2() {
    try {
      e4.compressedTexSubImage3D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Ie2() {
    try {
      e4.texStorage2D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Le2() {
    try {
      e4.texStorage3D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Re2() {
    try {
      e4.texImage2D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function ze2() {
    try {
      e4.texImage3D(...arguments);
    } catch (e5) {
      u(`WebGLState:`, e5);
    }
  }
  function Be2(t3) {
    return f2[t3] === void 0 ? e4.getParameter(t3) : f2[t3];
  }
  function Ve2(t3, n3) {
    f2[t3] !== n3 && (e4.pixelStorei(t3, n3), f2[t3] = n3);
  }
  function He2(t3) {
    ue2.equals(t3) === false && (e4.scissor(t3.x, t3.y, t3.z, t3.w), ue2.copy(t3));
  }
  function Ue2(t3) {
    de2.equals(t3) === false && (e4.viewport(t3.x, t3.y, t3.z, t3.w), de2.copy(t3));
  }
  function We2(t3, n3) {
    let r3 = l2.get(n3);
    r3 === void 0 && (r3 = /* @__PURE__ */ new WeakMap(), l2.set(n3, r3));
    let i3 = r3.get(t3);
    i3 === void 0 && (i3 = e4.getUniformBlockIndex(n3, t3.name), r3.set(t3, i3));
  }
  function Ge2(t3, n3) {
    let r3 = l2.get(n3).get(t3);
    c2.get(n3) !== r3 && (e4.uniformBlockBinding(n3, r3, t3.__bindingPointIndex), c2.set(n3, r3));
  }
  function Ke2() {
    e4.disable(e4.BLEND), e4.disable(e4.CULL_FACE), e4.disable(e4.DEPTH_TEST), e4.disable(e4.POLYGON_OFFSET_FILL), e4.disable(e4.SCISSOR_TEST), e4.disable(e4.STENCIL_TEST), e4.disable(e4.SAMPLE_ALPHA_TO_COVERAGE), e4.blendEquation(e4.FUNC_ADD), e4.blendFunc(e4.ONE, e4.ZERO), e4.blendFuncSeparate(e4.ONE, e4.ZERO, e4.ONE, e4.ZERO), e4.blendColor(0, 0, 0, 0), e4.colorMask(true, true, true, true), e4.clearColor(0, 0, 0, 0), e4.depthMask(true), e4.depthFunc(e4.LESS), o2.setReversed(false), e4.clearDepth(1), e4.stencilMask(4294967295), e4.stencilFunc(e4.ALWAYS, 0, 4294967295), e4.stencilOp(e4.KEEP, e4.KEEP, e4.KEEP), e4.clearStencil(0), e4.cullFace(e4.BACK), e4.frontFace(e4.CCW), e4.polygonOffset(0, 0), e4.activeTexture(e4.TEXTURE0), e4.bindFramebuffer(e4.FRAMEBUFFER, null), e4.bindFramebuffer(e4.DRAW_FRAMEBUFFER, null), e4.bindFramebuffer(e4.READ_FRAMEBUFFER, null), e4.useProgram(null), e4.lineWidth(1), e4.scissor(0, 0, e4.canvas.width, e4.canvas.height), e4.viewport(0, 0, e4.canvas.width, e4.canvas.height), e4.pixelStorei(e4.PACK_ALIGNMENT, 4), e4.pixelStorei(e4.UNPACK_ALIGNMENT, 4), e4.pixelStorei(e4.UNPACK_FLIP_Y_WEBGL, false), e4.pixelStorei(e4.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false), e4.pixelStorei(e4.UNPACK_COLORSPACE_CONVERSION_WEBGL, e4.BROWSER_DEFAULT_WEBGL), e4.pixelStorei(e4.PACK_ROW_LENGTH, 0), e4.pixelStorei(e4.PACK_SKIP_PIXELS, 0), e4.pixelStorei(e4.PACK_SKIP_ROWS, 0), e4.pixelStorei(e4.UNPACK_ROW_LENGTH, 0), e4.pixelStorei(e4.UNPACK_IMAGE_HEIGHT, 0), e4.pixelStorei(e4.UNPACK_SKIP_PIXELS, 0), e4.pixelStorei(e4.UNPACK_SKIP_ROWS, 0), e4.pixelStorei(e4.UNPACK_SKIP_IMAGES, 0), d2 = {}, f2 = {}, oe2 = null, se2 = {}, p2 = {}, m2 = /* @__PURE__ */ new WeakMap(), h2 = [], g2 = null, _2 = false, v2 = null, y2 = null, b2 = null, x2 = null, S2 = null, C2 = null, w2 = null, T2 = new P(0, 0, 0), E2 = 0, D2 = false, O2 = null, k2 = null, A2 = null, ee2 = null, te2 = null, ue2.set(0, 0, e4.canvas.width, e4.canvas.height), de2.set(0, 0, e4.canvas.width, e4.canvas.height), a2.reset(), o2.reset(), s2.reset();
  }
  return { buffers: { color: a2, depth: o2, stencil: s2 }, enable: me2, disable: he2, bindFramebuffer: ge2, drawBuffers: _e2, useProgram: ve2, setBlending: xe2, setMaterial: Se2, setFlipSided: Ce2, setCullFace: we2, setLineWidth: Te2, setPolygonOffset: Ee2, setScissorTest: De2, activeTexture: Oe2, bindTexture: j2, unbindTexture: ke2, compressedTexImage2D: Ae2, compressedTexImage3D: je2, texImage2D: Re2, texImage3D: ze2, pixelStorei: Ve2, getParameter: Be2, updateUBOMapping: We2, uniformBlockBinding: Ge2, texStorage2D: Ie2, texStorage3D: Le2, texSubImage2D: Me2, texSubImage3D: Ne2, compressedTexSubImage2D: Pe2, compressedTexSubImage3D: Fe2, scissor: He2, viewport: Ue2, reset: Ke2 };
}
function lu(e4, t2, n2, r2, i2, o2, s2) {
  let c2 = t2.has(`WEBGL_multisampled_render_to_texture`) ? t2.get(`WEBGL_multisampled_render_to_texture`) : null, d2 = typeof navigator > `u` ? false : /OculusBrowser/g.test(navigator.userAgent), f2 = new M(), p2 = /* @__PURE__ */ new WeakMap(), m2 = /* @__PURE__ */ new Set(), h2, g2 = /* @__PURE__ */ new WeakMap(), _2 = false;
  try {
    _2 = typeof OffscreenCanvas < `u` && new OffscreenCanvas(1, 1).getContext(`2d`) !== null;
  } catch {
  }
  function v2(e5, t3) {
    return _2 ? new OffscreenCanvas(e5, t3) : a(`canvas`);
  }
  function y2(e5, t3, n3) {
    let r3 = 1, i3 = Me2(e5);
    if ((i3.width > n3 || i3.height > n3) && (r3 = n3 / Math.max(i3.width, i3.height)), r3 < 1) if (typeof HTMLImageElement < `u` && e5 instanceof HTMLImageElement || typeof HTMLCanvasElement < `u` && e5 instanceof HTMLCanvasElement || typeof ImageBitmap < `u` && e5 instanceof ImageBitmap || typeof VideoFrame < `u` && e5 instanceof VideoFrame) {
      let n4 = Math.floor(r3 * i3.width), a2 = Math.floor(r3 * i3.height);
      h2 === void 0 && (h2 = v2(n4, a2));
      let o3 = t3 ? v2(n4, a2) : h2;
      return o3.width = n4, o3.height = a2, o3.getContext(`2d`).drawImage(e5, 0, 0, n4, a2), l(`WebGLRenderer: Texture has been resized from (` + i3.width + `x` + i3.height + `) to (` + n4 + `x` + a2 + `).`), o3;
    } else return `data` in e5 && l(`WebGLRenderer: Image in DataTexture is too big (` + i3.width + `x` + i3.height + `).`), e5;
    return e5;
  }
  function b2(e5) {
    return e5.generateMipmaps;
  }
  function x2(t3) {
    e4.generateMipmap(t3);
  }
  function S2(t3) {
    return t3.isWebGLCubeRenderTarget ? e4.TEXTURE_CUBE_MAP : t3.isWebGL3DRenderTarget ? e4.TEXTURE_3D : t3.isWebGLArrayRenderTarget || t3.isCompressedArrayTexture ? e4.TEXTURE_2D_ARRAY : e4.TEXTURE_2D;
  }
  function C2(n3, r3, i3, a2, o3, s3 = false) {
    if (n3 !== null) {
      if (e4[n3] !== void 0) return e4[n3];
      l(`WebGLRenderer: Attempt to use non-existing WebGL internal format '` + n3 + `'`);
    }
    let c3;
    a2 && (c3 = t2.get(`EXT_texture_norm16`), c3 || l(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));
    let u2 = r3;
    if (r3 === e4.RED && (i3 === e4.FLOAT && (u2 = e4.R32F), i3 === e4.HALF_FLOAT && (u2 = e4.R16F), i3 === e4.UNSIGNED_BYTE && (u2 = e4.R8), i3 === e4.UNSIGNED_SHORT && c3 && (u2 = c3.R16_EXT), i3 === e4.SHORT && c3 && (u2 = c3.R16_SNORM_EXT)), r3 === e4.RED_INTEGER && (i3 === e4.UNSIGNED_BYTE && (u2 = e4.R8UI), i3 === e4.UNSIGNED_SHORT && (u2 = e4.R16UI), i3 === e4.UNSIGNED_INT && (u2 = e4.R32UI), i3 === e4.BYTE && (u2 = e4.R8I), i3 === e4.SHORT && (u2 = e4.R16I), i3 === e4.INT && (u2 = e4.R32I)), r3 === e4.RG && (i3 === e4.FLOAT && (u2 = e4.RG32F), i3 === e4.HALF_FLOAT && (u2 = e4.RG16F), i3 === e4.UNSIGNED_BYTE && (u2 = e4.RG8), i3 === e4.UNSIGNED_SHORT && c3 && (u2 = c3.RG16_EXT), i3 === e4.SHORT && c3 && (u2 = c3.RG16_SNORM_EXT)), r3 === e4.RG_INTEGER && (i3 === e4.UNSIGNED_BYTE && (u2 = e4.RG8UI), i3 === e4.UNSIGNED_SHORT && (u2 = e4.RG16UI), i3 === e4.UNSIGNED_INT && (u2 = e4.RG32UI), i3 === e4.BYTE && (u2 = e4.RG8I), i3 === e4.SHORT && (u2 = e4.RG16I), i3 === e4.INT && (u2 = e4.RG32I)), r3 === e4.RGB_INTEGER && (i3 === e4.UNSIGNED_BYTE && (u2 = e4.RGB8UI), i3 === e4.UNSIGNED_SHORT && (u2 = e4.RGB16UI), i3 === e4.UNSIGNED_INT && (u2 = e4.RGB32UI), i3 === e4.BYTE && (u2 = e4.RGB8I), i3 === e4.SHORT && (u2 = e4.RGB16I), i3 === e4.INT && (u2 = e4.RGB32I)), r3 === e4.RGBA_INTEGER && (i3 === e4.UNSIGNED_BYTE && (u2 = e4.RGBA8UI), i3 === e4.UNSIGNED_SHORT && (u2 = e4.RGBA16UI), i3 === e4.UNSIGNED_INT && (u2 = e4.RGBA32UI), i3 === e4.BYTE && (u2 = e4.RGBA8I), i3 === e4.SHORT && (u2 = e4.RGBA16I), i3 === e4.INT && (u2 = e4.RGBA32I)), r3 === e4.RGB && (i3 === e4.UNSIGNED_SHORT && c3 && (u2 = c3.RGB16_EXT), i3 === e4.SHORT && c3 && (u2 = c3.RGB16_SNORM_EXT), i3 === e4.UNSIGNED_INT_5_9_9_9_REV && (u2 = e4.RGB9_E5), i3 === e4.UNSIGNED_INT_10F_11F_11F_REV && (u2 = e4.R11F_G11F_B10F)), r3 === e4.RGBA) {
      let t3 = s3 ? Un : dr.getTransfer(o3);
      i3 === e4.FLOAT && (u2 = e4.RGBA32F), i3 === e4.HALF_FLOAT && (u2 = e4.RGBA16F), i3 === e4.UNSIGNED_BYTE && (u2 = t3 === `srgb` ? e4.SRGB8_ALPHA8 : e4.RGBA8), i3 === e4.UNSIGNED_SHORT && c3 && (u2 = c3.RGBA16_EXT), i3 === e4.SHORT && c3 && (u2 = c3.RGBA16_SNORM_EXT), i3 === e4.UNSIGNED_SHORT_4_4_4_4 && (u2 = e4.RGBA4), i3 === e4.UNSIGNED_SHORT_5_5_5_1 && (u2 = e4.RGB5_A1);
    }
    return (u2 === e4.R16F || u2 === e4.R32F || u2 === e4.RG16F || u2 === e4.RG32F || u2 === e4.RGBA16F || u2 === e4.RGBA32F) && t2.get(`EXT_color_buffer_float`), u2;
  }
  function w2(t3, n3) {
    let r3;
    return t3 ? n3 === null || n3 === 1014 || n3 === 1020 ? r3 = e4.DEPTH24_STENCIL8 : n3 === 1015 ? r3 = e4.DEPTH32F_STENCIL8 : n3 === 1012 && (r3 = e4.DEPTH24_STENCIL8, l(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)) : n3 === null || n3 === 1014 || n3 === 1020 ? r3 = e4.DEPTH_COMPONENT24 : n3 === 1015 ? r3 = e4.DEPTH_COMPONENT32F : n3 === 1012 && (r3 = e4.DEPTH_COMPONENT16), r3;
  }
  function T2(e5, t3) {
    return b2(e5) === true || e5.isFramebufferTexture && e5.minFilter !== 1003 && e5.minFilter !== 1006 ? Math.log2(Math.max(t3.width, t3.height)) + 1 : e5.mipmaps !== void 0 && e5.mipmaps.length > 0 ? e5.mipmaps.length : e5.isCompressedTexture && Array.isArray(e5.image) ? t3.mipmaps.length : 1;
  }
  function E2(e5) {
    let t3 = e5.target;
    t3.removeEventListener(`dispose`, E2), O2(t3), t3.isVideoTexture && p2.delete(t3), t3.isHTMLTexture && m2.delete(t3);
  }
  function D2(e5) {
    let t3 = e5.target;
    t3.removeEventListener(`dispose`, D2), A2(t3);
  }
  function O2(e5) {
    let t3 = r2.get(e5);
    if (t3.__webglInit === void 0) return;
    let n3 = e5.source, i3 = g2.get(n3);
    if (i3) {
      let r3 = i3[t3.__cacheKey];
      r3.usedTimes--, r3.usedTimes === 0 && k2(e5), Object.keys(i3).length === 0 && g2.delete(n3);
    }
    r2.remove(e5);
  }
  function k2(t3) {
    let n3 = r2.get(t3);
    e4.deleteTexture(n3.__webglTexture);
    let i3 = t3.source, a2 = g2.get(i3);
    delete a2[n3.__cacheKey], s2.memory.textures--;
  }
  function A2(t3) {
    let n3 = r2.get(t3);
    if (t3.depthTexture && (t3.depthTexture.dispose(), r2.remove(t3.depthTexture)), t3.isWebGLCubeRenderTarget) for (let t4 = 0; t4 < 6; t4++) {
      if (Array.isArray(n3.__webglFramebuffer[t4])) for (let r3 = 0; r3 < n3.__webglFramebuffer[t4].length; r3++) e4.deleteFramebuffer(n3.__webglFramebuffer[t4][r3]);
      else e4.deleteFramebuffer(n3.__webglFramebuffer[t4]);
      n3.__webglDepthbuffer && e4.deleteRenderbuffer(n3.__webglDepthbuffer[t4]);
    }
    else {
      if (Array.isArray(n3.__webglFramebuffer)) for (let t4 = 0; t4 < n3.__webglFramebuffer.length; t4++) e4.deleteFramebuffer(n3.__webglFramebuffer[t4]);
      else e4.deleteFramebuffer(n3.__webglFramebuffer);
      if (n3.__webglDepthbuffer && e4.deleteRenderbuffer(n3.__webglDepthbuffer), n3.__webglMultisampledFramebuffer && e4.deleteFramebuffer(n3.__webglMultisampledFramebuffer), n3.__webglColorRenderbuffer) for (let t4 = 0; t4 < n3.__webglColorRenderbuffer.length; t4++) n3.__webglColorRenderbuffer[t4] && e4.deleteRenderbuffer(n3.__webglColorRenderbuffer[t4]);
      n3.__webglDepthRenderbuffer && e4.deleteRenderbuffer(n3.__webglDepthRenderbuffer);
    }
    let i3 = t3.textures;
    for (let t4 = 0, n4 = i3.length; t4 < n4; t4++) {
      let n5 = r2.get(i3[t4]);
      n5.__webglTexture && (e4.deleteTexture(n5.__webglTexture), s2.memory.textures--), r2.remove(i3[t4]);
    }
    r2.remove(t3);
  }
  let ee2 = 0;
  function te2() {
    ee2 = 0;
  }
  function ne2() {
    return ee2;
  }
  function re2(e5) {
    ee2 = e5;
  }
  function ie2() {
    let e5 = ee2;
    return e5 >= i2.maxTextures && l(`WebGLTextures: Trying to use ` + e5 + ` texture units while this GPU supports only ` + i2.maxTextures), ee2 += 1, e5;
  }
  function ae2(e5) {
    let t3 = [];
    return t3.push(e5.wrapS), t3.push(e5.wrapT), t3.push(e5.wrapR || 0), t3.push(e5.magFilter), t3.push(e5.minFilter), t3.push(e5.anisotropy), t3.push(e5.internalFormat), t3.push(e5.format), t3.push(e5.type), t3.push(e5.generateMipmaps), t3.push(e5.premultiplyAlpha), t3.push(e5.flipY), t3.push(e5.unpackAlignment), t3.push(e5.colorSpace), t3.join();
  }
  function oe2(t3, i3) {
    let a2 = r2.get(t3);
    if (t3.isVideoTexture && Ae2(t3), t3.isRenderTargetTexture === false && t3.isExternalTexture !== true && t3.version > 0 && a2.__version !== t3.version) {
      let e5 = t3.image;
      if (e5 === null) l(`WebGLRenderer: Texture marked for update but no image data found.`);
      else if (e5.complete === false) l(`WebGLRenderer: Texture marked for update but image is incomplete`);
      else {
        _e2(a2, t3, i3);
        return;
      }
    } else t3.isExternalTexture && (a2.__webglTexture = t3.sourceTexture ? t3.sourceTexture : null);
    n2.bindTexture(e4.TEXTURE_2D, a2.__webglTexture, e4.TEXTURE0 + i3);
  }
  function se2(t3, i3) {
    let a2 = r2.get(t3);
    if (t3.isRenderTargetTexture === false && t3.version > 0 && a2.__version !== t3.version) {
      _e2(a2, t3, i3);
      return;
    } else t3.isExternalTexture && (a2.__webglTexture = t3.sourceTexture ? t3.sourceTexture : null);
    n2.bindTexture(e4.TEXTURE_2D_ARRAY, a2.__webglTexture, e4.TEXTURE0 + i3);
  }
  function ce2(t3, i3) {
    let a2 = r2.get(t3);
    if (t3.isRenderTargetTexture === false && t3.version > 0 && a2.__version !== t3.version) {
      _e2(a2, t3, i3);
      return;
    }
    n2.bindTexture(e4.TEXTURE_3D, a2.__webglTexture, e4.TEXTURE0 + i3);
  }
  function le2(t3, i3) {
    let a2 = r2.get(t3);
    if (t3.isCubeDepthTexture !== true && t3.version > 0 && a2.__version !== t3.version) {
      ve2(a2, t3, i3);
      return;
    }
    n2.bindTexture(e4.TEXTURE_CUBE_MAP, a2.__webglTexture, e4.TEXTURE0 + i3);
  }
  let ue2 = { [_t]: e4.REPEAT, [vt]: e4.CLAMP_TO_EDGE, [yt]: e4.MIRRORED_REPEAT }, de2 = { [bt]: e4.NEAREST, [xt]: e4.NEAREST_MIPMAP_NEAREST, [St]: e4.NEAREST_MIPMAP_LINEAR, [Ct]: e4.LINEAR, [wt]: e4.LINEAR_MIPMAP_NEAREST, [Tt]: e4.LINEAR_MIPMAP_LINEAR }, fe2 = { 512: e4.NEVER, 519: e4.ALWAYS, 513: e4.LESS, 515: e4.LEQUAL, 514: e4.EQUAL, 518: e4.GEQUAL, 516: e4.GREATER, 517: e4.NOTEQUAL };
  function pe2(n3, a2) {
    if (a2.type === 1015 && t2.has(`OES_texture_float_linear`) === false && (a2.magFilter === 1006 || a2.magFilter === 1007 || a2.magFilter === 1005 || a2.magFilter === 1008 || a2.minFilter === 1006 || a2.minFilter === 1007 || a2.minFilter === 1005 || a2.minFilter === 1008) && l(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`), e4.texParameteri(n3, e4.TEXTURE_WRAP_S, ue2[a2.wrapS]), e4.texParameteri(n3, e4.TEXTURE_WRAP_T, ue2[a2.wrapT]), (n3 === e4.TEXTURE_3D || n3 === e4.TEXTURE_2D_ARRAY) && e4.texParameteri(n3, e4.TEXTURE_WRAP_R, ue2[a2.wrapR]), e4.texParameteri(n3, e4.TEXTURE_MAG_FILTER, de2[a2.magFilter]), e4.texParameteri(n3, e4.TEXTURE_MIN_FILTER, de2[a2.minFilter]), a2.compareFunction && (e4.texParameteri(n3, e4.TEXTURE_COMPARE_MODE, e4.COMPARE_REF_TO_TEXTURE), e4.texParameteri(n3, e4.TEXTURE_COMPARE_FUNC, fe2[a2.compareFunction])), t2.has(`EXT_texture_filter_anisotropic`) === true) {
      if (a2.magFilter === 1003 || a2.minFilter !== 1005 && a2.minFilter !== 1008 || a2.type === 1015 && t2.has(`OES_texture_float_linear`) === false) return;
      if (a2.anisotropy > 1 || r2.get(a2).__currentAnisotropy) {
        let o3 = t2.get(`EXT_texture_filter_anisotropic`);
        e4.texParameterf(n3, o3.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(a2.anisotropy, i2.getMaxAnisotropy())), r2.get(a2).__currentAnisotropy = a2.anisotropy;
      }
    }
  }
  function me2(t3, n3) {
    let r3 = false;
    t3.__webglInit === void 0 && (t3.__webglInit = true, n3.addEventListener(`dispose`, E2));
    let i3 = n3.source, a2 = g2.get(i3);
    a2 === void 0 && (a2 = {}, g2.set(i3, a2));
    let o3 = ae2(n3);
    if (o3 !== t3.__cacheKey) {
      a2[o3] === void 0 && (a2[o3] = { texture: e4.createTexture(), usedTimes: 0 }, s2.memory.textures++, r3 = true), a2[o3].usedTimes++;
      let i4 = a2[t3.__cacheKey];
      i4 !== void 0 && (a2[t3.__cacheKey].usedTimes--, i4.usedTimes === 0 && k2(n3)), t3.__cacheKey = o3, t3.__webglTexture = a2[o3].texture;
    }
    return r3;
  }
  function he2(e5, t3, n3) {
    return Math.floor(Math.floor(e5 / n3) / t3);
  }
  function ge2(t3, r3, i3, a2) {
    let o3 = t3.updateRanges;
    if (o3.length === 0) n2.texSubImage2D(e4.TEXTURE_2D, 0, 0, 0, r3.width, r3.height, i3, a2, r3.data);
    else {
      o3.sort((e5, t4) => e5.start - t4.start);
      let s3 = 0;
      for (let e5 = 1; e5 < o3.length; e5++) {
        let t4 = o3[s3], n3 = o3[e5], i4 = t4.start + t4.count, a3 = he2(n3.start, r3.width, 4), c4 = he2(t4.start, r3.width, 4);
        n3.start <= i4 + 1 && a3 === c4 && he2(n3.start + n3.count - 1, r3.width, 4) === a3 ? t4.count = Math.max(t4.count, n3.start + n3.count - t4.start) : (++s3, o3[s3] = n3);
      }
      o3.length = s3 + 1;
      let c3 = n2.getParameter(e4.UNPACK_ROW_LENGTH), l2 = n2.getParameter(e4.UNPACK_SKIP_PIXELS), u2 = n2.getParameter(e4.UNPACK_SKIP_ROWS);
      n2.pixelStorei(e4.UNPACK_ROW_LENGTH, r3.width);
      for (let t4 = 0, s4 = o3.length; t4 < s4; t4++) {
        let s5 = o3[t4], c4 = Math.floor(s5.start / 4), l3 = Math.ceil(s5.count / 4), u3 = c4 % r3.width, d3 = Math.floor(c4 / r3.width), f3 = l3;
        n2.pixelStorei(e4.UNPACK_SKIP_PIXELS, u3), n2.pixelStorei(e4.UNPACK_SKIP_ROWS, d3), n2.texSubImage2D(e4.TEXTURE_2D, 0, u3, d3, f3, 1, i3, a2, r3.data);
      }
      t3.clearUpdateRanges(), n2.pixelStorei(e4.UNPACK_ROW_LENGTH, c3), n2.pixelStorei(e4.UNPACK_SKIP_PIXELS, l2), n2.pixelStorei(e4.UNPACK_SKIP_ROWS, u2);
    }
  }
  function _e2(t3, a2, s3) {
    let c3 = e4.TEXTURE_2D;
    (a2.isDataArrayTexture || a2.isCompressedArrayTexture) && (c3 = e4.TEXTURE_2D_ARRAY), a2.isData3DTexture && (c3 = e4.TEXTURE_3D);
    let u2 = me2(t3, a2), d3 = a2.source;
    n2.bindTexture(c3, t3.__webglTexture, e4.TEXTURE0 + s3);
    let f3 = r2.get(d3);
    if (d3.version !== f3.__version || u2 === true) {
      if (n2.activeTexture(e4.TEXTURE0 + s3), !(typeof ImageBitmap < `u` && a2.image instanceof ImageBitmap)) {
        let t5 = dr.getPrimaries(dr.workingColorSpace), r4 = a2.colorSpace === `` ? null : dr.getPrimaries(a2.colorSpace), i3 = a2.colorSpace === `` || t5 === r4 ? e4.NONE : e4.BROWSER_DEFAULT_WEBGL;
        n2.pixelStorei(e4.UNPACK_FLIP_Y_WEBGL, a2.flipY), n2.pixelStorei(e4.UNPACK_PREMULTIPLY_ALPHA_WEBGL, a2.premultiplyAlpha), n2.pixelStorei(e4.UNPACK_COLORSPACE_CONVERSION_WEBGL, i3);
      }
      n2.pixelStorei(e4.UNPACK_ALIGNMENT, a2.unpackAlignment);
      let t4 = y2(a2.image, false, i2.maxTextureSize);
      t4 = je2(a2, t4);
      let r3 = o2.convert(a2.format, a2.colorSpace), p3 = o2.convert(a2.type), h3 = C2(a2.internalFormat, r3, p3, a2.normalized, a2.colorSpace, a2.isVideoTexture);
      pe2(c3, a2);
      let g3, _3 = a2.mipmaps, v3 = a2.isVideoTexture !== true, S3 = f3.__version === void 0 || u2 === true, E3 = d3.dataReady, D3 = T2(a2, t4);
      if (a2.isDepthTexture) h3 = w2(a2.format === Ut, a2.type), S3 && (v3 ? n2.texStorage2D(e4.TEXTURE_2D, 1, h3, t4.width, t4.height) : n2.texImage2D(e4.TEXTURE_2D, 0, h3, t4.width, t4.height, 0, r3, p3, null));
      else if (a2.isDataTexture) if (_3.length > 0) {
        v3 && S3 && n2.texStorage2D(e4.TEXTURE_2D, D3, h3, _3[0].width, _3[0].height);
        for (let t5 = 0, i3 = _3.length; t5 < i3; t5++) g3 = _3[t5], v3 ? E3 && n2.texSubImage2D(e4.TEXTURE_2D, t5, 0, 0, g3.width, g3.height, r3, p3, g3.data) : n2.texImage2D(e4.TEXTURE_2D, t5, h3, g3.width, g3.height, 0, r3, p3, g3.data);
        a2.generateMipmaps = false;
      } else v3 ? (S3 && n2.texStorage2D(e4.TEXTURE_2D, D3, h3, t4.width, t4.height), E3 && ge2(a2, t4, r3, p3)) : n2.texImage2D(e4.TEXTURE_2D, 0, h3, t4.width, t4.height, 0, r3, p3, t4.data);
      else if (a2.isCompressedTexture) if (a2.isCompressedArrayTexture) {
        v3 && S3 && n2.texStorage3D(e4.TEXTURE_2D_ARRAY, D3, h3, _3[0].width, _3[0].height, t4.depth);
        for (let i3 = 0, o3 = _3.length; i3 < o3; i3++) if (g3 = _3[i3], a2.format !== 1023) if (r3 !== null) if (v3) {
          if (E3) if (a2.layerUpdates.size > 0) {
            let t5 = mt(g3.width, g3.height, a2.format, a2.type);
            for (let o4 of a2.layerUpdates) {
              let a3 = g3.data.subarray(o4 * t5 / g3.data.BYTES_PER_ELEMENT, (o4 + 1) * t5 / g3.data.BYTES_PER_ELEMENT);
              n2.compressedTexSubImage3D(e4.TEXTURE_2D_ARRAY, i3, 0, 0, o4, g3.width, g3.height, 1, r3, a3);
            }
            a2.clearLayerUpdates();
          } else n2.compressedTexSubImage3D(e4.TEXTURE_2D_ARRAY, i3, 0, 0, 0, g3.width, g3.height, t4.depth, r3, g3.data);
        } else n2.compressedTexImage3D(e4.TEXTURE_2D_ARRAY, i3, h3, g3.width, g3.height, t4.depth, 0, g3.data, 0, 0);
        else l(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`);
        else v3 ? E3 && n2.texSubImage3D(e4.TEXTURE_2D_ARRAY, i3, 0, 0, 0, g3.width, g3.height, t4.depth, r3, p3, g3.data) : n2.texImage3D(e4.TEXTURE_2D_ARRAY, i3, h3, g3.width, g3.height, t4.depth, 0, r3, p3, g3.data);
      } else {
        v3 && S3 && n2.texStorage2D(e4.TEXTURE_2D, D3, h3, _3[0].width, _3[0].height);
        for (let t5 = 0, i3 = _3.length; t5 < i3; t5++) g3 = _3[t5], a2.format === 1023 ? v3 ? E3 && n2.texSubImage2D(e4.TEXTURE_2D, t5, 0, 0, g3.width, g3.height, r3, p3, g3.data) : n2.texImage2D(e4.TEXTURE_2D, t5, h3, g3.width, g3.height, 0, r3, p3, g3.data) : r3 === null ? l(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`) : v3 ? E3 && n2.compressedTexSubImage2D(e4.TEXTURE_2D, t5, 0, 0, g3.width, g3.height, r3, g3.data) : n2.compressedTexImage2D(e4.TEXTURE_2D, t5, h3, g3.width, g3.height, 0, g3.data);
      }
      else if (a2.isDataArrayTexture) if (v3) {
        if (S3 && n2.texStorage3D(e4.TEXTURE_2D_ARRAY, D3, h3, t4.width, t4.height, t4.depth), E3) if (a2.layerUpdates.size > 0) {
          let i3 = mt(t4.width, t4.height, a2.format, a2.type);
          for (let o3 of a2.layerUpdates) {
            let a3 = t4.data.subarray(o3 * i3 / t4.data.BYTES_PER_ELEMENT, (o3 + 1) * i3 / t4.data.BYTES_PER_ELEMENT);
            n2.texSubImage3D(e4.TEXTURE_2D_ARRAY, 0, 0, 0, o3, t4.width, t4.height, 1, r3, p3, a3);
          }
          a2.clearLayerUpdates();
        } else n2.texSubImage3D(e4.TEXTURE_2D_ARRAY, 0, 0, 0, 0, t4.width, t4.height, t4.depth, r3, p3, t4.data);
      } else n2.texImage3D(e4.TEXTURE_2D_ARRAY, 0, h3, t4.width, t4.height, t4.depth, 0, r3, p3, t4.data);
      else if (a2.isData3DTexture) v3 ? (S3 && n2.texStorage3D(e4.TEXTURE_3D, D3, h3, t4.width, t4.height, t4.depth), E3 && n2.texSubImage3D(e4.TEXTURE_3D, 0, 0, 0, 0, t4.width, t4.height, t4.depth, r3, p3, t4.data)) : n2.texImage3D(e4.TEXTURE_3D, 0, h3, t4.width, t4.height, t4.depth, 0, r3, p3, t4.data);
      else if (a2.isFramebufferTexture) {
        if (S3) if (v3) n2.texStorage2D(e4.TEXTURE_2D, D3, h3, t4.width, t4.height);
        else {
          let i3 = t4.width, a3 = t4.height;
          for (let t5 = 0; t5 < D3; t5++) n2.texImage2D(e4.TEXTURE_2D, t5, h3, i3, a3, 0, r3, p3, null), i3 >>= 1, a3 >>= 1;
        }
      } else if (a2.isHTMLTexture) {
        if (`texElementImage2D` in e4) {
          let n3 = e4.canvas;
          if (n3.hasAttribute(`layoutsubtree`) || n3.setAttribute(`layoutsubtree`, `true`), t4.parentNode !== n3) {
            n3.appendChild(t4), m2.add(a2), n3.onpaint = (e5) => {
              let t5 = e5.changedElements;
              for (let e6 of m2) t5.includes(e6.image) && (e6.needsUpdate = true);
            }, n3.requestPaint();
            return;
          }
          let r4 = e4.RGBA, i3 = e4.RGBA, o3 = e4.UNSIGNED_BYTE;
          e4.texElementImage2D(e4.TEXTURE_2D, 0, r4, i3, o3, t4), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_MIN_FILTER, e4.LINEAR), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_WRAP_S, e4.CLAMP_TO_EDGE), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_WRAP_T, e4.CLAMP_TO_EDGE);
        }
      } else if (_3.length > 0) {
        if (v3 && S3) {
          let t5 = Me2(_3[0]);
          n2.texStorage2D(e4.TEXTURE_2D, D3, h3, t5.width, t5.height);
        }
        for (let t5 = 0, i3 = _3.length; t5 < i3; t5++) g3 = _3[t5], v3 ? E3 && n2.texSubImage2D(e4.TEXTURE_2D, t5, 0, 0, r3, p3, g3) : n2.texImage2D(e4.TEXTURE_2D, t5, h3, r3, p3, g3);
        a2.generateMipmaps = false;
      } else if (v3) {
        if (S3) {
          let r4 = Me2(t4);
          n2.texStorage2D(e4.TEXTURE_2D, D3, h3, r4.width, r4.height);
        }
        E3 && n2.texSubImage2D(e4.TEXTURE_2D, 0, 0, 0, r3, p3, t4);
      } else n2.texImage2D(e4.TEXTURE_2D, 0, h3, r3, p3, t4);
      b2(a2) && x2(c3), f3.__version = d3.version, a2.onUpdate && a2.onUpdate(a2);
    }
    t3.__version = a2.version;
  }
  function ve2(t3, a2, s3) {
    if (a2.image.length !== 6) return;
    let c3 = me2(t3, a2), u2 = a2.source;
    n2.bindTexture(e4.TEXTURE_CUBE_MAP, t3.__webglTexture, e4.TEXTURE0 + s3);
    let d3 = r2.get(u2);
    if (u2.version !== d3.__version || c3 === true) {
      n2.activeTexture(e4.TEXTURE0 + s3);
      let t4 = dr.getPrimaries(dr.workingColorSpace), r3 = a2.colorSpace === `` ? null : dr.getPrimaries(a2.colorSpace), f3 = a2.colorSpace === `` || t4 === r3 ? e4.NONE : e4.BROWSER_DEFAULT_WEBGL;
      n2.pixelStorei(e4.UNPACK_FLIP_Y_WEBGL, a2.flipY), n2.pixelStorei(e4.UNPACK_PREMULTIPLY_ALPHA_WEBGL, a2.premultiplyAlpha), n2.pixelStorei(e4.UNPACK_ALIGNMENT, a2.unpackAlignment), n2.pixelStorei(e4.UNPACK_COLORSPACE_CONVERSION_WEBGL, f3);
      let p3 = a2.isCompressedTexture || a2.image[0].isCompressedTexture, m3 = a2.image[0] && a2.image[0].isDataTexture, h3 = [];
      for (let e5 = 0; e5 < 6; e5++) !p3 && !m3 ? h3[e5] = y2(a2.image[e5], true, i2.maxCubemapSize) : h3[e5] = m3 ? a2.image[e5].image : a2.image[e5], h3[e5] = je2(a2, h3[e5]);
      let g3 = h3[0], _3 = o2.convert(a2.format, a2.colorSpace), v3 = o2.convert(a2.type), S3 = C2(a2.internalFormat, _3, v3, a2.normalized, a2.colorSpace), w3 = a2.isVideoTexture !== true, E3 = d3.__version === void 0 || c3 === true, D3 = u2.dataReady, O3 = T2(a2, g3);
      pe2(e4.TEXTURE_CUBE_MAP, a2);
      let k3;
      if (p3) {
        w3 && E3 && n2.texStorage2D(e4.TEXTURE_CUBE_MAP, O3, S3, g3.width, g3.height);
        for (let t5 = 0; t5 < 6; t5++) {
          k3 = h3[t5].mipmaps;
          for (let r4 = 0; r4 < k3.length; r4++) {
            let i3 = k3[r4];
            a2.format === 1023 ? w3 ? D3 && n2.texSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4, 0, 0, i3.width, i3.height, _3, v3, i3.data) : n2.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4, S3, i3.width, i3.height, 0, _3, v3, i3.data) : _3 === null ? l(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`) : w3 ? D3 && n2.compressedTexSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4, 0, 0, i3.width, i3.height, _3, i3.data) : n2.compressedTexImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4, S3, i3.width, i3.height, 0, i3.data);
          }
        }
      } else {
        if (k3 = a2.mipmaps, w3 && E3) {
          k3.length > 0 && O3++;
          let t5 = Me2(h3[0]);
          n2.texStorage2D(e4.TEXTURE_CUBE_MAP, O3, S3, t5.width, t5.height);
        }
        for (let t5 = 0; t5 < 6; t5++) if (m3) {
          w3 ? D3 && n2.texSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, 0, 0, 0, h3[t5].width, h3[t5].height, _3, v3, h3[t5].data) : n2.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, 0, S3, h3[t5].width, h3[t5].height, 0, _3, v3, h3[t5].data);
          for (let r4 = 0; r4 < k3.length; r4++) {
            let i3 = k3[r4].image[t5].image;
            w3 ? D3 && n2.texSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4 + 1, 0, 0, i3.width, i3.height, _3, v3, i3.data) : n2.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4 + 1, S3, i3.width, i3.height, 0, _3, v3, i3.data);
          }
        } else {
          w3 ? D3 && n2.texSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, 0, 0, 0, _3, v3, h3[t5]) : n2.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, 0, S3, _3, v3, h3[t5]);
          for (let r4 = 0; r4 < k3.length; r4++) {
            let i3 = k3[r4];
            w3 ? D3 && n2.texSubImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4 + 1, 0, 0, _3, v3, i3.image[t5]) : n2.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + t5, r4 + 1, S3, _3, v3, i3.image[t5]);
          }
        }
      }
      b2(a2) && x2(e4.TEXTURE_CUBE_MAP), d3.__version = u2.version, a2.onUpdate && a2.onUpdate(a2);
    }
    t3.__version = a2.version;
  }
  function ye2(t3, i3, a2, s3, l2, u2) {
    let d3 = o2.convert(a2.format, a2.colorSpace), f3 = o2.convert(a2.type), p3 = C2(a2.internalFormat, d3, f3, a2.normalized, a2.colorSpace), m3 = r2.get(i3), h3 = r2.get(a2);
    if (h3.__renderTarget = i3, !m3.__hasExternalTextures) {
      let t4 = Math.max(1, i3.width >> u2), r3 = Math.max(1, i3.height >> u2);
      l2 === e4.TEXTURE_3D || l2 === e4.TEXTURE_2D_ARRAY ? n2.texImage3D(l2, u2, p3, t4, r3, i3.depth, 0, d3, f3, null) : n2.texImage2D(l2, u2, p3, t4, r3, 0, d3, f3, null);
    }
    n2.bindFramebuffer(e4.FRAMEBUFFER, t3), ke2(i3) ? c2.framebufferTexture2DMultisampleEXT(e4.FRAMEBUFFER, s3, l2, h3.__webglTexture, 0, j2(i3)) : (l2 === e4.TEXTURE_2D || l2 >= e4.TEXTURE_CUBE_MAP_POSITIVE_X && l2 <= e4.TEXTURE_CUBE_MAP_NEGATIVE_Z) && e4.framebufferTexture2D(e4.FRAMEBUFFER, s3, l2, h3.__webglTexture, u2), n2.bindFramebuffer(e4.FRAMEBUFFER, null);
  }
  function be2(t3, n3, r3) {
    if (e4.bindRenderbuffer(e4.RENDERBUFFER, t3), n3.depthBuffer) {
      let i3 = n3.depthTexture, a2 = i3 && i3.isDepthTexture ? i3.type : null, o3 = w2(n3.stencilBuffer, a2), s3 = n3.stencilBuffer ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT;
      ke2(n3) ? c2.renderbufferStorageMultisampleEXT(e4.RENDERBUFFER, j2(n3), o3, n3.width, n3.height) : r3 ? e4.renderbufferStorageMultisample(e4.RENDERBUFFER, j2(n3), o3, n3.width, n3.height) : e4.renderbufferStorage(e4.RENDERBUFFER, o3, n3.width, n3.height), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, s3, e4.RENDERBUFFER, t3);
    } else {
      let t4 = n3.textures;
      for (let i3 = 0; i3 < t4.length; i3++) {
        let a2 = t4[i3], s3 = o2.convert(a2.format, a2.colorSpace), l2 = o2.convert(a2.type), u2 = C2(a2.internalFormat, s3, l2, a2.normalized, a2.colorSpace);
        ke2(n3) ? c2.renderbufferStorageMultisampleEXT(e4.RENDERBUFFER, j2(n3), u2, n3.width, n3.height) : r3 ? e4.renderbufferStorageMultisample(e4.RENDERBUFFER, j2(n3), u2, n3.width, n3.height) : e4.renderbufferStorage(e4.RENDERBUFFER, u2, n3.width, n3.height);
      }
    }
    e4.bindRenderbuffer(e4.RENDERBUFFER, null);
  }
  function xe2(t3, i3, a2) {
    let s3 = i3.isWebGLCubeRenderTarget === true;
    if (n2.bindFramebuffer(e4.FRAMEBUFFER, t3), !(i3.depthTexture && i3.depthTexture.isDepthTexture)) throw Error(`renderTarget.depthTexture must be an instance of THREE.DepthTexture`);
    let l2 = r2.get(i3.depthTexture);
    if (l2.__renderTarget = i3, (!l2.__webglTexture || i3.depthTexture.image.width !== i3.width || i3.depthTexture.image.height !== i3.height) && (i3.depthTexture.image.width = i3.width, i3.depthTexture.image.height = i3.height, i3.depthTexture.needsUpdate = true), s3) {
      if (l2.__webglInit === void 0 && (l2.__webglInit = true, i3.depthTexture.addEventListener(`dispose`, E2)), l2.__webglTexture === void 0) {
        l2.__webglTexture = e4.createTexture(), n2.bindTexture(e4.TEXTURE_CUBE_MAP, l2.__webglTexture), pe2(e4.TEXTURE_CUBE_MAP, i3.depthTexture);
        let t4 = o2.convert(i3.depthTexture.format), r3 = o2.convert(i3.depthTexture.type), a3;
        i3.depthTexture.format === 1026 ? a3 = e4.DEPTH_COMPONENT24 : i3.depthTexture.format === 1027 && (a3 = e4.DEPTH24_STENCIL8);
        for (let n3 = 0; n3 < 6; n3++) e4.texImage2D(e4.TEXTURE_CUBE_MAP_POSITIVE_X + n3, 0, a3, i3.width, i3.height, 0, t4, r3, null);
      }
    } else oe2(i3.depthTexture, 0);
    let u2 = l2.__webglTexture, d3 = j2(i3), f3 = s3 ? e4.TEXTURE_CUBE_MAP_POSITIVE_X + a2 : e4.TEXTURE_2D, p3 = i3.depthTexture.format === 1027 ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT;
    if (i3.depthTexture.format === 1026) ke2(i3) ? c2.framebufferTexture2DMultisampleEXT(e4.FRAMEBUFFER, p3, f3, u2, 0, d3) : e4.framebufferTexture2D(e4.FRAMEBUFFER, p3, f3, u2, 0);
    else if (i3.depthTexture.format === 1027) ke2(i3) ? c2.framebufferTexture2DMultisampleEXT(e4.FRAMEBUFFER, p3, f3, u2, 0, d3) : e4.framebufferTexture2D(e4.FRAMEBUFFER, p3, f3, u2, 0);
    else throw Error(`Unknown depthTexture format`);
  }
  function Se2(t3) {
    let i3 = r2.get(t3), a2 = t3.isWebGLCubeRenderTarget === true;
    if (i3.__boundDepthTexture !== t3.depthTexture) {
      let e5 = t3.depthTexture;
      if (i3.__depthDisposeCallback && i3.__depthDisposeCallback(), e5) {
        let t4 = () => {
          delete i3.__boundDepthTexture, delete i3.__depthDisposeCallback, e5.removeEventListener(`dispose`, t4);
        };
        e5.addEventListener(`dispose`, t4), i3.__depthDisposeCallback = t4;
      }
      i3.__boundDepthTexture = e5;
    }
    if (t3.depthTexture && !i3.__autoAllocateDepthBuffer) if (a2) for (let e5 = 0; e5 < 6; e5++) xe2(i3.__webglFramebuffer[e5], t3, e5);
    else {
      let e5 = t3.texture.mipmaps;
      e5 && e5.length > 0 ? xe2(i3.__webglFramebuffer[0], t3, 0) : xe2(i3.__webglFramebuffer, t3, 0);
    }
    else if (a2) {
      i3.__webglDepthbuffer = [];
      for (let r3 = 0; r3 < 6; r3++) if (n2.bindFramebuffer(e4.FRAMEBUFFER, i3.__webglFramebuffer[r3]), i3.__webglDepthbuffer[r3] === void 0) i3.__webglDepthbuffer[r3] = e4.createRenderbuffer(), be2(i3.__webglDepthbuffer[r3], t3, false);
      else {
        let n3 = t3.stencilBuffer ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT, a3 = i3.__webglDepthbuffer[r3];
        e4.bindRenderbuffer(e4.RENDERBUFFER, a3), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, n3, e4.RENDERBUFFER, a3);
      }
    } else {
      let r3 = t3.texture.mipmaps;
      if (r3 && r3.length > 0 ? n2.bindFramebuffer(e4.FRAMEBUFFER, i3.__webglFramebuffer[0]) : n2.bindFramebuffer(e4.FRAMEBUFFER, i3.__webglFramebuffer), i3.__webglDepthbuffer === void 0) i3.__webglDepthbuffer = e4.createRenderbuffer(), be2(i3.__webglDepthbuffer, t3, false);
      else {
        let n3 = t3.stencilBuffer ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT, r4 = i3.__webglDepthbuffer;
        e4.bindRenderbuffer(e4.RENDERBUFFER, r4), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, n3, e4.RENDERBUFFER, r4);
      }
    }
    n2.bindFramebuffer(e4.FRAMEBUFFER, null);
  }
  function Ce2(t3, n3, i3) {
    let a2 = r2.get(t3);
    n3 !== void 0 && ye2(a2.__webglFramebuffer, t3, t3.texture, e4.COLOR_ATTACHMENT0, e4.TEXTURE_2D, 0), i3 !== void 0 && Se2(t3);
  }
  function we2(t3) {
    let i3 = t3.texture, a2 = r2.get(t3), c3 = r2.get(i3);
    t3.addEventListener(`dispose`, D2);
    let l2 = t3.textures, u2 = t3.isWebGLCubeRenderTarget === true, d3 = l2.length > 1;
    if (d3 || (c3.__webglTexture === void 0 && (c3.__webglTexture = e4.createTexture()), c3.__version = i3.version, s2.memory.textures++), u2) {
      a2.__webglFramebuffer = [];
      for (let t4 = 0; t4 < 6; t4++) if (i3.mipmaps && i3.mipmaps.length > 0) {
        a2.__webglFramebuffer[t4] = [];
        for (let n3 = 0; n3 < i3.mipmaps.length; n3++) a2.__webglFramebuffer[t4][n3] = e4.createFramebuffer();
      } else a2.__webglFramebuffer[t4] = e4.createFramebuffer();
    } else {
      if (i3.mipmaps && i3.mipmaps.length > 0) {
        a2.__webglFramebuffer = [];
        for (let t4 = 0; t4 < i3.mipmaps.length; t4++) a2.__webglFramebuffer[t4] = e4.createFramebuffer();
      } else a2.__webglFramebuffer = e4.createFramebuffer();
      if (d3) for (let t4 = 0, n3 = l2.length; t4 < n3; t4++) {
        let n4 = r2.get(l2[t4]);
        n4.__webglTexture === void 0 && (n4.__webglTexture = e4.createTexture(), s2.memory.textures++);
      }
      if (t3.samples > 0 && ke2(t3) === false) {
        a2.__webglMultisampledFramebuffer = e4.createFramebuffer(), a2.__webglColorRenderbuffer = [], n2.bindFramebuffer(e4.FRAMEBUFFER, a2.__webglMultisampledFramebuffer);
        for (let n3 = 0; n3 < l2.length; n3++) {
          let r3 = l2[n3];
          a2.__webglColorRenderbuffer[n3] = e4.createRenderbuffer(), e4.bindRenderbuffer(e4.RENDERBUFFER, a2.__webglColorRenderbuffer[n3]);
          let i4 = o2.convert(r3.format, r3.colorSpace), s3 = o2.convert(r3.type), c4 = C2(r3.internalFormat, i4, s3, r3.normalized, r3.colorSpace, t3.isXRRenderTarget === true), u3 = j2(t3);
          e4.renderbufferStorageMultisample(e4.RENDERBUFFER, u3, c4, t3.width, t3.height), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, e4.COLOR_ATTACHMENT0 + n3, e4.RENDERBUFFER, a2.__webglColorRenderbuffer[n3]);
        }
        e4.bindRenderbuffer(e4.RENDERBUFFER, null), t3.depthBuffer && (a2.__webglDepthRenderbuffer = e4.createRenderbuffer(), be2(a2.__webglDepthRenderbuffer, t3, true)), n2.bindFramebuffer(e4.FRAMEBUFFER, null);
      }
    }
    if (u2) {
      n2.bindTexture(e4.TEXTURE_CUBE_MAP, c3.__webglTexture), pe2(e4.TEXTURE_CUBE_MAP, i3);
      for (let n3 = 0; n3 < 6; n3++) if (i3.mipmaps && i3.mipmaps.length > 0) for (let r3 = 0; r3 < i3.mipmaps.length; r3++) ye2(a2.__webglFramebuffer[n3][r3], t3, i3, e4.COLOR_ATTACHMENT0, e4.TEXTURE_CUBE_MAP_POSITIVE_X + n3, r3);
      else ye2(a2.__webglFramebuffer[n3], t3, i3, e4.COLOR_ATTACHMENT0, e4.TEXTURE_CUBE_MAP_POSITIVE_X + n3, 0);
      b2(i3) && x2(e4.TEXTURE_CUBE_MAP), n2.unbindTexture();
    } else if (d3) {
      for (let i4 = 0, o3 = l2.length; i4 < o3; i4++) {
        let o4 = l2[i4], s3 = r2.get(o4), c4 = e4.TEXTURE_2D;
        (t3.isWebGL3DRenderTarget || t3.isWebGLArrayRenderTarget) && (c4 = t3.isWebGL3DRenderTarget ? e4.TEXTURE_3D : e4.TEXTURE_2D_ARRAY), n2.bindTexture(c4, s3.__webglTexture), pe2(c4, o4), ye2(a2.__webglFramebuffer, t3, o4, e4.COLOR_ATTACHMENT0 + i4, c4, 0), b2(o4) && x2(c4);
      }
      n2.unbindTexture();
    } else {
      let r3 = e4.TEXTURE_2D;
      if ((t3.isWebGL3DRenderTarget || t3.isWebGLArrayRenderTarget) && (r3 = t3.isWebGL3DRenderTarget ? e4.TEXTURE_3D : e4.TEXTURE_2D_ARRAY), n2.bindTexture(r3, c3.__webglTexture), pe2(r3, i3), i3.mipmaps && i3.mipmaps.length > 0) for (let n3 = 0; n3 < i3.mipmaps.length; n3++) ye2(a2.__webglFramebuffer[n3], t3, i3, e4.COLOR_ATTACHMENT0, r3, n3);
      else ye2(a2.__webglFramebuffer, t3, i3, e4.COLOR_ATTACHMENT0, r3, 0);
      b2(i3) && x2(r3), n2.unbindTexture();
    }
    t3.depthBuffer && Se2(t3);
  }
  function Te2(e5) {
    let t3 = e5.textures;
    for (let i3 = 0, a2 = t3.length; i3 < a2; i3++) {
      let a3 = t3[i3];
      if (b2(a3)) {
        let t4 = S2(e5), i4 = r2.get(a3).__webglTexture;
        n2.bindTexture(t4, i4), x2(t4), n2.unbindTexture();
      }
    }
  }
  let Ee2 = [], De2 = [];
  function Oe2(t3) {
    if (t3.samples > 0) {
      if (ke2(t3) === false) {
        let i3 = t3.textures, a2 = t3.width, o3 = t3.height, s3 = e4.COLOR_BUFFER_BIT, c3 = t3.stencilBuffer ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT, l2 = r2.get(t3), u2 = i3.length > 1;
        if (u2) for (let t4 = 0; t4 < i3.length; t4++) n2.bindFramebuffer(e4.FRAMEBUFFER, l2.__webglMultisampledFramebuffer), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, e4.COLOR_ATTACHMENT0 + t4, e4.RENDERBUFFER, null), n2.bindFramebuffer(e4.FRAMEBUFFER, l2.__webglFramebuffer), e4.framebufferTexture2D(e4.DRAW_FRAMEBUFFER, e4.COLOR_ATTACHMENT0 + t4, e4.TEXTURE_2D, null, 0);
        n2.bindFramebuffer(e4.READ_FRAMEBUFFER, l2.__webglMultisampledFramebuffer);
        let f3 = t3.texture.mipmaps;
        f3 && f3.length > 0 ? n2.bindFramebuffer(e4.DRAW_FRAMEBUFFER, l2.__webglFramebuffer[0]) : n2.bindFramebuffer(e4.DRAW_FRAMEBUFFER, l2.__webglFramebuffer);
        for (let n3 = 0; n3 < i3.length; n3++) {
          if (t3.resolveDepthBuffer && (t3.depthBuffer && (s3 |= e4.DEPTH_BUFFER_BIT), t3.stencilBuffer && t3.resolveStencilBuffer && (s3 |= e4.STENCIL_BUFFER_BIT)), u2) {
            e4.framebufferRenderbuffer(e4.READ_FRAMEBUFFER, e4.COLOR_ATTACHMENT0, e4.RENDERBUFFER, l2.__webglColorRenderbuffer[n3]);
            let t4 = r2.get(i3[n3]).__webglTexture;
            e4.framebufferTexture2D(e4.DRAW_FRAMEBUFFER, e4.COLOR_ATTACHMENT0, e4.TEXTURE_2D, t4, 0);
          }
          e4.blitFramebuffer(0, 0, a2, o3, 0, 0, a2, o3, s3, e4.NEAREST), d2 === true && (Ee2.length = 0, De2.length = 0, Ee2.push(e4.COLOR_ATTACHMENT0 + n3), t3.depthBuffer && t3.resolveDepthBuffer === false && (Ee2.push(c3), De2.push(c3), e4.invalidateFramebuffer(e4.DRAW_FRAMEBUFFER, De2)), e4.invalidateFramebuffer(e4.READ_FRAMEBUFFER, Ee2));
        }
        if (n2.bindFramebuffer(e4.READ_FRAMEBUFFER, null), n2.bindFramebuffer(e4.DRAW_FRAMEBUFFER, null), u2) for (let t4 = 0; t4 < i3.length; t4++) {
          n2.bindFramebuffer(e4.FRAMEBUFFER, l2.__webglMultisampledFramebuffer), e4.framebufferRenderbuffer(e4.FRAMEBUFFER, e4.COLOR_ATTACHMENT0 + t4, e4.RENDERBUFFER, l2.__webglColorRenderbuffer[t4]);
          let a3 = r2.get(i3[t4]).__webglTexture;
          n2.bindFramebuffer(e4.FRAMEBUFFER, l2.__webglFramebuffer), e4.framebufferTexture2D(e4.DRAW_FRAMEBUFFER, e4.COLOR_ATTACHMENT0 + t4, e4.TEXTURE_2D, a3, 0);
        }
        n2.bindFramebuffer(e4.DRAW_FRAMEBUFFER, l2.__webglMultisampledFramebuffer);
      } else if (t3.depthBuffer && t3.resolveDepthBuffer === false && d2) {
        let n3 = t3.stencilBuffer ? e4.DEPTH_STENCIL_ATTACHMENT : e4.DEPTH_ATTACHMENT;
        e4.invalidateFramebuffer(e4.DRAW_FRAMEBUFFER, [n3]);
      }
    }
  }
  function j2(e5) {
    return Math.min(i2.maxSamples, e5.samples);
  }
  function ke2(e5) {
    let n3 = r2.get(e5);
    return e5.samples > 0 && t2.has(`WEBGL_multisampled_render_to_texture`) === true && n3.__useRenderToTexture !== false;
  }
  function Ae2(e5) {
    let t3 = s2.render.frame;
    p2.get(e5) !== t3 && (p2.set(e5, t3), e5.update());
  }
  function je2(e5, t3) {
    let n3 = e5.colorSpace, r3 = e5.format, i3 = e5.type;
    return e5.isCompressedTexture === true || e5.isVideoTexture === true || n3 !== `srgb-linear` && n3 !== `` && (dr.getTransfer(n3) === `srgb` ? (r3 !== 1023 || i3 !== 1009) && l(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`) : u(`WebGLTextures: Unsupported texture color space:`, n3)), t3;
  }
  function Me2(e5) {
    return typeof HTMLImageElement < `u` && e5 instanceof HTMLImageElement ? (f2.width = e5.naturalWidth || e5.width, f2.height = e5.naturalHeight || e5.height) : typeof VideoFrame < `u` && e5 instanceof VideoFrame ? (f2.width = e5.displayWidth, f2.height = e5.displayHeight) : (f2.width = e5.width, f2.height = e5.height), f2;
  }
  this.allocateTextureUnit = ie2, this.resetTextureUnits = te2, this.getTextureUnits = ne2, this.setTextureUnits = re2, this.setTexture2D = oe2, this.setTexture2DArray = se2, this.setTexture3D = ce2, this.setTextureCube = le2, this.rebindTextures = Ce2, this.setupRenderTarget = we2, this.updateRenderTargetMipmap = Te2, this.updateMultisampleRenderTarget = Oe2, this.setupDepthRenderbuffer = Se2, this.setupFrameBufferTexture = ye2, this.useMultisampledRTT = ke2, this.isReversedDepthBuffer = function() {
    return n2.buffers.depth.getReversed();
  };
}
function uu(e4, t2) {
  function n2(n3, r2 = ``) {
    let i2, a2 = dr.getTransfer(r2);
    if (n3 === 1009) return e4.UNSIGNED_BYTE;
    if (n3 === 1017) return e4.UNSIGNED_SHORT_4_4_4_4;
    if (n3 === 1018) return e4.UNSIGNED_SHORT_5_5_5_1;
    if (n3 === 35902) return e4.UNSIGNED_INT_5_9_9_9_REV;
    if (n3 === 35899) return e4.UNSIGNED_INT_10F_11F_11F_REV;
    if (n3 === 1010) return e4.BYTE;
    if (n3 === 1011) return e4.SHORT;
    if (n3 === 1012) return e4.UNSIGNED_SHORT;
    if (n3 === 1013) return e4.INT;
    if (n3 === 1014) return e4.UNSIGNED_INT;
    if (n3 === 1015) return e4.FLOAT;
    if (n3 === 1016) return e4.HALF_FLOAT;
    if (n3 === 1021) return e4.ALPHA;
    if (n3 === 1022) return e4.RGB;
    if (n3 === 1023) return e4.RGBA;
    if (n3 === 1026) return e4.DEPTH_COMPONENT;
    if (n3 === 1027) return e4.DEPTH_STENCIL;
    if (n3 === 1028) return e4.RED;
    if (n3 === 1029) return e4.RED_INTEGER;
    if (n3 === 1030) return e4.RG;
    if (n3 === 1031) return e4.RG_INTEGER;
    if (n3 === 1033) return e4.RGBA_INTEGER;
    if (n3 === 33776 || n3 === 33777 || n3 === 33778 || n3 === 33779) if (a2 === `srgb`) if (i2 = t2.get(`WEBGL_compressed_texture_s3tc_srgb`), i2 !== null) {
      if (n3 === 33776) return i2.COMPRESSED_SRGB_S3TC_DXT1_EXT;
      if (n3 === 33777) return i2.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
      if (n3 === 33778) return i2.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
      if (n3 === 33779) return i2.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
    } else return null;
    else if (i2 = t2.get(`WEBGL_compressed_texture_s3tc`), i2 !== null) {
      if (n3 === 33776) return i2.COMPRESSED_RGB_S3TC_DXT1_EXT;
      if (n3 === 33777) return i2.COMPRESSED_RGBA_S3TC_DXT1_EXT;
      if (n3 === 33778) return i2.COMPRESSED_RGBA_S3TC_DXT3_EXT;
      if (n3 === 33779) return i2.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    } else return null;
    if (n3 === 35840 || n3 === 35841 || n3 === 35842 || n3 === 35843) if (i2 = t2.get(`WEBGL_compressed_texture_pvrtc`), i2 !== null) {
      if (n3 === 35840) return i2.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
      if (n3 === 35841) return i2.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
      if (n3 === 35842) return i2.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
      if (n3 === 35843) return i2.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
    } else return null;
    if (n3 === 36196 || n3 === 37492 || n3 === 37496 || n3 === 37488 || n3 === 37489 || n3 === 37490 || n3 === 37491) if (i2 = t2.get(`WEBGL_compressed_texture_etc`), i2 !== null) {
      if (n3 === 36196 || n3 === 37492) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ETC2 : i2.COMPRESSED_RGB8_ETC2;
      if (n3 === 37496) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : i2.COMPRESSED_RGBA8_ETC2_EAC;
      if (n3 === 37488) return i2.COMPRESSED_R11_EAC;
      if (n3 === 37489) return i2.COMPRESSED_SIGNED_R11_EAC;
      if (n3 === 37490) return i2.COMPRESSED_RG11_EAC;
      if (n3 === 37491) return i2.COMPRESSED_SIGNED_RG11_EAC;
    } else return null;
    if (n3 === 37808 || n3 === 37809 || n3 === 37810 || n3 === 37811 || n3 === 37812 || n3 === 37813 || n3 === 37814 || n3 === 37815 || n3 === 37816 || n3 === 37817 || n3 === 37818 || n3 === 37819 || n3 === 37820 || n3 === 37821) if (i2 = t2.get(`WEBGL_compressed_texture_astc`), i2 !== null) {
      if (n3 === 37808) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR : i2.COMPRESSED_RGBA_ASTC_4x4_KHR;
      if (n3 === 37809) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR : i2.COMPRESSED_RGBA_ASTC_5x4_KHR;
      if (n3 === 37810) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR : i2.COMPRESSED_RGBA_ASTC_5x5_KHR;
      if (n3 === 37811) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR : i2.COMPRESSED_RGBA_ASTC_6x5_KHR;
      if (n3 === 37812) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR : i2.COMPRESSED_RGBA_ASTC_6x6_KHR;
      if (n3 === 37813) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR : i2.COMPRESSED_RGBA_ASTC_8x5_KHR;
      if (n3 === 37814) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR : i2.COMPRESSED_RGBA_ASTC_8x6_KHR;
      if (n3 === 37815) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR : i2.COMPRESSED_RGBA_ASTC_8x8_KHR;
      if (n3 === 37816) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR : i2.COMPRESSED_RGBA_ASTC_10x5_KHR;
      if (n3 === 37817) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR : i2.COMPRESSED_RGBA_ASTC_10x6_KHR;
      if (n3 === 37818) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR : i2.COMPRESSED_RGBA_ASTC_10x8_KHR;
      if (n3 === 37819) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR : i2.COMPRESSED_RGBA_ASTC_10x10_KHR;
      if (n3 === 37820) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR : i2.COMPRESSED_RGBA_ASTC_12x10_KHR;
      if (n3 === 37821) return a2 === `srgb` ? i2.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR : i2.COMPRESSED_RGBA_ASTC_12x12_KHR;
    } else return null;
    if (n3 === 36492 || n3 === 36494 || n3 === 36495) if (i2 = t2.get(`EXT_texture_compression_bptc`), i2 !== null) {
      if (n3 === 36492) return a2 === `srgb` ? i2.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT : i2.COMPRESSED_RGBA_BPTC_UNORM_EXT;
      if (n3 === 36494) return i2.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;
      if (n3 === 36495) return i2.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT;
    } else return null;
    if (n3 === 36283 || n3 === 36284 || n3 === 36285 || n3 === 36286) if (i2 = t2.get(`EXT_texture_compression_rgtc`), i2 !== null) {
      if (n3 === 36283) return i2.COMPRESSED_RED_RGTC1_EXT;
      if (n3 === 36284) return i2.COMPRESSED_SIGNED_RED_RGTC1_EXT;
      if (n3 === 36285) return i2.COMPRESSED_RED_GREEN_RGTC2_EXT;
      if (n3 === 36286) return i2.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
    } else return null;
    return n3 === 1020 ? e4.UNSIGNED_INT_24_8 : e4[n3] === void 0 ? null : e4[n3];
  }
  return { convert: n2 };
}
function du(e4, t2) {
  function n2(e5, t3) {
    e5.matrixAutoUpdate === true && e5.updateMatrix(), t3.value.copy(e5.matrix);
  }
  function r2(t3, n3) {
    n3.color.getRGB(t3.fogColor.value, lt(e4)), n3.isFog ? (t3.fogNear.value = n3.near, t3.fogFar.value = n3.far) : n3.isFogExp2 && (t3.fogDensity.value = n3.density);
  }
  function i2(e5, t3, n3, r3, i3) {
    t3.isNodeMaterial ? t3.uniformsNeedUpdate = false : t3.isMeshBasicMaterial ? a2(e5, t3) : t3.isMeshLambertMaterial ? (a2(e5, t3), t3.envMap && (e5.envMapIntensity.value = t3.envMapIntensity)) : t3.isMeshToonMaterial ? (a2(e5, t3), d2(e5, t3)) : t3.isMeshPhongMaterial ? (a2(e5, t3), u2(e5, t3), t3.envMap && (e5.envMapIntensity.value = t3.envMapIntensity)) : t3.isMeshStandardMaterial ? (a2(e5, t3), f2(e5, t3), t3.isMeshPhysicalMaterial && p2(e5, t3, i3)) : t3.isMeshMatcapMaterial ? (a2(e5, t3), m2(e5, t3)) : t3.isMeshDepthMaterial ? a2(e5, t3) : t3.isMeshDistanceMaterial ? (a2(e5, t3), h2(e5, t3)) : t3.isMeshNormalMaterial ? a2(e5, t3) : t3.isLineBasicMaterial ? (o2(e5, t3), t3.isLineDashedMaterial && s2(e5, t3)) : t3.isPointsMaterial ? c2(e5, t3, n3, r3) : t3.isSpriteMaterial ? l2(e5, t3) : t3.isShadowMaterial ? (e5.color.value.copy(t3.color), e5.opacity.value = t3.opacity) : t3.isShaderMaterial && (t3.uniformsNeedUpdate = false);
  }
  function a2(e5, r3) {
    e5.opacity.value = r3.opacity, r3.color && e5.diffuse.value.copy(r3.color), r3.emissive && e5.emissive.value.copy(r3.emissive).multiplyScalar(r3.emissiveIntensity), r3.map && (e5.map.value = r3.map, n2(r3.map, e5.mapTransform)), r3.alphaMap && (e5.alphaMap.value = r3.alphaMap, n2(r3.alphaMap, e5.alphaMapTransform)), r3.bumpMap && (e5.bumpMap.value = r3.bumpMap, n2(r3.bumpMap, e5.bumpMapTransform), e5.bumpScale.value = r3.bumpScale, r3.side === 1 && (e5.bumpScale.value *= -1)), r3.normalMap && (e5.normalMap.value = r3.normalMap, n2(r3.normalMap, e5.normalMapTransform), e5.normalScale.value.copy(r3.normalScale), r3.side === 1 && e5.normalScale.value.negate()), r3.displacementMap && (e5.displacementMap.value = r3.displacementMap, n2(r3.displacementMap, e5.displacementMapTransform), e5.displacementScale.value = r3.displacementScale, e5.displacementBias.value = r3.displacementBias), r3.emissiveMap && (e5.emissiveMap.value = r3.emissiveMap, n2(r3.emissiveMap, e5.emissiveMapTransform)), r3.specularMap && (e5.specularMap.value = r3.specularMap, n2(r3.specularMap, e5.specularMapTransform)), r3.alphaTest > 0 && (e5.alphaTest.value = r3.alphaTest);
    let i3 = t2.get(r3), a3 = i3.envMap, o3 = i3.envMapRotation;
    a3 && (e5.envMap.value = a3, e5.envMapRotation.value.setFromMatrix4(xd.makeRotationFromEuler(o3)).transpose(), a3.isCubeTexture && a3.isRenderTargetTexture === false && e5.envMapRotation.value.premultiply(Sd), e5.reflectivity.value = r3.reflectivity, e5.ior.value = r3.ior, e5.refractionRatio.value = r3.refractionRatio), r3.lightMap && (e5.lightMap.value = r3.lightMap, e5.lightMapIntensity.value = r3.lightMapIntensity, n2(r3.lightMap, e5.lightMapTransform)), r3.aoMap && (e5.aoMap.value = r3.aoMap, e5.aoMapIntensity.value = r3.aoMapIntensity, n2(r3.aoMap, e5.aoMapTransform));
  }
  function o2(e5, t3) {
    e5.diffuse.value.copy(t3.color), e5.opacity.value = t3.opacity, t3.map && (e5.map.value = t3.map, n2(t3.map, e5.mapTransform));
  }
  function s2(e5, t3) {
    e5.dashSize.value = t3.dashSize, e5.totalSize.value = t3.dashSize + t3.gapSize, e5.scale.value = t3.scale;
  }
  function c2(e5, t3, r3, i3) {
    e5.diffuse.value.copy(t3.color), e5.opacity.value = t3.opacity, e5.size.value = t3.size * r3, e5.scale.value = i3 * 0.5, t3.map && (e5.map.value = t3.map, n2(t3.map, e5.uvTransform)), t3.alphaMap && (e5.alphaMap.value = t3.alphaMap, n2(t3.alphaMap, e5.alphaMapTransform)), t3.alphaTest > 0 && (e5.alphaTest.value = t3.alphaTest);
  }
  function l2(e5, t3) {
    e5.diffuse.value.copy(t3.color), e5.opacity.value = t3.opacity, e5.rotation.value = t3.rotation, t3.map && (e5.map.value = t3.map, n2(t3.map, e5.mapTransform)), t3.alphaMap && (e5.alphaMap.value = t3.alphaMap, n2(t3.alphaMap, e5.alphaMapTransform)), t3.alphaTest > 0 && (e5.alphaTest.value = t3.alphaTest);
  }
  function u2(e5, t3) {
    e5.specular.value.copy(t3.specular), e5.shininess.value = Math.max(t3.shininess, 1e-4);
  }
  function d2(e5, t3) {
    t3.gradientMap && (e5.gradientMap.value = t3.gradientMap);
  }
  function f2(e5, t3) {
    e5.metalness.value = t3.metalness, t3.metalnessMap && (e5.metalnessMap.value = t3.metalnessMap, n2(t3.metalnessMap, e5.metalnessMapTransform)), e5.roughness.value = t3.roughness, t3.roughnessMap && (e5.roughnessMap.value = t3.roughnessMap, n2(t3.roughnessMap, e5.roughnessMapTransform)), t3.envMap && (e5.envMapIntensity.value = t3.envMapIntensity);
  }
  function p2(e5, t3, r3) {
    e5.ior.value = t3.ior, t3.sheen > 0 && (e5.sheenColor.value.copy(t3.sheenColor).multiplyScalar(t3.sheen), e5.sheenRoughness.value = t3.sheenRoughness, t3.sheenColorMap && (e5.sheenColorMap.value = t3.sheenColorMap, n2(t3.sheenColorMap, e5.sheenColorMapTransform)), t3.sheenRoughnessMap && (e5.sheenRoughnessMap.value = t3.sheenRoughnessMap, n2(t3.sheenRoughnessMap, e5.sheenRoughnessMapTransform))), t3.clearcoat > 0 && (e5.clearcoat.value = t3.clearcoat, e5.clearcoatRoughness.value = t3.clearcoatRoughness, t3.clearcoatMap && (e5.clearcoatMap.value = t3.clearcoatMap, n2(t3.clearcoatMap, e5.clearcoatMapTransform)), t3.clearcoatRoughnessMap && (e5.clearcoatRoughnessMap.value = t3.clearcoatRoughnessMap, n2(t3.clearcoatRoughnessMap, e5.clearcoatRoughnessMapTransform)), t3.clearcoatNormalMap && (e5.clearcoatNormalMap.value = t3.clearcoatNormalMap, n2(t3.clearcoatNormalMap, e5.clearcoatNormalMapTransform), e5.clearcoatNormalScale.value.copy(t3.clearcoatNormalScale), t3.side === 1 && e5.clearcoatNormalScale.value.negate())), t3.dispersion > 0 && (e5.dispersion.value = t3.dispersion), t3.iridescence > 0 && (e5.iridescence.value = t3.iridescence, e5.iridescenceIOR.value = t3.iridescenceIOR, e5.iridescenceThicknessMinimum.value = t3.iridescenceThicknessRange[0], e5.iridescenceThicknessMaximum.value = t3.iridescenceThicknessRange[1], t3.iridescenceMap && (e5.iridescenceMap.value = t3.iridescenceMap, n2(t3.iridescenceMap, e5.iridescenceMapTransform)), t3.iridescenceThicknessMap && (e5.iridescenceThicknessMap.value = t3.iridescenceThicknessMap, n2(t3.iridescenceThicknessMap, e5.iridescenceThicknessMapTransform))), t3.transmission > 0 && (e5.transmission.value = t3.transmission, e5.transmissionSamplerMap.value = r3.texture, e5.transmissionSamplerSize.value.set(r3.width, r3.height), t3.transmissionMap && (e5.transmissionMap.value = t3.transmissionMap, n2(t3.transmissionMap, e5.transmissionMapTransform)), e5.thickness.value = t3.thickness, t3.thicknessMap && (e5.thicknessMap.value = t3.thicknessMap, n2(t3.thicknessMap, e5.thicknessMapTransform)), e5.attenuationDistance.value = t3.attenuationDistance, e5.attenuationColor.value.copy(t3.attenuationColor)), t3.anisotropy > 0 && (e5.anisotropyVector.value.set(t3.anisotropy * Math.cos(t3.anisotropyRotation), t3.anisotropy * Math.sin(t3.anisotropyRotation)), t3.anisotropyMap && (e5.anisotropyMap.value = t3.anisotropyMap, n2(t3.anisotropyMap, e5.anisotropyMapTransform))), e5.specularIntensity.value = t3.specularIntensity, e5.specularColor.value.copy(t3.specularColor), t3.specularColorMap && (e5.specularColorMap.value = t3.specularColorMap, n2(t3.specularColorMap, e5.specularColorMapTransform)), t3.specularIntensityMap && (e5.specularIntensityMap.value = t3.specularIntensityMap, n2(t3.specularIntensityMap, e5.specularIntensityMapTransform));
  }
  function m2(e5, t3) {
    t3.matcap && (e5.matcap.value = t3.matcap);
  }
  function h2(e5, n3) {
    let r3 = t2.get(n3).light;
    e5.referencePosition.value.setFromMatrixPosition(r3.matrixWorld), e5.nearDistance.value = r3.shadow.camera.near, e5.farDistance.value = r3.shadow.camera.far;
  }
  return { refreshFogUniforms: r2, refreshMaterialUniforms: i2 };
}
function fu(e4, t2, n2, r2) {
  let i2 = {}, a2 = {}, o2 = [], s2 = e4.getParameter(e4.MAX_UNIFORM_BUFFER_BINDINGS);
  function c2(e5, t3) {
    let n3 = t3.program;
    r2.uniformBlockBinding(e5, n3);
  }
  function d2(e5, n3) {
    let o3 = i2[e5.id];
    o3 === void 0 && (g2(e5), o3 = f2(e5), i2[e5.id] = o3, e5.addEventListener(`dispose`, v2));
    let s3 = n3.program;
    r2.updateUBOMapping(e5, s3);
    let c3 = t2.render.frame;
    a2[e5.id] !== c3 && (m2(e5), a2[e5.id] = c3);
  }
  function f2(t3) {
    let n3 = p2();
    t3.__bindingPointIndex = n3;
    let r3 = e4.createBuffer(), i3 = t3.__size, a3 = t3.usage;
    return e4.bindBuffer(e4.UNIFORM_BUFFER, r3), e4.bufferData(e4.UNIFORM_BUFFER, i3, a3), e4.bindBuffer(e4.UNIFORM_BUFFER, null), e4.bindBufferBase(e4.UNIFORM_BUFFER, n3, r3), r3;
  }
  function p2() {
    for (let e5 = 0; e5 < s2; e5++) if (o2.indexOf(e5) === -1) return o2.push(e5), e5;
    return u(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`), 0;
  }
  function m2(t3) {
    let n3 = i2[t3.id], r3 = t3.uniforms, a3 = t3.__cache;
    e4.bindBuffer(e4.UNIFORM_BUFFER, n3);
    for (let t4 = 0, n4 = r3.length; t4 < n4; t4++) {
      let n5 = Array.isArray(r3[t4]) ? r3[t4] : [r3[t4]];
      for (let r4 = 0, i3 = n5.length; r4 < i3; r4++) {
        let i4 = n5[r4];
        if (h2(i4, t4, r4, a3) === true) {
          let t5 = i4.__offset, n6 = Array.isArray(i4.value) ? i4.value : [i4.value], r5 = 0;
          for (let a4 = 0; a4 < n6.length; a4++) {
            let o3 = n6[a4], s3 = _2(o3);
            typeof o3 == `number` || typeof o3 == `boolean` ? (i4.__data[0] = o3, e4.bufferSubData(e4.UNIFORM_BUFFER, t5 + r5, i4.__data)) : o3.isMatrix3 ? (i4.__data[0] = o3.elements[0], i4.__data[1] = o3.elements[1], i4.__data[2] = o3.elements[2], i4.__data[3] = 0, i4.__data[4] = o3.elements[3], i4.__data[5] = o3.elements[4], i4.__data[6] = o3.elements[5], i4.__data[7] = 0, i4.__data[8] = o3.elements[6], i4.__data[9] = o3.elements[7], i4.__data[10] = o3.elements[8], i4.__data[11] = 0) : ArrayBuffer.isView(o3) ? i4.__data.set(new o3.constructor(o3.buffer, o3.byteOffset, i4.__data.length)) : (o3.toArray(i4.__data, r5), r5 += s3.storage / Float32Array.BYTES_PER_ELEMENT);
          }
          e4.bufferSubData(e4.UNIFORM_BUFFER, t5, i4.__data);
        }
      }
    }
    e4.bindBuffer(e4.UNIFORM_BUFFER, null);
  }
  function h2(e5, t3, n3, r3) {
    let i3 = e5.value, a3 = t3 + `_` + n3;
    if (r3[a3] === void 0) return typeof i3 == `number` || typeof i3 == `boolean` ? r3[a3] = i3 : ArrayBuffer.isView(i3) ? r3[a3] = i3.slice() : r3[a3] = i3.clone(), true;
    {
      let e6 = r3[a3];
      if (typeof i3 == `number` || typeof i3 == `boolean`) {
        if (e6 !== i3) return r3[a3] = i3, true;
      } else if (ArrayBuffer.isView(i3)) return true;
      else if (e6.equals(i3) === false) return e6.copy(i3), true;
    }
    return false;
  }
  function g2(e5) {
    let t3 = e5.uniforms, n3 = 0;
    for (let e6 = 0, r4 = t3.length; e6 < r4; e6++) {
      let r5 = Array.isArray(t3[e6]) ? t3[e6] : [t3[e6]];
      for (let e7 = 0, t4 = r5.length; e7 < t4; e7++) {
        let t5 = r5[e7], i3 = Array.isArray(t5.value) ? t5.value : [t5.value];
        for (let e8 = 0, r6 = i3.length; e8 < r6; e8++) {
          let r7 = i3[e8], a3 = _2(r7), o3 = n3 % 16, s3 = o3 % a3.boundary, c3 = o3 + s3;
          n3 += s3, c3 !== 0 && 16 - c3 < a3.storage && (n3 += 16 - c3), t5.__data = new Float32Array(a3.storage / Float32Array.BYTES_PER_ELEMENT), t5.__offset = n3, n3 += a3.storage;
        }
      }
    }
    let r3 = n3 % 16;
    return r3 > 0 && (n3 += 16 - r3), e5.__size = n3, e5.__cache = {}, this;
  }
  function _2(e5) {
    let t3 = { boundary: 0, storage: 0 };
    return typeof e5 == `number` || typeof e5 == `boolean` ? (t3.boundary = 4, t3.storage = 4) : e5.isVector2 ? (t3.boundary = 8, t3.storage = 8) : e5.isVector3 || e5.isColor ? (t3.boundary = 16, t3.storage = 12) : e5.isVector4 ? (t3.boundary = 16, t3.storage = 16) : e5.isMatrix3 ? (t3.boundary = 48, t3.storage = 48) : e5.isMatrix4 ? (t3.boundary = 64, t3.storage = 64) : e5.isTexture ? l(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`) : ArrayBuffer.isView(e5) ? (t3.boundary = 16, t3.storage = e5.byteLength) : l(`WebGLRenderer: Unsupported uniform value type.`, e5), t3;
  }
  function v2(t3) {
    let n3 = t3.target;
    n3.removeEventListener(`dispose`, v2);
    let r3 = o2.indexOf(n3.__bindingPointIndex);
    o2.splice(r3, 1), e4.deleteBuffer(i2[n3.id]), delete i2[n3.id], delete a2[n3.id];
  }
  function y2() {
    for (let t3 in i2) e4.deleteBuffer(i2[t3]);
    o2 = [], i2 = {}, a2 = {};
  }
  return { bind: c2, update: d2, dispose: y2 };
}
function pu() {
  return wd === null && (wd = new Na(Cd, 16, 16, Kt, Nt), wd.name = `DFG_LUT`, wd.minFilter = Ct, wd.magFilter = Ct, wd.wrapS = vt, wd.wrapT = vt, wd.generateMipmaps = false, wd.needsUpdate = true), wd;
}
var mu, F, hu, gu, _u, vu, yu, bu, xu, Su, Cu, wu, Tu, Eu, Du, Ou, ku, Au, ju, Mu, Nu, Pu, Fu, Iu, Lu, Ru, zu, Bu, Vu, Hu, Uu, Wu, Gu, Ku, qu, Ju, Yu, Xu, Zu, Qu, $u, ed, td, nd, rd, id, ad, od, sd, cd, ld, ud, dd, fd, pd, md, hd, gd, _d, vd, yd, bd, xd, Sd, Cd, wd, Td, Ed = t((() => {
  cc(), mu = { alphahash_fragment: `#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`, alphahash_pars_fragment: `#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`, alphamap_fragment: `#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`, alphamap_pars_fragment: `#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, alphatest_fragment: `#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`, alphatest_pars_fragment: `#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`, aomap_fragment: `#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`, aomap_pars_fragment: `#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`, batching_pars_vertex: `#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`, batching_vertex: `#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`, begin_vertex: `vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`, beginnormal_vertex: `vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`, bsdfs: `float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`, iridescence_fragment: `#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`, bumpmap_pars_fragment: `#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`, clipping_planes_fragment: `#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`, clipping_planes_pars_fragment: `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`, clipping_planes_pars_vertex: `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`, clipping_planes_vertex: `#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`, color_fragment: `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`, color_pars_fragment: `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`, color_pars_vertex: `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`, color_vertex: `#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`, common: `#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`, cube_uv_reflection_fragment: `#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`, defaultnormal_vertex: `vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`, displacementmap_pars_vertex: `#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`, displacementmap_vertex: `#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`, emissivemap_fragment: `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`, emissivemap_pars_fragment: `#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`, colorspace_fragment: `gl_FragColor = linearToOutputTexel( gl_FragColor );`, colorspace_pars_fragment: `vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`, envmap_fragment: `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`, envmap_common_pars_fragment: `#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`, envmap_pars_fragment: `#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`, envmap_pars_vertex: `#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`, envmap_physical_pars_fragment: `#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`, envmap_vertex: `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`, fog_vertex: `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`, fog_pars_vertex: `#ifdef USE_FOG
	varying float vFogDepth;
#endif`, fog_fragment: `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`, fog_pars_fragment: `#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`, gradientmap_pars_fragment: `#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`, lightmap_pars_fragment: `#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`, lights_lambert_fragment: `LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`, lights_lambert_pars_fragment: `varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`, lights_pars_begin: `uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`, lights_toon_fragment: `ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`, lights_toon_pars_fragment: `varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`, lights_phong_fragment: `BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`, lights_phong_pars_fragment: `varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`, lights_physical_fragment: `PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`, lights_physical_pars_fragment: `uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`, lights_fragment_begin: `
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`, lights_fragment_maps: `#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`, lights_fragment_end: `#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`, lightprobes_pars_fragment: `#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`, logdepthbuf_fragment: `#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`, logdepthbuf_pars_fragment: `#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`, logdepthbuf_pars_vertex: `#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`, logdepthbuf_vertex: `#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`, map_fragment: `#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`, map_pars_fragment: `#ifdef USE_MAP
	uniform sampler2D map;
#endif`, map_particle_fragment: `#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`, map_particle_pars_fragment: `#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, metalnessmap_fragment: `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`, metalnessmap_pars_fragment: `#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`, morphinstance_vertex: `#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`, morphcolor_vertex: `#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`, morphnormal_vertex: `#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`, morphtarget_pars_vertex: `#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`, morphtarget_vertex: `#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`, normal_fragment_begin: `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`, normal_fragment_maps: `#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`, normal_pars_fragment: `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, normal_pars_vertex: `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, normal_vertex: `#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`, normalmap_pars_fragment: `#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`, clearcoat_normal_fragment_begin: `#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`, clearcoat_normal_fragment_maps: `#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`, clearcoat_pars_fragment: `#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`, iridescence_pars_fragment: `#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`, opaque_fragment: `#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`, packing: `vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`, premultiplied_alpha_fragment: `#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`, project_vertex: `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`, dithering_fragment: `#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`, dithering_pars_fragment: `#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`, roughnessmap_fragment: `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`, roughnessmap_pars_fragment: `#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`, shadowmap_pars_fragment: `#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`, shadowmap_pars_vertex: `#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`, shadowmap_vertex: `#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`, shadowmask_pars_fragment: `float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`, skinbase_vertex: `#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`, skinning_pars_vertex: `#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`, skinning_vertex: `#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`, skinnormal_vertex: `#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`, specularmap_fragment: `float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`, specularmap_pars_fragment: `#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`, tonemapping_fragment: `#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`, tonemapping_pars_fragment: `#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`, transmission_fragment: `#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`, transmission_pars_fragment: `#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`, uv_pars_fragment: `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, uv_pars_vertex: `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, uv_vertex: `#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`, worldpos_vertex: `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`, background_vert: `varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`, background_frag: `uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, backgroundCube_vert: `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, backgroundCube_frag: `#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, cube_vert: `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, cube_frag: `uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, depth_vert: `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`, depth_frag: `#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`, distance_vert: `#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`, distance_frag: `#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`, equirect_vert: `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`, equirect_frag: `uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`, linedashed_vert: `uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, linedashed_frag: `uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, meshbasic_vert: `#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`, meshbasic_frag: `uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, meshlambert_vert: `#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, meshlambert_frag: `#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, meshmatcap_vert: `#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`, meshmatcap_frag: `#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, meshnormal_vert: `#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`, meshnormal_frag: `#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`, meshphong_vert: `#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, meshphong_frag: `#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, meshphysical_vert: `#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`, meshphysical_frag: `#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, meshtoon_vert: `#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, meshtoon_frag: `#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, points_vert: `uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`, points_frag: `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, shadow_vert: `#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, shadow_frag: `uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, sprite_vert: `uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, sprite_frag: `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}` }, F = { common: { diffuse: { value: new P(16777215) }, opacity: { value: 1 }, map: { value: null }, mapTransform: { value: new sr() }, alphaMap: { value: null }, alphaMapTransform: { value: new sr() }, alphaTest: { value: 0 } }, specularmap: { specularMap: { value: null }, specularMapTransform: { value: new sr() } }, envmap: { envMap: { value: null }, envMapRotation: { value: new sr() }, reflectivity: { value: 1 }, ior: { value: 1.5 }, refractionRatio: { value: 0.98 }, dfgLUT: { value: null } }, aomap: { aoMap: { value: null }, aoMapIntensity: { value: 1 }, aoMapTransform: { value: new sr() } }, lightmap: { lightMap: { value: null }, lightMapIntensity: { value: 1 }, lightMapTransform: { value: new sr() } }, bumpmap: { bumpMap: { value: null }, bumpMapTransform: { value: new sr() }, bumpScale: { value: 1 } }, normalmap: { normalMap: { value: null }, normalMapTransform: { value: new sr() }, normalScale: { value: new M(1, 1) } }, displacementmap: { displacementMap: { value: null }, displacementMapTransform: { value: new sr() }, displacementScale: { value: 1 }, displacementBias: { value: 0 } }, emissivemap: { emissiveMap: { value: null }, emissiveMapTransform: { value: new sr() } }, metalnessmap: { metalnessMap: { value: null }, metalnessMapTransform: { value: new sr() } }, roughnessmap: { roughnessMap: { value: null }, roughnessMapTransform: { value: new sr() } }, gradientmap: { gradientMap: { value: null } }, fog: { fogDensity: { value: 25e-5 }, fogNear: { value: 1 }, fogFar: { value: 2e3 }, fogColor: { value: new P(16777215) } }, lights: { ambientLightColor: { value: [] }, lightProbe: { value: [] }, directionalLights: { value: [], properties: { direction: {}, color: {} } }, directionalLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {} } }, directionalShadowMatrix: { value: [] }, spotLights: { value: [], properties: { color: {}, position: {}, direction: {}, distance: {}, coneCos: {}, penumbraCos: {}, decay: {} } }, spotLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {} } }, spotLightMap: { value: [] }, spotLightMatrix: { value: [] }, pointLights: { value: [], properties: { color: {}, position: {}, decay: {}, distance: {} } }, pointLightShadows: { value: [], properties: { shadowIntensity: 1, shadowBias: {}, shadowNormalBias: {}, shadowRadius: {}, shadowMapSize: {}, shadowCameraNear: {}, shadowCameraFar: {} } }, pointShadowMatrix: { value: [] }, hemisphereLights: { value: [], properties: { direction: {}, skyColor: {}, groundColor: {} } }, rectAreaLights: { value: [], properties: { color: {}, position: {}, width: {}, height: {} } }, ltc_1: { value: null }, ltc_2: { value: null }, probesSH: { value: null }, probesMin: { value: new N() }, probesMax: { value: new N() }, probesResolution: { value: new N() } }, points: { diffuse: { value: new P(16777215) }, opacity: { value: 1 }, size: { value: 1 }, scale: { value: 1 }, map: { value: null }, alphaMap: { value: null }, alphaMapTransform: { value: new sr() }, alphaTest: { value: 0 }, uvTransform: { value: new sr() } }, sprite: { diffuse: { value: new P(16777215) }, opacity: { value: 1 }, center: { value: new M(0.5, 0.5) }, rotation: { value: 0 }, map: { value: null }, mapTransform: { value: new sr() }, alphaMap: { value: null }, alphaMapTransform: { value: new sr() }, alphaTest: { value: 0 } } }, hu = { basic: { uniforms: ot([F.common, F.specularmap, F.envmap, F.aomap, F.lightmap, F.fog]), vertexShader: mu.meshbasic_vert, fragmentShader: mu.meshbasic_frag }, lambert: { uniforms: ot([F.common, F.specularmap, F.envmap, F.aomap, F.lightmap, F.emissivemap, F.bumpmap, F.normalmap, F.displacementmap, F.fog, F.lights, { emissive: { value: new P(0) }, envMapIntensity: { value: 1 } }]), vertexShader: mu.meshlambert_vert, fragmentShader: mu.meshlambert_frag }, phong: { uniforms: ot([F.common, F.specularmap, F.envmap, F.aomap, F.lightmap, F.emissivemap, F.bumpmap, F.normalmap, F.displacementmap, F.fog, F.lights, { emissive: { value: new P(0) }, specular: { value: new P(1118481) }, shininess: { value: 30 }, envMapIntensity: { value: 1 } }]), vertexShader: mu.meshphong_vert, fragmentShader: mu.meshphong_frag }, standard: { uniforms: ot([F.common, F.envmap, F.aomap, F.lightmap, F.emissivemap, F.bumpmap, F.normalmap, F.displacementmap, F.roughnessmap, F.metalnessmap, F.fog, F.lights, { emissive: { value: new P(0) }, roughness: { value: 1 }, metalness: { value: 0 }, envMapIntensity: { value: 1 } }]), vertexShader: mu.meshphysical_vert, fragmentShader: mu.meshphysical_frag }, toon: { uniforms: ot([F.common, F.aomap, F.lightmap, F.emissivemap, F.bumpmap, F.normalmap, F.displacementmap, F.gradientmap, F.fog, F.lights, { emissive: { value: new P(0) } }]), vertexShader: mu.meshtoon_vert, fragmentShader: mu.meshtoon_frag }, matcap: { uniforms: ot([F.common, F.bumpmap, F.normalmap, F.displacementmap, F.fog, { matcap: { value: null } }]), vertexShader: mu.meshmatcap_vert, fragmentShader: mu.meshmatcap_frag }, points: { uniforms: ot([F.points, F.fog]), vertexShader: mu.points_vert, fragmentShader: mu.points_frag }, dashed: { uniforms: ot([F.common, F.fog, { scale: { value: 1 }, dashSize: { value: 1 }, totalSize: { value: 2 } }]), vertexShader: mu.linedashed_vert, fragmentShader: mu.linedashed_frag }, depth: { uniforms: ot([F.common, F.displacementmap]), vertexShader: mu.depth_vert, fragmentShader: mu.depth_frag }, normal: { uniforms: ot([F.common, F.bumpmap, F.normalmap, F.displacementmap, { opacity: { value: 1 } }]), vertexShader: mu.meshnormal_vert, fragmentShader: mu.meshnormal_frag }, sprite: { uniforms: ot([F.sprite, F.fog]), vertexShader: mu.sprite_vert, fragmentShader: mu.sprite_frag }, background: { uniforms: { uvTransform: { value: new sr() }, t2D: { value: null }, backgroundIntensity: { value: 1 } }, vertexShader: mu.background_vert, fragmentShader: mu.background_frag }, backgroundCube: { uniforms: { envMap: { value: null }, backgroundBlurriness: { value: 0 }, backgroundIntensity: { value: 1 }, backgroundRotation: { value: new sr() } }, vertexShader: mu.backgroundCube_vert, fragmentShader: mu.backgroundCube_frag }, cube: { uniforms: { tCube: { value: null }, tFlip: { value: -1 }, opacity: { value: 1 } }, vertexShader: mu.cube_vert, fragmentShader: mu.cube_frag }, equirect: { uniforms: { tEquirect: { value: null } }, vertexShader: mu.equirect_vert, fragmentShader: mu.equirect_frag }, distance: { uniforms: ot([F.common, F.displacementmap, { referencePosition: { value: new N() }, nearDistance: { value: 1 }, farDistance: { value: 1e3 } }]), vertexShader: mu.distance_vert, fragmentShader: mu.distance_frag }, shadow: { uniforms: ot([F.lights, F.fog, { color: { value: new P(0) }, opacity: { value: 1 } }]), vertexShader: mu.shadow_vert, fragmentShader: mu.shadow_frag } }, hu.physical = { uniforms: ot([hu.standard.uniforms, { clearcoat: { value: 0 }, clearcoatMap: { value: null }, clearcoatMapTransform: { value: new sr() }, clearcoatNormalMap: { value: null }, clearcoatNormalMapTransform: { value: new sr() }, clearcoatNormalScale: { value: new M(1, 1) }, clearcoatRoughness: { value: 0 }, clearcoatRoughnessMap: { value: null }, clearcoatRoughnessMapTransform: { value: new sr() }, dispersion: { value: 0 }, iridescence: { value: 0 }, iridescenceMap: { value: null }, iridescenceMapTransform: { value: new sr() }, iridescenceIOR: { value: 1.3 }, iridescenceThicknessMinimum: { value: 100 }, iridescenceThicknessMaximum: { value: 400 }, iridescenceThicknessMap: { value: null }, iridescenceThicknessMapTransform: { value: new sr() }, sheen: { value: 0 }, sheenColor: { value: new P(0) }, sheenColorMap: { value: null }, sheenColorMapTransform: { value: new sr() }, sheenRoughness: { value: 1 }, sheenRoughnessMap: { value: null }, sheenRoughnessMapTransform: { value: new sr() }, transmission: { value: 0 }, transmissionMap: { value: null }, transmissionMapTransform: { value: new sr() }, transmissionSamplerSize: { value: new M() }, transmissionSamplerMap: { value: null }, thickness: { value: 0 }, thicknessMap: { value: null }, thicknessMapTransform: { value: new sr() }, attenuationDistance: { value: 0 }, attenuationColor: { value: new P(0) }, specularColor: { value: new P(1, 1, 1) }, specularColorMap: { value: null }, specularColorMapTransform: { value: new sr() }, specularIntensity: { value: 1 }, specularIntensityMap: { value: null }, specularIntensityMapTransform: { value: new sr() }, anisotropyVector: { value: new M() }, anisotropyMap: { value: null }, anisotropyMapTransform: { value: new sr() } }]), vertexShader: mu.meshphysical_vert, fragmentShader: mu.meshphysical_frag }, gu = { r: 0, b: 0, g: 0 }, _u = new wr(), vu = new sr(), vu.set(-1, 0, 0, 0, 1, 0, 0, 0, 1), yu = 4, bu = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582], xu = 20, Su = 256, Cu = new js(), wu = new P(), Tu = null, Eu = 0, Du = 0, Ou = false, ku = new N(), Au = class {
    constructor(e4) {
      this._renderer = e4, this._pingPongRenderTarget = null, this._lodMax = 0, this._cubeSize = 0, this._sizeLods = [], this._sigmas = [], this._lodMeshes = [], this._backgroundBox = null, this._cubemapMaterial = null, this._equirectMaterial = null, this._blurMaterial = null, this._ggxMaterial = null;
    }
    fromScene(e4, t2 = 0, n2 = 0.1, r2 = 100, i2 = {}) {
      let { size: a2 = 256, position: o2 = ku } = i2;
      Tu = this._renderer.getRenderTarget(), Eu = this._renderer.getActiveCubeFace(), Du = this._renderer.getActiveMipmapLevel(), Ou = this._renderer.xr.enabled, this._renderer.xr.enabled = false, this._setSize(a2);
      let s2 = this._allocateTargets();
      return s2.depthBuffer = true, this._sceneToCubeUV(e4, n2, r2, s2, o2), t2 > 0 && this._blur(s2, 0, 0, t2), this._applyPMREM(s2), this._cleanup(s2), s2;
    }
    fromEquirectangular(e4, t2 = null) {
      return this._fromTexture(e4, t2);
    }
    fromCubemap(e4, t2 = null) {
      return this._fromTexture(e4, t2);
    }
    compileCubemapShader() {
      this._cubemapMaterial === null && (this._cubemapMaterial = Sc(), this._compileMaterial(this._cubemapMaterial));
    }
    compileEquirectangularShader() {
      this._equirectMaterial === null && (this._equirectMaterial = xc(), this._compileMaterial(this._equirectMaterial));
    }
    dispose() {
      this._dispose(), this._cubemapMaterial !== null && this._cubemapMaterial.dispose(), this._equirectMaterial !== null && this._equirectMaterial.dispose(), this._backgroundBox !== null && (this._backgroundBox.geometry.dispose(), this._backgroundBox.material.dispose());
    }
    _setSize(e4) {
      this._lodMax = Math.floor(Math.log2(e4)), this._cubeSize = 2 ** this._lodMax;
    }
    _dispose() {
      this._blurMaterial !== null && this._blurMaterial.dispose(), this._ggxMaterial !== null && this._ggxMaterial.dispose(), this._pingPongRenderTarget !== null && this._pingPongRenderTarget.dispose();
      for (let e4 = 0; e4 < this._lodMeshes.length; e4++) this._lodMeshes[e4].geometry.dispose();
    }
    _cleanup(e4) {
      this._renderer.setRenderTarget(Tu, Eu, Du), this._renderer.xr.enabled = Ou, e4.scissorTest = false, vc(e4, 0, 0, e4.width, e4.height);
    }
    _fromTexture(e4, t2) {
      e4.mapping === 301 || e4.mapping === 302 ? this._setSize(e4.image.length === 0 ? 16 : e4.image[0].width || e4.image[0].image.width) : this._setSize(e4.image.width / 4), Tu = this._renderer.getRenderTarget(), Eu = this._renderer.getActiveCubeFace(), Du = this._renderer.getActiveMipmapLevel(), Ou = this._renderer.xr.enabled, this._renderer.xr.enabled = false;
      let n2 = t2 || this._allocateTargets();
      return this._textureToCubeUV(e4, n2), this._applyPMREM(n2), this._cleanup(n2), n2;
    }
    _allocateTargets() {
      let e4 = 3 * Math.max(this._cubeSize, 112), t2 = 4 * this._cubeSize, n2 = { magFilter: Ct, minFilter: Ct, generateMipmaps: false, type: Nt, format: Vt, colorSpace: Hn, depthBuffer: false }, r2 = _c(e4, t2, n2);
      if (this._pingPongRenderTarget === null || this._pingPongRenderTarget.width !== e4 || this._pingPongRenderTarget.height !== t2) {
        this._pingPongRenderTarget !== null && this._dispose(), this._pingPongRenderTarget = _c(e4, t2, n2);
        let { _lodMax: r3 } = this;
        ({ lodMeshes: this._lodMeshes, sizeLods: this._sizeLods, sigmas: this._sigmas } = gc(r3)), this._blurMaterial = bc(r3, e4, t2), this._ggxMaterial = yc(r3, e4, t2);
      }
      return r2;
    }
    _compileMaterial(e4) {
      let t2 = new xa(new Qi(), e4);
      this._renderer.compile(t2, Cu);
    }
    _sceneToCubeUV(e4, t2, n2, r2, i2) {
      let a2 = new Os(90, 1, t2, n2), o2 = [1, -1, 1, 1, 1, 1], s2 = [1, 1, 1, -1, -1, -1], c2 = this._renderer, l2 = c2.autoClear, u2 = c2.toneMapping;
      c2.getClearColor(wu), c2.toneMapping = 0, c2.autoClear = false, c2.state.buffers.depth.getReversed() && (c2.setRenderTarget(r2), c2.clearDepth(), c2.setRenderTarget(null)), this._backgroundBox === null && (this._backgroundBox = new xa(new ao(), new la({ name: `PMREM.Background`, side: 1, depthWrite: false, depthTest: false })));
      let d2 = this._backgroundBox, f2 = d2.material, p2 = false, m2 = e4.background;
      m2 ? m2.isColor && (f2.color.copy(m2), e4.background = null, p2 = true) : (f2.color.copy(wu), p2 = true);
      for (let t3 = 0; t3 < 6; t3++) {
        let n3 = t3 % 3;
        n3 === 0 ? (a2.up.set(0, o2[t3], 0), a2.position.set(i2.x, i2.y, i2.z), a2.lookAt(i2.x + s2[t3], i2.y, i2.z)) : n3 === 1 ? (a2.up.set(0, 0, o2[t3]), a2.position.set(i2.x, i2.y, i2.z), a2.lookAt(i2.x, i2.y + s2[t3], i2.z)) : (a2.up.set(0, o2[t3], 0), a2.position.set(i2.x, i2.y, i2.z), a2.lookAt(i2.x, i2.y, i2.z + s2[t3]));
        let l3 = this._cubeSize;
        vc(r2, n3 * l3, t3 > 2 ? l3 : 0, l3, l3), c2.setRenderTarget(r2), p2 && c2.render(d2, a2), c2.render(e4, a2);
      }
      c2.toneMapping = u2, c2.autoClear = l2, e4.background = m2;
    }
    _textureToCubeUV(e4, t2) {
      let n2 = this._renderer, r2 = e4.mapping === 301 || e4.mapping === 302;
      r2 ? (this._cubemapMaterial === null && (this._cubemapMaterial = Sc()), this._cubemapMaterial.uniforms.flipEnvMap.value = e4.isRenderTargetTexture === false ? -1 : 1) : this._equirectMaterial === null && (this._equirectMaterial = xc());
      let i2 = r2 ? this._cubemapMaterial : this._equirectMaterial, a2 = this._lodMeshes[0];
      a2.material = i2;
      let o2 = i2.uniforms;
      o2.envMap.value = e4;
      let s2 = this._cubeSize;
      vc(t2, 0, 0, 3 * s2, 2 * s2), n2.setRenderTarget(t2), n2.render(a2, Cu);
    }
    _applyPMREM(e4) {
      let t2 = this._renderer, n2 = t2.autoClear;
      t2.autoClear = false;
      let r2 = this._lodMeshes.length;
      for (let t3 = 1; t3 < r2; t3++) this._applyGGXFilter(e4, t3 - 1, t3);
      t2.autoClear = n2;
    }
    _applyGGXFilter(e4, t2, n2) {
      let r2 = this._renderer, i2 = this._pingPongRenderTarget, a2 = this._ggxMaterial, o2 = this._lodMeshes[n2];
      o2.material = a2;
      let s2 = a2.uniforms, c2 = n2 / (this._lodMeshes.length - 1), l2 = t2 / (this._lodMeshes.length - 1), u2 = Math.sqrt(c2 * c2 - l2 * l2) * (0 + c2 * 1.25), { _lodMax: d2 } = this, f2 = this._sizeLods[n2], p2 = 3 * f2 * (n2 > d2 - yu ? n2 - d2 + yu : 0), m2 = 4 * (this._cubeSize - f2);
      s2.envMap.value = e4.texture, s2.roughness.value = u2, s2.mipInt.value = d2 - t2, vc(i2, p2, m2, 3 * f2, 2 * f2), r2.setRenderTarget(i2), r2.render(o2, Cu), s2.envMap.value = i2.texture, s2.roughness.value = 0, s2.mipInt.value = d2 - n2, vc(e4, p2, m2, 3 * f2, 2 * f2), r2.setRenderTarget(e4), r2.render(o2, Cu);
    }
    _blur(e4, t2, n2, r2, i2) {
      let a2 = this._pingPongRenderTarget;
      this._halfBlur(e4, a2, t2, n2, r2, `latitudinal`, i2), this._halfBlur(a2, e4, n2, n2, r2, `longitudinal`, i2);
    }
    _halfBlur(e4, t2, n2, r2, i2, a2, o2) {
      let s2 = this._renderer, c2 = this._blurMaterial;
      a2 !== `latitudinal` && a2 !== `longitudinal` && u(`blur direction must be either latitudinal or longitudinal!`);
      let d2 = this._lodMeshes[r2];
      d2.material = c2;
      let f2 = c2.uniforms, p2 = this._sizeLods[n2] - 1, m2 = isFinite(i2) ? Math.PI / (2 * p2) : 2 * Math.PI / (2 * xu - 1), h2 = i2 / m2, g2 = isFinite(i2) ? 1 + Math.floor(3 * h2) : xu;
      g2 > xu && l(`sigmaRadians, ${i2}, is too large and will clip, as it requested ${g2} samples when the maximum is set to ${xu}`);
      let _2 = [], v2 = 0;
      for (let e5 = 0; e5 < xu; ++e5) {
        let t3 = e5 / h2, n3 = Math.exp(-t3 * t3 / 2);
        _2.push(n3), e5 === 0 ? v2 += n3 : e5 < g2 && (v2 += 2 * n3);
      }
      for (let e5 = 0; e5 < _2.length; e5++) _2[e5] = _2[e5] / v2;
      f2.envMap.value = e4.texture, f2.samples.value = g2, f2.weights.value = _2, f2.latitudinal.value = a2 === `latitudinal`, o2 && (f2.poleAxis.value = o2);
      let { _lodMax: y2 } = this;
      f2.dTheta.value = m2, f2.mipInt.value = y2 - n2;
      let b2 = this._sizeLods[r2];
      vc(t2, 3 * b2 * (r2 > y2 - yu ? r2 - y2 + yu : 0), 4 * (this._cubeSize - b2), 3 * b2, 2 * b2), s2.setRenderTarget(t2), s2.render(d2, Cu);
    }
  }, ju = class extends xr {
    constructor(e4 = 1, t2 = {}) {
      super(e4, e4, t2), this.isWebGLCubeRenderTarget = true;
      let n2 = { width: e4, height: e4, depth: 1 }, r2 = [n2, n2, n2, n2, n2, n2];
      this.texture = new eo(r2), this._setTextureOptions(t2), this.texture.isRenderTargetTexture = true;
    }
    fromEquirectangularTexture(e4, t2) {
      this.texture.type = t2.type, this.texture.colorSpace = t2.colorSpace, this.texture.generateMipmaps = t2.generateMipmaps, this.texture.minFilter = t2.minFilter, this.texture.magFilter = t2.magFilter;
      let n2 = { uniforms: { tEquirect: { value: null } }, vertexShader: `

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`, fragmentShader: `

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			` }, r2 = new ao(5, 5, 5), i2 = new qo({ name: `CubemapFromEquirect`, uniforms: at(n2.uniforms), vertexShader: n2.vertexShader, fragmentShader: n2.fragmentShader, side: 1, blending: 0 });
      i2.uniforms.tEquirect.value = t2;
      let a2 = new xa(r2, i2), o2 = t2.minFilter;
      return t2.minFilter === 1008 && (t2.minFilter = Ct), new Ls(1, 10, this).update(e4, a2), t2.minFilter = o2, a2.geometry.dispose(), a2.material.dispose(), this;
    }
    clear(e4, t2 = true, n2 = true, r2 = true) {
      let i2 = e4.getRenderTarget();
      for (let i3 = 0; i3 < 6; i3++) e4.setRenderTarget(this, i3), e4.clear(t2, n2, r2);
      e4.setRenderTarget(i2);
    }
  }, Mu = { 1: `LINEAR_TONE_MAPPING`, 2: `REINHARD_TONE_MAPPING`, 3: `CINEON_TONE_MAPPING`, 4: `ACES_FILMIC_TONE_MAPPING`, 6: `AGX_TONE_MAPPING`, 7: `NEUTRAL_TONE_MAPPING`, 5: `CUSTOM_TONE_MAPPING` }, Nu = new vr(), Pu = new no(1, 1), Fu = new Sr(), Iu = new Cr(), Lu = new eo(), Ru = [], zu = [], Bu = new Float32Array(16), Vu = new Float32Array(9), Hu = new Float32Array(4), Uu = class {
    constructor(e4, t2, n2) {
      this.id = e4, this.addr = n2, this.cache = [], this.type = t2.type, this.setValue = tl(t2.type);
    }
  }, Wu = class {
    constructor(e4, t2, n2) {
      this.id = e4, this.addr = n2, this.cache = [], this.type = t2.type, this.size = t2.size, this.setValue = xl(t2.type);
    }
  }, Gu = class {
    constructor(e4) {
      this.id = e4, this.seq = [], this.map = {};
    }
    setValue(e4, t2, n2) {
      let r2 = this.seq;
      for (let i2 = 0, a2 = r2.length; i2 !== a2; ++i2) {
        let a3 = r2[i2];
        a3.setValue(e4, t2[a3.id], n2);
      }
    }
  }, Ku = /(\w+)(\])?(\[|\.)?/g, qu = class {
    constructor(e4, t2) {
      this.seq = [], this.map = {};
      let n2 = e4.getProgramParameter(t2, e4.ACTIVE_UNIFORMS);
      for (let r3 = 0; r3 < n2; ++r3) {
        let n3 = e4.getActiveUniform(t2, r3);
        Cl(n3, e4.getUniformLocation(t2, n3.name), this);
      }
      let r2 = [], i2 = [];
      for (let t3 of this.seq) t3.type === e4.SAMPLER_2D_SHADOW || t3.type === e4.SAMPLER_CUBE_SHADOW || t3.type === e4.SAMPLER_2D_ARRAY_SHADOW ? r2.push(t3) : i2.push(t3);
      r2.length > 0 && (this.seq = r2.concat(i2));
    }
    setValue(e4, t2, n2, r2) {
      let i2 = this.map[t2];
      i2 !== void 0 && i2.setValue(e4, n2, r2);
    }
    setOptional(e4, t2, n2) {
      let r2 = t2[n2];
      r2 !== void 0 && this.setValue(e4, n2, r2);
    }
    static upload(e4, t2, n2, r2) {
      for (let i2 = 0, a2 = t2.length; i2 !== a2; ++i2) {
        let a3 = t2[i2], o2 = n2[a3.id];
        o2.needsUpdate !== false && a3.setValue(e4, o2.value, r2);
      }
    }
    static seqWithValue(e4, t2) {
      let n2 = [];
      for (let r2 = 0, i2 = e4.length; r2 !== i2; ++r2) {
        let i3 = e4[r2];
        i3.id in t2 && n2.push(i3);
      }
      return n2;
    }
  }, Ju = 37297, Yu = 0, Xu = new sr(), Zu = { 1: `Linear`, 2: `Reinhard`, 3: `Cineon`, 4: `ACESFilmic`, 6: `AgX`, 7: `Neutral`, 5: `Custom` }, Qu = new N(), $u = /^[ \t]*#include +<([\w\d./]+)>/gm, ed = /* @__PURE__ */ new Map(), td = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g, nd = { 1: `SHADOWMAP_TYPE_PCF`, 3: `SHADOWMAP_TYPE_VSM` }, rd = { 301: `ENVMAP_TYPE_CUBE`, 302: `ENVMAP_TYPE_CUBE`, 306: `ENVMAP_TYPE_CUBE_UV` }, id = { 302: `ENVMAP_MODE_REFRACTION` }, ad = { 0: `ENVMAP_BLENDING_MULTIPLY`, 1: `ENVMAP_BLENDING_MIX`, 2: `ENVMAP_BLENDING_ADD` }, od = 0, sd = class {
    constructor() {
      this.shaderCache = /* @__PURE__ */ new Map(), this.materialCache = /* @__PURE__ */ new Map();
    }
    update(e4) {
      let t2 = e4.vertexShader, n2 = e4.fragmentShader, r2 = this._getShaderStage(t2), i2 = this._getShaderStage(n2), a2 = this._getShaderCacheForMaterial(e4);
      return a2.has(r2) === false && (a2.add(r2), r2.usedTimes++), a2.has(i2) === false && (a2.add(i2), i2.usedTimes++), this;
    }
    remove(e4) {
      let t2 = this.materialCache.get(e4);
      for (let e5 of t2) e5.usedTimes--, e5.usedTimes === 0 && this.shaderCache.delete(e5.code);
      return this.materialCache.delete(e4), this;
    }
    getVertexShaderID(e4) {
      return this._getShaderStage(e4.vertexShader).id;
    }
    getFragmentShaderID(e4) {
      return this._getShaderStage(e4.fragmentShader).id;
    }
    dispose() {
      this.shaderCache.clear(), this.materialCache.clear();
    }
    _getShaderCacheForMaterial(e4) {
      let t2 = this.materialCache, n2 = t2.get(e4);
      return n2 === void 0 && (n2 = /* @__PURE__ */ new Set(), t2.set(e4, n2)), n2;
    }
    _getShaderStage(e4) {
      let t2 = this.shaderCache, n2 = t2.get(e4);
      return n2 === void 0 && (n2 = new cd(e4), t2.set(e4, n2)), n2;
    }
  }, cd = class {
    constructor(e4) {
      this.id = od++, this.code = e4, this.usedTimes = 0;
    }
  }, ld = 0, ud = `void main() {
	gl_Position = vec4( position, 1.0 );
}`, dd = `uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`, fd = [new N(1, 0, 0), new N(-1, 0, 0), new N(0, 1, 0), new N(0, -1, 0), new N(0, 0, 1), new N(0, 0, -1)], pd = [new N(0, -1, 0), new N(0, -1, 0), new N(0, 0, 1), new N(0, 0, -1), new N(0, -1, 0), new N(0, -1, 0)], md = new wr(), hd = new N(), gd = new N(), _d = `
void main() {

	gl_Position = vec4( position, 1.0 );

}`, vd = `
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`, yd = class {
    constructor() {
      this.texture = null, this.mesh = null, this.depthNear = 0, this.depthFar = 0;
    }
    init(e4, t2) {
      if (this.texture === null) {
        let n2 = new io(e4.texture);
        (e4.depthNear !== t2.depthNear || e4.depthFar !== t2.depthFar) && (this.depthNear = e4.depthNear, this.depthFar = e4.depthFar), this.texture = n2;
      }
    }
    getMesh(e4) {
      if (this.texture !== null && this.mesh === null) {
        let t2 = e4.cameras[0].viewport, n2 = new qo({ vertexShader: _d, fragmentShader: vd, uniforms: { depthColor: { value: this.texture }, depthWidth: { value: t2.z }, depthHeight: { value: t2.w } } });
        this.mesh = new xa(new Bo(20, 20), n2);
      }
      return this.mesh;
    }
    reset() {
      this.texture = null, this.mesh = null;
    }
    getDepthTexture() {
      return this.texture;
    }
  }, bd = class extends Qn {
    constructor(e4, t2) {
      super();
      let n2 = this, r2 = null, i2 = 1, a2 = null, o2 = `local-floor`, s2 = 1, c2 = null, u2 = null, d2 = null, f2 = null, p2 = null, m2 = null, h2 = typeof XRWebGLBinding < `u`, g2 = new yd(), _2 = {}, v2 = t2.getContextAttributes(), y2 = null, b2 = null, x2 = [], S2 = [], C2 = new M(), w2 = null, T2 = new Os();
      T2.viewport = new yr();
      let E2 = new Os();
      E2.viewport = new yr();
      let D2 = [T2, E2], O2 = new Rs(), k2 = null, A2 = null;
      this.cameraAutoUpdate = true, this.enabled = false, this.isPresenting = false, this.getController = function(e5) {
        let t3 = x2[e5];
        return t3 === void 0 && (t3 = new ei(), x2[e5] = t3), t3.getTargetRaySpace();
      }, this.getControllerGrip = function(e5) {
        let t3 = x2[e5];
        return t3 === void 0 && (t3 = new ei(), x2[e5] = t3), t3.getGripSpace();
      }, this.getHand = function(e5) {
        let t3 = x2[e5];
        return t3 === void 0 && (t3 = new ei(), x2[e5] = t3), t3.getHandSpace();
      };
      function ee2(e5) {
        let t3 = S2.indexOf(e5.inputSource);
        if (t3 === -1) return;
        let n3 = x2[t3];
        n3 !== void 0 && (n3.update(e5.inputSource, e5.frame, c2 || a2), n3.dispatchEvent({ type: e5.type, data: e5.inputSource }));
      }
      function te2() {
        r2.removeEventListener(`select`, ee2), r2.removeEventListener(`selectstart`, ee2), r2.removeEventListener(`selectend`, ee2), r2.removeEventListener(`squeeze`, ee2), r2.removeEventListener(`squeezestart`, ee2), r2.removeEventListener(`squeezeend`, ee2), r2.removeEventListener(`end`, te2), r2.removeEventListener(`inputsourceschange`, ne2);
        for (let e5 = 0; e5 < x2.length; e5++) {
          let t3 = S2[e5];
          t3 !== null && (S2[e5] = null, x2[e5].disconnect(t3));
        }
        k2 = null, A2 = null, g2.reset();
        for (let e5 in _2) delete _2[e5];
        e4.setRenderTarget(y2), p2 = null, f2 = null, d2 = null, r2 = null, b2 = null, ue2.stop(), n2.isPresenting = false, e4.setPixelRatio(w2), e4.setSize(C2.width, C2.height, false), n2.dispatchEvent({ type: `sessionend` });
      }
      this.setFramebufferScaleFactor = function(e5) {
        i2 = e5, n2.isPresenting === true && l(`WebXRManager: Cannot change framebuffer scale while presenting.`);
      }, this.setReferenceSpaceType = function(e5) {
        o2 = e5, n2.isPresenting === true && l(`WebXRManager: Cannot change reference space type while presenting.`);
      }, this.getReferenceSpace = function() {
        return c2 || a2;
      }, this.setReferenceSpace = function(e5) {
        c2 = e5;
      }, this.getBaseLayer = function() {
        return f2 === null ? p2 : f2;
      }, this.getBinding = function() {
        return d2 === null && h2 && (d2 = new XRWebGLBinding(r2, t2)), d2;
      }, this.getFrame = function() {
        return m2;
      }, this.getSession = function() {
        return r2;
      }, this.setSession = async function(l2) {
        if (r2 = l2, r2 !== null) {
          if (y2 = e4.getRenderTarget(), r2.addEventListener(`select`, ee2), r2.addEventListener(`selectstart`, ee2), r2.addEventListener(`selectend`, ee2), r2.addEventListener(`squeeze`, ee2), r2.addEventListener(`squeezestart`, ee2), r2.addEventListener(`squeezeend`, ee2), r2.addEventListener(`end`, te2), r2.addEventListener(`inputsourceschange`, ne2), v2.xrCompatible !== true && await t2.makeXRCompatible(), w2 = e4.getPixelRatio(), e4.getSize(C2), h2 && `createProjectionLayer` in XRWebGLBinding.prototype) {
            let n3 = null, a3 = null, o3 = null;
            v2.depth && (o3 = v2.stencil ? t2.DEPTH24_STENCIL8 : t2.DEPTH_COMPONENT24, n3 = v2.stencil ? Ut : Ht, a3 = v2.stencil ? It : jt);
            let s3 = { colorFormat: t2.RGBA8, depthFormat: o3, scaleFactor: i2 };
            d2 = this.getBinding(), f2 = d2.createProjectionLayer(s3), r2.updateRenderState({ layers: [f2] }), e4.setPixelRatio(1), e4.setSize(f2.textureWidth, f2.textureHeight, false), b2 = new xr(f2.textureWidth, f2.textureHeight, { format: Vt, type: Et, depthTexture: new no(f2.textureWidth, f2.textureHeight, a3, void 0, void 0, void 0, void 0, void 0, void 0, n3), stencilBuffer: v2.stencil, colorSpace: e4.outputColorSpace, samples: v2.antialias ? 4 : 0, resolveDepthBuffer: f2.ignoreDepthValues === false, resolveStencilBuffer: f2.ignoreDepthValues === false });
          } else {
            let n3 = { antialias: v2.antialias, alpha: true, depth: v2.depth, stencil: v2.stencil, framebufferScaleFactor: i2 };
            p2 = new XRWebGLLayer(r2, t2, n3), r2.updateRenderState({ baseLayer: p2 }), e4.setPixelRatio(1), e4.setSize(p2.framebufferWidth, p2.framebufferHeight, false), b2 = new xr(p2.framebufferWidth, p2.framebufferHeight, { format: Vt, type: Et, colorSpace: e4.outputColorSpace, stencilBuffer: v2.stencil, resolveDepthBuffer: p2.ignoreDepthValues === false, resolveStencilBuffer: p2.ignoreDepthValues === false });
          }
          b2.isXRRenderTarget = true, this.setFoveation(s2), c2 = null, a2 = await r2.requestReferenceSpace(o2), ue2.setContext(r2), ue2.start(), n2.isPresenting = true, n2.dispatchEvent({ type: `sessionstart` });
        }
      }, this.getEnvironmentBlendMode = function() {
        if (r2 !== null) return r2.environmentBlendMode;
      }, this.getDepthTexture = function() {
        return g2.getDepthTexture();
      };
      function ne2(e5) {
        for (let t3 = 0; t3 < e5.removed.length; t3++) {
          let n3 = e5.removed[t3], r3 = S2.indexOf(n3);
          r3 >= 0 && (S2[r3] = null, x2[r3].disconnect(n3));
        }
        for (let t3 = 0; t3 < e5.added.length; t3++) {
          let n3 = e5.added[t3], r3 = S2.indexOf(n3);
          if (r3 === -1) {
            for (let e6 = 0; e6 < x2.length; e6++) if (e6 >= S2.length) {
              S2.push(n3), r3 = e6;
              break;
            } else if (S2[e6] === null) {
              S2[e6] = n3, r3 = e6;
              break;
            }
            if (r3 === -1) break;
          }
          let i3 = x2[r3];
          i3 && i3.connect(n3);
        }
      }
      let re2 = new N(), ie2 = new N();
      function ae2(e5, t3, n3) {
        re2.setFromMatrixPosition(t3.matrixWorld), ie2.setFromMatrixPosition(n3.matrixWorld);
        let r3 = re2.distanceTo(ie2), i3 = t3.projectionMatrix.elements, a3 = n3.projectionMatrix.elements, o3 = i3[14] / (i3[10] - 1), s3 = i3[14] / (i3[10] + 1), c3 = (i3[9] + 1) / i3[5], l2 = (i3[9] - 1) / i3[5], u3 = (i3[8] - 1) / i3[0], d3 = (a3[8] + 1) / a3[0], f3 = o3 * u3, p3 = o3 * d3, m3 = r3 / (-u3 + d3), h3 = m3 * -u3;
        if (t3.matrixWorld.decompose(e5.position, e5.quaternion, e5.scale), e5.translateX(h3), e5.translateZ(m3), e5.matrixWorld.compose(e5.position, e5.quaternion, e5.scale), e5.matrixWorldInverse.copy(e5.matrixWorld).invert(), i3[10] === -1) e5.projectionMatrix.copy(t3.projectionMatrix), e5.projectionMatrixInverse.copy(t3.projectionMatrixInverse);
        else {
          let t4 = o3 + m3, n4 = s3 + m3, i4 = f3 - h3, a4 = p3 + (r3 - h3), u4 = c3 * s3 / n4 * t4, d4 = l2 * s3 / n4 * t4;
          e5.projectionMatrix.makePerspective(i4, a4, u4, d4, t4, n4), e5.projectionMatrixInverse.copy(e5.projectionMatrix).invert();
        }
      }
      function oe2(e5, t3) {
        t3 === null ? e5.matrixWorld.copy(e5.matrix) : e5.matrixWorld.multiplyMatrices(t3.matrixWorld, e5.matrix), e5.matrixWorldInverse.copy(e5.matrixWorld).invert();
      }
      this.updateCamera = function(e5) {
        if (r2 === null) return;
        let t3 = e5.near, n3 = e5.far;
        g2.texture !== null && (g2.depthNear > 0 && (t3 = g2.depthNear), g2.depthFar > 0 && (n3 = g2.depthFar)), O2.near = E2.near = T2.near = t3, O2.far = E2.far = T2.far = n3, (k2 !== O2.near || A2 !== O2.far) && (r2.updateRenderState({ depthNear: O2.near, depthFar: O2.far }), k2 = O2.near, A2 = O2.far), O2.layers.mask = e5.layers.mask | 6, T2.layers.mask = O2.layers.mask & -5, E2.layers.mask = O2.layers.mask & -3;
        let i3 = e5.parent, a3 = O2.cameras;
        oe2(O2, i3);
        for (let e6 = 0; e6 < a3.length; e6++) oe2(a3[e6], i3);
        a3.length === 2 ? ae2(O2, T2, E2) : O2.projectionMatrix.copy(T2.projectionMatrix), se2(e5, O2, i3);
      };
      function se2(e5, t3, n3) {
        n3 === null ? e5.matrix.copy(t3.matrixWorld) : (e5.matrix.copy(n3.matrixWorld), e5.matrix.invert(), e5.matrix.multiply(t3.matrixWorld)), e5.matrix.decompose(e5.position, e5.quaternion, e5.scale), e5.updateMatrixWorld(true), e5.projectionMatrix.copy(t3.projectionMatrix), e5.projectionMatrixInverse.copy(t3.projectionMatrixInverse), e5.isPerspectiveCamera && (e5.fov = nr * 2 * Math.atan(1 / e5.projectionMatrix.elements[5]), e5.zoom = 1);
      }
      this.getCamera = function() {
        return O2;
      }, this.getFoveation = function() {
        if (!(f2 === null && p2 === null)) return s2;
      }, this.setFoveation = function(e5) {
        s2 = e5, f2 !== null && (f2.fixedFoveation = e5), p2 !== null && p2.fixedFoveation !== void 0 && (p2.fixedFoveation = e5);
      }, this.hasDepthSensing = function() {
        return g2.texture !== null;
      }, this.getDepthSensingMesh = function() {
        return g2.getMesh(O2);
      }, this.getCameraTexture = function(e5) {
        return _2[e5];
      };
      let ce2 = null;
      function le2(t3, i3) {
        if (u2 = i3.getViewerPose(c2 || a2), m2 = i3, u2 !== null) {
          let t4 = u2.views;
          p2 !== null && (e4.setRenderTargetFramebuffer(b2, p2.framebuffer), e4.setRenderTarget(b2));
          let i4 = false;
          t4.length !== O2.cameras.length && (O2.cameras.length = 0, i4 = true);
          for (let n3 = 0; n3 < t4.length; n3++) {
            let r3 = t4[n3], a4 = null;
            if (p2 !== null) a4 = p2.getViewport(r3);
            else {
              let t5 = d2.getViewSubImage(f2, r3);
              a4 = t5.viewport, n3 === 0 && (e4.setRenderTargetTextures(b2, t5.colorTexture, t5.depthStencilTexture), e4.setRenderTarget(b2));
            }
            let o3 = D2[n3];
            o3 === void 0 && (o3 = new Os(), o3.layers.enable(n3), o3.viewport = new yr(), D2[n3] = o3), o3.matrix.fromArray(r3.transform.matrix), o3.matrix.decompose(o3.position, o3.quaternion, o3.scale), o3.projectionMatrix.fromArray(r3.projectionMatrix), o3.projectionMatrixInverse.copy(o3.projectionMatrix).invert(), o3.viewport.set(a4.x, a4.y, a4.width, a4.height), n3 === 0 && (O2.matrix.copy(o3.matrix), O2.matrix.decompose(O2.position, O2.quaternion, O2.scale)), i4 === true && O2.cameras.push(o3);
          }
          let a3 = r2.enabledFeatures;
          if (a3 && a3.includes(`depth-sensing`) && r2.depthUsage == `gpu-optimized` && h2) {
            d2 = n2.getBinding();
            let e5 = d2.getDepthInformation(t4[0]);
            e5 && e5.isValid && e5.texture && g2.init(e5, r2.renderState);
          }
          if (a3 && a3.includes(`camera-access`) && h2) {
            e4.state.unbindTexture(), d2 = n2.getBinding();
            for (let e5 = 0; e5 < t4.length; e5++) {
              let n3 = t4[e5].camera;
              if (n3) {
                let e6 = _2[n3];
                e6 || (e6 = new io(), _2[n3] = e6);
                let t5 = d2.getCameraImage(n3);
                e6.sourceTexture = t5;
              }
            }
          }
        }
        for (let e5 = 0; e5 < x2.length; e5++) {
          let t4 = S2[e5], n3 = x2[e5];
          t4 !== null && n3 !== void 0 && n3.update(t4, i3, c2 || a2);
        }
        ce2 && ce2(t3, i3), i3.detectedPlanes && n2.dispatchEvent({ type: `planesdetected`, data: i3 }), m2 = null;
      }
      let ue2 = new lc();
      ue2.setAnimationLoop(le2), this.setAnimationLoop = function(e5) {
        ce2 = e5;
      }, this.dispose = function() {
      };
    }
  }, xd = new wr(), Sd = new sr(), Sd.set(-1, 0, 0, 0, 1, 0, 0, 0, 1), Cd = new Uint16Array([12469, 15057, 12620, 14925, 13266, 14620, 13807, 14376, 14323, 13990, 14545, 13625, 14713, 13328, 14840, 12882, 14931, 12528, 14996, 12233, 15039, 11829, 15066, 11525, 15080, 11295, 15085, 10976, 15082, 10705, 15073, 10495, 13880, 14564, 13898, 14542, 13977, 14430, 14158, 14124, 14393, 13732, 14556, 13410, 14702, 12996, 14814, 12596, 14891, 12291, 14937, 11834, 14957, 11489, 14958, 11194, 14943, 10803, 14921, 10506, 14893, 10278, 14858, 9960, 14484, 14039, 14487, 14025, 14499, 13941, 14524, 13740, 14574, 13468, 14654, 13106, 14743, 12678, 14818, 12344, 14867, 11893, 14889, 11509, 14893, 11180, 14881, 10751, 14852, 10428, 14812, 10128, 14765, 9754, 14712, 9466, 14764, 13480, 14764, 13475, 14766, 13440, 14766, 13347, 14769, 13070, 14786, 12713, 14816, 12387, 14844, 11957, 14860, 11549, 14868, 11215, 14855, 10751, 14825, 10403, 14782, 10044, 14729, 9651, 14666, 9352, 14599, 9029, 14967, 12835, 14966, 12831, 14963, 12804, 14954, 12723, 14936, 12564, 14917, 12347, 14900, 11958, 14886, 11569, 14878, 11247, 14859, 10765, 14828, 10401, 14784, 10011, 14727, 9600, 14660, 9289, 14586, 8893, 14508, 8533, 15111, 12234, 15110, 12234, 15104, 12216, 15092, 12156, 15067, 12010, 15028, 11776, 14981, 11500, 14942, 11205, 14902, 10752, 14861, 10393, 14812, 9991, 14752, 9570, 14682, 9252, 14603, 8808, 14519, 8445, 14431, 8145, 15209, 11449, 15208, 11451, 15202, 11451, 15190, 11438, 15163, 11384, 15117, 11274, 15055, 10979, 14994, 10648, 14932, 10343, 14871, 9936, 14803, 9532, 14729, 9218, 14645, 8742, 14556, 8381, 14461, 8020, 14365, 7603, 15273, 10603, 15272, 10607, 15267, 10619, 15256, 10631, 15231, 10614, 15182, 10535, 15118, 10389, 15042, 10167, 14963, 9787, 14883, 9447, 14800, 9115, 14710, 8665, 14615, 8318, 14514, 7911, 14411, 7507, 14279, 7198, 15314, 9675, 15313, 9683, 15309, 9712, 15298, 9759, 15277, 9797, 15229, 9773, 15166, 9668, 15084, 9487, 14995, 9274, 14898, 8910, 14800, 8539, 14697, 8234, 14590, 7790, 14479, 7409, 14367, 7067, 14178, 6621, 15337, 8619, 15337, 8631, 15333, 8677, 15325, 8769, 15305, 8871, 15264, 8940, 15202, 8909, 15119, 8775, 15022, 8565, 14916, 8328, 14804, 8009, 14688, 7614, 14569, 7287, 14448, 6888, 14321, 6483, 14088, 6171, 15350, 7402, 15350, 7419, 15347, 7480, 15340, 7613, 15322, 7804, 15287, 7973, 15229, 8057, 15148, 8012, 15046, 7846, 14933, 7611, 14810, 7357, 14682, 7069, 14552, 6656, 14421, 6316, 14251, 5948, 14007, 5528, 15356, 5942, 15356, 5977, 15353, 6119, 15348, 6294, 15332, 6551, 15302, 6824, 15249, 7044, 15171, 7122, 15070, 7050, 14949, 6861, 14818, 6611, 14679, 6349, 14538, 6067, 14398, 5651, 14189, 5311, 13935, 4958, 15359, 4123, 15359, 4153, 15356, 4296, 15353, 4646, 15338, 5160, 15311, 5508, 15263, 5829, 15188, 6042, 15088, 6094, 14966, 6001, 14826, 5796, 14678, 5543, 14527, 5287, 14377, 4985, 14133, 4586, 13869, 4257, 15360, 1563, 15360, 1642, 15358, 2076, 15354, 2636, 15341, 3350, 15317, 4019, 15273, 4429, 15203, 4732, 15105, 4911, 14981, 4932, 14836, 4818, 14679, 4621, 14517, 4386, 14359, 4156, 14083, 3795, 13808, 3437, 15360, 122, 15360, 137, 15358, 285, 15355, 636, 15344, 1274, 15322, 2177, 15281, 2765, 15215, 3223, 15120, 3451, 14995, 3569, 14846, 3567, 14681, 3466, 14511, 3305, 14344, 3121, 14037, 2800, 13753, 2467, 15360, 0, 15360, 1, 15359, 21, 15355, 89, 15346, 253, 15325, 479, 15287, 796, 15225, 1148, 15133, 1492, 15008, 1749, 14856, 1882, 14685, 1886, 14506, 1783, 14324, 1608, 13996, 1398, 13702, 1183]), wd = null, Td = class {
    constructor(e4 = {}) {
      let { canvas: t2 = o(), context: n2 = null, depth: r2 = true, stencil: i2 = false, alpha: a2 = false, antialias: c2 = false, premultipliedAlpha: d2 = true, preserveDrawingBuffer: p2 = false, powerPreference: m2 = `default`, failIfMajorPerformanceCaveat: h2 = false, reversedDepthBuffer: g2 = false, outputBufferType: _2 = Et } = e4;
      this.isWebGLRenderer = true;
      let v2;
      if (n2 !== null) {
        if (typeof WebGLRenderingContext < `u` && n2 instanceof WebGLRenderingContext) throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);
        v2 = n2.getContextAttributes().alpha;
      } else v2 = a2;
      let y2 = _2, b2 = /* @__PURE__ */ new Set([Jt, qt, Gt]), x2 = /* @__PURE__ */ new Set([Et, jt, kt, It, Pt, Ft]), S2 = new Uint32Array(4), C2 = new Int32Array(4), w2 = new N(), T2 = null, E2 = null, D2 = [], O2 = [], k2 = null;
      this.domElement = t2, this.debug = { checkShaderErrors: true, onShaderError: null }, this.autoClear = true, this.autoClearColor = true, this.autoClearDepth = true, this.autoClearStencil = true, this.sortObjects = true, this.clippingPlanes = [], this.localClippingEnabled = false, this.toneMapping = 0, this.toneMappingExposure = 1, this.transmissionResolutionScale = 1;
      let A2 = this, ee2 = false, te2 = null;
      this._outputColorSpace = Vn;
      let ne2 = 0, re2 = 0, ie2 = null, ae2 = -1, oe2 = null, se2 = new yr(), ce2 = new yr(), le2 = null, ue2 = new P(0), de2 = 0, fe2 = t2.width, pe2 = t2.height, me2 = 1, he2 = null, ge2 = null, _e2 = new yr(0, 0, fe2, pe2), ve2 = new yr(0, 0, fe2, pe2), ye2 = false, be2 = new $a(), xe2 = false, Se2 = false, Ce2 = new wr(), we2 = new N(), Te2 = new yr(), Ee2 = { background: null, fog: null, environment: null, overrideMaterial: null, isScene: true }, De2 = false;
      function Oe2() {
        return ie2 === null ? me2 : 1;
      }
      let j2 = n2;
      function ke2(e5, n3) {
        return t2.getContext(e5, n3);
      }
      try {
        let e5 = { alpha: true, depth: r2, stencil: i2, antialias: c2, premultipliedAlpha: d2, preserveDrawingBuffer: p2, powerPreference: m2, failIfMajorPerformanceCaveat: h2 };
        if (`setAttribute` in t2 && t2.setAttribute(`data-engine`, `three.js r184`), t2.addEventListener(`webglcontextlost`, tt2, false), t2.addEventListener(`webglcontextrestored`, nt2, false), t2.addEventListener(`webglcontextcreationerror`, rt2, false), j2 === null) {
          let t3 = `webgl2`;
          if (j2 = ke2(t3, e5), j2 === null) throw ke2(t3) ? Error(`Error creating WebGL context with your selected attributes.`) : Error(`Error creating WebGL context.`);
        }
      } catch (e5) {
        throw u(`WebGLRenderer: ` + e5.message), e5;
      }
      let Ae2, je2, Me2, Ne2, Pe2, Fe2, Ie2, Le2, Re2, ze2, Be2, Ve2, He2, Ue2, We2, Ge2, Ke2, qe2, Je2, Ye2, Xe2, Ze2, Qe2;
      function $e2() {
        Ae2 = new Tc(j2), Ae2.init(), Xe2 = new uu(j2, Ae2), je2 = new mc(j2, Ae2, e4, Xe2), Me2 = new cu(j2, Ae2), je2.reversedDepthBuffer && g2 && Me2.buffers.depth.setReversed(true), Ne2 = new Oc(j2), Pe2 = new Xl(), Fe2 = new lu(j2, Ae2, Me2, Pe2, je2, Xe2, Ne2), Ie2 = new wc(A2), Le2 = new uc(j2), Ze2 = new fc(j2, Le2), Re2 = new Ec(j2, Le2, Ne2, Ze2), ze2 = new Ac(j2, Re2, Le2, Ze2, Ne2), qe2 = new kc(j2, je2, Fe2), We2 = new hc(Pe2), Be2 = new Yl(A2, Ie2, Ae2, je2, Ze2, We2), Ve2 = new du(A2, Pe2), He2 = new eu(), Ue2 = new ou(Ae2), Ke2 = new dc(A2, Ie2, Me2, ze2, v2, d2), Ge2 = new su(A2, ze2, je2), Qe2 = new fu(j2, Ne2, je2, Me2), Je2 = new pc(j2, Ae2, Ne2), Ye2 = new Dc(j2, Ae2, Ne2), Ne2.programs = Be2.programs, A2.capabilities = je2, A2.extensions = Ae2, A2.properties = Pe2, A2.renderLists = He2, A2.shadowMap = Ge2, A2.state = Me2, A2.info = Ne2;
      }
      $e2(), y2 !== 1009 && (k2 = new jc(y2, t2.width, t2.height, r2, i2));
      let et2 = new bd(A2, j2);
      this.xr = et2, this.getContext = function() {
        return j2;
      }, this.getContextAttributes = function() {
        return j2.getContextAttributes();
      }, this.forceContextLoss = function() {
        let e5 = Ae2.get(`WEBGL_lose_context`);
        e5 && e5.loseContext();
      }, this.forceContextRestore = function() {
        let e5 = Ae2.get(`WEBGL_lose_context`);
        e5 && e5.restoreContext();
      }, this.getPixelRatio = function() {
        return me2;
      }, this.setPixelRatio = function(e5) {
        e5 !== void 0 && (me2 = e5, this.setSize(fe2, pe2, false));
      }, this.getSize = function(e5) {
        return e5.set(fe2, pe2);
      }, this.setSize = function(e5, n3, r3 = true) {
        if (et2.isPresenting) {
          l(`WebGLRenderer: Can't change size while VR device is presenting.`);
          return;
        }
        fe2 = e5, pe2 = n3, t2.width = Math.floor(e5 * me2), t2.height = Math.floor(n3 * me2), r3 === true && (t2.style.width = e5 + `px`, t2.style.height = n3 + `px`), k2 !== null && k2.setSize(t2.width, t2.height), this.setViewport(0, 0, e5, n3);
      }, this.getDrawingBufferSize = function(e5) {
        return e5.set(fe2 * me2, pe2 * me2).floor();
      }, this.setDrawingBufferSize = function(e5, n3, r3) {
        fe2 = e5, pe2 = n3, me2 = r3, t2.width = Math.floor(e5 * r3), t2.height = Math.floor(n3 * r3), this.setViewport(0, 0, e5, n3);
      }, this.setEffects = function(e5) {
        if (y2 === 1009) {
          u(`THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);
          return;
        }
        if (e5) {
          for (let t3 = 0; t3 < e5.length; t3++) if (e5[t3].isOutputPass === true) {
            l(`THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);
            break;
          }
        }
        k2.setEffects(e5 || []);
      }, this.getCurrentViewport = function(e5) {
        return e5.copy(se2);
      }, this.getViewport = function(e5) {
        return e5.copy(_e2);
      }, this.setViewport = function(e5, t3, n3, r3) {
        e5.isVector4 ? _e2.set(e5.x, e5.y, e5.z, e5.w) : _e2.set(e5, t3, n3, r3), Me2.viewport(se2.copy(_e2).multiplyScalar(me2).round());
      }, this.getScissor = function(e5) {
        return e5.copy(ve2);
      }, this.setScissor = function(e5, t3, n3, r3) {
        e5.isVector4 ? ve2.set(e5.x, e5.y, e5.z, e5.w) : ve2.set(e5, t3, n3, r3), Me2.scissor(ce2.copy(ve2).multiplyScalar(me2).round());
      }, this.getScissorTest = function() {
        return ye2;
      }, this.setScissorTest = function(e5) {
        Me2.setScissorTest(ye2 = e5);
      }, this.setOpaqueSort = function(e5) {
        he2 = e5;
      }, this.setTransparentSort = function(e5) {
        ge2 = e5;
      }, this.getClearColor = function(e5) {
        return e5.copy(Ke2.getClearColor());
      }, this.setClearColor = function() {
        Ke2.setClearColor(...arguments);
      }, this.getClearAlpha = function() {
        return Ke2.getClearAlpha();
      }, this.setClearAlpha = function() {
        Ke2.setClearAlpha(...arguments);
      }, this.clear = function(e5 = true, t3 = true, n3 = true) {
        let r3 = 0;
        if (e5) {
          let e6 = false;
          if (ie2 !== null) {
            let t4 = ie2.texture.format;
            e6 = b2.has(t4);
          }
          if (e6) {
            let e7 = ie2.texture.type, t4 = x2.has(e7), n4 = Ke2.getClearColor(), r4 = Ke2.getClearAlpha(), i3 = n4.r, a3 = n4.g, o2 = n4.b;
            t4 ? (S2[0] = i3, S2[1] = a3, S2[2] = o2, S2[3] = r4, j2.clearBufferuiv(j2.COLOR, 0, S2)) : (C2[0] = i3, C2[1] = a3, C2[2] = o2, C2[3] = r4, j2.clearBufferiv(j2.COLOR, 0, C2));
          } else r3 |= j2.COLOR_BUFFER_BIT;
        }
        t3 && (r3 |= j2.DEPTH_BUFFER_BIT, this.state.buffers.depth.setMask(true)), n3 && (r3 |= j2.STENCIL_BUFFER_BIT, this.state.buffers.stencil.setMask(4294967295)), r3 !== 0 && j2.clear(r3);
      }, this.clearColor = function() {
        this.clear(true, false, false);
      }, this.clearDepth = function() {
        this.clear(false, true, false);
      }, this.clearStencil = function() {
        this.clear(false, false, true);
      }, this.setNodesHandler = function(e5) {
        e5.setRenderer(this), te2 = e5;
      }, this.dispose = function() {
        t2.removeEventListener(`webglcontextlost`, tt2, false), t2.removeEventListener(`webglcontextrestored`, nt2, false), t2.removeEventListener(`webglcontextcreationerror`, rt2, false), Ke2.dispose(), He2.dispose(), Ue2.dispose(), Pe2.dispose(), Ie2.dispose(), ze2.dispose(), Ze2.dispose(), Qe2.dispose(), Be2.dispose(), et2.dispose(), et2.removeEventListener(`sessionstart`, ut2), et2.removeEventListener(`sessionend`, dt2), ft2.stop();
      };
      function tt2(e5) {
        e5.preventDefault(), s(`WebGLRenderer: Context Lost.`), ee2 = true;
      }
      function nt2() {
        s(`WebGLRenderer: Context Restored.`), ee2 = false;
        let e5 = Ne2.autoReset, t3 = Ge2.enabled, n3 = Ge2.autoUpdate, r3 = Ge2.needsUpdate, i3 = Ge2.type;
        $e2(), Ne2.autoReset = e5, Ge2.enabled = t3, Ge2.autoUpdate = n3, Ge2.needsUpdate = r3, Ge2.type = i3;
      }
      function rt2(e5) {
        u(`WebGLRenderer: A WebGL context could not be created. Reason: `, e5.statusMessage);
      }
      function it2(e5) {
        let t3 = e5.target;
        t3.removeEventListener(`dispose`, it2), at2(t3);
      }
      function at2(e5) {
        ot2(e5), Pe2.remove(e5);
      }
      function ot2(e5) {
        let t3 = Pe2.get(e5).programs;
        t3 !== void 0 && (t3.forEach(function(e6) {
          Be2.releaseProgram(e6);
        }), e5.isShaderMaterial && Be2.releaseShaderCache(e5));
      }
      this.renderBufferDirect = function(e5, t3, n3, r3, i3, a3) {
        t3 === null && (t3 = Ee2);
        let o2 = i3.isMesh && i3.matrixWorld.determinant() < 0, s2 = St2(e5, t3, n3, r3, i3);
        Me2.setMaterial(r3, o2);
        let c3 = n3.index, l2 = 1;
        if (r3.wireframe === true) {
          if (c3 = Re2.getWireframeAttribute(n3), c3 === void 0) return;
          l2 = 2;
        }
        let u2 = n3.drawRange, d3 = n3.attributes.position, f2 = u2.start * l2, p3 = (u2.start + u2.count) * l2;
        a3 !== null && (f2 = Math.max(f2, a3.start * l2), p3 = Math.min(p3, (a3.start + a3.count) * l2)), c3 === null ? d3 != null && (f2 = Math.max(f2, 0), p3 = Math.min(p3, d3.count)) : (f2 = Math.max(f2, 0), p3 = Math.min(p3, c3.count));
        let m3 = p3 - f2;
        if (m3 < 0 || m3 === 1 / 0) return;
        Ze2.setup(i3, r3, s2, n3, c3);
        let h3, g3 = Je2;
        if (c3 !== null && (h3 = Le2.get(c3), g3 = Ye2, g3.setIndex(h3)), i3.isMesh) r3.wireframe === true ? (Me2.setLineWidth(r3.wireframeLinewidth * Oe2()), g3.setMode(j2.LINES)) : g3.setMode(j2.TRIANGLES);
        else if (i3.isLine) {
          let e6 = r3.linewidth;
          e6 === void 0 && (e6 = 1), Me2.setLineWidth(e6 * Oe2()), i3.isLineSegments ? g3.setMode(j2.LINES) : i3.isLineLoop ? g3.setMode(j2.LINE_LOOP) : g3.setMode(j2.LINE_STRIP);
        } else i3.isPoints ? g3.setMode(j2.POINTS) : i3.isSprite && g3.setMode(j2.TRIANGLES);
        if (i3.isBatchedMesh) if (Ae2.get(`WEBGL_multi_draw`)) g3.renderMultiDraw(i3._multiDrawStarts, i3._multiDrawCounts, i3._multiDrawCount);
        else {
          let e6 = i3._multiDrawStarts, t4 = i3._multiDrawCounts, n4 = i3._multiDrawCount, a4 = c3 ? Le2.get(c3).bytesPerElement : 1, o3 = Pe2.get(r3).currentProgram.getUniforms();
          for (let r4 = 0; r4 < n4; r4++) o3.setValue(j2, `_gl_DrawID`, r4), g3.render(e6[r4] / a4, t4[r4]);
        }
        else if (i3.isInstancedMesh) g3.renderInstances(f2, m3, i3.count);
        else if (n3.isInstancedBufferGeometry) {
          let e6 = n3._maxInstanceCount === void 0 ? 1 / 0 : n3._maxInstanceCount, t4 = Math.min(n3.instanceCount, e6);
          g3.renderInstances(f2, m3, t4);
        } else g3.render(f2, m3);
      };
      function st2(e5, t3, n3) {
        e5.transparent === true && e5.side === 2 && e5.forceSinglePass === false ? (e5.side = 1, e5.needsUpdate = true, vt2(e5, t3, n3), e5.side = 0, e5.needsUpdate = true, vt2(e5, t3, n3), e5.side = 2) : vt2(e5, t3, n3);
      }
      this.compile = function(e5, t3, n3 = null) {
        n3 === null && (n3 = e5), E2 = Ue2.get(n3), E2.init(t3), O2.push(E2), n3.traverseVisible(function(e6) {
          e6.isLight && e6.layers.test(t3.layers) && (E2.pushLight(e6), e6.castShadow && E2.pushShadow(e6));
        }), e5 !== n3 && e5.traverseVisible(function(e6) {
          e6.isLight && e6.layers.test(t3.layers) && (E2.pushLight(e6), e6.castShadow && E2.pushShadow(e6));
        }), E2.setupLights();
        let r3 = /* @__PURE__ */ new Set();
        return e5.traverse(function(e6) {
          if (!(e6.isMesh || e6.isPoints || e6.isLine || e6.isSprite)) return;
          let t4 = e6.material;
          if (t4) if (Array.isArray(t4)) for (let i3 = 0; i3 < t4.length; i3++) {
            let a3 = t4[i3];
            st2(a3, n3, e6), r3.add(a3);
          }
          else st2(t4, n3, e6), r3.add(t4);
        }), E2 = O2.pop(), r3;
      }, this.compileAsync = function(e5, t3, n3 = null) {
        let r3 = this.compile(e5, t3, n3);
        return new Promise((t4) => {
          function n4() {
            if (r3.forEach(function(e6) {
              Pe2.get(e6).currentProgram.isReady() && r3.delete(e6);
            }), r3.size === 0) {
              t4(e5);
              return;
            }
            setTimeout(n4, 10);
          }
          Ae2.get(`KHR_parallel_shader_compile`) === null ? setTimeout(n4, 10) : n4();
        });
      };
      let ct2 = null;
      function lt2(e5) {
        ct2 && ct2(e5);
      }
      function ut2() {
        ft2.stop();
      }
      function dt2() {
        ft2.start();
      }
      let ft2 = new lc();
      ft2.setAnimationLoop(lt2), typeof self < `u` && ft2.setContext(self), this.setAnimationLoop = function(e5) {
        ct2 = e5, et2.setAnimationLoop(e5), e5 === null ? ft2.stop() : ft2.start();
      }, et2.addEventListener(`sessionstart`, ut2), et2.addEventListener(`sessionend`, dt2), this.render = function(e5, t3) {
        if (t3 !== void 0 && t3.isCamera !== true) {
          u(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);
          return;
        }
        if (ee2 === true) return;
        te2 !== null && te2.renderStart(e5, t3);
        let n3 = et2.enabled === true && et2.isPresenting === true, r3 = k2 !== null && (ie2 === null || n3) && k2.begin(A2, ie2);
        if (e5.matrixWorldAutoUpdate === true && e5.updateMatrixWorld(), t3.parent === null && t3.matrixWorldAutoUpdate === true && t3.updateMatrixWorld(), et2.enabled === true && et2.isPresenting === true && (k2 === null || k2.isCompositing() === false) && (et2.cameraAutoUpdate === true && et2.updateCamera(t3), t3 = et2.getCamera()), e5.isScene === true && e5.onBeforeRender(A2, e5, t3, ie2), E2 = Ue2.get(e5, O2.length), E2.init(t3), E2.state.textureUnits = Fe2.getTextureUnits(), O2.push(E2), Ce2.multiplyMatrices(t3.projectionMatrix, t3.matrixWorldInverse), be2.setFromProjectionMatrix(Ce2, Jn, t3.reversedDepth), Se2 = this.localClippingEnabled, xe2 = We2.init(this.clippingPlanes, Se2), T2 = He2.get(e5, D2.length), T2.init(), D2.push(T2), et2.enabled === true && et2.isPresenting === true) {
          let e6 = A2.xr.getDepthSensingMesh();
          e6 !== null && pt2(e6, t3, -1 / 0, A2.sortObjects);
        }
        pt2(e5, t3, 0, A2.sortObjects), T2.finish(), A2.sortObjects === true && T2.sort(he2, ge2), De2 = et2.enabled === false || et2.isPresenting === false || et2.hasDepthSensing() === false, De2 && Ke2.addToRenderList(T2, e5), this.info.render.frame++, xe2 === true && We2.beginShadows();
        let i3 = E2.state.shadowsArray;
        if (Ge2.render(i3, e5, t3), xe2 === true && We2.endShadows(), this.info.autoReset === true && this.info.reset(), (r3 && k2.hasRenderPass()) === false) {
          let n4 = T2.opaque, r4 = T2.transmissive;
          if (E2.setupLights(), t3.isArrayCamera) {
            let i4 = t3.cameras;
            if (r4.length > 0) for (let t4 = 0, a3 = i4.length; t4 < a3; t4++) {
              let a4 = i4[t4];
              ht2(n4, r4, e5, a4);
            }
            De2 && Ke2.render(e5);
            for (let t4 = 0, n5 = i4.length; t4 < n5; t4++) {
              let n6 = i4[t4];
              mt2(T2, e5, n6, n6.viewport);
            }
          } else r4.length > 0 && ht2(n4, r4, e5, t3), De2 && Ke2.render(e5), mt2(T2, e5, t3);
        }
        ie2 !== null && re2 === 0 && (Fe2.updateMultisampleRenderTarget(ie2), Fe2.updateRenderTargetMipmap(ie2)), r3 && k2.end(A2), e5.isScene === true && e5.onAfterRender(A2, e5, t3), Ze2.resetDefaultState(), ae2 = -1, oe2 = null, O2.pop(), O2.length > 0 ? (E2 = O2[O2.length - 1], Fe2.setTextureUnits(E2.state.textureUnits), xe2 === true && We2.setGlobalState(A2.clippingPlanes, E2.state.camera)) : E2 = null, D2.pop(), T2 = D2.length > 0 ? D2[D2.length - 1] : null, te2 !== null && te2.renderEnd();
      };
      function pt2(e5, t3, n3, r3) {
        if (e5.visible === false) return;
        if (e5.layers.test(t3.layers)) {
          if (e5.isGroup) n3 = e5.renderOrder;
          else if (e5.isLOD) e5.autoUpdate === true && e5.update(t3);
          else if (e5.isLightProbeGrid) E2.pushLightProbeGrid(e5);
          else if (e5.isLight) E2.pushLight(e5), e5.castShadow && E2.pushShadow(e5);
          else if (e5.isSprite) {
            if (!e5.frustumCulled || be2.intersectsSprite(e5)) {
              r3 && Te2.setFromMatrixPosition(e5.matrixWorld).applyMatrix4(Ce2);
              let t4 = ze2.update(e5), i4 = e5.material;
              i4.visible && T2.push(e5, t4, i4, n3, Te2.z, null);
            }
          } else if ((e5.isMesh || e5.isLine || e5.isPoints) && (!e5.frustumCulled || be2.intersectsObject(e5))) {
            let t4 = ze2.update(e5), i4 = e5.material;
            if (r3 && (e5.boundingSphere === void 0 ? (t4.boundingSphere === null && t4.computeBoundingSphere(), Te2.copy(t4.boundingSphere.center)) : (e5.boundingSphere === null && e5.computeBoundingSphere(), Te2.copy(e5.boundingSphere.center)), Te2.applyMatrix4(e5.matrixWorld).applyMatrix4(Ce2)), Array.isArray(i4)) {
              let r4 = t4.groups;
              for (let a3 = 0, o2 = r4.length; a3 < o2; a3++) {
                let o3 = r4[a3], s2 = i4[o3.materialIndex];
                s2 && s2.visible && T2.push(e5, t4, s2, n3, Te2.z, o3);
              }
            } else i4.visible && T2.push(e5, t4, i4, n3, Te2.z, null);
          }
        }
        let i3 = e5.children;
        for (let e6 = 0, a3 = i3.length; e6 < a3; e6++) pt2(i3[e6], t3, n3, r3);
      }
      function mt2(e5, t3, n3, r3) {
        let { opaque: i3, transmissive: a3, transparent: o2 } = e5;
        E2.setupLightsView(n3), xe2 === true && We2.setGlobalState(A2.clippingPlanes, n3), r3 && Me2.viewport(se2.copy(r3)), i3.length > 0 && gt2(i3, t3, n3), a3.length > 0 && gt2(a3, t3, n3), o2.length > 0 && gt2(o2, t3, n3), Me2.buffers.depth.setTest(true), Me2.buffers.depth.setMask(true), Me2.buffers.color.setMask(true), Me2.setPolygonOffset(false);
      }
      function ht2(e5, t3, n3, r3) {
        if ((n3.isScene === true ? n3.overrideMaterial : null) !== null) return;
        if (E2.state.transmissionRenderTarget[r3.id] === void 0) {
          let e6 = Ae2.has(`EXT_color_buffer_half_float`) || Ae2.has(`EXT_color_buffer_float`);
          E2.state.transmissionRenderTarget[r3.id] = new xr(1, 1, { generateMipmaps: true, type: e6 ? Nt : Et, minFilter: Tt, samples: Math.max(4, je2.samples), stencilBuffer: i2, resolveDepthBuffer: false, resolveStencilBuffer: false, colorSpace: dr.workingColorSpace });
        }
        let a3 = E2.state.transmissionRenderTarget[r3.id], o2 = r3.viewport || se2;
        a3.setSize(o2.z * A2.transmissionResolutionScale, o2.w * A2.transmissionResolutionScale);
        let s2 = A2.getRenderTarget(), c3 = A2.getActiveCubeFace(), l2 = A2.getActiveMipmapLevel();
        A2.setRenderTarget(a3), A2.getClearColor(ue2), de2 = A2.getClearAlpha(), de2 < 1 && A2.setClearColor(16777215, 0.5), A2.clear(), De2 && Ke2.render(n3);
        let u2 = A2.toneMapping;
        A2.toneMapping = 0;
        let d3 = r3.viewport;
        if (r3.viewport !== void 0 && (r3.viewport = void 0), E2.setupLightsView(r3), xe2 === true && We2.setGlobalState(A2.clippingPlanes, r3), gt2(e5, n3, r3), Fe2.updateMultisampleRenderTarget(a3), Fe2.updateRenderTargetMipmap(a3), Ae2.has(`WEBGL_multisampled_render_to_texture`) === false) {
          let e6 = false;
          for (let i3 = 0, a4 = t3.length; i3 < a4; i3++) {
            let { object: a5, geometry: o3, material: s3, group: c4 } = t3[i3];
            if (s3.side === 2 && a5.layers.test(r3.layers)) {
              let t4 = s3.side;
              s3.side = 1, s3.needsUpdate = true, _t2(a5, n3, r3, o3, s3, c4), s3.side = t4, s3.needsUpdate = true, e6 = true;
            }
          }
          e6 === true && (Fe2.updateMultisampleRenderTarget(a3), Fe2.updateRenderTargetMipmap(a3));
        }
        A2.setRenderTarget(s2, c3, l2), A2.setClearColor(ue2, de2), d3 !== void 0 && (r3.viewport = d3), A2.toneMapping = u2;
      }
      function gt2(e5, t3, n3) {
        let r3 = t3.isScene === true ? t3.overrideMaterial : null;
        for (let i3 = 0, a3 = e5.length; i3 < a3; i3++) {
          let a4 = e5[i3], { object: o2, geometry: s2, group: c3 } = a4, l2 = a4.material;
          l2.allowOverride === true && r3 !== null && (l2 = r3), o2.layers.test(n3.layers) && _t2(o2, t3, n3, s2, l2, c3);
        }
      }
      function _t2(e5, t3, n3, r3, i3, a3) {
        e5.onBeforeRender(A2, t3, n3, r3, i3, a3), e5.modelViewMatrix.multiplyMatrices(n3.matrixWorldInverse, e5.matrixWorld), e5.normalMatrix.getNormalMatrix(e5.modelViewMatrix), i3.onBeforeRender(A2, t3, n3, r3, e5, a3), i3.transparent === true && i3.side === 2 && i3.forceSinglePass === false ? (i3.side = 1, i3.needsUpdate = true, A2.renderBufferDirect(n3, t3, r3, i3, e5, a3), i3.side = 0, i3.needsUpdate = true, A2.renderBufferDirect(n3, t3, r3, i3, e5, a3), i3.side = 2) : A2.renderBufferDirect(n3, t3, r3, i3, e5, a3), e5.onAfterRender(A2, t3, n3, r3, i3, a3);
      }
      function vt2(e5, t3, n3) {
        t3.isScene !== true && (t3 = Ee2);
        let r3 = Pe2.get(e5), i3 = E2.state.lights, a3 = E2.state.shadowsArray, o2 = i3.state.version, s2 = Be2.getParameters(e5, i3.state, a3, t3, n3, E2.state.lightProbeGridArray), c3 = Be2.getProgramCacheKey(s2), l2 = r3.programs;
        r3.environment = e5.isMeshStandardMaterial || e5.isMeshLambertMaterial || e5.isMeshPhongMaterial ? t3.environment : null, r3.fog = t3.fog;
        let u2 = e5.isMeshStandardMaterial || e5.isMeshLambertMaterial && !e5.envMap || e5.isMeshPhongMaterial && !e5.envMap;
        r3.envMap = Ie2.get(e5.envMap || r3.environment, u2), r3.envMapRotation = r3.environment !== null && e5.envMap === null ? t3.environmentRotation : e5.envMapRotation, l2 === void 0 && (e5.addEventListener(`dispose`, it2), l2 = /* @__PURE__ */ new Map(), r3.programs = l2);
        let d3 = l2.get(c3);
        if (d3 !== void 0) {
          if (r3.currentProgram === d3 && r3.lightsStateVersion === o2) return bt2(e5, s2), d3;
        } else s2.uniforms = Be2.getUniforms(e5), te2 !== null && e5.isNodeMaterial && te2.build(e5, n3, s2), e5.onBeforeCompile(s2, A2), d3 = Be2.acquireProgram(s2, c3), l2.set(c3, d3), r3.uniforms = s2.uniforms;
        let f2 = r3.uniforms;
        return (!e5.isShaderMaterial && !e5.isRawShaderMaterial || e5.clipping === true) && (f2.clippingPlanes = We2.uniform), bt2(e5, s2), r3.needsLights = wt2(e5), r3.lightsStateVersion = o2, r3.needsLights && (f2.ambientLightColor.value = i3.state.ambient, f2.lightProbe.value = i3.state.probe, f2.directionalLights.value = i3.state.directional, f2.directionalLightShadows.value = i3.state.directionalShadow, f2.spotLights.value = i3.state.spot, f2.spotLightShadows.value = i3.state.spotShadow, f2.rectAreaLights.value = i3.state.rectArea, f2.ltc_1.value = i3.state.rectAreaLTC1, f2.ltc_2.value = i3.state.rectAreaLTC2, f2.pointLights.value = i3.state.point, f2.pointLightShadows.value = i3.state.pointShadow, f2.hemisphereLights.value = i3.state.hemi, f2.directionalShadowMatrix.value = i3.state.directionalShadowMatrix, f2.spotLightMatrix.value = i3.state.spotLightMatrix, f2.spotLightMap.value = i3.state.spotLightMap, f2.pointShadowMatrix.value = i3.state.pointShadowMatrix), r3.lightProbeGrid = E2.state.lightProbeGridArray.length > 0, r3.currentProgram = d3, r3.uniformsList = null, d3;
      }
      function yt2(e5) {
        if (e5.uniformsList === null) {
          let t3 = e5.currentProgram.getUniforms();
          e5.uniformsList = qu.seqWithValue(t3.seq, e5.uniforms);
        }
        return e5.uniformsList;
      }
      function bt2(e5, t3) {
        let n3 = Pe2.get(e5);
        n3.outputColorSpace = t3.outputColorSpace, n3.batching = t3.batching, n3.batchingColor = t3.batchingColor, n3.instancing = t3.instancing, n3.instancingColor = t3.instancingColor, n3.instancingMorph = t3.instancingMorph, n3.skinning = t3.skinning, n3.morphTargets = t3.morphTargets, n3.morphNormals = t3.morphNormals, n3.morphColors = t3.morphColors, n3.morphTargetsCount = t3.morphTargetsCount, n3.numClippingPlanes = t3.numClippingPlanes, n3.numIntersection = t3.numClipIntersection, n3.vertexAlphas = t3.vertexAlphas, n3.vertexTangents = t3.vertexTangents, n3.toneMapping = t3.toneMapping;
      }
      function xt2(e5, t3) {
        if (e5.length === 0) return null;
        if (e5.length === 1) return e5[0].texture === null ? null : e5[0];
        w2.setFromMatrixPosition(t3.matrixWorld);
        for (let t4 = 0, n3 = e5.length; t4 < n3; t4++) {
          let n4 = e5[t4];
          if (n4.texture !== null && n4.boundingBox.containsPoint(w2)) return n4;
        }
        return null;
      }
      function St2(e5, t3, n3, r3, i3) {
        t3.isScene !== true && (t3 = Ee2), Fe2.resetTextureUnits();
        let a3 = t3.fog, o2 = r3.isMeshStandardMaterial || r3.isMeshLambertMaterial || r3.isMeshPhongMaterial ? t3.environment : null, s2 = ie2 === null ? A2.outputColorSpace : ie2.isXRRenderTarget === true ? ie2.texture.colorSpace : dr.workingColorSpace, c3 = r3.isMeshStandardMaterial || r3.isMeshLambertMaterial && !r3.envMap || r3.isMeshPhongMaterial && !r3.envMap, l2 = Ie2.get(r3.envMap || o2, c3), u2 = r3.vertexColors === true && !!n3.attributes.color && n3.attributes.color.itemSize === 4, d3 = !!n3.attributes.tangent && (!!r3.normalMap || r3.anisotropy > 0), f2 = !!n3.morphAttributes.position, p3 = !!n3.morphAttributes.normal, m3 = !!n3.morphAttributes.color, h3 = 0;
        r3.toneMapped && (ie2 === null || ie2.isXRRenderTarget === true) && (h3 = A2.toneMapping);
        let g3 = n3.morphAttributes.position || n3.morphAttributes.normal || n3.morphAttributes.color, _3 = g3 === void 0 ? 0 : g3.length, v3 = Pe2.get(r3), y3 = E2.state.lights;
        if (xe2 === true && (Se2 === true || e5 !== oe2)) {
          let t4 = e5 === oe2 && r3.id === ae2;
          We2.setState(r3, e5, t4);
        }
        let b3 = false;
        r3.version === v3.__version ? v3.needsLights && v3.lightsStateVersion !== y3.state.version ? b3 = true : v3.outputColorSpace === s2 ? i3.isBatchedMesh && v3.batching === false || !i3.isBatchedMesh && v3.batching === true || i3.isBatchedMesh && v3.batchingColor === true && i3.colorTexture === null || i3.isBatchedMesh && v3.batchingColor === false && i3.colorTexture !== null || i3.isInstancedMesh && v3.instancing === false || !i3.isInstancedMesh && v3.instancing === true || i3.isSkinnedMesh && v3.skinning === false || !i3.isSkinnedMesh && v3.skinning === true || i3.isInstancedMesh && v3.instancingColor === true && i3.instanceColor === null || i3.isInstancedMesh && v3.instancingColor === false && i3.instanceColor !== null || i3.isInstancedMesh && v3.instancingMorph === true && i3.morphTexture === null || i3.isInstancedMesh && v3.instancingMorph === false && i3.morphTexture !== null ? b3 = true : v3.envMap === l2 ? r3.fog === true && v3.fog !== a3 || v3.numClippingPlanes !== void 0 && (v3.numClippingPlanes !== We2.numPlanes || v3.numIntersection !== We2.numIntersection) ? b3 = true : v3.vertexAlphas === u2 && v3.vertexTangents === d3 && v3.morphTargets === f2 && v3.morphNormals === p3 && v3.morphColors === m3 && v3.toneMapping === h3 && v3.morphTargetsCount === _3 ? !!v3.lightProbeGrid != E2.state.lightProbeGridArray.length > 0 && (b3 = true) : b3 = true : b3 = true : b3 = true : (b3 = true, v3.__version = r3.version);
        let x3 = v3.currentProgram;
        b3 === true && (x3 = vt2(r3, t3, i3), te2 && r3.isNodeMaterial && te2.onUpdateProgram(r3, x3, v3));
        let S3 = false, C3 = false, w3 = false, T3 = x3.getUniforms(), D3 = v3.uniforms;
        if (Me2.useProgram(x3.program) && (S3 = true, C3 = true, w3 = true), r3.id !== ae2 && (ae2 = r3.id, C3 = true), v3.needsLights) {
          let e6 = xt2(E2.state.lightProbeGridArray, i3);
          v3.lightProbeGrid !== e6 && (v3.lightProbeGrid = e6, C3 = true);
        }
        if (S3 || oe2 !== e5) {
          Me2.buffers.depth.getReversed() && e5.reversedDepth !== true && (e5._reversedDepth = true, e5.updateProjectionMatrix()), T3.setValue(j2, `projectionMatrix`, e5.projectionMatrix), T3.setValue(j2, `viewMatrix`, e5.matrixWorldInverse);
          let t4 = T3.map.cameraPosition;
          t4 !== void 0 && t4.setValue(j2, we2.setFromMatrixPosition(e5.matrixWorld)), je2.logarithmicDepthBuffer && T3.setValue(j2, `logDepthBufFC`, 2 / (Math.log(e5.far + 1) / Math.LN2)), (r3.isMeshPhongMaterial || r3.isMeshToonMaterial || r3.isMeshLambertMaterial || r3.isMeshBasicMaterial || r3.isMeshStandardMaterial || r3.isShaderMaterial) && T3.setValue(j2, `isOrthographic`, e5.isOrthographicCamera === true), oe2 !== e5 && (oe2 = e5, C3 = true, w3 = true);
        }
        if (v3.needsLights && (y3.state.directionalShadowMap.length > 0 && T3.setValue(j2, `directionalShadowMap`, y3.state.directionalShadowMap, Fe2), y3.state.spotShadowMap.length > 0 && T3.setValue(j2, `spotShadowMap`, y3.state.spotShadowMap, Fe2), y3.state.pointShadowMap.length > 0 && T3.setValue(j2, `pointShadowMap`, y3.state.pointShadowMap, Fe2)), i3.isSkinnedMesh) {
          T3.setOptional(j2, i3, `bindMatrix`), T3.setOptional(j2, i3, `bindMatrixInverse`);
          let e6 = i3.skeleton;
          e6 && (e6.boneTexture === null && e6.computeBoneTexture(), T3.setValue(j2, `boneTexture`, e6.boneTexture, Fe2));
        }
        i3.isBatchedMesh && (T3.setOptional(j2, i3, `batchingTexture`), T3.setValue(j2, `batchingTexture`, i3._matricesTexture, Fe2), T3.setOptional(j2, i3, `batchingIdTexture`), T3.setValue(j2, `batchingIdTexture`, i3._indirectTexture, Fe2), T3.setOptional(j2, i3, `batchingColorTexture`), i3._colorsTexture !== null && T3.setValue(j2, `batchingColorTexture`, i3._colorsTexture, Fe2));
        let O3 = n3.morphAttributes;
        if ((O3.position !== void 0 || O3.normal !== void 0 || O3.color !== void 0) && qe2.update(i3, n3, x3), (C3 || v3.receiveShadow !== i3.receiveShadow) && (v3.receiveShadow = i3.receiveShadow, T3.setValue(j2, `receiveShadow`, i3.receiveShadow)), (r3.isMeshStandardMaterial || r3.isMeshLambertMaterial || r3.isMeshPhongMaterial) && r3.envMap === null && t3.environment !== null && (D3.envMapIntensity.value = t3.environmentIntensity), D3.dfgLUT !== void 0 && (D3.dfgLUT.value = pu()), C3) {
          if (T3.setValue(j2, `toneMappingExposure`, A2.toneMappingExposure), v3.needsLights && Ct2(D3, w3), a3 && r3.fog === true && Ve2.refreshFogUniforms(D3, a3), Ve2.refreshMaterialUniforms(D3, r3, me2, pe2, E2.state.transmissionRenderTarget[e5.id]), v3.needsLights && v3.lightProbeGrid) {
            let e6 = v3.lightProbeGrid;
            D3.probesSH.value = e6.texture, D3.probesMin.value.copy(e6.boundingBox.min), D3.probesMax.value.copy(e6.boundingBox.max), D3.probesResolution.value.copy(e6.resolution);
          }
          qu.upload(j2, yt2(v3), D3, Fe2);
        }
        if (r3.isShaderMaterial && r3.uniformsNeedUpdate === true && (qu.upload(j2, yt2(v3), D3, Fe2), r3.uniformsNeedUpdate = false), r3.isSpriteMaterial && T3.setValue(j2, `center`, i3.center), T3.setValue(j2, `modelViewMatrix`, i3.modelViewMatrix), T3.setValue(j2, `normalMatrix`, i3.normalMatrix), T3.setValue(j2, `modelMatrix`, i3.matrixWorld), r3.uniformsGroups !== void 0) {
          let e6 = r3.uniformsGroups;
          for (let t4 = 0, n4 = e6.length; t4 < n4; t4++) {
            let n5 = e6[t4];
            Qe2.update(n5, x3), Qe2.bind(n5, x3);
          }
        }
        return x3;
      }
      function Ct2(e5, t3) {
        e5.ambientLightColor.needsUpdate = t3, e5.lightProbe.needsUpdate = t3, e5.directionalLights.needsUpdate = t3, e5.directionalLightShadows.needsUpdate = t3, e5.pointLights.needsUpdate = t3, e5.pointLightShadows.needsUpdate = t3, e5.spotLights.needsUpdate = t3, e5.spotLightShadows.needsUpdate = t3, e5.rectAreaLights.needsUpdate = t3, e5.hemisphereLights.needsUpdate = t3;
      }
      function wt2(e5) {
        return e5.isMeshLambertMaterial || e5.isMeshToonMaterial || e5.isMeshPhongMaterial || e5.isMeshStandardMaterial || e5.isShadowMaterial || e5.isShaderMaterial && e5.lights === true;
      }
      this.getActiveCubeFace = function() {
        return ne2;
      }, this.getActiveMipmapLevel = function() {
        return re2;
      }, this.getRenderTarget = function() {
        return ie2;
      }, this.setRenderTargetTextures = function(e5, t3, n3) {
        let r3 = Pe2.get(e5);
        r3.__autoAllocateDepthBuffer = e5.resolveDepthBuffer === false, r3.__autoAllocateDepthBuffer === false && (r3.__useRenderToTexture = false), Pe2.get(e5.texture).__webglTexture = t3, Pe2.get(e5.depthTexture).__webglTexture = r3.__autoAllocateDepthBuffer ? void 0 : n3, r3.__hasExternalTextures = true;
      }, this.setRenderTargetFramebuffer = function(e5, t3) {
        let n3 = Pe2.get(e5);
        n3.__webglFramebuffer = t3, n3.__useDefaultFramebuffer = t3 === void 0;
      };
      let Dt2 = j2.createFramebuffer();
      this.setRenderTarget = function(e5, t3 = 0, n3 = 0) {
        ie2 = e5, ne2 = t3, re2 = n3;
        let r3 = null, i3 = false, a3 = false;
        if (e5) {
          let o2 = Pe2.get(e5);
          if (o2.__useDefaultFramebuffer !== void 0) {
            Me2.bindFramebuffer(j2.FRAMEBUFFER, o2.__webglFramebuffer), se2.copy(e5.viewport), ce2.copy(e5.scissor), le2 = e5.scissorTest, Me2.viewport(se2), Me2.scissor(ce2), Me2.setScissorTest(le2), ae2 = -1;
            return;
          } else if (o2.__webglFramebuffer === void 0) Fe2.setupRenderTarget(e5);
          else if (o2.__hasExternalTextures) Fe2.rebindTextures(e5, Pe2.get(e5.texture).__webglTexture, Pe2.get(e5.depthTexture).__webglTexture);
          else if (e5.depthBuffer) {
            let t4 = e5.depthTexture;
            if (o2.__boundDepthTexture !== t4) {
              if (t4 !== null && Pe2.has(t4) && (e5.width !== t4.image.width || e5.height !== t4.image.height)) throw Error(`WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.`);
              Fe2.setupDepthRenderbuffer(e5);
            }
          }
          let s2 = e5.texture;
          (s2.isData3DTexture || s2.isDataArrayTexture || s2.isCompressedArrayTexture) && (a3 = true);
          let c3 = Pe2.get(e5).__webglFramebuffer;
          e5.isWebGLCubeRenderTarget ? (r3 = Array.isArray(c3[t3]) ? c3[t3][n3] : c3[t3], i3 = true) : r3 = e5.samples > 0 && Fe2.useMultisampledRTT(e5) === false ? Pe2.get(e5).__webglMultisampledFramebuffer : Array.isArray(c3) ? c3[n3] : c3, se2.copy(e5.viewport), ce2.copy(e5.scissor), le2 = e5.scissorTest;
        } else se2.copy(_e2).multiplyScalar(me2).floor(), ce2.copy(ve2).multiplyScalar(me2).floor(), le2 = ye2;
        if (n3 !== 0 && (r3 = Dt2), Me2.bindFramebuffer(j2.FRAMEBUFFER, r3) && Me2.drawBuffers(e5, r3), Me2.viewport(se2), Me2.scissor(ce2), Me2.setScissorTest(le2), i3) {
          let r4 = Pe2.get(e5.texture);
          j2.framebufferTexture2D(j2.FRAMEBUFFER, j2.COLOR_ATTACHMENT0, j2.TEXTURE_CUBE_MAP_POSITIVE_X + t3, r4.__webglTexture, n3);
        } else if (a3) {
          let r4 = t3;
          for (let t4 = 0; t4 < e5.textures.length; t4++) {
            let i4 = Pe2.get(e5.textures[t4]);
            j2.framebufferTextureLayer(j2.FRAMEBUFFER, j2.COLOR_ATTACHMENT0 + t4, i4.__webglTexture, n3, r4);
          }
        } else if (e5 !== null && n3 !== 0) {
          let t4 = Pe2.get(e5.texture);
          j2.framebufferTexture2D(j2.FRAMEBUFFER, j2.COLOR_ATTACHMENT0, j2.TEXTURE_2D, t4.__webglTexture, n3);
        }
        ae2 = -1;
      }, this.readRenderTargetPixels = function(e5, t3, n3, r3, i3, a3, o2, s2 = 0) {
        if (!(e5 && e5.isWebGLRenderTarget)) {
          u(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);
          return;
        }
        let c3 = Pe2.get(e5).__webglFramebuffer;
        if (e5.isWebGLCubeRenderTarget && o2 !== void 0 && (c3 = c3[o2]), c3) {
          Me2.bindFramebuffer(j2.FRAMEBUFFER, c3);
          try {
            let o3 = e5.textures[s2], c4 = o3.format, l2 = o3.type;
            if (e5.textures.length > 1 && j2.readBuffer(j2.COLOR_ATTACHMENT0 + s2), !je2.textureFormatReadable(c4)) {
              u(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);
              return;
            }
            if (!je2.textureTypeReadable(l2)) {
              u(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);
              return;
            }
            t3 >= 0 && t3 <= e5.width - r3 && n3 >= 0 && n3 <= e5.height - i3 && j2.readPixels(t3, n3, r3, i3, Xe2.convert(c4), Xe2.convert(l2), a3);
          } finally {
            let e6 = ie2 === null ? null : Pe2.get(ie2).__webglFramebuffer;
            Me2.bindFramebuffer(j2.FRAMEBUFFER, e6);
          }
        }
      }, this.readRenderTargetPixelsAsync = async function(e5, t3, n3, r3, i3, a3, o2, s2 = 0) {
        if (!(e5 && e5.isWebGLRenderTarget)) throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);
        let c3 = Pe2.get(e5).__webglFramebuffer;
        if (e5.isWebGLCubeRenderTarget && o2 !== void 0 && (c3 = c3[o2]), c3) if (t3 >= 0 && t3 <= e5.width - r3 && n3 >= 0 && n3 <= e5.height - i3) {
          Me2.bindFramebuffer(j2.FRAMEBUFFER, c3);
          let o3 = e5.textures[s2], l2 = o3.format, u2 = o3.type;
          if (e5.textures.length > 1 && j2.readBuffer(j2.COLOR_ATTACHMENT0 + s2), !je2.textureFormatReadable(l2)) throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);
          if (!je2.textureTypeReadable(u2)) throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);
          let d3 = j2.createBuffer();
          j2.bindBuffer(j2.PIXEL_PACK_BUFFER, d3), j2.bufferData(j2.PIXEL_PACK_BUFFER, a3.byteLength, j2.STREAM_READ), j2.readPixels(t3, n3, r3, i3, Xe2.convert(l2), Xe2.convert(u2), 0);
          let p3 = ie2 === null ? null : Pe2.get(ie2).__webglFramebuffer;
          Me2.bindFramebuffer(j2.FRAMEBUFFER, p3);
          let m3 = j2.fenceSync(j2.SYNC_GPU_COMMANDS_COMPLETE, 0);
          return j2.flush(), await f(j2, m3, 4), j2.bindBuffer(j2.PIXEL_PACK_BUFFER, d3), j2.getBufferSubData(j2.PIXEL_PACK_BUFFER, 0, a3), j2.deleteBuffer(d3), j2.deleteSync(m3), a3;
        } else throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`);
      }, this.copyFramebufferToTexture = function(e5, t3 = null, n3 = 0) {
        let r3 = 2 ** -n3, i3 = Math.floor(e5.image.width * r3), a3 = Math.floor(e5.image.height * r3), o2 = t3 === null ? 0 : t3.x, s2 = t3 === null ? 0 : t3.y;
        Fe2.setTexture2D(e5, 0), j2.copyTexSubImage2D(j2.TEXTURE_2D, n3, 0, 0, o2, s2, i3, a3), Me2.unbindTexture();
      };
      let Ot2 = j2.createFramebuffer(), At2 = j2.createFramebuffer();
      this.copyTextureToTexture = function(e5, t3, n3 = null, r3 = null, i3 = 0, a3 = 0) {
        let o2, s2, c3, l2, u2, d3, f2, p3, m3, h3 = e5.isCompressedTexture ? e5.mipmaps[a3] : e5.image;
        if (n3 !== null) o2 = n3.max.x - n3.min.x, s2 = n3.max.y - n3.min.y, c3 = n3.isBox3 ? n3.max.z - n3.min.z : 1, l2 = n3.min.x, u2 = n3.min.y, d3 = n3.isBox3 ? n3.min.z : 0;
        else {
          let t4 = 2 ** -i3;
          o2 = Math.floor(h3.width * t4), s2 = Math.floor(h3.height * t4), c3 = e5.isDataArrayTexture ? h3.depth : e5.isData3DTexture ? Math.floor(h3.depth * t4) : 1, l2 = 0, u2 = 0, d3 = 0;
        }
        r3 === null ? (f2 = 0, p3 = 0, m3 = 0) : (f2 = r3.x, p3 = r3.y, m3 = r3.z);
        let g3 = Xe2.convert(t3.format), _3 = Xe2.convert(t3.type), v3;
        t3.isData3DTexture ? (Fe2.setTexture3D(t3, 0), v3 = j2.TEXTURE_3D) : t3.isDataArrayTexture || t3.isCompressedArrayTexture ? (Fe2.setTexture2DArray(t3, 0), v3 = j2.TEXTURE_2D_ARRAY) : (Fe2.setTexture2D(t3, 0), v3 = j2.TEXTURE_2D), Me2.activeTexture(j2.TEXTURE0), Me2.pixelStorei(j2.UNPACK_FLIP_Y_WEBGL, t3.flipY), Me2.pixelStorei(j2.UNPACK_PREMULTIPLY_ALPHA_WEBGL, t3.premultiplyAlpha), Me2.pixelStorei(j2.UNPACK_ALIGNMENT, t3.unpackAlignment);
        let y3 = Me2.getParameter(j2.UNPACK_ROW_LENGTH), b3 = Me2.getParameter(j2.UNPACK_IMAGE_HEIGHT), x3 = Me2.getParameter(j2.UNPACK_SKIP_PIXELS), S3 = Me2.getParameter(j2.UNPACK_SKIP_ROWS), C3 = Me2.getParameter(j2.UNPACK_SKIP_IMAGES);
        Me2.pixelStorei(j2.UNPACK_ROW_LENGTH, h3.width), Me2.pixelStorei(j2.UNPACK_IMAGE_HEIGHT, h3.height), Me2.pixelStorei(j2.UNPACK_SKIP_PIXELS, l2), Me2.pixelStorei(j2.UNPACK_SKIP_ROWS, u2), Me2.pixelStorei(j2.UNPACK_SKIP_IMAGES, d3);
        let w3 = e5.isDataArrayTexture || e5.isData3DTexture, T3 = t3.isDataArrayTexture || t3.isData3DTexture;
        if (e5.isDepthTexture) {
          let n4 = Pe2.get(e5), r4 = Pe2.get(t3), h4 = Pe2.get(n4.__renderTarget), g4 = Pe2.get(r4.__renderTarget);
          Me2.bindFramebuffer(j2.READ_FRAMEBUFFER, h4.__webglFramebuffer), Me2.bindFramebuffer(j2.DRAW_FRAMEBUFFER, g4.__webglFramebuffer);
          for (let n5 = 0; n5 < c3; n5++) w3 && (j2.framebufferTextureLayer(j2.READ_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, Pe2.get(e5).__webglTexture, i3, d3 + n5), j2.framebufferTextureLayer(j2.DRAW_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, Pe2.get(t3).__webglTexture, a3, m3 + n5)), j2.blitFramebuffer(l2, u2, o2, s2, f2, p3, o2, s2, j2.DEPTH_BUFFER_BIT, j2.NEAREST);
          Me2.bindFramebuffer(j2.READ_FRAMEBUFFER, null), Me2.bindFramebuffer(j2.DRAW_FRAMEBUFFER, null);
        } else if (i3 !== 0 || e5.isRenderTargetTexture || Pe2.has(e5)) {
          let n4 = Pe2.get(e5), r4 = Pe2.get(t3);
          Me2.bindFramebuffer(j2.READ_FRAMEBUFFER, Ot2), Me2.bindFramebuffer(j2.DRAW_FRAMEBUFFER, At2);
          for (let e6 = 0; e6 < c3; e6++) w3 ? j2.framebufferTextureLayer(j2.READ_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, n4.__webglTexture, i3, d3 + e6) : j2.framebufferTexture2D(j2.READ_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, j2.TEXTURE_2D, n4.__webglTexture, i3), T3 ? j2.framebufferTextureLayer(j2.DRAW_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, r4.__webglTexture, a3, m3 + e6) : j2.framebufferTexture2D(j2.DRAW_FRAMEBUFFER, j2.COLOR_ATTACHMENT0, j2.TEXTURE_2D, r4.__webglTexture, a3), i3 === 0 ? T3 ? j2.copyTexSubImage3D(v3, a3, f2, p3, m3 + e6, l2, u2, o2, s2) : j2.copyTexSubImage2D(v3, a3, f2, p3, l2, u2, o2, s2) : j2.blitFramebuffer(l2, u2, o2, s2, f2, p3, o2, s2, j2.COLOR_BUFFER_BIT, j2.NEAREST);
          Me2.bindFramebuffer(j2.READ_FRAMEBUFFER, null), Me2.bindFramebuffer(j2.DRAW_FRAMEBUFFER, null);
        } else T3 ? e5.isDataTexture || e5.isData3DTexture ? j2.texSubImage3D(v3, a3, f2, p3, m3, o2, s2, c3, g3, _3, h3.data) : t3.isCompressedArrayTexture ? j2.compressedTexSubImage3D(v3, a3, f2, p3, m3, o2, s2, c3, g3, h3.data) : j2.texSubImage3D(v3, a3, f2, p3, m3, o2, s2, c3, g3, _3, h3) : e5.isDataTexture ? j2.texSubImage2D(j2.TEXTURE_2D, a3, f2, p3, o2, s2, g3, _3, h3.data) : e5.isCompressedTexture ? j2.compressedTexSubImage2D(j2.TEXTURE_2D, a3, f2, p3, h3.width, h3.height, g3, h3.data) : j2.texSubImage2D(j2.TEXTURE_2D, a3, f2, p3, o2, s2, g3, _3, h3);
        Me2.pixelStorei(j2.UNPACK_ROW_LENGTH, y3), Me2.pixelStorei(j2.UNPACK_IMAGE_HEIGHT, b3), Me2.pixelStorei(j2.UNPACK_SKIP_PIXELS, x3), Me2.pixelStorei(j2.UNPACK_SKIP_ROWS, S3), Me2.pixelStorei(j2.UNPACK_SKIP_IMAGES, C3), a3 === 0 && t3.generateMipmaps && j2.generateMipmap(v3), Me2.unbindTexture();
      }, this.initRenderTarget = function(e5) {
        Pe2.get(e5).__webglFramebuffer === void 0 && Fe2.setupRenderTarget(e5);
      }, this.initTexture = function(e5) {
        e5.isCubeTexture ? Fe2.setTextureCube(e5, 0) : e5.isData3DTexture ? Fe2.setTexture3D(e5, 0) : e5.isDataArrayTexture || e5.isCompressedArrayTexture ? Fe2.setTexture2DArray(e5, 0) : Fe2.setTexture2D(e5, 0), Me2.unbindTexture();
      }, this.resetState = function() {
        ne2 = 0, re2 = 0, ie2 = null, Me2.reset(), Ze2.reset();
      }, typeof __THREE_DEVTOOLS__ < `u` && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`, { detail: this }));
    }
    get coordinateSystem() {
      return Jn;
    }
    get outputColorSpace() {
      return this._outputColorSpace;
    }
    set outputColorSpace(e4) {
      this._outputColorSpace = e4;
      let t2 = this.getContext();
      t2.drawingBufferColorSpace = dr._getDrawingBufferColorSpace(e4), t2.unpackColorSpace = dr._getUnpackColorSpace();
    }
  };
})), Dd, Od = t((() => {
  Dd = { item: `wl-item`, gold: `wl-gold`, npc: `wl-npc`, damage: `wl-dmg`, object: `wl-object`, levelUp: `wl-levelup` };
}));
Ed(), Od();

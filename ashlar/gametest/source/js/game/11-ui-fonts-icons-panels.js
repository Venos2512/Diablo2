// ===== game part 11-ui-fonts-icons-panels (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var lw, uw, dw = t((() => {
  lw = class {
    ctx;
    seen = [];
    dirty = true;
    constructor(e4) {
      this.ctx = e4;
    }
    invalidate() {
      this.dirty = true;
    }
    isActive() {
      return true;
    }
    sync() {
      if (!this.isActive()) return;
      let e4 = this.ctx.model.rev, t2 = this.dirty;
      for (let n2 = 0; n2 < this.deps.length; n2++) {
        let r2 = e4[this.deps[n2]] ?? 0;
        this.seen[n2] !== r2 && (this.seen[n2] = r2, t2 = true);
      }
      t2 && (this.dirty = false, this.render());
    }
    tick(e4) {
    }
    destroy() {
    }
  }, uw = { panelW: 572, panelH: 756, consoleW: 1240, orbTop: 240, margin: 24, cell: 48 };
}));
function fw(e4, t2, ...n2) {
  let r2 = document.createElement(e4);
  return typeof t2 == `string` ? r2.className = t2 : t2 && pw(r2, t2), mw(r2, n2), r2;
}
function pw(e4, t2) {
  for (let n2 of Object.keys(t2)) {
    let r2 = t2[n2];
    if (!(r2 == null || r2 === false)) if (n2 === `class`) e4.className = String(r2);
    else if (n2 === `style`) e4.setAttribute(`style`, String(r2));
    else if (n2 === `text`) e4.textContent = String(r2);
    else if (n2 === `html`) e4.innerHTML = String(r2);
    else if (n2 === `on`) for (let [t3, n3] of Object.entries(r2)) e4.addEventListener(t3, n3);
    else r2 === true ? e4.setAttribute(n2, ``) : e4.setAttribute(n2, String(r2));
  }
}
function mw(e4, t2) {
  for (let n2 of t2) if (Array.isArray(n2)) mw(e4, n2);
  else if (n2 == null || n2 === false) continue;
  else typeof n2 == `string` || typeof n2 == `number` ? e4.appendChild(document.createTextNode(String(n2))) : e4.appendChild(n2);
}
function W(e4, ...t2) {
  return fw(`div`, e4, ...t2);
}
function G(e4, t2) {
  let n2 = document.createElement(`span`);
  return n2.className = e4, t2 !== void 0 && (n2.textContent = t2), n2;
}
function hw(e4, t2 = ``, n2 = ``) {
  let r2 = new Image();
  return r2.draggable = false, r2.alt = n2, t2 && (r2.className = t2), e4 && (r2.src = e4), r2;
}
function gw(e4, t2, n2, r2) {
  let i2 = fw(`button`, { class: e4, type: `button` });
  return r2 && i2.setAttribute(`aria-label`, r2), mw(i2, [t2]), i2.addEventListener(`click`, (e5) => {
    e5.stopPropagation(), !(i2.disabled || i2.classList.contains(`is-disabled`)) && n2(e5);
  }), i2;
}
function _w(e4, t2) {
  e4.textContent !== t2 && (e4.textContent = t2);
}
function vw(e4, t2, n2) {
  e4.classList.contains(t2) !== n2 && e4.classList.toggle(t2, n2);
}
function yw(e4) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(e4)}`;
}
function bw(e4) {
  return `url("${e4}")`;
}
function xw(e4, t2, n2) {
  return e4 < t2 ? t2 : e4 > n2 ? n2 : e4;
}
function Sw(e4) {
  return e4 < 0 ? 0 : e4 > 1 ? 1 : e4;
}
var Cw = t((() => {
}));
function ww(e4) {
  let t2 = e4 >>> 0;
  return () => {
    t2 = t2 + 1831565813 >>> 0;
    let e5 = t2;
    return e5 = Math.imul(e5 ^ e5 >>> 15, e5 | 1), e5 ^= e5 + Math.imul(e5 ^ e5 >>> 7, e5 | 61), ((e5 ^ e5 >>> 14) >>> 0) / 4294967296;
  };
}
function Tw(e4, t2, n2, r2) {
  let i2 = ww(r2), a2 = new Float32Array(t2 * n2);
  for (let e5 = 0; e5 < a2.length; e5++) a2[e5] = i2();
  let o2 = new Float32Array(e4 * e4);
  for (let r3 = 0; r3 < e4; r3++) {
    let i3 = r3 / e4 * n2, s2 = Math.floor(i3), c2 = i3 - s2, l2 = c2 * c2 * (3 - 2 * c2), u2 = (s2 + 1) % n2;
    for (let n3 = 0; n3 < e4; n3++) {
      let i4 = n3 / e4 * t2, c3 = Math.floor(i4), d2 = i4 - c3, f2 = d2 * d2 * (3 - 2 * d2), p2 = (c3 + 1) % t2, m2 = a2[s2 * t2 + c3], h2 = a2[s2 * t2 + p2], g2 = a2[u2 * t2 + c3], _2 = a2[u2 * t2 + p2];
      o2[r3 * e4 + n3] = m2 + (h2 - m2) * f2 + (g2 - m2) * l2 + (m2 - h2 - g2 + _2) * f2 * l2;
    }
  }
  return o2;
}
function Ew(e4, t2, n2, r2, i2, a2 = 0.5) {
  let o2 = new Float32Array(e4 * e4), s2 = 1, c2 = 0;
  for (let l2 = 0; l2 < r2; l2++) {
    let r3 = Tw(e4, t2 << l2, n2 << l2, i2 + l2 * 101);
    for (let e5 = 0; e5 < o2.length; e5++) o2[e5] += r3[e5] * s2;
    c2 += s2, s2 *= a2;
  }
  for (let e5 = 0; e5 < o2.length; e5++) o2[e5] /= c2;
  return o2;
}
function Dw(e4, t2) {
  let n2 = document.createElement(`canvas`);
  n2.width = e4, n2.height = t2;
  let r2 = n2.getContext(`2d`);
  if (!r2) throw Error(`2d canvas unavailable`);
  return [n2, r2];
}
function Ow(e4, t2) {
  return t2 ? e4.toDataURL(`image/webp`, 0.9) : e4.toDataURL(`image/webp`, 0.88);
}
function kw() {
  let [e4, t2] = Dw(256, 256), n2 = t2.createImageData(256, 256), r2 = Ew(256, 4, 4, 5, 11), i2 = Ew(256, 16, 16, 3, 23), a2 = Ew(256, 6, 6, 4, 37), o2 = ww(91);
  for (let e5 = 0; e5 < 256 * 256; e5++) {
    let t3 = 0.55 + (r2[e5] - 0.5) * 0.55 + (i2[e5] - 0.5) * 0.35, s2 = 1 - Math.abs(a2[e5] * 2 - 1);
    t3 -= s2 ** 9 * 0.35;
    let c2 = o2();
    c2 > 0.996 ? t3 += 0.22 : c2 < 0.01 && (t3 -= 0.18), t3 = Math.max(0, Math.min(1, t3));
    let l2 = 13 + t3 * 18;
    n2.data[e5 * 4] = l2 * 1.08 + 2, n2.data[e5 * 4 + 1] = l2 * 0.98, n2.data[e5 * 4 + 2] = l2 * 0.86, n2.data[e5 * 4 + 3] = 255;
  }
  return t2.putImageData(n2, 0, 0), Ow(e4, false);
}
function Aw() {
  let [e4, t2] = Dw(256, 256), n2 = t2.createImageData(256, 256), r2 = Ew(256, 3, 3, 5, 5), i2 = Ew(256, 12, 12, 4, 17), a2 = Ew(256, 5, 5, 5, 29), o2 = ww(7);
  for (let e5 = 0; e5 < 256 * 256; e5++) {
    let t3 = 0.5 + (r2[e5] - 0.5) * 0.7 + (i2[e5] - 0.5) * 0.45, s2 = 1 - Math.abs(a2[e5] * 2 - 1);
    t3 -= s2 ** 12 * 0.5;
    let c2 = o2();
    c2 > 0.993 ? t3 += 0.16 : c2 < 0.012 && (t3 -= 0.2), t3 = Math.max(0, Math.min(1, t3));
    let l2 = 42 + t3 * 58;
    n2.data[e5 * 4] = l2 * 1.05, n2.data[e5 * 4 + 1] = l2 * 0.98, n2.data[e5 * 4 + 2] = l2 * 0.88, n2.data[e5 * 4 + 3] = 255;
  }
  return t2.putImageData(n2, 0, 0), Ow(e4, false);
}
function jw() {
  let [e4, t2] = Dw(128, 128), n2 = t2.createImageData(128, 128), r2 = ww(3), i2 = Ew(128, 32, 32, 2, 41);
  for (let e5 = 0; e5 < 16384; e5++) {
    let t3 = r2() > 0.5, a2 = (r2() * 0.5 + i2[e5] * 0.5) * 34, o2 = t3 ? 255 : 0;
    n2.data[e5 * 4] = o2, n2.data[e5 * 4 + 1] = t3 ? 236 : 0, n2.data[e5 * 4 + 2] = t3 ? 200 : 0, n2.data[e5 * 4 + 3] = t3 ? a2 * 0.55 : a2;
  }
  return t2.putImageData(n2, 0, 0), Ow(e4, true);
}
function Mw() {
  let [e4, t2] = Dw(256, 256), n2 = t2.createImageData(256, 256), r2 = Ew(256, 2, 96, 3, 61), i2 = Ew(256, 24, 24, 2, 73), a2 = ww(13);
  for (let e5 = 0; e5 < 256 * 256; e5++) {
    let t3 = r2[e5], o2 = t3 > 0.5, s2 = Math.abs(t3 - 0.5) * 2 * 60;
    i2[e5] < 0.28 && (s2 += 40 * (0.28 - i2[e5]) * 4), a2() > 0.997 && (s2 += 80), n2.data[e5 * 4] = o2 ? 255 : 0, n2.data[e5 * 4 + 1] = o2 ? 246 : 0, n2.data[e5 * 4 + 2] = o2 ? 230 : 0, n2.data[e5 * 4 + 3] = Math.min(255, o2 ? s2 * 0.5 : s2);
  }
  return t2.putImageData(n2, 0, 0), Ow(e4, true);
}
function Nw() {
  let [e4, t2] = Dw(96, 96);
  t2.fillStyle = `#080706`, t2.fillRect(0, 0, 96, 96);
  let n2 = t2.createRadialGradient(96 * 0.5, 96 * 0.45, 4, 96 * 0.5, 96 * 0.5, 96 * 0.75);
  n2.addColorStop(0, `rgba(46,40,32,0.55)`), n2.addColorStop(1, `rgba(0,0,0,0)`), t2.fillStyle = n2, t2.fillRect(2, 2, 92, 92), t2.fillStyle = `rgba(0,0,0,0.75)`, t2.fillRect(2, 2, 92, 4), t2.fillRect(2, 2, 4, 92), t2.fillStyle = `rgba(170,140,100,0.10)`, t2.fillRect(4, 91, 90, 2), t2.fillRect(91, 4, 2, 90), t2.strokeStyle = `rgba(92,80,62,0.55)`, t2.lineWidth = 2, t2.strokeRect(1, 1, 94, 94);
  let r2 = ww(5);
  for (let e5 = 0; e5 < 90; e5++) t2.fillStyle = r2() > 0.5 ? `rgba(255,230,190,0.035)` : `rgba(0,0,0,0.25)`, t2.fillRect(4 + r2() * 88, 4 + r2() * 88, 2, 2);
  return e4.toDataURL(`image/png`);
}
function Pw() {
  if (Iw) return Iw;
  let e4 = Ew(256, 4, 4, 5, 501), t2 = Ew(256, 4, 4, 5, 677), n2 = Ew(256, 4, 4, 4, 853), r2 = new Uint8Array(256 * 256 * 4), i2 = (e5) => {
    let t3 = 1, n3 = 0;
    for (let r3 = 0; r3 < e5.length; r3++) e5[r3] < t3 && (t3 = e5[r3]), e5[r3] > n3 && (n3 = e5[r3]);
    return [t3, Math.max(1e-6, n3 - t3)];
  }, [a2, o2] = i2(e4), [s2, c2] = i2(t2), [l2, u2] = i2(n2), d2 = (e5, t3, n3) => Math.round((0.1 + (e5 - t3) / n3 * 0.8) * 255);
  for (let i3 = 0; i3 < 256 * 256; i3++) r2[i3 * 4] = d2(e4[i3], a2, o2), r2[i3 * 4 + 1] = d2(t2[i3], s2, c2), r2[i3 * 4 + 2] = d2(n2[i3], l2, u2), r2[i3 * 4 + 3] = 255;
  return Iw = { size: 256, data: r2 }, Iw;
}
function Fw() {
  if (Lw) return Lw;
  try {
    Lw = { "--tex-stone": bw(kw()), "--tex-slab": bw(Aw()), "--tex-grain": bw(jw()), "--tex-brushed": bw(Mw()), "--tex-cell": bw(Nw()) };
  } catch {
    Lw = { "--tex-stone": `linear-gradient(#15120f,#15120f)`, "--tex-slab": `linear-gradient(#2a251f,#2a251f)`, "--tex-grain": `linear-gradient(transparent,transparent)`, "--tex-brushed": `linear-gradient(transparent,transparent)`, "--tex-cell": `linear-gradient(#080706,#080706)` };
  }
  return Lw;
}
var Iw, Lw, Rw = t((() => {
  Cw(), Iw = null, Lw = null;
})), zw, Bw = t((() => {
  zw = `fonts/cinzel-500-normal.woff2`;
})), Vw, Hw = t((() => {
  Vw = `fonts/cinzel-600-normal.woff2`;
})), Uw, Ww = t((() => {
  Uw = `fonts/cinzel-700-normal.woff2`;
})), Gw, Kw = t((() => {
  Gw = `fonts/cinzel-decorative-900-normal.woff2`;
})), qw, Jw = t((() => {
  qw = `fonts/alegreya-sans-400-normal.woff2`;
})), Yw, Xw = t((() => {
  Yw = `fonts/alegreya-sans-500-normal.woff2`;
})), Zw, Qw = t((() => {
  Zw = `fonts/alegreya-sans-700-normal.woff2`;
})), $w, eT = t((() => {
  $w = `fonts/alegreya-sans-sc-500-normal.woff2`;
})), tT, nT = t((() => {
  tT = `fonts/alegreya-sans-sc-700-normal.woff2`;
})), rT, iT = t((() => {
  rT = `fonts/im-fell-english-400-normal.woff2`;
})), aT, oT = t((() => {
  aT = `fonts/im-fell-english-400-italic.woff2`;
}));
function sT() {
  if (lT) return lT;
  if (typeof FontFace > `u` || !document.fonts) return lT = Promise.resolve(), lT;
  let e4 = [];
  for (let [t2, n2, r2, i2] of cT) {
    let a2 = new FontFace(t2, `url(${n2}) format('woff2')`, { weight: r2, style: i2, display: `swap` });
    document.fonts.add(a2), e4.push(a2.load().catch(() => void 0));
  }
  return lT = Promise.all(e4).then(() => void 0), lT;
}
var cT, lT, uT = t((() => {
  Bw(), Hw(), Ww(), Kw(), Jw(), Xw(), Qw(), eT(), nT(), iT(), oT(), cT = [[`Cinzel`, zw, `500`, `normal`], [`Cinzel`, Vw, `600`, `normal`], [`Cinzel`, Uw, `700`, `normal`], [`Cinzel Decorative`, Gw, `900`, `normal`], [`Alegreya Sans`, qw, `400`, `normal`], [`Alegreya Sans`, Yw, `500`, `normal`], [`Alegreya Sans`, Zw, `700`, `normal`], [`Alegreya Sans SC`, $w, `500`, `normal`], [`Alegreya Sans SC`, tT, `700`, `normal`], [`IM Fell English`, rT, `400`, `normal`], [`IM Fell English`, aT, `400`, `italic`]], lT = null;
}));
function dT(e4, t2, n2, r2) {
  let i2 = (t3) => +(n2 ? e4 - t3 : t3).toFixed(2), a2 = (e5) => +(r2 ? t2 - e5 : e5).toFixed(2);
  return { X: i2, Y: a2, p: (e5, t3) => `${i2(e5)} ${a2(t3)}` };
}
function fT(e4, t2, n2, r2) {
  return `<circle cx="${e4}" cy="${t2}" r="${n2 + 1.6}" fill="url(#gold)" stroke="#000" stroke-width="1"/>
<circle cx="${e4}" cy="${t2}" r="${n2}" fill="url(#${r2})" stroke="#000" stroke-width=".8"/>
<ellipse cx="${e4 - n2 * 0.32}" cy="${t2 - n2 * 0.38}" rx="${n2 * 0.36}" ry="${n2 * 0.22}" fill="#fff" opacity=".7"/>`;
}
function pT(e4, t2, n2) {
  return `<circle cx="${e4}" cy="${t2 + 0.8}" r="${n2}" fill="#000" opacity=".6"/>
<circle cx="${e4}" cy="${t2}" r="${n2}" fill="url(#dome)" stroke="#050505" stroke-width=".6"/>`;
}
function mT(e4) {
  let { p: t2, X: n2, Y: r2 } = dT(96, 96, e4 === `tr` || e4 === `br`, e4 === `bl` || e4 === `br`), i2 = `M${t2(0, 0)} L${t2(76, 0)} L${t2(90, 7.5)} L${t2(76, 15)} L${t2(30, 15)} Q${t2(15, 15)} ${t2(15, 30)} L${t2(15, 76)} L${t2(7.5, 90)} L${t2(0, 76)} Z`, a2 = `M${t2(24, 7.5)} L${t2(72, 7.5)}`, o2 = `M${t2(7.5, 24)} L${t2(7.5, 72)}`;
  return `<svg ${kT} viewBox="0 0 96 96"><defs>${AT}</defs>
<path d="${i2}" fill="#000" opacity=".55" transform="translate(1.5 2)"/>
<path d="${i2}" fill="url(#iron)" stroke="#000" stroke-width="1.4"/>
<path d="${`M${t2(38, 15)} L${t2(43, 23)} L${t2(48, 15)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1"/>
<path d="${`M${t2(15, 38)} L${t2(23, 43)} L${t2(15, 48)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1"/>
<path d="${a2}" stroke="#d9b05a" stroke-width="1.6" stroke-linecap="round"/>
<path d="${o2}" stroke="#d9b05a" stroke-width="1.6" stroke-linecap="round"/>
<path d="${`M${t2(76, 3.5)} L${t2(84, 7.5)} L${t2(76, 11.5)} Z`}" fill="url(#gold)"/><path d="${`M${t2(3.5, 76)} L${t2(7.5, 84)} L${t2(11.5, 76)} Z`}" fill="url(#gold)"/>
${pT(n2(48), r2(7.5), 2.8)}${pT(n2(7.5), r2(48), 2.8)}
<circle cx="${n2(16)}" cy="${r2(16)}" r="15" fill="#000" opacity=".5"/>
<circle cx="${n2(15)}" cy="${r2(15)}" r="14" fill="url(#iron)" stroke="#000" stroke-width="1.3"/>
<circle cx="${n2(15)}" cy="${r2(15)}" r="10.5" fill="none" stroke="url(#gold)" stroke-width="1.8"/>
${fT(n2(15), r2(15), 6.4, `ruby`)}
</svg>`;
}
function hT(e4) {
  let { p: t2, X: n2, Y: r2 } = dT(40, 40, e4 === `tr` || e4 === `br`, e4 === `bl` || e4 === `br`);
  return `<svg ${kT} viewBox="0 0 40 40"><defs>${AT}</defs>
<path d="${`M${t2(0, 0)} L${t2(32, 0)} L${t2(38, 3.5)} L${t2(32, 7)} L${t2(12, 7)} Q${t2(7, 7)} ${t2(7, 12)} L${t2(7, 32)} L${t2(3.5, 38)} L${t2(0, 32)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1"/>
<path d="M${t2(11, 3.5)} L${t2(30, 3.5)} M${t2(3.5, 11)} L${t2(3.5, 30)}" stroke="#d9b05a" stroke-width="1.1"/>
<circle cx="${n2(6)}" cy="${r2(6)}" r="5" fill="url(#dome)" stroke="#000" stroke-width=".8"/>
<circle cx="${n2(6)}" cy="${r2(6)}" r="2.4" fill="url(#gold)"/>
</svg>`;
}
function gT(e4) {
  let { p: t2, X: n2 } = dT(240, 240, e4 === `right`, false), r2 = e4 === `left` ? `ruby` : `sapphire`, i2 = 75.5, a2 = `M25 128 a95 95 0 1 0 190 0 a95 95 0 1 0 -190 0 Z M${120 - i2} 128 a${i2} ${i2} 0 1 1 ${i2 * 2} 0 a${i2} ${i2} 0 1 1 ${-i2 * 2} 0 Z`, o2 = `M${t2(58, 196)} C${t2(18, 176)} ${t2(2, 118)} ${t2(14, 64)} C${t2(18, 46)} ${t2(26, 30)} ${t2(38, 18)} C${t2(32, 46)} ${t2(32, 78)} ${t2(44, 108)} C${t2(50, 124)} ${t2(56, 138)} ${t2(64, 150)} Z`, s2 = `M${t2(24, 70)} C${t2(22, 100)} ${t2(30, 140)} ${t2(54, 178)}`, c2 = `M${t2(34, 44)} C${t2(28, 70)} ${t2(32, 104)} ${t2(48, 132)}`, l2 = `M${t2(196, 92)} C${t2(212, 74)} ${t2(226, 58)} ${t2(232, 34)} C${t2(236, 58)} ${t2(228, 86)} ${t2(210, 110)} Z`, u2 = `M${t2(96, 44)} L${t2(104, 30)} L${t2(112, 34)} L${t2(120, 4)} L${t2(128, 34)} L${t2(136, 30)} L${t2(144, 44)} Q${t2(120, 36)} ${t2(96, 44)} Z`, d2 = (e5, t3) => {
    let r3 = e5 * Math.PI / 180, i3 = Math.cos(r3), a3 = Math.sin(r3), o3 = -a3, s3 = i3, c3 = 100 - t3, l3 = 120 + i3 * 100, u3 = 128 + a3 * 100, d3 = 120 + i3 * c3, f3 = 128 + a3 * c3, p3 = l3 + o3 * 9, m3 = u3 + s3 * 9, h3 = l3 - o3 * 9, g2 = u3 - s3 * 9, _2 = (l3 + d3) / 2 + o3 * 7, v2 = (u3 + f3) / 2 + s3 * 7;
    return `M${n2(p3)} ${m3.toFixed(1)} Q${n2(_2 + o3 * 3)} ${v2.toFixed(1)} ${n2(d3)} ${f3.toFixed(1)} Q${n2(_2 - o3 * 4)} ${(v2 - s3 * 4).toFixed(1)} ${n2(h3)} ${g2.toFixed(1)} Z`;
  }, f2 = [118, 90, 62].map((e5, t3) => d2(e5, t3 === 1 ? 30 : 34)).join(` `), p2 = `M${t2(70, 214)} L${t2(170, 214)} L${t2(196, 240)} L${t2(44, 240)} Z`, m2 = `M${t2(186, 198)} L${t2(240, 204)} L${t2(240, 228)} L${t2(176, 224)} Z`, h2 = ``;
  for (let e5 = 0; e5 < 12; e5++) {
    let t3 = e5 / 12 * Math.PI * 2 - Math.PI / 2 + Math.PI / 12, r3 = 120 + Math.cos(t3) * 85.3, i3 = 128 + Math.sin(t3) * 85.3;
    h2 += pT(n2(r3), +i3.toFixed(1), 2.6);
  }
  return `<svg ${kT} viewBox="0 0 240 240"><defs>${AT}
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
<radialGradient id="ringG" cx=".38" cy=".3" r=".85">
  <stop offset="0" stop-color="#9a9ea6"/><stop offset=".42" stop-color="#3b3e44"/>
  <stop offset=".78" stop-color="#16171a"/><stop offset="1" stop-color="#060607"/>
</radialGradient>
</defs>
<g filter="url(#sh)" opacity=".75" transform="translate(2 4)">
  <path d="${o2}" fill="#000"/><path d="${a2}" fill="#000" fill-rule="evenodd"/><path d="${p2}" fill="#000"/>
</g>
<path d="${m2}" fill="url(#ironV)" stroke="#000" stroke-width="1.4"/>
<path d="M${t2(182, 206)} L${t2(240, 211)}" stroke="#d9b05a" stroke-width="1.2" opacity=".8"/>
<path d="${p2}" fill="url(#ironV)" stroke="#000" stroke-width="1.4"/>
<path d="M${t2(76, 220)} L${t2(164, 220)}" stroke="#d9b05a" stroke-width="1.4"/>
<path d="${l2}" fill="url(#iron)" stroke="#000" stroke-width="1.3"/>
<path d="${o2}" fill="url(#iron)" stroke="#000" stroke-width="1.5"/>
<path d="${s2}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.4"/>
<path d="${c2}" fill="none" stroke="#c9ced6" stroke-opacity=".22" stroke-width="1.2"/>
<path d="${u2}" fill="url(#iron)" stroke="#000" stroke-width="1.4"/>
<path d="M${t2(120, 10)} L${t2(120, 32)}" stroke="#d9b05a" stroke-width="1.4"/>
<path d="${a2}" fill="url(#ringG)" fill-rule="evenodd" stroke="#000" stroke-width="1.6"/>
<circle cx="120" cy="128" r="${i2 + 1.4}" fill="none" stroke="url(#gold)" stroke-width="2"/>
<circle cx="120" cy="128" r="92.6" fill="none" stroke="url(#gold)" stroke-width="1.3" opacity=".8"/>
<circle cx="120" cy="128" r="${i2}" fill="none" stroke="#000" stroke-width="2.2"/>
${h2}
<path d="${f2}" fill="url(#iron)" stroke="#000" stroke-width="1.3"/>
${fT(120, 46, 9.5, r2)}
</svg>`;
}
function _T() {
  let e4 = MT.map(([e5, t3]) => `${e5} ${t3}`).join(` L`), t2 = (e5) => MT.slice(1, -1).map(([t3, n3]) => `${t3} ${n3 + e5}`).join(` L`), n2 = t2(6), r2 = ``;
  for (let e5 of [190, 290, 950, 1050]) r2 += pT(e5, 30, 3.2);
  for (let e5 of [510, 730]) r2 += pT(e5, 14, 3.2);
  return `<svg ${kT} viewBox="0 0 ${jT.w} ${jT.h}" preserveAspectRatio="none"><defs>${AT}
<linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></linearGradient>
</defs>
<path d="M${e4} Z" fill="none" stroke="#000" stroke-width="3"/>
<path d="M${t2(2.6)}" fill="none" stroke="#ffe9c4" stroke-opacity=".34" stroke-width="2.2"/>
<path d="M${t2(10)}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="3"/>
<path d="M${n2}" fill="none" stroke="url(#gold)" stroke-width="1.8" opacity=".95"/>
<rect x="150" y="112" width="940" height="20" fill="url(#foot)"/>
<path d="M152 116 L1088 116" stroke="#000" stroke-opacity=".7" stroke-width="2"/>
<path d="M152 118 L1088 118" stroke="#fff0d0" stroke-opacity=".07" stroke-width="1"/>
${r2}
</svg>`;
}
function vT(e4) {
  let { p: t2, X: n2 } = dT(96, 72, e4 === `right`, false), r2 = `M${t2(96, 22)} L${t2(58, 22)} L${t2(44, 12)} L${t2(30, 18)} L${t2(22, 36)} L${t2(30, 54)} L${t2(44, 60)} L${t2(58, 50)} L${t2(96, 50)} Z`;
  return `<svg ${kT} viewBox="0 0 96 72"><defs>${AT}</defs>
<path d="${`M${t2(46, 16)} C${t2(36, 4)} ${t2(18, 0)} ${t2(2, 6)} C${t2(16, 8)} ${t2(28, 14)} ${t2(32, 24)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1.4"/>
<path d="${`M${t2(46, 56)} C${t2(36, 68)} ${t2(18, 72)} ${t2(4, 64)} C${t2(16, 64)} ${t2(28, 58)} ${t2(32, 48)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1.4"/>
<path d="${`M${t2(24, 36)} L${t2(4, 36)} L${t2(24, 30)} Z M${t2(24, 36)} L${t2(4, 36)} L${t2(24, 42)} Z`}" fill="url(#iron)" stroke="#000" stroke-width="1.2"/>
<path d="${r2}" fill="url(#ironV)" stroke="#000" stroke-width="1.6"/>
<path d="M${t2(94, 26)} L${t2(60, 26)} M${t2(94, 46)} L${t2(60, 46)}" stroke="#d9b05a" stroke-width="1.4"/>
${fT(n2(42), 36, 8.5, `ruby`)}
</svg>`;
}
function yT() {
  let e4 = [`M120 40 L126 64 M126 40 L120 64 M118 52 L128 52`, `M150 40 L150 64 M150 46 L158 40 M150 56 L158 50`, `M182 38 L176 52 L188 52 L182 66`, `M210 40 L210 64 M204 46 L216 46 M204 58 L216 58`, `M238 40 L232 64 M232 40 L240 50`].join(` `), t2 = ``;
  for (let [e5, n2] of [[64, 112], [296, 112], [70, 210], [290, 210], [76, 306], [284, 306]]) t2 += pT(e5, n2, 4.2);
  return `<svg ${kT} viewBox="0 0 360 340"><defs>${AT}
<linearGradient id="lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1c"/><stop offset="1" stop-color="#140c06"/></linearGradient>
<radialGradient id="mouth" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset=".55" stop-color="#a02a08" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<ellipse cx="180" cy="330" rx="150" ry="10" fill="#000" opacity=".6" filter="url(#blur)"/>
<path d="M78 96 L104 18 L256 18 L282 96 Z" fill="url(#iron)" stroke="#000" stroke-width="2"/>
<path d="M108 30 L252 30 L268 88 L92 88 Z" fill="url(#lid)" stroke="#d9b05a" stroke-opacity=".7" stroke-width="1.4"/>
<path d="${e4}" stroke="#ff9a3a" stroke-width="5" fill="none" opacity=".35" filter="url(#blur)"/>
<path d="${e4}" stroke="#ffcf7a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M54 100 C26 84 12 52 22 18 C30 44 46 64 76 84 Z" fill="url(#iron)" stroke="#000" stroke-width="1.6"/>
<path d="M306 100 C334 84 348 52 338 18 C330 44 314 64 284 84 Z" fill="url(#iron)" stroke="#000" stroke-width="1.6"/>
<path d="M44 92 L316 92 L302 324 L58 324 Z" fill="url(#iron)" stroke="#000" stroke-width="2.2"/>
<path d="M52 100 L308 100 L296 316 L64 316 Z" fill="none" stroke="#d9b05a" stroke-opacity=".55" stroke-width="1.4"/>
<rect x="94" y="90" width="172" height="220" fill="#050302" stroke="#000" stroke-width="2"/>
<rect x="94" y="90" width="172" height="220" fill="url(#mouth)"/>
<rect x="98" y="94" width="164" height="212" fill="none" stroke="#ff7a2a" stroke-opacity=".55" stroke-width="2" filter="url(#blur)"/>
<rect x="94" y="90" width="172" height="220" fill="none" stroke="#d9b05a" stroke-width="1.6"/>
<path d="M44 92 L316 92 L314 104 L46 104 Z" fill="#fff" opacity=".08"/>
${t2}
<path d="M70 324 L82 336 L118 336 L122 324 Z M238 324 L242 336 L278 336 L290 324 Z" fill="url(#ironV)" stroke="#000" stroke-width="1.4"/>
${fT(180, 72, 8, `ruby`)}
</svg>`;
}
function bT(e4) {
  return e4 === `sorceress` ? `<path d="M58 30 A28 28 0 1 0 72 80 A22 22 0 1 1 58 30 Z" fill="url(#gold)" stroke="#000" stroke-width="1.4"/>
<circle cx="58" cy="58" r="10" fill="url(#sapphire)" stroke="#000" stroke-width="1"/>
<path d="M58 40 L60 54 L74 58 L60 62 L58 76 L56 62 L42 58 L56 54 Z" fill="#e8f2ff" opacity=".9"/>
<circle cx="34" cy="36" r="2" fill="#fff"/><circle cx="78" cy="40" r="1.6" fill="#fff"/><circle cx="74" cy="84" r="1.4" fill="#fff"/>` : e4 === `barbarian` ? `<g stroke="#000" stroke-width="1.3">
<path d="M28 88 L66 34" stroke="#5b3a1e" stroke-width="5" stroke-linecap="round"/>
<path d="M72 88 L34 34" stroke="#5b3a1e" stroke-width="5" stroke-linecap="round"/>
<path d="M60 30 Q74 22 84 30 Q78 44 70 48 Z" fill="url(#iron)"/>
<path d="M40 30 Q26 22 16 30 Q22 44 30 48 Z" fill="url(#iron)"/>
<path d="M30 70 Q50 56 70 70 L70 76 Q50 92 30 76 Z" fill="url(#iron)"/>
<path d="M30 64 Q20 50 14 56 Q20 66 30 70 Z M70 64 Q80 50 86 56 Q80 66 70 70 Z" fill="url(#gold)"/>
<path d="M44 74 L56 74" stroke="#000" stroke-width="2"/>
</g>` : `<g stroke="#000" stroke-width="1.3">
<path d="M76 22 Q92 44 74 68 Q82 46 70 30 Z" fill="url(#iron)"/>
<path d="M70 30 L44 86" stroke="#c9b48a" stroke-width="3" stroke-linecap="round"/>
<path d="M50 34 C34 34 26 46 28 60 C29 68 34 72 36 74 L36 84 L64 84 L64 74 C66 72 71 68 72 60 C74 46 66 34 50 34 Z" fill="#e3d6b8"/>
<path d="M38 56 Q42 50 47 56 Q44 64 38 60 Z M62 56 Q58 50 53 56 Q56 64 62 60 Z" fill="#0a0806" stroke="none"/>
<path d="M50 62 L47 69 L53 69 Z" fill="#0a0806" stroke="none"/>
<path d="M41 78 L41 84 M47 78 L47 84 M53 78 L53 84 M59 78 L59 84" stroke="#0a0806" stroke-width="1.6"/>
<circle cx="44" cy="58" r="1.4" fill="#7dffb0" stroke="none"/><circle cx="56" cy="58" r="1.4" fill="#7dffb0" stroke="none"/>
</g>`;
}
function xT(e4) {
  let [t2, n2] = NT[e4];
  return `<svg ${kT} viewBox="0 0 100 120"><defs>${AT}
<radialGradient id="field" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${t2}"/><stop offset="1" stop-color="${n2}"/></radialGradient></defs>
<path d="M50 4 L94 16 L94 58 C94 88 72 106 50 116 C28 106 6 88 6 58 L6 16 Z" fill="url(#iron)" stroke="#000" stroke-width="2"/>
<path d="M50 11 L87 21 L87 58 C87 84 68 99 50 108 C32 99 13 84 13 58 L13 21 Z" fill="url(#field)" stroke="url(#gold)" stroke-width="2"/>
<path d="M50 11 L87 21 L87 34 Q50 26 13 34 L13 21 Z" fill="#fff" opacity=".05"/>
${bT(e4)}
</svg>`;
}
function ST() {
  return `<svg ${kT} viewBox="0 0 100 100"><defs>${AT}
<radialGradient id="bg" cx=".62" cy=".3" r=".85"><stop offset="0" stop-color="#3c4a4c"/><stop offset=".45" stop-color="#1c2222"/><stop offset="1" stop-color="#070808"/></radialGradient>
<linearGradient id="hood" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#5f6e44"/><stop offset=".5" stop-color="#2e3a22"/><stop offset="1" stop-color="#10140b"/></linearGradient>
<linearGradient id="cloak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46553a"/><stop offset=".6" stop-color="#1e2617"/><stop offset="1" stop-color="#0a0d07"/></linearGradient>
<radialGradient id="face" cx=".45" cy=".55" r=".6"><stop offset="0" stop-color="#2a1d14"/><stop offset=".7" stop-color="#0c0806"/><stop offset="1" stop-color="#050302"/></radialGradient>
<linearGradient id="rim" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#9fd0e0" stop-opacity=".55"/><stop offset=".3" stop-color="#9fd0e0" stop-opacity="0"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a2410"/><stop offset=".5" stop-color="#8a5a2c"/><stop offset="1" stop-color="#2a1708"/></linearGradient>
</defs>
<rect width="100" height="100" fill="url(#bg)"/>
<circle cx="74" cy="22" r="22" fill="#a8c8d0" opacity=".06"/>
<path d="M80 4 C98 34 98 66 80 96" fill="none" stroke="#120a04" stroke-width="5"/>
<path d="M80 4 C98 34 98 66 80 96" fill="none" stroke="url(#wood)" stroke-width="3"/>
<path d="M80 5 L80 95" stroke="#e8e0cc" stroke-width=".7" opacity=".75"/>
<path d="M18 30 L24 8 M23 30 L30 9 M28 31 L36 11" stroke="#5a3a1c" stroke-width="1.6"/>
<path d="M22 8 L24 4 L27 8 Z M29 9 L31 5 L34 9 Z M35 11 L37 7 L40 11 Z" fill="#c9b48a"/>
<path d="M8 100 C10 78 26 66 50 63 C74 66 90 78 92 100 Z" fill="url(#cloak)" stroke="#000" stroke-width="1.2"/>
<path d="M30 76 C38 86 40 94 40 100 M70 76 C62 86 60 94 60 100" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1.4"/>
<path d="M18 92 L84 70" stroke="#2a1a0c" stroke-width="4"/><path d="M18 92 L84 70" stroke="#6a4626" stroke-width="2"/>
<circle cx="50" cy="81" r="3" fill="url(#gold)" stroke="#000" stroke-width=".6"/>
<path d="M50 11 C33 11 24 26 24 43 C24 56 28 64 35 70 L65 70 C72 64 76 56 76 43 C76 26 67 11 50 11 Z" fill="url(#hood)" stroke="#000" stroke-width="1.2"/>
<path d="M50 11 C60 12 70 22 74 36 C70 28 62 20 50 18 Z" fill="#fff" opacity=".06"/>
<path d="M50 28 C39 28 34 37 34 47 C34 58 41 66 50 66 C59 66 66 58 66 47 C66 37 61 28 50 28 Z" fill="url(#face)"/>
<path d="M41 47.6 L47.2 49 M52.8 49 L59 47.6" stroke="#d9a85a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".9"/>
<circle cx="44.6" cy="48.5" r=".75" fill="#fff3d0"/><circle cx="55.4" cy="48.5" r=".75" fill="#fff3d0"/>
<path d="M38 54 C42 60 58 60 62 54 C58 63 42 63 38 54 Z" fill="#000" opacity=".35"/>
<path d="M50 11 C67 11 76 26 76 43 C76 56 72 64 65 70" fill="none" stroke="url(#rim)" stroke-width="2.4"/>
</svg>`;
}
function CT() {
  return `<svg ${kT} viewBox="0 0 480 368"><defs>
<radialGradient id="g" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#2a2219" stop-opacity=".9"/><stop offset="1" stop-color="#0a0806" stop-opacity="0"/></radialGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f1913"/><stop offset="1" stop-color="#0b0907"/></linearGradient>
</defs>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
<ellipse cx="240" cy="184" rx="230" ry="190" fill="url(#g)"/>
<g fill="url(#b)" opacity=".7" filter="url(#soft)">
<circle cx="240" cy="54" r="38"/>
<path d="M240 96 C206 96 170 104 150 120 C132 134 120 168 104 212 C96 236 86 262 80 290 L100 296 C112 262 126 230 140 204 L150 270 L162 368 L226 368 L236 290 L244 290 L254 368 L318 368 L330 270 L340 204 C354 230 368 262 380 296 L400 290 C394 262 384 236 376 212 C360 168 348 134 330 120 C310 104 274 96 240 96 Z"/>
</g>
</svg>`;
}
function wT() {
  let e4 = ``;
  for (let t2 = 0; t2 < 8; t2++) {
    let n2 = t2 / 8 * Math.PI * 2, r2 = n2 + Math.PI / 8, i2 = n2 - Math.PI / 8, a2 = 32 + Math.cos(n2) * 29, o2 = 32 + Math.sin(n2) * 29, s2 = 32 + Math.cos(r2) * 12, c2 = 32 + Math.sin(r2) * 12, l2 = 32 + Math.cos(i2) * 12, u2 = 32 + Math.sin(i2) * 12;
    e4 += `M${a2.toFixed(1)} ${o2.toFixed(1)} L${s2.toFixed(1)} ${c2.toFixed(1)} L${l2.toFixed(1)} ${u2.toFixed(1)} Z `;
  }
  return `<svg ${kT} viewBox="0 0 64 64"><defs>${AT}
<radialGradient id="emb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1c0"/><stop offset=".4" stop-color="#ff9a3a"/><stop offset="1" stop-color="#a0300a" stop-opacity="0"/></radialGradient></defs>
<circle cx="32" cy="32" r="30" fill="url(#emb)" opacity=".35"/>
<path d="${e4}" fill="url(#gold)" stroke="#2a1606" stroke-width=".8"/>
<circle cx="32" cy="32" r="22" fill="none" stroke="url(#gold)" stroke-width="1.6"/>
<circle cx="32" cy="32" r="6" fill="url(#ruby)" stroke="#000" stroke-width=".8"/>
</svg>`;
}
function TT() {
  return `<svg ${kT} viewBox="0 0 600 40"><defs>${AT}
<linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="600" y2="0">
<stop offset="0" stop-color="#c8a24a" stop-opacity="0"/><stop offset=".3" stop-color="#d9b562" stop-opacity=".95"/>
<stop offset=".7" stop-color="#d9b562" stop-opacity=".95"/><stop offset="1" stop-color="#c8a24a" stop-opacity="0"/></linearGradient></defs>
<path d="M10 20 L262 20 M338 20 L590 20" stroke="url(#fade)" stroke-width="1.6"/>
<path d="M60 24 L262 24 M338 24 L540 24" stroke="url(#fade)" stroke-width=".8" opacity=".6"/>
<path d="M300 4 L318 20 L300 36 L282 20 Z" fill="url(#gold)" stroke="#2a1606" stroke-width="1"/>
<path d="M300 11 L309 20 L300 29 L291 20 Z" fill="url(#ruby)"/>
<path d="M262 20 L272 14 L282 20 L272 26 Z M338 20 L328 14 L318 20 L328 26 Z" fill="url(#gold)" stroke="#2a1606" stroke-width=".8"/>
<circle cx="248" cy="20" r="2.4" fill="url(#gold)"/><circle cx="352" cy="20" r="2.4" fill="url(#gold)"/>
</svg>`;
}
function ET(e4) {
  return `<svg ${kT} viewBox="0 0 48 48"><defs>${AT}</defs><g stroke="#1a0e04" stroke-width="1" stroke-linejoin="round">${PT[(e4 % PT.length + PT.length) % PT.length]}</g></svg>`;
}
function DT(e4) {
  let t2 = e4 === `current` ? `#ffd27a` : e4 === `active` ? `#7fc4ff` : `#4a4a4a`, n2 = e4 === `current` ? `#fff3c8` : e4 === `active` ? `#d6ecff` : `#6a6a6a`;
  return `<svg ${kT} viewBox="0 0 48 48"><defs>${AT}
<radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${n2}"/><stop offset=".45" stop-color="${t2}" stop-opacity=".75"/><stop offset="1" stop-color="${t2}" stop-opacity="0"/></radialGradient></defs>
<circle cx="24" cy="24" r="22" fill="url(#iron)" stroke="#000" stroke-width="1.2"/>
<circle cx="24" cy="24" r="18" fill="#08090b" stroke="${e4 === `inactive` ? `#3a3a3a` : `url(#gold)`}" stroke-width="1.4"/>
${e4 === `inactive` ? `` : `<circle cx="24" cy="24" r="17" fill="url(#gl)" opacity=".7"/>`}
<path d="M24 8 L27 21 L40 24 L27 27 L24 40 L21 27 L8 24 L21 21 Z" fill="${n2}" opacity="${e4 === `inactive` ? 0.35 : 0.95}"/>
<circle cx="24" cy="24" r="12" fill="none" stroke="${n2}" stroke-width="1" stroke-dasharray="2 3" opacity="${e4 === `inactive` ? 0.3 : 0.8}"/>
</svg>`;
}
function OT(e4) {
  let t2 = `#e2bd6a`, n2 = `#2a2620`;
  return `<svg ${kT} viewBox="0 0 40 56">
<path d="M20 2 C9 2 3 10 3 22 L3 36 C3 47 10 54 20 54 C30 54 37 47 37 36 L37 22 C37 10 31 2 20 2 Z" fill="#141210" stroke="#8c7a58" stroke-width="2"/>
<path d="M20 3 C10 3 4 10 4 21 L19 21 L19 3 Z" fill="${e4 === `left` ? t2 : n2}"/>
<path d="M21 3 C30 3 36 10 36 21 L21 21 L21 3 Z" fill="${e4 === `right` ? t2 : n2}"/>
<rect x="17.5" y="8" width="5" height="9" rx="2.5" fill="${e4 === `wheel` ? t2 : `#4a4236`}" stroke="#000" stroke-width=".8"/>
<path d="M3 22 L37 22" stroke="#8c7a58" stroke-width="1.4"/>
</svg>`;
}
var kT, AT, jT, MT, NT, PT, FT = t((() => {
  kT = `xmlns="http://www.w3.org/2000/svg"`, AT = `
<linearGradient id="iron" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#8a8e96"/><stop offset=".28" stop-color="#43464c"/>
  <stop offset=".62" stop-color="#1c1d20"/><stop offset="1" stop-color="#0a0a0b"/>
</linearGradient>
<linearGradient id="ironV" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#6e727a"/><stop offset=".45" stop-color="#2a2c30"/>
  <stop offset="1" stop-color="#0c0c0d"/>
</linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff2c2"/><stop offset=".35" stop-color="#ddb55e"/>
  <stop offset=".7" stop-color="#8c6224"/><stop offset="1" stop-color="#4a3210"/>
</linearGradient>
<radialGradient id="dome" cx=".35" cy=".3" r=".75">
  <stop offset="0" stop-color="#b9bcc2"/><stop offset=".35" stop-color="#55585e"/>
  <stop offset="1" stop-color="#0d0d0f"/>
</radialGradient>
<radialGradient id="ruby" cx=".35" cy=".3" r=".8">
  <stop offset="0" stop-color="#ffb3a6"/><stop offset=".25" stop-color="#e2332b"/>
  <stop offset=".7" stop-color="#6e0710"/><stop offset="1" stop-color="#240206"/>
</radialGradient>
<radialGradient id="sapphire" cx=".35" cy=".3" r=".8">
  <stop offset="0" stop-color="#c7e2ff"/><stop offset=".25" stop-color="#3f7dff"/>
  <stop offset=".7" stop-color="#0b2277"/><stop offset="1" stop-color="#030a2a"/>
</radialGradient>
<radialGradient id="topaz" cx=".35" cy=".3" r=".8">
  <stop offset="0" stop-color="#fff1c4"/><stop offset=".3" stop-color="#f0b43c"/>
  <stop offset=".75" stop-color="#7a4a0c"/><stop offset="1" stop-color="#2a1604"/>
</radialGradient>`, jT = { w: 1240, h: 132 }, MT = [[150, 132], [150, 36], [174, 22], [470, 22], [492, 6], [748, 6], [770, 22], [1066, 22], [1090, 36], [1090, 132]], NT = { sorceress: [`#2b2a6a`, `#0b0a1e`], barbarian: [`#5a2412`, `#1a0904`], necromancer: [`#24402e`, `#070f0a`] }, PT = [`<path d="M6 40 C8 22 16 10 24 10 C32 10 40 22 42 40 Z" fill="url(#gold)"/><path d="M14 40 C15 28 19 20 24 20 C29 20 33 28 34 40 Z" fill="#0a0806"/><path d="M18 40 L20 34 L22 40 M26 40 L28 33 L30 40" fill="#c9b48a"/>`, `<path d="M4 24 Q24 6 44 24 Q24 42 4 24 Z" fill="url(#gold)"/><circle cx="24" cy="24" r="8" fill="#0a0806"/><circle cx="24" cy="24" r="3.6" fill="url(#ruby)"/>`, `<path d="M14 42 L16 16 L12 16 L12 8 L17 8 L17 12 L21 12 L21 8 L27 8 L27 12 L31 12 L31 8 L36 8 L36 16 L32 16 L34 42 Z" fill="url(#gold)"/><path d="M21 42 L21 32 Q24 28 27 32 L27 42 Z M22 20 L26 20 L26 25 L22 25 Z" fill="#0a0806"/>`, `<path d="M22 4 L26 4 L26 28 L22 28 Z" fill="url(#gold)"/><path d="M16 28 L32 28 L32 31 L16 31 Z" fill="url(#gold)"/><path d="M8 44 L12 34 L36 34 L40 44 Z" fill="#6b6253"/><path d="M22 31 L26 31 L25 36 L23 36 Z" fill="url(#gold)"/>`, `<path d="M6 36 L8 14 L16 24 L24 8 L32 24 L40 14 L42 36 Z" fill="url(#gold)"/><path d="M6 36 L42 36 L42 42 L6 42 Z" fill="url(#gold)"/><circle cx="24" cy="30" r="3.4" fill="url(#ruby)"/>`, `<path d="M8 10 L24 14 L40 10 L40 38 L24 42 L8 38 Z" fill="url(#gold)"/><path d="M24 14 L24 42" stroke="#2a1606" stroke-width="1.6"/><path d="M12 18 L20 20 M12 24 L20 26 M28 20 L36 18 M28 26 L36 24" stroke="#2a1606" stroke-width="1.2"/>`];
}));
function IT(e4, t2 = WT, n2 = 32) {
  return `<svg ${HT} viewBox="0 0 ${n2} ${n2}"><defs>
<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t2[0]}"/><stop offset="1" stop-color="${t2[1]}"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset="1" stop-color="#8c6224"/></linearGradient>
</defs><g fill="url(#f)" stroke="${UT}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">${e4}</g></svg>`;
}
function LT(e4, t2, n2 = `url(#f)`) {
  return `<path d="${e4}" fill="none" stroke="${UT}" stroke-width="${t2 + 2}"/><path d="${e4}" fill="none" stroke="${n2}" stroke-width="${t2}"/>`;
}
function RT(e4, t2, n2, r2, i2) {
  let a2 = [], o2 = Math.PI * 2 / i2;
  for (let s2 = 0; s2 < i2; s2++) {
    let i3 = s2 * o2, c2 = (n3, r3) => `${(e4 + Math.cos(n3) * r3).toFixed(2)} ${(t2 + Math.sin(n3) * r3).toFixed(2)}`;
    a2.push(c2(i3 - o2 * 0.32, r2), c2(i3 - o2 * 0.17, n2), c2(i3 + o2 * 0.17, n2), c2(i3 + o2 * 0.32, r2));
  }
  return `M${a2.join(` L`)} Z`;
}
function zT(e4, t2, n2) {
  return `<svg ${HT} viewBox="0 0 ${e4} ${t2}"><g fill="none" stroke="#c9b48a" stroke-opacity=".16" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${n2}</g></svg>`;
}
function BT(e4) {
  let t2 = ZT.get(e4);
  return t2 || (t2 = yw(YT[e4]()), ZT.set(e4, t2)), t2;
}
function VT(e4) {
  let t2 = `ghost:${e4}`, n2 = ZT.get(t2);
  return n2 || (n2 = yw(XT[e4]()), ZT.set(t2, n2)), n2;
}
var HT, UT, WT, GT, KT, qT, JT, YT, XT, ZT, QT = t((() => {
  Cw(), HT = `xmlns="http://www.w3.org/2000/svg"`, UT = `#0b0806`, WT = [`#fbe9b6`, `#9a7234`], GT = [`#f4ead2`, `#9c8c6c`], KT = [`#eef1f5`, `#6c727c`], qT = `M16 2.5 C18 8 24 10.5 24.5 17.5 C25 23.5 21 28.5 16 28.5 C11 28.5 7 24.5 7.5 18.5 C7.8 15 9.5 12.5 11.5 11 C11.5 14 12.5 16 14 17 C13.5 11.5 15.5 7 16 2.5 Z`, JT = `M16 15 C17.5 18 20 19.5 20 22.5 C20 25.5 18 27 16 27 C14 27 12 25.5 12 23 C12 21 13.2 19.8 14.2 19 C14.4 20.5 15 21.2 15.6 21.6 C15.4 19 15.8 17 16 15 Z`, YT = { str: () => IT(`<path d="M8 14 L29 14 L29 19.5 C29 24 26.2 27 22.5 28 L22.5 31 L12 31 L12 27.6 C9.2 26.2 7.6 23.4 7.6 19.5 Z"/>
<rect x="8" y="7.8" width="5.6" height="9.4" rx="2.8"/><rect x="13.6" y="6.6" width="5.6" height="10.4" rx="2.8"/>
<rect x="19.2" y="7.2" width="5.6" height="9.8" rx="2.8"/><rect x="24.6" y="8.8" width="4.6" height="8.4" rx="2.3"/>
<path d="M4.4 17.6 C4.4 15.1 6 13.8 8 13.8 L16.2 13.8 C18.2 13.8 19 15 19 16.3 C19 17.7 18 18.7 16.4 18.7 L11.2 18.7 L11.2 22.2 C7 22.2 4.4 20.6 4.4 17.6 Z"/>`, GT), dex: () => IT(`${LT(`M7 25 L25 7`, 2.2)}<path d="M29 3 L20.6 5.4 L26.6 11.4 Z"/>
<path d="M9.6 22.4 L4.2 21.6 L2.6 25.8 L7.2 26.2 Z"/><path d="M9.6 22.4 L10.4 27.8 L6.2 29.4 L5.8 24.8 Z"/>`, GT), vit: () => IT(`<path d="M16 28.5 C9 23.5 3.6 18.8 3.6 12.6 C3.6 8.4 6.8 5.2 10.6 5.2 C13 5.2 15 6.6 16 8.8 C17 6.6 19 5.2 21.4 5.2 C25.2 5.2 28.4 8.4 28.4 12.6 C28.4 18.8 23 23.5 16 28.5 Z"/>
<path d="M9.4 9.6 C8 10.4 7.2 12 7.4 13.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>`, [`#ff8a7a`, `#7a0a0e`]), ene: () => IT(`<path d="M16 2 L24.5 10.5 L21 29 L11 29 L7.5 10.5 Z"/><path d="M7.5 10.5 L16 14.5 L24.5 10.5 M16 14.5 L16 29 M16 2 L16 14.5" fill="none" stroke="${UT}" stroke-opacity=".7"/>
<path d="M10 11.6 L15 14 L14 26" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>`, [`#e2d8ff`, `#5a3ab8`]), damage: () => IT(`${LT(`M6.5 25.5 L23.5 8.5`, 2.4, `url(#f)`)}${LT(`M25.5 25.5 L8.5 8.5`, 2.4, `url(#f)`)}
<path d="M24.5 4.5 L27.5 4.5 L27.5 7.5 L23.5 8.5 Z M7.5 4.5 L4.5 4.5 L4.5 7.5 L8.5 8.5 Z"/>
${LT(`M6.5 19.5 L12.5 25.5`, 1.8, `url(#g)`)}${LT(`M25.5 19.5 L19.5 25.5`, 1.8, `url(#g)`)}
<circle cx="4.8" cy="27.2" r="2.1" fill="url(#g)"/><circle cx="27.2" cy="27.2" r="2.1" fill="url(#g)"/>`, KT), attackRating: () => IT(`<circle cx="16" cy="16" r="11.5" fill="none" stroke="${UT}" stroke-width="4"/><circle cx="16" cy="16" r="11.5" fill="none" stroke="url(#f)" stroke-width="2"/>
<circle cx="16" cy="16" r="6" fill="none" stroke="${UT}" stroke-width="4"/><circle cx="16" cy="16" r="6" fill="none" stroke="url(#f)" stroke-width="2"/>
<circle cx="16" cy="16" r="2.2"/>${LT(`M16 1.5 L16 7 M16 25 L16 30.5 M1.5 16 L7 16 M25 16 L30.5 16`, 1.6)}`, WT), defense: () => IT(`<path d="M16 2.8 L27.4 6.4 L27.4 15 C27.4 22 22.4 26.8 16 29.4 C9.6 26.8 4.6 22 4.6 15 L4.6 6.4 Z"/>
<path d="M16 6 L16 26 M8 12 L24 12" fill="none" stroke="${UT}" stroke-opacity=".6" stroke-width="1.4"/>
<path d="M16 2.8 L27.4 6.4 L27.4 9 L16 5.6 L4.6 9 L4.6 6.4 Z" fill="#fff" fill-opacity=".25" stroke="none"/>`, KT), block: () => IT(`<circle cx="16" cy="16" r="12.5"/><circle cx="16" cy="16" r="9" fill="none" stroke="${UT}" stroke-opacity=".55"/>
<circle cx="16" cy="16" r="4" fill="url(#g)"/><path d="M6 6 L26 26" stroke="#ffe9b0" stroke-width="1.4" stroke-opacity=".0"/>
<path d="M3 23 L10 16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>`, KT), resFire: () => IT(`<path d="${qT}"/><path d="${JT}" fill="#ffe9a0" stroke="none"/>`, [`#ffd27a`, `#c2300a`]), resCold: () => IT(LT(`M16 3 L16 29 M4.7 9.5 L27.3 22.5 M4.7 22.5 L27.3 9.5 M16 8 L12.5 4.5 M16 8 L19.5 4.5 M16 24 L12.5 27.5 M16 24 L19.5 27.5 M9 12 L5 12.6 M9 12 L7.6 8.2 M23 20 L27 19.4 M23 20 L24.4 23.8 M9 20 L5 19.4 M9 20 L7.6 23.8 M23 12 L27 12.6 M23 12 L24.4 8.2`, 1.8), [`#ecfbff`, `#3f9fd8`]), resLightning: () => IT(`<path d="M19.5 2 L6.5 18 L14.5 18 L11 30 L25.5 12.5 L17.5 12.5 L22 2 Z"/>`, [`#ffffff`, `#6f86ff`]), resPoison: () => IT(`<path d="M16 2.5 C16 2.5 6.5 13.5 6.5 20 C6.5 25.4 10.8 29.5 16 29.5 C21.2 29.5 25.5 25.4 25.5 20 C25.5 13.5 16 2.5 16 2.5 Z"/>
<circle cx="13" cy="20" r="2.4" fill="#0f2a06" stroke="none"/><circle cx="19.5" cy="23" r="1.6" fill="#0f2a06" stroke="none"/>
<path d="M11 13.5 C10 15.5 9.8 17 10 18.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>`, [`#c8ff8a`, `#2f7a12`]), gold: () => IT(`<ellipse cx="16" cy="23.5" rx="11" ry="4.6"/><ellipse cx="16" cy="19.5" rx="11" ry="4.6"/><ellipse cx="16" cy="15.5" rx="11" ry="4.6"/>
<ellipse cx="16" cy="11.5" rx="11" ry="4.6"/><ellipse cx="16" cy="11.5" rx="6" ry="2.2" fill="none" stroke="${UT}" stroke-opacity=".55"/>`, [`#fff0b0`, `#a06a12`]), life: () => IT(`<path d="M16 3 C16 3 7 14 7 20 C7 25 11 29 16 29 C21 29 25 25 25 20 C25 14 16 3 16 3 Z"/>`, [`#ff8a7a`, `#7a0a0e`]), mana: () => IT(`<circle cx="16" cy="16" r="12"/><path d="M10 12 C11 9.5 13 8.2 15.5 8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`, [`#a8c8ff`, `#14309a`]), stamina: () => IT(`<path d="M9 4 L17 4 L17 18 L27 21 C28.5 21.5 29 23 29 24 L29 28 L4 28 L4 23 L9 21 Z"/><path d="M9 10 L17 10" fill="none" stroke="${UT}" stroke-opacity=".5"/>`, [`#ffe9a0`, `#a87414`]), xp: () => IT(`<path d="M16 2 L19.6 11.6 L30 12.2 L22 18.6 L24.8 28.8 L16 23 L7.2 28.8 L10 18.6 L2 12.2 L12.4 11.6 Z"/>`, WT), menuCharacter: () => IT(`<path d="M3.5 30 C4.5 23.5 9 21 16 21 C23 21 27.5 23.5 28.5 30 Z"/>
<path d="M8.6 15 C8.6 8.4 11.8 4.4 16 4.4 C20.2 4.4 23.4 8.4 23.4 15 L23.4 20.2 L8.6 20.2 Z"/>
<path d="M10.8 12.6 L21.2 12.6 M16 12.6 L16 18.6" fill="none" stroke="${UT}" stroke-width="1.8"/>
<path d="M16 4.4 L16 1.6" fill="none" stroke="url(#g)" stroke-width="1.6"/>`, KT), menuInventory: () => IT(`<path d="M5.5 13 L26.5 13 L28.5 29 L3.5 29 Z"/>
<path d="M6 13.5 C6 8.6 9.6 6 16 6 C22.4 6 26 8.6 26 13.5 L26 18.5 L6 18.5 Z" fill="url(#g)"/>
<rect x="13.6" y="16" width="4.8" height="5.6" rx="1" fill="${UT}"/><path d="M11 6.6 C11 3.6 13 2.2 16 2.2 C19 2.2 21 3.6 21 6.6" fill="none" stroke="${UT}" stroke-width="3.4"/>
<path d="M11 6.6 C11 3.6 13 2.2 16 2.2 C19 2.2 21 3.6 21 6.6" fill="none" stroke="url(#f)" stroke-width="1.6"/>`, [`#d9b47a`, `#6a4220`]), menuSkills: () => IT(`${LT(`M16 28 L16 17 M16 17 L8 9 M16 17 L24 9 M16 21 L25 21`, 1.8, `url(#g)`)}
<path d="M16 23.5 L19.5 27 L16 30.5 L12.5 27 Z"/><path d="M8 4.5 L11.5 8 L8 11.5 L4.5 8 Z" fill="#9ad0ff"/>
<path d="M24 4.5 L27.5 8 L24 11.5 L20.5 8 Z" fill="#ff9a6a"/><path d="M26 17.5 L29.5 21 L26 24.5 L22.5 21 Z" fill="#b48cff"/>
<path d="M16 13.5 L19.5 17 L16 20.5 L12.5 17 Z"/>`, WT), menuQuests: () => IT(`<path d="M8 6 L24 6 L24 26 L8 26 Z" fill="#d9c79a"/>
<path d="M11 11 L21 11 M11 15 L21 15 M11 19 L18 19" fill="none" stroke="${UT}" stroke-opacity=".75" stroke-width="1.3"/>
<rect x="5" y="3.5" width="22" height="4.6" rx="2.3"/><rect x="5" y="24" width="22" height="4.6" rx="2.3"/>
<circle cx="22" cy="22.5" r="3.6" fill="#9c1a14"/>`, [`#e9cf8a`, `#7a5a22`]), menuAutomap: () => IT(`<path d="M3 7 L11 4 L21 7 L29 4 L29 25 L21 28 L11 25 L3 28 Z" fill="#cdb98a"/>
<path d="M11 4 L11 25 M21 7 L21 28" fill="none" stroke="${UT}" stroke-opacity=".5"/>
<path d="M6 21 C9 17 12 19 14 15 C16 11 19 13 22 11" fill="none" stroke="#7a1a12" stroke-width="1.6" stroke-dasharray="2 1.6"/>
<path d="M22.5 8.5 L26 12 M26 8.5 L22.5 12" fill="none" stroke="#9c1a14" stroke-width="2"/>`, [`#e9cf8a`, `#7a5a22`]), menuMenu: () => IT(`<path d="${RT(16, 16, 14, 10.4, 9)} M16 11.4 A4.6 4.6 0 1 0 16.01 11.4 Z" fill-rule="evenodd"/>
<circle cx="16" cy="16" r="7.6" fill="none" stroke="${UT}" stroke-opacity=".5"/>`, KT), run: () => IT(`<circle cx="20" cy="5.6" r="3.4"/>${LT(`M17.5 10.5 L13.5 18.5 M17.5 10.5 L23 14.5 L27 12.5 M17.5 10.5 L11 12 L8 16 M13.5 18.5 L19 22 L18 29 M13.5 18.5 L9.5 24 L4 24.5`, 2.6)}`, GT), walk: () => IT(`<circle cx="16.5" cy="5.6" r="3.4"/>${LT(`M16 10.5 L15 19 M16 10.5 L20 16 L21 19 M16 10.5 L12 15.5 L11.5 19 M15 19 L19 24 L20 29.5 M15 19 L12.5 24.5 L11 29.5`, 2.6)}`, GT), lock: () => IT(`<path d="M10 14 L10 10 C10 6 12.6 3.6 16 3.6 C19.4 3.6 22 6 22 10 L22 14" fill="none" stroke="${UT}" stroke-width="4.4"/>
<path d="M10 14 L10 10 C10 6 12.6 3.6 16 3.6 C19.4 3.6 22 6 22 10 L22 14" fill="none" stroke="url(#f)" stroke-width="2.4"/>
<rect x="6.5" y="13.5" width="19" height="15" rx="2"/><path d="M16 18.5 L16 23.5" fill="none" stroke="${UT}" stroke-width="2.4"/>`, KT), skull: () => IT(`<path d="M16 3 C9 3 5 8 5 14 C5 18 7 20.5 9 21.6 L9 26 L23 26 L23 21.6 C25 20.5 27 18 27 14 C27 8 23 3 16 3 Z"/>
<path d="M9.5 13.5 C10.5 11 13.6 11 14 14 C13.6 17 10.4 17.2 9.5 13.5 Z M22.5 13.5 C21.5 11 18.4 11 18 14 C18.4 17 21.6 17.2 22.5 13.5 Z" fill="${UT}"/>
<path d="M16 17 L14.4 20.6 L17.6 20.6 Z" fill="${UT}"/><path d="M12.5 23 L12.5 26 M16 23 L16 26 M19.5 23 L19.5 26" fill="none" stroke="${UT}" stroke-width="1.2"/>`, GT), close: () => IT(`${LT(`M8 8 L24 24 M24 8 L8 24`, 3)}`, [`#e9d6a6`, `#8a6a34`]), plus: () => IT(`${LT(`M16 6 L16 26 M6 16 L26 16`, 3.6)}`, [`#fff3c8`, `#c8a24a`]), check: () => IT(`${LT(`M6 17 L13 24 L26 8`, 3.2)}`, [`#fff3c8`, `#c8a24a`]), exclaim: () => IT(`<path d="M13 3 L19 3 L18 20 L14 20 Z"/><circle cx="16" cy="26" r="3"/>`, [`#fff3c8`, `#d9a02a`]), chevronUp: () => IT(`${LT(`M7 20 L16 11 L25 20`, 3)}`, WT), swords: () => YT.damage(), hourglass: () => IT(`<path d="M8 3 L24 3 L24 6 C24 11 19 14 17.5 16 C19 18 24 21 24 26 L24 29 L8 29 L8 26 C8 21 13 18 14.5 16 C13 14 8 11 8 6 Z"/>
<path d="M11 26 C11 23 14 21 16 19.5 C18 21 21 23 21 26 Z" fill="#fff0b0" stroke="none"/>`, WT) }, XT = { head: () => zT(96, 96, `<path d="M22 64 C20 36 32 18 48 18 C64 18 76 36 74 64 L66 70 L62 52 L34 52 L30 70 Z"/><path d="M36 42 L60 42 M48 42 L48 60"/>`), amulet: () => zT(48, 48, `<path d="M12 6 C12 18 18 24 24 26 C30 24 36 18 36 6"/><path d="M24 26 L31 34 L24 44 L17 34 Z"/>`), body: () => zT(96, 144, `<path d="M28 18 L40 12 L56 12 L68 18 L84 30 L78 58 L70 56 L70 126 L26 126 L26 56 L18 58 L12 30 Z"/><path d="M40 12 C42 22 54 22 56 12 M48 26 L48 118 M30 78 L66 78"/>`), mainHand: () => zT(96, 192, `<path d="M48 14 L56 30 L56 140 L40 140 L40 30 Z"/><path d="M26 140 L70 140 M44 146 L52 146 L52 170 L44 170 Z"/><circle cx="48" cy="178" r="6"/>`), offHand: () => zT(96, 192, `<path d="M48 26 L80 36 L80 96 C80 130 66 152 48 166 C30 152 16 130 16 96 L16 36 Z"/><path d="M48 40 L48 150 M24 80 L72 80"/>`), ringLeft: () => zT(48, 48, `<circle cx="24" cy="28" r="12"/><path d="M18 14 L24 8 L30 14"/>`), ringRight: () => zT(48, 48, `<circle cx="24" cy="28" r="12"/><path d="M18 14 L24 8 L30 14"/>`), belt: () => zT(96, 48, `<path d="M6 16 L90 16 L90 32 L6 32 Z"/><rect x="38" y="12" width="20" height="24" rx="2"/><path d="M48 20 L48 28"/>`), gloves: () => zT(96, 96, `<path d="M32 82 L32 50 L26 40 L28 30 L36 36 L38 18 L46 18 L46 32 L50 14 L58 14 L58 32 L62 18 L70 20 L68 38 L72 30 L78 34 L70 56 L66 82 Z"/>`), boots: () => zT(96, 96, `<path d="M34 14 L58 14 L58 58 L80 66 C84 68 86 72 86 76 L86 84 L18 84 L18 74 L34 66 Z"/><path d="M34 34 L58 34"/>`) }, ZT = /* @__PURE__ */ new Map();
}));
function $T(e4) {
  return rE.format(Math.round(e4));
}
function eE(e4) {
  return `${Math.round(e4)}%`;
}
function tE(e4) {
  return iE[e4] ?? String(e4);
}
function nE(e4) {
  return e4.length ? e4[0].toUpperCase() + e4.slice(1) : e4;
}
var rE, iE, aE = t((() => {
  rE = new Intl.NumberFormat(`en-US`), iE = [``, `I`, `II`, `III`, `IV`, `V`, `VI`, `VII`, `VIII`, `IX`, `X`];
}));
function oE(e4) {
  let t2 = W(`uh-tl c-${e4.color}${e4.size === `title` ? ` uh-tl--title` : e4.size === `small` ? ` uh-tl--small` : ``}`);
  return t2.textContent = e4.text, t2;
}
function sE(e4, t2 = ``) {
  let n2 = W(`uh-tip ${t2}`), r2 = W(`uh-tip__lines`);
  for (let t3 of e4) r2.appendChild(oE(t3));
  return n2.appendChild(r2), n2;
}
function cE(e4, t2 = {}) {
  let n2 = sE(e4.lines, `uh-tip--item q-${e4.quality}${e4.unusable ? ` is-unusable` : ``}`);
  if (e4.socketCount > 0) {
    let t3 = W(`uh-tip__sockets`);
    for (let n3 = 0; n3 < e4.socketCount; n3++) {
      let r2 = W(`uh-sock`), i2 = e4.socketed[n3];
      i2 ? r2.appendChild(hw(i2, `uh-sock__gem`)) : r2.classList.add(`is-empty`), t3.appendChild(r2);
    }
    n2.appendChild(t3);
  }
  if (e4.quantity !== void 0 && !e4.lines.some((e5) => /quantity/i.test(e5.text)) && n2.appendChild(W(`uh-tip__qty`, G(`c-grey`, `Quantity: `), G(`uh-num c-white`, $T(e4.quantity)))), t2.price) {
    let e5 = W(`uh-tip__price${t2.price.bad ? ` is-bad` : ``}`);
    e5.append(G(`uh-tip__price-label`, `${t2.price.label} `), G(`uh-num uh-tip__price-amt`, $T(t2.price.amount)), G(`uh-tip__coin`)), n2.appendChild(e5);
  }
  return t2.hint && n2.appendChild(W(`uh-tip__hint`, t2.hint)), n2;
}
function lE(e4, t2 = [], n2 = ``) {
  let r2 = W(`uh-tip uh-tip--text ${n2}`);
  r2.appendChild(W(`uh-tip__title`, e4));
  for (let e5 of t2) typeof e5 == `string` ? r2.appendChild(W(`uh-tip__row`, e5)) : r2.appendChild(W(`uh-tip__row uh-tip__row--kv`, G(`uh-tip__k`, e5[0]), G(`uh-num uh-tip__v`, e5[1])));
  return r2;
}
function uE(e4, t2) {
  let n2 = W(`uh-tip uh-tip--key`);
  return n2.appendChild(G(`uh-tip__label`, e4)), t2 && n2.appendChild(fw(`span`, `uh-key uh-key--tip`, t2)), n2;
}
var dE, fE, pE, mE = t((() => {
  Cw(), aE(), dE = 8, fE = 10, pE = class {
    getScale;
    el;
    owner = null;
    anchor = null;
    placement = `above`;
    constructor(e4, t2) {
      this.getScale = t2, this.el = W(`uh-tip-host`), this.el.setAttribute(`role`, `tooltip`), e4.appendChild(this.el);
    }
    get visible() {
      return this.owner !== null;
    }
    isOwner(e4) {
      return this.owner === e4;
    }
    show(e4, t2, n2 = {}) {
      this.owner = n2.owner ?? e4, this.anchor = t2, this.placement = n2.placement ?? `above`, this.el.className = `uh-tip-host is-visible${n2.variant ? ` ${n2.variant}` : ``}`, this.el.replaceChildren(e4), this.position();
    }
    move(e4) {
      this.owner && (this.anchor = e4, this.position());
    }
    hide(e4) {
      e4 !== void 0 && e4 !== this.owner || (this.owner = null, this.anchor = null, this.el.className = `uh-tip-host`, this.el.replaceChildren());
    }
    position() {
      let e4 = this.anchor;
      if (!e4) return;
      let t2 = this.getScale() || 1, n2 = window.innerWidth, r2 = window.innerHeight;
      this.el.style.left = `0px`, this.el.style.top = `0px`;
      let i2 = this.el.getBoundingClientRect(), a2 = i2.width, o2 = i2.height, s2 = e4.left + e4.width / 2 - a2 / 2, c2, l2 = e4.top - fE - dE, u2 = r2 - e4.bottom - fE - dE;
      if (this.placement === `side` || this.placement === `sideLeft`) {
        let t3 = e4.right + fE, r3 = e4.left - fE - a2, i3 = t3 + a2 <= n2 - dE, l3 = r3 >= dE;
        s2 = this.placement === `sideLeft` ? l3 ? r3 : i3 ? t3 : Math.max(dE, n2 - dE - a2) : i3 ? t3 : l3 ? r3 : Math.max(dE, n2 - dE - a2), c2 = e4.top + e4.height / 2 - o2 / 2;
      } else if (this.placement === `below` ? u2 >= o2 || u2 >= l2 : l2 < o2 && u2 >= o2) c2 = e4.bottom + fE;
      else if (l2 >= o2) c2 = e4.top - fE - o2;
      else {
        let t3 = e4.right + fE;
        s2 = t3 + a2 <= n2 - dE ? t3 : e4.left - fE - a2, c2 = e4.top + e4.height / 2 - o2 / 2;
      }
      s2 = Math.min(Math.max(dE, s2), Math.max(dE, n2 - dE - a2)), c2 = Math.min(Math.max(dE, c2), Math.max(dE, r2 - dE - o2)), this.el.style.left = `${(s2 / t2).toFixed(1)}px`, this.el.style.top = `${(c2 / t2).toFixed(1)}px`;
    }
  };
})), hE, gE = t((() => {
  Cw(), aE(), dw(), hE = class {
    getScale;
    el;
    icon;
    hint;
    item = null;
    fw = 0;
    fh = 0;
    lastX = -9999;
    lastY = -9999;
    hintText = ``;
    constructor(e4, t2) {
      this.getScale = t2, this.el = W(`uh-cursor-item`), this.icon = hw(``, `uh-cursor-item__icon`), this.hint = W(`uh-cursor-item__hint`), this.el.append(this.icon, this.hint), e4.appendChild(this.el);
    }
    get held() {
      return this.item;
    }
    render(e4) {
      this.item = e4;
      let t2 = !!e4;
      if (document.documentElement.classList.toggle(`uh-holding`, t2), this.el.classList.toggle(`is-visible`, t2), !e4) {
        this.setHint(null);
        return;
      }
      this.fw = e4.w * uw.cell, this.fh = e4.h * uw.cell, this.icon.style.width = `${this.fw}px`, this.icon.style.height = `${this.fh}px`, this.icon.getAttribute(`src`) !== e4.icon && (this.icon.src = e4.icon), this.el.className = `uh-cursor-item is-visible q-${e4.quality}${e4.unusable ? ` is-unusable` : ``}`, this.place();
    }
    move(e4, t2) {
      this.lastX = e4, this.lastY = t2, this.item && this.place();
    }
    setHint(e4, t2) {
      let n2 = e4 ? `${e4}${t2 === void 0 ? `` : $T(t2)}` : ``;
      n2 !== this.hintText && (this.hintText = n2, this.hint.replaceChildren(), e4 && (this.hint.append(G(``, e4)), t2 !== void 0 && this.hint.append(G(`uh-num uh-cursor-item__amt`, $T(t2)), G(`uh-tip__coin`))), this.hint.classList.toggle(`is-on`, !!e4));
    }
    place() {
      let e4 = this.getScale() || 1, t2 = this.lastX / e4 - this.fw / 2, n2 = this.lastY / e4 - this.fh / 2;
      this.el.style.transform = `translate3d(${t2.toFixed(1)}px, ${n2.toFixed(1)}px, 0)`;
    }
    destroy() {
      document.documentElement.classList.remove(`uh-holding`);
    }
  };
})), _E, vE, yE = t((() => {
  _E = [`sorceress`, `barbarian`, `necromancer`], vE = { attack: { id: `attack`, name: `Attack`, classId: `all`, element: `physical`, motif: `crossed sword swing` }, fireBolt: { id: `fireBolt`, name: `Fire Bolt`, classId: `sorceress`, element: `fire`, motif: `single flame dart` }, fireball: { id: `fireball`, name: `Fireball`, classId: `sorceress`, element: `fire`, motif: `blazing sphere with tail` }, meteor: { id: `meteor`, name: `Meteor`, classId: `sorceress`, element: `fire`, motif: `burning rock falling from sky` }, iceBolt: { id: `iceBolt`, name: `Ice Bolt`, classId: `sorceress`, element: `cold`, motif: `ice shard dart` }, frostNova: { id: `frostNova`, name: `Frost Nova`, classId: `sorceress`, element: `cold`, motif: `expanding frost ring` }, glacialOrb: { id: `glacialOrb`, name: `Glacial Orb`, classId: `sorceress`, element: `cold`, motif: `orb spraying ice shards` }, chargedBolt: { id: `chargedBolt`, name: `Charged Bolt`, classId: `sorceress`, element: `lightning`, motif: `crackling sparks` }, teleport: { id: `teleport`, name: `Teleport`, classId: `sorceress`, element: `magic`, motif: `figure dissolving into blue light` }, chainLightning: { id: `chainLightning`, name: `Chain Lightning`, classId: `sorceress`, element: `lightning`, motif: `forked bolt jumping between points` }, bash: { id: `bash`, name: `Bash`, classId: `barbarian`, element: `physical`, motif: `weapon impact burst` }, leapAttack: { id: `leapAttack`, name: `Leap Attack`, classId: `barbarian`, element: `physical`, motif: `warrior arc with downward strike` }, whirlwind: { id: `whirlwind`, name: `Whirlwind`, classId: `barbarian`, element: `physical`, motif: `spinning blades vortex` }, weaponMastery: { id: `weaponMastery`, name: `Weapon Mastery`, classId: `barbarian`, element: `physical`, motif: `crossed axe and sword` }, ironHide: { id: `ironHide`, name: `Iron Hide`, classId: `barbarian`, element: `physical`, motif: `riveted iron skin plate` }, swiftness: { id: `swiftness`, name: `Swiftness`, classId: `barbarian`, element: `physical`, motif: `winged boot / speed lines` }, howl: { id: `howl`, name: `Howl`, classId: `barbarian`, element: `physical`, motif: `roaring mouth sound waves` }, warCry: { id: `warCry`, name: `War Cry`, classId: `barbarian`, element: `physical`, motif: `shockwave from shouting head` }, rallyingRoar: { id: `rallyingRoar`, name: `Rallying Roar`, classId: `barbarian`, element: `physical`, motif: `raised banner with golden aura` }, raiseSkeleton: { id: `raiseSkeleton`, name: `Raise Skeleton`, classId: `necromancer`, element: `magic`, motif: `skeletal hand from ground` }, earthGolem: { id: `earthGolem`, name: `Earthen Golem`, classId: `necromancer`, element: `physical`, motif: `hulking clay figure` }, skeletalMage: { id: `skeletalMage`, name: `Skeletal Mage`, classId: `necromancer`, element: `magic`, motif: `skull with glowing orb` }, teeth: { id: `teeth`, name: `Teeth`, classId: `necromancer`, element: `magic`, motif: `fan of fangs` }, corpseExplosion: { id: `corpseExplosion`, name: `Corpse Explosion`, classId: `necromancer`, element: `fire`, motif: `bursting body with gore` }, boneSpear: { id: `boneSpear`, name: `Bone Spear`, classId: `necromancer`, element: `magic`, motif: `piercing bone lance` }, amplifyDamage: { id: `amplifyDamage`, name: `Amplify Damage`, classId: `necromancer`, element: `magic`, motif: `red curse sigil over head` }, terror: { id: `terror`, name: `Terror`, classId: `necromancer`, element: `magic`, motif: `screaming ghost face` }, lifeTap: { id: `lifeTap`, name: `Life Tap`, classId: `necromancer`, element: `magic`, motif: `blood drop with fang` } };
})), bE, xE, SE = t((() => {
  bE = { character: `C`, inventory: `I`, skills: `T`, quests: `Q`, automap: `Tab`, menu: `Esc`, help: `H`, run: `R`, closeAll: `Space`, showItems: `Alt`, standStill: `Shift` }, xE = [{ title: `Movement & combat`, rows: [{ keys: [], mouse: `left`, label: `Move, attack, pick up, talk` }, { keys: [], mouse: `right`, label: `Use the right-hand skill` }, { keys: [bE.standStill], mouse: `left`, label: `Attack without moving` }, { keys: [`F1`, `–`, `F8`], label: `Select a hotkeyed skill` }, { keys: [`1`, `–`, `4`], label: `Drink from the belt` }, { keys: [bE.run], label: `Toggle run / walk` }, { keys: [bE.showItems], label: `Show item labels on the ground` }] }, { title: `Panels`, rows: [{ keys: [bE.character], label: `Character` }, { keys: [bE.inventory], label: `Inventory` }, { keys: [bE.skills], label: `Skill tree` }, { keys: [bE.quests], label: `Quest log` }, { keys: [bE.automap], label: `Automap` }, { keys: [bE.closeAll], label: `Close all panels` }, { keys: [bE.menu], label: `Game menu / close` }, { keys: [bE.help], label: `This help screen` }] }, { title: `Items & skills`, rows: [{ keys: [], mouse: `left`, label: `Pick up / place / swap an item` }, { keys: [], mouse: `right`, label: `Use, drink, or quick-move an item` }, { keys: [], mouse: `right`, label: `Buy from a trader` }, { keys: [`F1`, `–`, `F8`], label: `Bind while hovering a skill in the skill chooser` }] }];
}));
function CE(e4, t2) {
  return t2.map(([t3, ...n2]) => {
    let r2 = [t3];
    for (let t4 = 0; t4 < n2.length; t4 += 2) {
      let i2 = e4([n2[t4], n2[t4 + 1]]);
      r2.push(i2[0].toFixed(2), i2[1].toFixed(2));
    }
    return r2.join(` `);
  }).join(` `);
}
function wE(e4, t2, n2) {
  let r2 = CE(e4, [[`M`, -n2, 0], [`L`, -n2 * 0.92, -t2 * 0.8], [`L`, 0, -t2], [`L`, n2 * 0.92, -t2 * 0.8], [`L`, n2, 0], [`Z`]]), i2 = CE(e4, [[`M`, 0, -2], [`L`, 0, -t2 * 0.8]]), a2 = CE(e4, [[`M`, -n2 * 3.1, 0.6], [`Q`, 0, -n2 * 1.4, n2 * 3.1, 0.6], [`L`, n2 * 3.1, n2 * 1.2], [`Q`, 0, n2 * 0.2, -n2 * 3.1, n2 * 1.2], [`Z`]]), o2 = CE(e4, [[`M`, -n2 * 0.6, n2 * 0.8], [`L`, n2 * 0.6, n2 * 0.8], [`L`, n2 * 0.6, t2 * 0.27], [`L`, -n2 * 0.6, t2 * 0.27], [`Z`]]), s2 = zE(e4, 0, t2 * 0.27 + n2 * 0.9);
  return `<path d="${r2}"/><path d="${i2}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1"/>
<path d="${o2}" fill="#5a3a1c"/><path d="${a2}" fill="url(#gd)"/><circle cx="${BE(s2[0])}" cy="${BE(s2[1])}" r="${BE(n2 * 1.05)}" fill="url(#gd)"/>`;
}
function TE(e4, t2, n2) {
  let r2 = CE(e4, [[`M`, -1.7, -t2 * 0.46], [`L`, 1.7, -t2 * 0.46], [`L`, 1.9, t2 * 0.5], [`L`, -1.9, t2 * 0.5], [`Z`]]), i2 = CE(e4, [[`M`, 1.2, -t2 * 0.44], [`C`, n2 * 0.45, -t2 * 0.5, n2 * 0.85, -t2 * 0.52, n2, -t2 * 0.4], [`C`, n2 * 1.12, -t2 * 0.28, n2 * 1.12, -t2 * 0.12, n2, 0], [`C`, n2 * 0.7, -t2 * 0.1, n2 * 0.35, -t2 * 0.15, 1.2, -t2 * 0.2], [`Z`]]), a2 = CE(e4, [[`M`, n2, -t2 * 0.4], [`C`, n2 * 1.12, -t2 * 0.28, n2 * 1.12, -t2 * 0.12, n2, 0]]);
  return `<path d="${r2}" fill="#5a3a1c"/><path d="${CE(e4, [[`M`, -1.2, -t2 * 0.38], [`L`, -n2 * 0.42, -t2 * 0.33], [`L`, -1.2, -t2 * 0.27], [`Z`]])}"/><path d="${i2}"/>
<path d="${a2}" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.2"/>`;
}
function EE(e4, t2, n2, r2 = `url(#gl)`) {
  return `<path d="${CE(e4, [[`M`, 0, -t2 * 0.62], [`C`, n2 * 0.18, -t2 * 0.4, n2 * 0.62, -t2 * 0.22, n2 * 0.52, t2 * 0.1], [`C`, n2 * 0.46, t2 * 0.3, n2 * 0.24, t2 * 0.38, 0, t2 * 0.38], [`C`, -n2 * 0.26, t2 * 0.38, -n2 * 0.5, t2 * 0.28, -n2 * 0.52, t2 * 0.06], [`C`, -n2 * 0.54, -t2 * 0.12, -n2 * 0.32, -t2 * 0.2, -n2 * 0.18, -t2 * 0.34], [`C`, -n2 * 0.14, -t2 * 0.2, -n2 * 0.06, -t2 * 0.14, 0, -t2 * 0.12], [`C`, -n2 * 0.08, -t2 * 0.32, -n2 * 0.02, -t2 * 0.48, 0, -t2 * 0.62], [`Z`]])}" fill="${r2}"/>`;
}
function DE(e4, t2, n2, r2 = `url(#gl)`) {
  return `<path d="${CE(e4, [[`M`, 0, -t2 / 2], [`L`, n2 / 2, -t2 * 0.08], [`L`, 0, t2 / 2], [`L`, -n2 / 2, -t2 * 0.08], [`Z`]])}" fill="${r2}"/><path d="${CE(e4, [[`M`, 0, -t2 / 2], [`L`, 0, t2 / 2]])}" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width=".9"/>`;
}
function OE(e4, t2) {
  let n2 = `M${e4.map((e5) => `${BE(e5[0])} ${BE(e5[1])}`).join(` L`)}`;
  return `<path d="${n2}" fill="none" stroke="#0a0605" stroke-width="${t2 + 2.4}"/><path d="${n2}" fill="none" stroke="url(#gl)" stroke-width="${t2}"/>
<path d="${n2}" fill="none" stroke="#ffffff" stroke-width="${Math.max(0.8, t2 * 0.35)}"/>`;
}
function kE(e4, t2, n2, r2) {
  let i2 = RE(e4, t2, 0, n2), a2 = CE(i2, [[`M`, 0, -14], [`C`, -9, -14, -13, -8, -13, -1], [`C`, -13, 4, -10.5, 7, -8, 8], [`L`, -8, 13], [`L`, 8, 13], [`L`, 8, 8], [`C`, 10.5, 7, 13, 4, 13, -1], [`C`, 13, -8, 9, -14, 0, -14], [`Z`]]), o2 = CE(i2, [[`M`, -9, -1], [`C`, -8, -5, -3.5, -5, -3, -1], [`C`, -3.5, 3, -8, 3, -9, -1], [`Z`]]), s2 = CE(i2, [[`M`, 9, -1], [`C`, 8, -5, 3.5, -5, 3, -1], [`C`, 3.5, 3, 8, 3, 9, -1], [`Z`]]), c2 = CE(i2, [[`M`, 0, 2], [`L`, -2, 6], [`L`, 2, 6], [`Z`]]), l2 = CE(i2, [[`M`, -4, 9], [`L`, -4, 13], [`M`, 0, 9], [`L`, 0, 13], [`M`, 4, 9], [`L`, 4, 13]]);
  return `<path d="${a2}"/>${r2 ? `<path d="${o2}" fill="${r2}" stroke="none"/><path d="${s2}" fill="${r2}" stroke="none"/>` : `<path d="${o2}" fill="#0a0605"/><path d="${s2}" fill="#0a0605"/>`}<path d="${c2}" fill="#0a0605"/><path d="${l2}" fill="none" stroke="#0a0605" stroke-width="1.3"/>`;
}
function AE(e4, t2, n2, r2, i2, a2 = 0) {
  let o2 = [];
  for (let s2 = 0; s2 < i2 * 2; s2++) {
    let c2 = s2 % 2 == 0 ? n2 : r2, l2 = s2 / (i2 * 2) * Math.PI * 2 + a2;
    o2.push(`${BE(e4 + Math.sin(l2) * c2)} ${BE(t2 - Math.cos(l2) * c2)}`);
  }
  return `M${o2.join(` L`)} Z`;
}
function jE(e4, t2, n2, r2) {
  return `M${e4 - n2} ${t2} a${n2} ${n2} 0 1 0 ${n2 * 2} 0 a${n2} ${n2} 0 1 0 ${-n2 * 2} 0 Z M${e4 - r2} ${t2} a${r2} ${r2} 0 1 1 ${r2 * 2} 0 a${r2} ${r2} 0 1 1 ${-r2 * 2} 0 Z`;
}
function ME(e4, t2, n2) {
  let r2 = CE(e4, [[`M`, -n2 * 0.42, -t2 / 2 + n2], [`L`, n2 * 0.42, -t2 / 2 + n2], [`L`, n2 * 0.42, t2 / 2 - n2], [`L`, -n2 * 0.42, t2 / 2 - n2], [`Z`]]), i2 = (t3) => {
    let r3 = zE(e4, -n2 * 0.45, t3), i3 = zE(e4, n2 * 0.45, t3);
    return `<circle cx="${BE(r3[0])}" cy="${BE(r3[1])}" r="${BE(n2 * 0.62)}"/><circle cx="${BE(i3[0])}" cy="${BE(i3[1])}" r="${BE(n2 * 0.62)}"/>`;
  };
  return `${i2(-t2 / 2 + n2 * 0.7)}${i2(t2 / 2 - n2 * 0.7)}<path d="${r2}"/>`;
}
function NE(e4) {
  let t2 = IE[LE[e4]] ?? IE[vE[e4].element] ?? IE.physical;
  return `<svg ${FE} viewBox="0 0 64 64"><defs>
<radialGradient id="bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${t2.bg}"/><stop offset=".7" stop-color="${t2.bg2}"/><stop offset="1" stop-color="#020101"/></radialGradient>
<linearGradient id="gl" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${t2.gl[0]}"/><stop offset=".45" stop-color="${t2.gl[1]}"/><stop offset="1" stop-color="${t2.gl[2]}"/></linearGradient>
<radialGradient id="hot" cx=".42" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${t2.gl[1]}"/><stop offset="1" stop-color="${t2.gl[2]}"/></radialGradient>
<radialGradient id="aura" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${t2.rim}" stop-opacity=".5"/><stop offset="1" stop-color="${t2.rim}" stop-opacity="0"/></radialGradient>
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#d4a84e"/><stop offset="1" stop-color="#6e4a17"/></linearGradient>
<filter id="fx" x="-20%" y="-20%" width="140%" height="140%">
<feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b"/><feFlood flood-color="${t2.rim}" flood-opacity=".75"/><feComposite in2="b" operator="in" result="g"/>
<feOffset in="SourceAlpha" dx="1.1" dy="1.5" result="o"/><feFlood flood-color="#000" flood-opacity=".8"/><feComposite in2="o" operator="in" result="s"/>
<feMerge><feMergeNode in="g"/><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="64" height="64" fill="url(#bg)"/>
<circle cx="32" cy="32" r="27" fill="url(#aura)"/>
<g filter="url(#fx)" fill="url(#gl)" stroke="#0a0605" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">${VE[e4]()}</g>
<path d="M0 0 H64 L58.5 5.5 H5.5 V58.5 L0 64 Z" fill="#ffffff" opacity=".11"/>
<path d="M64 64 H0 L5.5 58.5 H58.5 V5.5 L64 0 Z" fill="#000" opacity=".55"/>
<rect x="5.75" y="5.75" width="52.5" height="52.5" fill="none" stroke="${t2.rim}" stroke-opacity=".3" stroke-width="1"/>
<path d="M6 6 H46 Q24 12 6 38 Z" fill="#ffffff" opacity=".06"/>
</svg>`;
}
function PE(e4) {
  let t2 = HE.get(e4);
  return t2 || (t2 = yw(NE(e4)), HE.set(e4, t2)), t2;
}
var FE, IE, LE, RE, zE, BE, VE, HE, UE = t((() => {
  yE(), Cw(), FE = `xmlns="http://www.w3.org/2000/svg"`, IE = { fire: { bg: `#6a2006`, bg2: `#170502`, gl: [`#fff7d6`, `#ffb347`, `#d23a0a`], rim: `#ff7a2a` }, cold: { bg: `#0f3d5c`, bg2: `#020b14`, gl: [`#ffffff`, `#c4ecff`, `#3c9ad8`], rim: `#7fd4ff` }, lightning: { bg: `#1e2878`, bg2: `#04061c`, gl: [`#ffffff`, `#e2e8ff`, `#7d8cff`], rim: `#b9c8ff` }, magic: { bg: `#401566`, bg2: `#0b0316`, gl: [`#fff2ff`, `#dcaaff`, `#8a3ad0`], rim: `#c070ff` }, physical: { bg: `#3d2f1f`, bg2: `#0b0806`, gl: [`#ffffff`, `#e8dccb`, `#8c7a5e`], rim: `#e8dccb` }, bronze: { bg: `#4d3312`, bg2: `#0d0803`, gl: [`#fff6dc`, `#e8c070`, `#8a5a1c`], rim: `#e6b65e` }, blood: { bg: `#560c0c`, bg2: `#0e0202`, gl: [`#fff2e2`, `#ff8e6e`, `#a81a10`], rim: `#ff5a46` }, bone: { bg: `#2e2640`, bg2: `#07060c`, gl: [`#ffffff`, `#efe6cf`, `#9c8c6c`], rim: `#cdbfe8` }, earth: { bg: `#3e2c14`, bg2: `#0b0803`, gl: [`#f6e4c4`, `#be905a`, `#5c3c1a`], rim: `#c99e5e` }, curse: { bg: `#3d0a1c`, bg2: `#0b0205`, gl: [`#ffe2dc`, `#e0485a`, `#7a0a22`], rim: `#e8425a` }, spirit: { bg: `#18303a`, bg2: `#03080a`, gl: [`#ffffff`, `#cfeaf2`, `#5a8a9a`], rim: `#a8e2f2` }, poison: { bg: `#20440f`, bg2: `#040b02`, gl: [`#f2ffd6`, `#a8e060`, `#3f8a1a`], rim: `#7fd04a` } }, LE = { attack: `physical`, fireBolt: `fire`, fireball: `fire`, meteor: `fire`, iceBolt: `cold`, frostNova: `cold`, glacialOrb: `cold`, chargedBolt: `lightning`, teleport: `magic`, chainLightning: `lightning`, bash: `physical`, leapAttack: `physical`, whirlwind: `physical`, weaponMastery: `bronze`, ironHide: `bronze`, swiftness: `bronze`, howl: `blood`, warCry: `blood`, rallyingRoar: `blood`, raiseSkeleton: `bone`, earthGolem: `earth`, skeletalMage: `magic`, teeth: `bone`, corpseExplosion: `fire`, boneSpear: `bone`, amplifyDamage: `curse`, terror: `spirit`, lifeTap: `curse` }, RE = (e4, t2, n2 = 0, r2 = 1) => {
    let i2 = n2 * Math.PI / 180, a2 = Math.cos(i2), o2 = Math.sin(i2);
    return ([n3, i3]) => [e4 + (n3 * a2 - i3 * o2) * r2, t2 + (n3 * o2 + i3 * a2) * r2];
  }, zE = (e4, t2, n2) => e4([t2, n2]), BE = (e4) => e4.toFixed(2), VE = { attack: () => `<path d="M10 44 C9 24 22 11 44 9 C28 16 19 27 17 46 Z" fill="url(#hot)" opacity=".85"/>${wE(RE(36, 34, 45, 1), 30, 3.2)}`, fireBolt: () => `<path d="M10 54 L26 36 L29 39 Z M6 44 L22 32 L24 35 Z M18 58 L30 42 L33 44 Z" fill="url(#gl)" opacity=".75"/>${EE(RE(36, 28, 45, 1), 40, 20)}${EE(RE(37, 27, 45, 1), 22, 10, `#fff8dc`)}`, fireball: () => `<path d="M30 18 C20 30 14 42 6 58 C18 48 32 44 48 34 C40 34 34 30 30 18 Z" fill="url(#gl)" opacity=".9"/>
<path d="M30 24 C24 34 20 42 14 52 C24 44 32 42 42 36 C36 36 32 32 30 24 Z" fill="#ffd36a" stroke="none" opacity=".8"/><circle cx="40" cy="25" r="13" fill="url(#hot)"/><circle cx="36" cy="21" r="4" fill="#fff" stroke="none" opacity=".75"/>
<circle cx="18" cy="30" r="1.8" fill="#ffd36a"/><circle cx="26" cy="54" r="1.5" fill="#ffd36a"/>`, meteor: () => `<path d="M4 4 L36 30 L32 36 Z" fill="url(#gl)" opacity=".8"/><path d="M16 2 L42 28 L38 32 Z" fill="url(#gl)" opacity=".6"/>
<path d="M2 18 L32 38 L30 42 Z" fill="url(#gl)" opacity=".6"/><path d="M34 30 L46 26 L56 34 L57 46 L48 56 L36 54 L29 44 Z" fill="#3a2418"/>
<path d="M34 30 L46 26 L56 34 L50 36 L40 34 Z" fill="url(#hot)" stroke="none" opacity=".95"/>
<path d="M36 40 L44 38 M42 48 L50 44" fill="none" stroke="#ff9a3a" stroke-width="1.4"/><ellipse cx="44" cy="60" rx="14" ry="2.6" fill="#ff7a2a" stroke="none" opacity=".5"/>`, iceBolt: () => `<path d="M12 50 L16 48 L14 52 Z M8 40 L12 40 L10 43 Z M20 56 L22 52 L24 56 Z" fill="#e6f8ff"/>${DE(RE(34, 30, 45, 1), 46, 14)}${DE(RE(34, 30, 45, 1), 20, 5, `#ffffff`)}`, frostNova: () => {
    let e4 = ``;
    for (let t2 = 0; t2 < 8; t2++) e4 += DE(RE(32 + Math.sin(t2 * Math.PI / 4) * 21, 32 - Math.cos(t2 * Math.PI / 4) * 21, t2 * 45, 1), 14, 6);
    return `<path d="${jE(32, 32, 16, 11)}" fill="url(#gl)" fill-rule="evenodd"/>${e4}<path d="${AE(32, 32, 7, 2.6, 6)}" fill="#ffffff"/>`;
  }, glacialOrb: () => {
    let e4 = ``;
    for (let [t2, n2, r2, i2] of [[52, 18, 30, 12], [56, 40, 100, 11], [44, 56, 150, 10], [14, 52, 220, 10], [10, 24, 300, 11], [30, 8, 350, 9]]) e4 += DE(RE(t2, n2, r2, 1), i2, 5);
    return `${e4}<circle cx="31" cy="33" r="14" fill="url(#hot)"/>
<path d="M22 28 L31 20 L40 28 L37 40 L25 40 Z" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="1"/>
<circle cx="26" cy="27" r="3" fill="#fff" stroke="none"/>`;
  }, chargedBolt: () => `${OE([[10, 40], [18, 34], [16, 28], [26, 22]], 2.2)}${OE([[30, 54], [34, 44], [28, 40], [38, 30]], 2.2)}${OE([[44, 12], [42, 22], [50, 24], [46, 34]], 2.2)}${OE([[56, 48], [48, 46], [50, 40], [42, 38]], 2)}<circle cx="27" cy="21" r="3.6" fill="url(#hot)"/><circle cx="39" cy="29" r="3.2" fill="url(#hot)"/>
<circle cx="46" cy="35" r="2.8" fill="url(#hot)"/><circle cx="41" cy="38" r="2.4" fill="url(#hot)"/>`, teleport: () => {
    let e4 = ``;
    for (let [t2, n2, r2] of [[18, 42, 28], [22, 46, 20], [16, 50, 16], [26, 54, 12], [20, 58, 8]]) e4 += `<rect x="${t2}" y="${n2}" width="${r2}" height="2.2" rx="1" fill="url(#gl)" stroke="none"/>`;
    return `<path d="M8 10 L14 14 M56 10 L50 14 M4 30 L12 30 M60 30 L52 30" fill="none" stroke="#e8c8ff" stroke-width="1.6"/><circle cx="32" cy="14" r="6"/><path d="M22 24 C24 21 28 20 32 20 C36 20 40 21 42 24 L44 38 L20 38 Z"/>${e4}<circle cx="44" cy="48" r="1.6" fill="#fff"/><circle cx="14" cy="44" r="1.3" fill="#fff"/>`;
  }, chainLightning: () => `${OE([[12, 50], [18, 40], [14, 36], [24, 28], [22, 24], [32, 18]], 2.4)}${OE([[32, 18], [38, 26], [36, 30], [46, 34], [44, 38], [54, 44]], 2.4)}${OE([[32, 18], [30, 10], [36, 6]], 1.6)}<circle cx="12" cy="50" r="4.4" fill="url(#hot)"/><circle cx="32" cy="18" r="4.4" fill="url(#hot)"/><circle cx="54" cy="44" r="4.4" fill="url(#hot)"/>`, bash: () => {
    let e4 = `<path d="${AE(40, 40, 20, 8, 10, 0.2)}" fill="url(#hot)" opacity=".9"/>`, t2 = ``;
    for (let e5 = 0; e5 < 8; e5++) {
      let n2 = e5 / 8 * Math.PI * 2, r2 = 31 + Math.sin(n2) * 9, i2 = 31 - Math.cos(n2) * 9;
      t2 += CE(RE(r2, i2, e5 * 360 / 8, 1), [[`M`, -2.6, 1], [`L`, 0, -6], [`L`, 2.6, 1], [`Z`]]) + ` `;
    }
    return `${e4}<path d="M8 56 L28 34 L31 37 L11 59 Z" fill="#5a3a1c"/><path d="${t2}"/><circle cx="31" cy="31" r="9"/><circle cx="28" cy="28" r="2.6" fill="#fff" stroke="none" opacity=".6"/>`;
  }, leapAttack: () => `<path d="M6 56 C10 22 30 6 46 18" fill="none" stroke="#e8dccb" stroke-width="2.4" stroke-dasharray="4 4"/><path d="M30 60 L62 60" fill="none" stroke="#e8dccb" stroke-width="2"/><path d="M38 54 L34 48 M48 52 L48 45 M56 54 L60 48" fill="none" stroke="#fff" stroke-width="1.6"/>${wE(RE(48, 22, 180, 1), 30, 3)}`, whirlwind: () => {
    let e4 = ``;
    for (let t2 = 0; t2 < 3; t2++) {
      let n2 = RE(32, 32, t2 * 120, 1);
      e4 += `<path d="${CE(n2, [[`M`, 2, -4], [`C`, 14, -10, 22, -6, 26, 4], [`C`, 18, -2, 10, -2, 4, 4], [`Z`]])}"/>`;
    }
    return `<path d="M32 10 C46 10 54 20 54 32 M32 54 C18 54 10 44 10 32" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1.6"/>${e4}<circle cx="32" cy="32" r="5" fill="url(#hot)"/>`;
  }, weaponMastery: () => `${TE(RE(24, 34, -32, 1), 44, 16)}${wE(RE(40, 38, 32, 1), 30, 3)}`, ironHide: () => {
    let e4 = ``;
    for (let [t2, n2] of [[16, 18], [48, 18], [16, 40], [48, 40], [26, 24], [38, 24], [26, 36], [38, 36]]) e4 += `<circle cx="${t2}" cy="${n2}" r="2.4" fill="url(#gd)"/>`;
    return `<path d="M14 12 L50 12 L54 18 L54 44 C54 52 44 58 32 60 C20 58 10 52 10 44 L10 18 Z"/><path d="M10 30 L54 30 M32 12 L32 60" fill="none" stroke="#0a0605" stroke-opacity=".6" stroke-width="1.4"/>${e4}<path d="M14 12 L50 12 L52 16 L12 16 Z" fill="#fff" stroke="none" opacity=".35"/>`;
  }, swiftness: () => `<path d="M4 24 L20 24 M2 32 L18 32 M6 40 L20 40" fill="none" stroke="#fff3d0" stroke-width="2"/><path d="M26 22 C18 18 14 12 14 6 C20 10 24 12 28 12 Z M26 28 C16 26 12 20 10 14 C18 18 22 20 27 20 Z" fill="url(#gd)"/><path d="M26 14 L40 14 L40 38 L54 42 C57 43 58 45 58 47 L58 52 L24 52 L24 46 L26 40 Z"/><path d="M26 30 L40 30" fill="none" stroke="#0a0605" stroke-opacity=".5" stroke-width="1.4"/>`, howl: () => `<path d="M50 24 Q56 32 50 40 M54 18 Q63 32 54 46" fill="none" stroke="url(#gl)" stroke-width="2.6"/><path d="M8 52 C8 34 14 18 28 14 C34 12 40 14 42 20 L46 26 L40 30 L46 36 L38 38 C36 44 30 48 26 56 Z"/>
<path d="M40 30 L46 36 L38 38 Z" fill="#2a0606"/><circle cx="32" cy="22" r="2" fill="#0a0605"/>`, warCry: () => `<path d="M10 20 Q4 32 10 44 M54 20 Q60 32 54 44 M16 14 Q8 32 16 50 M48 14 Q56 32 48 50" fill="none" stroke="url(#gl)" stroke-width="2.4"/><path d="M32 12 C24 12 20 18 20 26 C20 34 22 40 26 46 L38 46 C42 40 44 34 44 26 C44 18 40 12 32 12 Z"/>
<path d="M24 24 L29 26 M40 24 L35 26" fill="none" stroke="#0a0605" stroke-width="2"/><ellipse cx="32" cy="36" rx="5" ry="6.5" fill="#2a0606"/>`, rallyingRoar: () => {
    let e4 = ``;
    for (let t2 = 0; t2 < 10; t2++) {
      let n2 = t2 / 10 * Math.PI * 2;
      e4 += `M${BE(32 + Math.cos(n2) * 14)} ${BE(28 + Math.sin(n2) * 14)} L${BE(32 + Math.cos(n2) * 26)} ${BE(28 + Math.sin(n2) * 26)} `;
    }
    return `<path d="${e4}" fill="none" stroke="#ffe08a" stroke-opacity=".7" stroke-width="1.6"/><path d="M20 6 L23 6 L23 60 L20 60 Z" fill="#5a3a1c"/><circle cx="21.5" cy="6" r="2.6" fill="url(#gd)"/><path d="M23 10 L52 12 L46 22 L52 32 L23 32 Z"/><path d="M33 16 L37 21 L33 26 L29 21 Z" fill="#a81a10"/>`;
  }, raiseSkeleton: () => {
    let e4 = ``;
    for (let [t3, n2, r2] of [[22, 22, -14], [28, 14, -5], [34, 12, 4], [40, 16, 12]]) e4 += ME(RE(t3, n2 + 9, r2, 1), 18, 3.4);
    let t2 = ME(RE(16, 34, -50, 1), 12, 3.2);
    return `<path d="M4 50 L60 50 L60 60 L4 60 Z" fill="#2a2018"/><path d="M14 50 L18 56 M44 50 L40 57 M30 52 L32 58" fill="none" stroke="#000" stroke-width="1.4"/><path d="M26 44 L38 44 L37 52 L27 52 Z"/><path d="M20 30 L44 30 L42 44 L24 44 Z"/>${e4}${t2}`;
  }, earthGolem: () => `<path d="M22 10 L42 10 L44 18 L54 22 L58 38 L52 40 L48 30 L46 40 L46 58 L36 58 L34 44 L30 44 L28 58 L18 58 L18 40 L16 30 L12 40 L6 38 L10 22 L20 18 Z"/><path d="M26 22 L30 28 L28 34 M38 20 L36 26 L40 32 M22 46 L24 52" fill="none" stroke="#2a1606" stroke-width="1.4"/><path d="M26 14 L30 15 M34 15 L38 14" fill="none" stroke="#ffd36a" stroke-width="2"/>`, skeletalMage: () => `<circle cx="32" cy="14" r="8" fill="url(#hot)"/><circle cx="29" cy="11" r="2.4" fill="#fff" stroke="none"/>${kE(32, 42, 1.15, `#d8a0ff`)}`, teeth: () => {
    let e4 = ``;
    for (let t2 = -2; t2 <= 2; t2++) {
      let n2 = RE(32, 54, t2 * 22, 1);
      e4 += `<path d="${CE(n2, [[`M`, -4.2, -14], [`C`, -3.6, -26, -1.4, -36, 0, -44], [`C`, 1.4, -36, 3.6, -26, 4.2, -14], [`Z`]])}"/>`;
    }
    return `${e4}<path d="M18 56 Q32 48 46 56" fill="none" stroke="#e8dccb" stroke-width="2.2"/>`;
  }, corpseExplosion: () => `${`<path d="${AE(32, 34, 26, 11, 12)}" fill="url(#hot)"/>`}<path d="M8 10 L14 12 L12 16 Z M54 8 L58 14 L52 14 Z M58 50 L54 56 L52 50 Z M6 50 L12 48 L10 54 Z" fill="#7a1a10"/>
<path d="M18 6 L22 14 M48 4 L44 14 M60 32 L52 32" fill="none" stroke="#efe6cf" stroke-width="2"/><circle cx="32" cy="34" r="6" fill="#fff6d6" stroke="none"/>`, boneSpear: () => {
    let e4 = RE(32, 32, 45, 1), t2 = CE(e4, [[`M`, 0, -30], [`L`, 4.4, -16], [`L`, 2.6, -14], [`L`, 2.6, 22], [`L`, -2.6, 22], [`L`, -2.6, -14], [`L`, -4.4, -16], [`Z`]]), n2 = zE(e4, 0, 24), r2 = zE(e4, 0, 4);
    return `<path d="M6 44 L22 40 M10 54 L26 46 M20 60 L30 50" fill="none" stroke="#cdbfe8" stroke-opacity=".7" stroke-width="1.6"/><path d="${t2}"/><circle cx="${BE(n2[0])}" cy="${BE(n2[1])}" r="4.4"/><circle cx="${BE(r2[0])}" cy="${BE(r2[1])}" r="3.4"/>
<path d="${CE(e4, [[`M`, 0, -28], [`L`, 0, 20]])}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>`;
  }, amplifyDamage: () => `<path d="M10 62 C12 50 20 46 32 46 C44 46 52 50 54 62 Z" fill="#2a0c12"/><circle cx="32" cy="38" r="8" fill="#2a0c12"/><circle cx="32" cy="16" r="11" fill="none" stroke="url(#gl)" stroke-width="2.6"/>
<path d="M32 6 L41 21 L23 21 Z" fill="none" stroke="#ffffff" stroke-width="1.6"/><circle cx="32" cy="16" r="2.4" fill="#fff"/>`, terror: () => `<path d="M6 18 L12 20 M4 30 L11 30 M58 18 L52 20 M60 30 L53 30" fill="none" stroke="#cfeaf2" stroke-width="1.6"/><path d="M32 6 C20 6 14 16 14 28 L14 56 L20 50 L26 58 L32 50 L38 58 L44 50 L50 56 L50 28 C50 16 44 6 32 6 Z"/><ellipse cx="25" cy="24" rx="4" ry="5.6" fill="#0a0605"/><ellipse cx="39" cy="24" rx="4" ry="5.6" fill="#0a0605"/>
<ellipse cx="32" cy="38" rx="5" ry="8" fill="#0a0605"/>`, lifeTap: () => `<path d="M28 10 C28 10 12 30 12 40 C12 50 19 57 28 57 C37 57 44 50 44 40 C44 30 28 10 28 10 Z"/><path d="M20 36 C19 40 20 44 22 46" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="M44 6 C50 8 54 14 54 22 L52 36 C50 30 46 24 40 20 Z" fill="#efe6cf"/>` }, HE = /* @__PURE__ */ new Map();
})), WE, GE, KE, qE, JE, YE, XE = t((() => {
  Rw(), WE = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`, GE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uFill;
uniform float uPoison;
uniform float uPulse;
uniform float uPx;
uniform vec2 uOff1;
uniform vec2 uOff2;
uniform vec2 uOffS;
uniform float uSeed;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uHi;
uniform vec3 uPDeep;
uniform vec3 uPMid;
uniform vec3 uPHi;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 >= 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float r = sqrt(r2);
  float mask = 1.0 - smoothstep(1.0 - uPx * 2.0, 1.0, r);
  float z = sqrt(1.0 - r2);
  // lens bulge: interior features magnify toward the centre
  vec2 q = p * (0.82 + 0.18 * z);
  float t = uTime;

  vec3 deep = mix(uDeep, uPDeep, uPoison);
  vec3 mid = mix(uMid, uPMid, uPoison);
  vec3 hi = mix(uHi, uPHi, uPoison);

  // ---- liquid surface (kept slightly inside the rim so low values stay readable)
  float lvl = mix(-0.95, 0.97, uFill);
  float calm = 1.0 - smoothstep(0.8, 1.0, abs(lvl));
  float wave = sin(q.x * 4.2 + t * 2.0) * 0.024 + sin(q.x * 7.7 - t * 2.9) * 0.012 + sin(q.x * 13.0 + t * 4.3) * 0.005;
  float slosh = sin(t * 0.8) * 0.035 * q.x;
  float surf = lvl + (wave + slosh) * calm;
  float d = surf - q.y;
  float inLiq = smoothstep(-uPx * 1.5, uPx * 1.5, d) * step(0.002, uFill);

  // ---- empty space: smoked glass with a faint reflection of the liquid
  vec3 col = vec3(0.022, 0.02, 0.022) + hi * 0.04 * smoothstep(0.6, 1.0, r);
  if (inLiq < 0.999) {
    float smoke = texture2D(uNoise, q * 0.55 + uOffS).b;
    col += mid * 0.07 * smoke;
  }

  // ---- swirling interior
  if (inLiq > 0.001) {
    // swirl = q rotated by an angle that grows with time and radius (no atan needed)
    float th = t * 0.22 + length(q) * 2.1;
    float cs = cos(th);
    float sn = sin(th);
    vec2 polar = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
    float n1 = texture2D(uNoise, polar * 0.6 + uOff1).r;
    float n2 = texture2D(uNoise, q * 0.825 + vec2(n1 * 0.55, n1 * 0.35) + uOff2).g;
    // deeper liquid is darker; the scale grows near full so a full globe stays vivid
    float depth = clamp(d / (1.5 + 0.9 * smoothstep(0.6, 1.0, uFill)), 0.0, 1.0);
    vec3 liq = mix(mid, deep, smoothstep(0.02, 0.85, depth));
    liq = mix(liq, hi, smoothstep(0.52, 0.92, n2) * 0.5);
    liq *= 0.68 + 0.62 * n1;
    // glow just beneath the surface + meniscus
    liq += hi * 0.32 * exp(-max(d, 0.0) * 8.0);
    float mk = d / (uPx * 2.5 + 0.014);
    liq += mix(hi, vec3(1.0), 0.35) * exp(-mk * mk) * 0.85;

    // ---- bubbles: one per vertical lane, so each pixel evaluates a single bubble
    if (d > -0.02) {
      float lane = floor((q.x + 0.75) * 6.0);
      if (lane >= 0.0 && lane < 9.0) {
        float h1 = fract(sin(lane * 12.9898 + uSeed * 78.233) * 43758.5453);
        float h2 = fract(sin(lane * 39.3468 + uSeed * 11.135) * 24634.6345);
        float h3 = fract(sin(lane * 73.1567 + uSeed * 5.731) * 15731.7431);
        float rad = 0.014 + h3 * 0.03;
        float by = -1.05 + mod(t * (0.16 + h2 * 0.28) + h1 * 2.2, 2.3);
        float bx = -0.75 + (lane + 0.5) / 6.0 + (h1 - 0.5) * 0.04 + sin(t * 1.7 + lane * 2.3) * 0.035;
        vec2 dv = q - vec2(bx, by);
        float bub = smoothstep(rad, rad * 0.55, length(dv)) * 0.6
          + smoothstep(rad * 0.45, 0.0, length(dv - vec2(-rad * 0.3, rad * 0.3))) * 0.6;
        liq += mix(hi, vec3(1.0), 0.4) * bub * 0.55 * step(by, surf - 0.03);
      }
    }
    col = mix(col, liq, inLiq);
  }

  // ---- spherical shading (r^3.5 and (1-z)^3 without pow)
  col *= mix(1.0, 0.3, r2 * r * sqrt(r));
  float iz = 1.0 - z;
  col += mix(vec3(0.55, 0.5, 0.45), hi, 0.55) * (iz * iz * iz) * 0.32;

  // ---- glass highlights
  float h1 = smoothstep(0.44, 0.0, length((p - vec2(-0.3, 0.42)) * vec2(1.0, 1.55)));
  col += vec3(1.0, 0.97, 0.92) * h1 * 0.2;
  float h2 = smoothstep(0.1, 0.0, length((p - vec2(-0.4, 0.5)) * vec2(1.0, 1.3)));
  col += vec3(1.0) * h2 * 0.6;
  float rim = smoothstep(0.82, 0.97, r) * smoothstep(1.0, 0.97, r) * smoothstep(0.1, -0.7, p.y + p.x * 0.4);
  col += mix(hi, vec3(1.0), 0.3) * rim * 0.32;

  // ---- low-life heartbeat
  col *= 1.0 + uPulse * 0.5;
  col += hi * uPulse * 0.1 * inLiq;

  gl_FragColor = vec4(col * mask, mask);
}`, KE = { life: { deep: [0.16, 0, 0.01], mid: [0.62, 0.03, 0.04], hi: [1, 0.33, 0.22] }, mana: { deep: [0, 0.02, 0.18], mid: [0.07, 0.2, 0.75], hi: [0.36, 0.62, 1] } }, qE = { deep: [0.02, 0.1, 0], mid: [0.18, 0.5, 0.05], hi: [0.6, 1, 0.25] }, JE = /swiftshader|llvmpipe|softpipe|software|basic render/i, YE = class {
    kind;
    canvas;
    software = false;
    gl = null;
    prog = null;
    u = {};
    ctx2d = null;
    lost = false;
    size = 0;
    seed;
    constructor(e4) {
      this.kind = e4, this.seed = e4 === `life` ? 0.13 : 0.71, this.canvas = document.createElement(`canvas`), this.canvas.className = `uh-orb__canvas`, this.canvas.addEventListener(`webglcontextlost`, (e5) => {
        e5.preventDefault(), this.lost = true;
      }), this.canvas.addEventListener(`webglcontextrestored`, () => {
        this.lost = false, this.init();
      }), this.init();
    }
    init() {
      let e4 = this.canvas.getContext(`webgl`, { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: `low-power` });
      if (!e4) {
        this.ctx2d = this.canvas.getContext(`2d`);
        return;
      }
      let t2 = e4.getExtension(`WEBGL_debug_renderer_info`), n2 = String(t2 ? e4.getParameter(t2.UNMASKED_RENDERER_WEBGL) : e4.getParameter(e4.RENDERER));
      this.software = JE.test(n2);
      let r2 = (t3, n3) => {
        let r3 = e4.createShader(t3);
        return r3 ? (e4.shaderSource(r3, n3), e4.compileShader(r3), e4.getShaderParameter(r3, e4.COMPILE_STATUS) ? r3 : (console.warn(`[ui] orb shader:`, e4.getShaderInfoLog(r3)), null)) : null;
      }, i2 = r2(e4.VERTEX_SHADER, WE), a2 = r2(e4.FRAGMENT_SHADER, GE), o2 = e4.createProgram();
      if (!i2 || !a2 || !o2) return;
      if (e4.attachShader(o2, i2), e4.attachShader(o2, a2), e4.bindAttribLocation(o2, 0, `aPos`), e4.linkProgram(o2), !e4.getProgramParameter(o2, e4.LINK_STATUS)) {
        console.warn(`[ui] orb link:`, e4.getProgramInfoLog(o2));
        return;
      }
      let s2 = e4.createBuffer();
      e4.bindBuffer(e4.ARRAY_BUFFER, s2), e4.bufferData(e4.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), e4.STATIC_DRAW), e4.enableVertexAttribArray(0), e4.vertexAttribPointer(0, 2, e4.FLOAT, false, 0, 0), e4.useProgram(o2);
      let c2 = Pw(), l2 = e4.createTexture();
      e4.activeTexture(e4.TEXTURE0), e4.bindTexture(e4.TEXTURE_2D, l2), e4.texImage2D(e4.TEXTURE_2D, 0, e4.RGBA, c2.size, c2.size, 0, e4.RGBA, e4.UNSIGNED_BYTE, c2.data), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_WRAP_S, e4.REPEAT), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_WRAP_T, e4.REPEAT), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_MIN_FILTER, e4.LINEAR), e4.texParameteri(e4.TEXTURE_2D, e4.TEXTURE_MAG_FILTER, e4.LINEAR);
      for (let t3 of [`uNoise`, `uTime`, `uFill`, `uPoison`, `uPulse`, `uPx`, `uOff1`, `uOff2`, `uOffS`, `uSeed`, `uDeep`, `uMid`, `uHi`, `uPDeep`, `uPMid`, `uPHi`]) this.u[t3] = e4.getUniformLocation(o2, t3);
      e4.uniform1i(this.u.uNoise, 0);
      let u2 = KE[this.kind];
      e4.uniform3fv(this.u.uDeep, u2.deep), e4.uniform3fv(this.u.uMid, u2.mid), e4.uniform3fv(this.u.uHi, u2.hi), e4.uniform3fv(this.u.uPDeep, qE.deep), e4.uniform3fv(this.u.uPMid, qE.mid), e4.uniform3fv(this.u.uPHi, qE.hi), e4.uniform1f(this.u.uSeed, this.seed), this.gl = e4, this.prog = o2;
    }
    resize(e4) {
      let t2 = Math.max(16, Math.round(e4));
      t2 !== this.size && (this.size = t2, this.canvas.width = t2, this.canvas.height = t2);
    }
    draw(e4, t2, n2, r2) {
      if (this.lost) return;
      let i2 = this.gl;
      if (i2 && this.prog) {
        let a2 = e4 + this.seed * 17, o2 = (e5) => e5 - Math.floor(e5);
        i2.viewport(0, 0, this.canvas.width, this.canvas.height), i2.uniform1f(this.u.uTime, a2), i2.uniform1f(this.u.uFill, t2), i2.uniform1f(this.u.uPoison, n2), i2.uniform1f(this.u.uPulse, r2), i2.uniform1f(this.u.uPx, 2 / Math.max(16, this.canvas.width)), i2.uniform2f(this.u.uOff1, 0, o2(-a2 * 0.075)), i2.uniform2f(this.u.uOff2, 0, o2(-a2 * 0.1125)), i2.uniform2f(this.u.uOffS, o2(a2 * 0.0125), o2(a2 * 75e-4)), i2.clearColor(0, 0, 0, 0), i2.clear(i2.COLOR_BUFFER_BIT), i2.drawArrays(i2.TRIANGLE_STRIP, 0, 4);
        return;
      }
      this.draw2d(t2, n2);
    }
    draw2d(e4, t2) {
      let n2 = this.ctx2d;
      if (!n2) return;
      let r2 = this.canvas.width, i2 = r2 / 2;
      n2.clearRect(0, 0, r2, r2), n2.save(), n2.beginPath(), n2.arc(i2, i2, i2, 0, Math.PI * 2), n2.clip(), n2.fillStyle = `#060506`, n2.fillRect(0, 0, r2, r2);
      let a2 = t2 > 0.5 ? qE : KE[this.kind], o2 = (e5) => `rgb(${e5[0] * 255 | 0},${e5[1] * 255 | 0},${e5[2] * 255 | 0})`, s2 = r2 * (1 - (0.025 + 0.96 * e4));
      if (e4 > 2e-3) {
        let e5 = n2.createLinearGradient(0, s2, 0, r2);
        e5.addColorStop(0, o2(a2.hi)), e5.addColorStop(0.18, o2(a2.mid)), e5.addColorStop(1, o2(a2.deep)), n2.fillStyle = e5, n2.fillRect(0, s2, r2, r2 - s2), n2.fillStyle = `rgba(255,255,255,0.35)`, n2.fillRect(0, s2, r2, Math.max(1, r2 * 0.012));
      }
      let c2 = n2.createRadialGradient(i2, i2, i2 * 0.4, i2, i2, i2);
      c2.addColorStop(0, `rgba(0,0,0,0)`), c2.addColorStop(1, `rgba(0,0,0,0.75)`), n2.fillStyle = c2, n2.fillRect(0, 0, r2, r2);
      let l2 = i2 * 0.62, u2 = i2 * 0.5, d2 = n2.createRadialGradient(l2, u2, 0, l2, u2, i2 * 0.32);
      d2.addColorStop(0, `rgba(255,250,240,0.55)`), d2.addColorStop(1, `rgba(255,250,240,0)`), n2.fillStyle = d2, n2.fillRect(0, 0, r2, r2), n2.restore();
    }
    destroy() {
      let e4 = this.gl;
      e4 && e4.getExtension(`WEBGL_lose_context`)?.loseContext(), this.gl = null;
    }
  };
})), ZE, QE = t((() => {
  Cw(), FT(), XE(), mE(), aE(), ZE = class {
    kind;
    tip;
    el;
    renderer;
    glass;
    shown = -1;
    poison = 0;
    acc = 0;
    devicePx = 0;
    cur = 0;
    max = 1;
    hovering = false;
    prevTarget = -1;
    hitTimer = 0;
    frame = 0;
    constructor(e4, t2) {
      this.kind = e4, this.tip = t2, this.renderer = new YE(e4), this.el = W(`uh-orb uh-orb--${e4}`);
      let n2 = hw(yw(gT(e4 === `life` ? `left` : `right`)), `uh-orb__frame`);
      this.glass = W(`uh-orb__glass`);
      let r2 = W(`uh-orb__glow`);
      this.el.append(r2, this.renderer.canvas, n2, this.glass), this.glass.addEventListener(`pointerenter`, () => {
        this.hovering = true, this.showTip();
      }), this.glass.addEventListener(`pointerleave`, () => {
        this.hovering = false, this.tip.hide(this);
      });
    }
    showTip() {
      let e4 = lE(`${this.kind === `life` ? `Life` : `Mana`}: ${$T(this.cur)} / ${$T(this.max)}`, [], `uh-tip--stat uh-tip--${this.kind}`);
      this.tip.show(e4, this.glass.getBoundingClientRect(), { owner: this, placement: `above` });
    }
    update(e4, t2, n2, r2, i2, a2, o2, s2 = 0) {
      let c2 = r2 > 0 ? Math.max(0, Math.min(1, n2 / r2)) : 0;
      this.shown < 0 && (this.shown = c2);
      let l2 = 1 - Math.exp(-e4 * 9);
      this.shown += (c2 - this.shown) * l2, this.poison += (+!!i2 - this.poison) * (1 - Math.exp(-e4 * 4));
      let u2 = this.kind === `life` && c2 < 0.25 && r2 > 0;
      this.el.classList.toggle(`is-low`, u2), this.kind === `life` && this.prevTarget >= 0 && c2 < this.prevTarget - 0.07 && (this.el.classList.remove(`is-hit`), this.el.offsetWidth, this.el.classList.add(`is-hit`), window.clearTimeout(this.hitTimer), this.hitTimer = window.setTimeout(() => this.el.classList.remove(`is-hit`), 420)), this.prevTarget = c2, this.el.classList.toggle(`is-poisoned`, i2 && this.kind === `life`), (n2 !== this.cur || r2 !== this.max) && (this.cur = n2, this.max = r2, this.hovering && this.showTip());
      let d2 = 150 * a2 * Math.min(2, window.devicePixelRatio || 1);
      Math.abs(d2 - this.devicePx) > 0.5 && (this.devicePx = d2, this.renderer.resize(d2), this.acc = 1);
      let f2 = o2 === `low` ? 1 / 20 : o2 === `medium` ? 1 / 30 : 0;
      if (this.acc += e4, this.renderer.software && (f2 = Math.max(f2, 1 / 30), this.frame++, this.acc < 1 && (this.frame & 1) !== s2) || this.acc < f2) return;
      this.acc = 0;
      let p2 = 0;
      if (u2) {
        let e5 = t2 % 1.05;
        p2 = Math.exp(-((e5 - 0.06) ** 2) / 35e-4) + 0.55 * Math.exp(-((e5 - 0.3) ** 2) / 35e-4), p2 *= 0.55 + (0.25 - c2) * 1.8;
      }
      this.renderer.draw(t2, this.shown, this.poison, p2);
    }
    destroy() {
      this.renderer.destroy();
    }
  };
})), $E, eD = t((() => {
  Cw(), mE(), $E = class {
    ctx;
    el;
    more;
    slots = [];
    icons = [];
    qty = [];
    rowsEl = [];
    view = null;
    hover = false;
    hoverSlot = -1;
    closeTimer = 0;
    constructor(e4) {
      this.ctx = e4, this.el = W(`uh-belt`), this.more = W(`uh-belt__more uh-frame`);
      for (let e5 of [`tl`, `tr`, `bl`, `br`]) this.more.appendChild(W(`uh-sc ${e5}`));
      let t2 = W(`uh-belt__row uh-belt__row--hot`);
      for (let e5 = 3; e5 >= 1; e5--) {
        let t3 = W(`uh-belt__row`);
        t3.dataset.row = String(e5), this.rowsEl[e5] = t3, this.more.appendChild(t3);
      }
      this.rowsEl[0] = t2;
      for (let e5 = 0; e5 < 16; e5++) {
        let t3 = Math.floor(e5 / 4), n2 = W(`uh-belt__slot`);
        n2.dataset.index = String(e5);
        let r2 = hw(``, `uh-belt__icon`), i2 = G(`uh-belt__qty uh-num`);
        n2.append(r2, i2), t3 === 0 && n2.appendChild(G(`uh-belt__key`, String(e5 + 1))), this.slots[e5] = n2, this.icons[e5] = r2, this.qty[e5] = i2, this.rowsEl[t3].appendChild(n2), n2.addEventListener(`pointerdown`, (t4) => this.onDown(t4, e5)), n2.addEventListener(`pointerenter`, () => this.onSlotEnter(e5)), n2.addEventListener(`pointerleave`, () => this.onSlotLeave(e5));
      }
      this.el.append(this.more, t2), this.el.addEventListener(`pointerenter`, () => this.setHover(true)), this.el.addEventListener(`pointerleave`, () => this.setHover(false));
    }
    setHover(e4) {
      window.clearTimeout(this.closeTimer), e4 ? (this.hover = true, this.updateMore()) : this.closeTimer = window.setTimeout(() => {
        this.hover = false, this.updateMore();
      }, 180);
    }
    updateMore() {
      let e4 = this.view?.rows ?? 1;
      this.more.classList.toggle(`is-open`, e4 > 1 && this.hover);
    }
    onDown(e4, t2) {
      e4.preventDefault(), e4.stopPropagation();
      let n2 = this.ctx.actions;
      if (e4.button === 2) {
        n2.useBeltSlot(t2);
        return;
      }
      e4.button === 0 && (this.ctx.model.cursorItem || e4.shiftKey ? n2.clickBeltSlot(t2) : n2.useBeltSlot(t2));
    }
    onSlotEnter(e4) {
      this.hoverSlot = e4, this.showTip(e4);
    }
    onSlotLeave(e4) {
      this.hoverSlot === e4 && (this.hoverSlot = -1), this.ctx.tip.hide(this);
    }
    showTip(e4) {
      let t2 = this.view?.slots[e4];
      if (!t2 || this.ctx.model.cursorItem) {
        this.ctx.tip.hide(this);
        return;
      }
      let n2 = e4 < 4 ? `Press ${e4 + 1} or click to drink` : `Click to drink · Shift-click to pick up`;
      this.ctx.tip.show(cE(t2, { hint: n2 }), this.slots[e4].getBoundingClientRect(), { owner: this, placement: `above` });
    }
    render(e4) {
      this.view = e4;
      let t2 = Math.max(1, Math.min(4, e4.rows | 0));
      this.el.dataset.rows = String(t2);
      for (let e5 = 1; e5 < 4; e5++) this.rowsEl[e5].classList.toggle(`uh-hidden`, e5 >= t2);
      for (let n2 = 0; n2 < 16; n2++) {
        let r2 = n2 < t2 * 4 ? e4.slots[n2] ?? null : null;
        this.slots[n2].classList.toggle(`is-filled`, !!r2);
        let i2 = this.icons[n2];
        if (r2) {
          i2.getAttribute(`src`) !== r2.icon && (i2.src = r2.icon), i2.style.visibility = `visible`;
          let e5 = r2.quantity !== void 0 && r2.quantity > 1 ? String(r2.quantity) : ``;
          this.qty[n2].textContent !== e5 && (this.qty[n2].textContent = e5);
        } else i2.removeAttribute(`src`), i2.style.visibility = `hidden`, this.qty[n2].textContent && (this.qty[n2].textContent = ``);
      }
      this.updateMore(), this.hoverSlot >= 0 && this.showTip(this.hoverSlot);
    }
    onCursor() {
      this.updateMore();
    }
  };
})), tD, nD = t((() => {
  yE(), dw(), Cw(), UE(), mE(), tD = class extends lw {
    deps = [`skills`];
    el;
    side = `right`;
    anchor = null;
    hovered = null;
    hoveredEl = null;
    open = false;
    onClose = null;
    constructor(e4) {
      super(e4), this.el = W(`uh-chooser uh-frame`), this.el.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), e4.layers.pop.appendChild(this.el);
    }
    isActive() {
      return this.open;
    }
    toggle(e4, t2) {
      if (this.open && this.side === e4) {
        this.close();
        return;
      }
      this.side = e4, this.anchor = t2, this.open = true, this.sig = ``, this.el.classList.add(`is-open`), this.el.dataset.side = e4, window.addEventListener(`keydown`, this.onKey, true), window.addEventListener(`pointerdown`, this.onOutside, true), this.invalidate(), this.sync();
    }
    close() {
      this.open && (this.open = false, this.hovered = null, this.hoveredEl = null, this.el.classList.remove(`is-open`), this.ctx.tip.hide(this), window.removeEventListener(`keydown`, this.onKey, true), window.removeEventListener(`pointerdown`, this.onOutside, true), this.onClose?.());
    }
    onOutside = (e4) => {
      let t2 = e4.target;
      t2 && (this.el.contains(t2) || this.anchor?.contains(t2)) || this.close();
    };
    onKey = (e4) => {
      if (e4.key === `Escape`) {
        e4.preventDefault(), e4.stopImmediatePropagation(), this.close();
        return;
      }
      let t2 = /^F([1-8])$/.exec(e4.key);
      if (!t2) return;
      let n2 = this.skillAtPointer(), r2 = n2?.dataset.skill;
      if (!n2 || !r2) {
        this.hovered && (this.hovered = null, this.hoveredEl = null, this.ctx.tip.hide(this));
        return;
      }
      e4.preventDefault(), e4.stopImmediatePropagation(), !e4.repeat && (this.ctx.actions.setHotkey(Number(t2[1]) - 1, r2), n2.classList.remove(`is-bound-flash`), n2.offsetWidth, n2.classList.add(`is-bound-flash`));
    };
    skillAtPointer() {
      let e4 = this.ctx.pointer;
      if (!e4.inside) return null;
      let t2 = document.elementFromPoint(e4.x, e4.y), n2 = t2 instanceof Element ? t2.closest(`.uh-chooser__skill`) : null;
      return n2 && this.el.contains(n2) ? n2 : null;
    }
    sig = ``;
    render() {
      let e4 = this.ctx.model.skills, t2 = e4 ? `${this.side}|${e4.bar.left}|${e4.bar.right}|${e4.bar.hotkeys.join(`,`)}|${e4.bar.available.map((e5) => `${e5.id}:${e5.manaCost}:${+!!e5.allowLeft}`).join(`,`)}` : `none`;
      if (t2 === this.sig && this.el.childElementCount > 0) {
        this.place();
        return;
      }
      this.sig = t2, this.el.replaceChildren();
      for (let e5 of [`tl`, `tr`, `bl`, `br`]) this.el.appendChild(W(`uh-sc ${e5}`));
      if (!e4) return;
      let n2 = e4.bar, r2 = this.side === `left` ? n2.left : n2.right, i2 = n2.available.filter((e5) => this.side === `left` ? e5.allowLeft : true), a2 = /* @__PURE__ */ new Map(), o2 = /* @__PURE__ */ new Map();
      e4.trees.forEach((e5, t3) => {
        for (let n3 of e5.nodes) a2.set(n3.id, t3), o2.set(n3.id, n3.name);
      });
      let s2 = /* @__PURE__ */ new Map();
      for (let e5 of i2) {
        let t3 = a2.get(e5.id) ?? -1;
        s2.has(t3) || s2.set(t3, []), s2.get(t3).push(e5);
      }
      let c2 = [...s2.keys()].sort((e5, t3) => e5 === -1 ? 1 : t3 === -1 ? -1 : t3 - e5), l2 = W(`uh-chooser__title`, this.side === `left` ? `Left-hand skill` : `Right-hand skill`);
      this.el.appendChild(l2);
      let u2 = W(`uh-chooser__rows`), d2 = /* @__PURE__ */ new Map();
      for (let e5 of c2) {
        let t3 = W(`uh-chooser__row`);
        for (let i3 of s2.get(e5)) {
          let e6 = W(`uh-chooser__skill${i3.id === r2 ? ` is-current` : ``}`);
          e6.setAttribute(`role`, `button`), e6.dataset.skill = i3.id, d2.set(i3.id, e6), e6.appendChild(hw(PE(i3.id), `uh-chooser__icon`));
          let a3 = n2.hotkeys.indexOf(i3.id);
          a3 >= 0 && e6.appendChild(G(`uh-hk`, `F${a3 + 1}`)), e6.addEventListener(`pointerenter`, () => {
            this.hovered = i3.id, this.hoveredEl = e6;
            let t4 = o2.get(i3.id) ?? vE[i3.id]?.name ?? i3.id, n3 = [];
            i3.manaCost > 0 && n3.push([`Mana cost`, String(Math.round(i3.manaCost))]), n3.push(a3 >= 0 ? [`Hotkey`, `F${a3 + 1}`] : `Hover and press F1–F8 to bind`);
            let r3 = this.el.getBoundingClientRect(), s3 = e6.getBoundingClientRect(), c3 = new DOMRect(r3.left, s3.top, r3.width, s3.height);
            this.ctx.tip.show(lE(t4, n3, `uh-tip--skill`), c3, { owner: this, placement: this.side === `right` ? `sideLeft` : `side` });
          }), e6.addEventListener(`pointerleave`, () => {
            this.hovered === i3.id && (this.hovered = null, this.hoveredEl = null), this.ctx.tip.hide(this);
          }), e6.addEventListener(`click`, (e7) => {
            e7.stopPropagation(), this.ctx.actions.setSkill(this.side, i3.id), this.close();
          }), t3.appendChild(e6);
        }
        u2.appendChild(t3);
      }
      if (i2.length || u2.appendChild(W(`uh-chooser__empty`, `No skills learned yet`)), this.el.appendChild(u2), this.place(), this.hovered) {
        let e5 = d2.get(this.hovered);
        if (e5 && this.skillAtPointer() === e5) {
          let t3 = this.hoveredEl?.classList.contains(`is-bound-flash`);
          e5.dispatchEvent(new PointerEvent(`pointerenter`)), t3 && e5.classList.add(`is-bound-flash`);
        } else this.hovered = null, this.hoveredEl = null, this.ctx.tip.hide(this);
      }
    }
    place() {
      let e4 = this.anchor;
      if (!e4) return;
      let t2 = this.ctx.scale, n2 = e4.getBoundingClientRect(), r2 = window.innerWidth, i2 = (window.innerHeight - n2.top) / t2 + 14;
      this.el.style.bottom = `${i2.toFixed(1)}px`, this.side === `left` ? (this.el.style.right = ``, this.el.style.left = `${Math.max(8, n2.left / t2 - 10).toFixed(1)}px`) : (this.el.style.left = ``, this.el.style.right = `${Math.max(8, (r2 - n2.right) / t2 - 10).toFixed(1)}px`);
    }
    destroy() {
      this.close();
    }
  };
})), rD, iD, aD = t((() => {
  yE(), dw(), Cw(), aE(), SE(), FT(), UE(), QT(), mE(), QE(), eD(), nD(), rD = [{ id: `character`, icon: `menuCharacter`, label: `Character`, key: bE.character }, { id: `inventory`, icon: `menuInventory`, label: `Inventory`, key: bE.inventory }, { id: `skills`, icon: `menuSkills`, label: `Skill tree`, key: bE.skills }, { id: `quests`, icon: `menuQuests`, label: `Quest log`, key: bE.quests }, { id: `automap`, icon: `menuAutomap`, label: `Automap`, key: bE.automap }, { id: `menu`, icon: `menuMenu`, label: `Game menu`, key: bE.menu }], iD = class extends lw {
    deps = [`hero`, `skills`, `belt`, `panels`, `cursor`];
    el;
    life;
    mana;
    belt;
    chooser;
    btnL;
    btnR;
    stamFill;
    stamina;
    runBtn;
    runIcon;
    xp;
    xpFill;
    menuBtns = /* @__PURE__ */ new Map();
    badgeStats;
    badgeSkills;
    stamShown = -1;
    xpShown = -1;
    stamHover = false;
    xpHover = false;
    lastBeltRev = -1;
    lastCursorRev = -1;
    lastLevel = -1;
    constructor(e4) {
      super(e4), this.el = W(`uh-console`);
      let t2 = W(`uh-console__slab`), n2 = MT.map(([e5, t3]) => `${((e5 - 150) / 940 * 100).toFixed(3)}% ${(t3 / jT.h * 100).toFixed(3)}%`).join(`, `);
      t2.style.clipPath = `polygon(${n2})`;
      let r2 = hw(yw(_T()), `uh-console__trim`);
      this.life = new ZE(`life`, e4.tip), this.mana = new ZE(`mana`, e4.tip), this.chooser = new tD(e4), this.chooser.onClose = () => {
        this.btnL.el.classList.remove(`is-open`), this.btnR.el.classList.remove(`is-open`);
      }, this.btnL = this.makeSkillBtn(`left`), this.btnR = this.makeSkillBtn(`right`), this.stamina = W(`uh-stamina`), this.runIcon = hw(BT(`run`), ``), this.runBtn = gw(`uh-ibtn uh-runbtn`, this.runIcon, () => e4.actions.toggleRun(), `Toggle run or walk`), this.bindTip(this.runBtn, () => uE(e4.model.hero?.running ? `Running — click to walk` : `Walking — click to run`, bE.run));
      let i2 = W(`uh-stamina__bar`);
      this.stamFill = W(`uh-stamina__fill`), i2.append(this.stamFill, W(`uh-stamina__gloss`)), i2.addEventListener(`pointerenter`, () => {
        this.stamHover = true, this.stamTip(i2);
      }), i2.addEventListener(`pointerleave`, () => {
        this.stamHover = false, e4.tip.hide(i2);
      }), this.stamina.append(this.runBtn, i2), this.xp = W(`uh-xp`), this.xpFill = W(`uh-xp__fill`);
      let a2 = W(`uh-xp__ticks`);
      for (let e5 = 1; e5 < 10; e5++) a2.appendChild(W(`uh-xp__tick`));
      this.xp.append(this.xpFill, a2), this.xp.addEventListener(`pointerenter`, () => {
        this.xpHover = true, this.xpTip();
      }), this.xp.addEventListener(`pointerleave`, () => {
        this.xpHover = false, e4.tip.hide(this.xp);
      }), this.belt = new $E(e4);
      let o2 = W(`uh-minimenu`);
      for (let t3 of rD) {
        let n3 = gw(`uh-ibtn uh-minimenu__btn`, hw(BT(t3.icon), ``), () => {
          t3.id === `automap` ? e4.actions.toggleAutomap() : e4.actions.togglePanel(t3.id);
        }, t3.label);
        this.bindTip(n3, () => uE(t3.label, t3.key)), this.menuBtns.set(t3.id, n3), o2.appendChild(n3);
      }
      this.badgeStats = this.makeBadge(`New stats`, `character`, `uh-badge--stats`), this.badgeSkills = this.makeBadge(`New skill`, `skills`, `uh-badge--skills`), this.el.addEventListener(`pointerdown`, (e5) => e5.stopPropagation());
      let s2 = [`skillL`, `stamina`, `belt`, `menu`, `skillR`].map((e5) => W(`uh-console__well uh-console__well--${e5}`)), c2 = W(`uh-console__xprail`, fw(`i`, `uh-console__stud is-l`), fw(`i`, `uh-console__stud is-r`)), l2 = hw(yw(wT()), `uh-console__keystone`);
      this.el.append(t2, ...s2, r2, c2, l2, this.xp, this.btnL.el, this.stamina, this.belt.el, o2, this.btnR.el, this.life.el, this.mana.el, this.badgeStats, this.badgeSkills), e4.layers.hud.appendChild(this.el);
    }
    bindTip(e4, t2) {
      e4.addEventListener(`pointerenter`, () => this.ctx.tip.show(t2(), e4.getBoundingClientRect(), { owner: e4, placement: `above` })), e4.addEventListener(`pointerleave`, () => this.ctx.tip.hide(e4)), e4.addEventListener(`click`, () => {
        requestAnimationFrame(() => {
          this.ctx.tip.isOwner(e4) && this.ctx.tip.show(t2(), e4.getBoundingClientRect(), { owner: e4, placement: `above` });
        });
      });
    }
    makeSkillBtn(e4) {
      let t2 = hw(``, `uh-skillbtn__icon`), n2 = G(`uh-hk`), r2 = W(`uh-skillbtn__cd`), i2 = gw(`uh-skillbtn uh-skillbtn--${e4}`, [t2, r2, n2], () => {
        this.ctx.tip.hide(i2), this.chooser.toggle(e4, i2), i2.classList.toggle(`is-open`, this.chooser.open), (e4 === `left` ? this.btnR : this.btnL).el.classList.remove(`is-open`);
      }, e4 === `left` ? `Left skill` : `Right skill`), a2 = { el: i2, icon: t2, hk: n2, cd: r2, id: null, cdShown: -1 };
      return i2.addEventListener(`pointerenter`, () => {
        if (this.chooser.open || !a2.id) return;
        let t3 = this.skillName(a2.id);
        this.ctx.tip.show(lE(t3, [e4 === `left` ? `Left mouse button` : `Right mouse button`, `Click to change skill`], `uh-tip--skill`), i2.getBoundingClientRect(), { owner: i2, placement: `above` });
      }), i2.addEventListener(`pointerleave`, () => this.ctx.tip.hide(i2)), a2;
    }
    skillName(e4) {
      for (let t2 of this.ctx.model.skills?.trees ?? []) for (let n2 of t2.nodes) if (n2.id === e4) return n2.name;
      return vE[e4]?.name ?? e4;
    }
    makeBadge(e4, t2, n2) {
      return gw(`uh-badge ${n2}`, [W(`uh-badge__gem`, hw(BT(`plus`), ``)), G(`uh-badge__label`, e4)], () => {
        this.ctx.isOpen(t2) || this.ctx.actions.togglePanel(t2);
      }, e4);
    }
    stamTip(e4) {
      let t2 = this.ctx.model.hero;
      t2 && this.ctx.tip.show(lE(`Stamina: ${$T(t2.stamina)} / ${$T(t2.staminaMax)}`, [], `uh-tip--stat uh-tip--stamina`), e4.getBoundingClientRect(), { owner: e4, placement: `above` });
    }
    xpTipSig = ``;
    xpTip(e4 = true) {
      let t2 = this.ctx.model.hero;
      if (!t2) return;
      let n2 = `${t2.level}|${t2.xp}|${t2.xpLevelEnd}`;
      if (!e4 && n2 === this.xpTipSig) return;
      this.xpTipSig = n2;
      let r2 = Math.max(0, t2.xp - t2.xpLevelStart), i2 = Math.max(1, t2.xpLevelEnd - t2.xpLevelStart), a2 = [[`Experience`, $T(t2.xp)], [`Next level`, $T(t2.xpLevelEnd)], [`Remaining`, $T(Math.max(0, t2.xpLevelEnd - t2.xp))], [`Progress`, `${(r2 / i2 * 100).toFixed(1)}%`]];
      this.ctx.tip.show(lE(`Level ${t2.level}`, a2, `uh-tip--xp`), this.xp.getBoundingClientRect(), { owner: this.xp, placement: `above` });
    }
    render() {
      let e4 = this.ctx.model, t2 = e4.hero, n2 = e4.skills;
      this.setSkill(this.btnL, n2?.bar.left ?? null, n2?.bar.hotkeys ?? []), this.setSkill(this.btnR, n2?.bar.right ?? null, n2?.bar.hotkeys ?? []);
      let r2 = !!t2?.running, i2 = BT(r2 ? `run` : `walk`);
      this.runIcon.getAttribute(`src`) !== i2 && (this.runIcon.src = i2), vw(this.runBtn, `is-on`, r2), vw(this.badgeStats, `is-on`, !!t2 && t2.statPoints > 0 && !e4.openPanels.includes(`character`)), vw(this.badgeSkills, `is-on`, !!t2 && t2.skillPoints > 0 && !e4.openPanels.includes(`skills`));
      for (let [t3, n3] of this.menuBtns) vw(n3, `is-on`, t3 !== `automap` && e4.openPanels.includes(t3));
      e4.rev.belt !== this.lastBeltRev && (this.lastBeltRev = e4.rev.belt, this.belt.render(e4.belt)), e4.rev.cursor !== this.lastCursorRev && (this.lastCursorRev = e4.rev.cursor, this.belt.onCursor()), this.xpHover && this.xpTip(false);
    }
    setSkill(e4, t2, n2) {
      e4.id !== t2 && (e4.id = t2, t2 ? e4.icon.src = PE(t2) : e4.icon.removeAttribute(`src`), e4.el.classList.toggle(`is-empty`, !t2));
      let r2 = t2 ? n2.indexOf(t2) : -1, i2 = r2 >= 0 ? `F${r2 + 1}` : ``;
      e4.hk.textContent !== i2 && (e4.hk.textContent = i2);
    }
    tick(e4) {
      let t2 = this.ctx.model, n2 = t2.hero;
      if (!n2) return;
      let r2 = t2.options.quality;
      this.life.update(e4, this.ctx.time, n2.life, n2.lifeMax, n2.poisoned, this.ctx.scale, r2, 0), this.mana.update(e4, this.ctx.time, n2.mana, n2.manaMax, false, this.ctx.scale, r2, 1);
      let i2 = n2.staminaMax > 0 ? Math.max(0, Math.min(1, n2.stamina / n2.staminaMax)) : 0;
      Math.abs(i2 - this.stamShown) > 5e-4 && (this.stamShown = i2, this.stamFill.style.transform = `scaleX(${i2.toFixed(4)})`, vw(this.stamina, `is-low`, i2 < 0.25), this.stamHover && this.stamTip(this.stamFill.parentElement)), this.lastLevel >= 0 && n2.level > this.lastLevel && (this.xp.classList.remove(`is-levelup`), this.xp.offsetWidth, this.xp.classList.add(`is-levelup`), window.setTimeout(() => this.xp.classList.remove(`is-levelup`), 1600)), this.lastLevel = n2.level;
      let a2 = Math.max(1, n2.xpLevelEnd - n2.xpLevelStart), o2 = Math.max(0, Math.min(1, (n2.xp - n2.xpLevelStart) / a2));
      Math.abs(o2 - this.xpShown) > 2e-4 && (this.xpShown = o2, this.xpFill.style.transform = `scaleX(${o2.toFixed(4)})`);
      let s2 = t2.skills?.bar.cooldowns;
      this.cooldown(this.btnL, s2), this.cooldown(this.btnR, s2);
    }
    cooldown(e4, t2) {
      let n2 = e4.id && t2 ? Math.max(0, Math.min(1, t2[e4.id] ?? 0)) : 0;
      Math.abs(n2 - e4.cdShown) < 4e-3 && !(n2 === 0 && e4.cdShown > 0) || (e4.cdShown = n2, e4.cd.style.setProperty(`--cd`, n2.toFixed(3)), vw(e4.el, `is-cooling`, n2 > 0));
    }
    relayout() {
      this.chooser.open && this.chooser.invalidate();
    }
    get skillChooser() {
      return this.chooser;
    }
    destroy() {
      this.life.destroy(), this.mana.destroy(), this.chooser.destroy();
    }
  };
}));
function oD(e4) {
  let t2 = G(`uh-toast__text`);
  for (let n2 of e4.split(/(\S*\w-\w\S*)/)) n2 && (/\w-\w/.test(n2) && !/\s/.test(n2) ? t2.appendChild(G(`uh-nobr`, n2)) : t2.appendChild(document.createTextNode(n2)));
  return t2;
}
var sD, cD, lD, uD, dD = t((() => {
  dw(), Cw(), aE(), FT(), QT(), mE(), sD = [`character`, `quests`, `stash`, `vendor`, `cube`, `waypoint`, `mercenary`], cD = [`inventory`, `skills`], lD = class extends lw {
    deps = [`target`, `boss`, `tracker`, `area`, `panels`, `merc`, `screen`];
    top;
    target;
    tName;
    tSub;
    tFill;
    tFrac = -1;
    boss;
    bName;
    bTitle;
    bFill;
    bTrail;
    bPips;
    bShown = 1;
    bTrailV = 1;
    bHold = 0;
    bLastF = 1;
    topRight;
    areaName;
    areaDiff;
    tracker;
    trTitle;
    trText;
    banner;
    banName;
    banSub;
    lastArea = ``;
    bannerTimer = 0;
    merc;
    mFill;
    mLevel;
    mFrac = -1;
    constructor(e4) {
      super(e4), this.top = W(`uh-top`), this.target = W(`uh-target`), this.tFill = W(`uh-target__fill`), this.tName = W(`uh-target__name`), this.tSub = W(`uh-target__sub`);
      let t2 = W(`uh-target__bar`, W(`uh-target__track`, this.tFill, W(`uh-target__gloss`)), this.tName);
      this.target.append(t2, this.tSub), this.boss = W(`uh-boss`), this.bName = W(`uh-boss__name`), this.bTitle = W(`uh-boss__title`), this.bFill = W(`uh-boss__fill`), this.bTrail = W(`uh-boss__trail`), this.bPips = W(`uh-boss__pips`);
      let n2 = hw(yw(vT(`left`)), `uh-boss__cap uh-boss__cap--l`), r2 = hw(yw(vT(`right`)), `uh-boss__cap uh-boss__cap--r`), i2 = W(`uh-boss__bar`, W(`uh-boss__track`, this.bTrail, this.bFill, W(`uh-boss__gloss`)), n2, r2, this.bPips);
      this.boss.append(this.bName, i2, this.bTitle), this.top.append(this.boss, this.target), this.topRight = W(`uh-topright`), this.areaName = W(`uh-area__name`), this.areaDiff = W(`uh-area__diff`);
      let a2 = W(`uh-area`, this.areaName, this.areaDiff);
      this.trTitle = W(`uh-tracker__title`), this.trText = W(`uh-tracker__text`), this.tracker = W(`uh-tracker uh-frame`, hw(BT(`exclaim`), `uh-tracker__icon`), W(`uh-tracker__body`, this.trTitle, this.trText)), this.topRight.append(a2, this.tracker), this.banName = W(`uh-banner__name`), this.banSub = W(`uh-banner__sub`), this.banner = W(`uh-banner`, this.banName, hw(yw(TT()), `uh-banner__flourish`), this.banSub), this.mFill = W(`uh-merc__fill`), this.mLevel = G(`uh-merc__lvl uh-num`), this.merc = W(`uh-merc`, W(`uh-merc__frame`, hw(yw(ST()), `uh-merc__img`), this.mLevel), W(`uh-merc__bar`, this.mFill)), this.merc.addEventListener(`pointerenter`, () => this.mercTip()), this.merc.addEventListener(`pointerleave`, () => e4.tip.hide(this.merc)), this.merc.addEventListener(`pointerdown`, (t3) => {
        t3.stopPropagation(), e4.actions.togglePanel(`mercenary`);
      }), e4.layers.hud.append(this.top, this.topRight, this.banner, this.merc);
    }
    mercTip() {
      let e4 = this.ctx.model.merc;
      e4 && this.ctx.tip.show(lE(e4.name, e4.dead ? [`Fallen — revive at the captain`] : [[`Level`, String(e4.level)], [`Life`, `${$T(e4.life)} / ${$T(e4.lifeMax)}`]], `uh-tip--merc`), this.merc.getBoundingClientRect(), { owner: this.merc, placement: `below` });
    }
    render() {
      let e4 = this.ctx.model, t2 = e4.openPanels, n2 = t2.some((e5) => sD.includes(e5)), r2 = t2.some((e5) => cD.includes(e5)), i2 = e4.boss;
      if (vw(this.boss, `is-on`, !!i2), i2) {
        _w(this.bName, i2.name), _w(this.bTitle, i2.title);
        let e5 = Math.max(2, i2.phase);
        if (this.bPips.childElementCount !== e5) {
          this.bPips.replaceChildren();
          for (let t3 = 0; t3 < e5; t3++) this.bPips.appendChild(W(`uh-boss__pip`));
        }
        [...this.bPips.children].forEach((e6, t3) => vw(e6, `is-lit`, t3 < i2.phase)), this.boss.dataset.phase = String(i2.phase);
      } else this.bShown = 1, this.bTrailV = 1, this.bLastF = 1;
      let a2 = e4.target, o2 = !!i2 && !!a2 && (a2.kind === `boss` || a2.name === i2.name);
      vw(this.target, `is-on`, !!a2 && !o2), vw(this.target, `is-below-boss`, !!i2), a2 && (this.target.dataset.kind = a2.kind, _w(this.tName, a2.name), this.tName.className = `uh-target__name c-${a2.nameColor}`, _w(this.tSub, a2.subtitle), vw(this.tSub, `uh-hidden`, !a2.subtitle));
      let s2 = e4.area;
      vw(this.topRight, `is-covered`, r2), _w(this.areaName, s2?.name ?? ``);
      let c2 = s2 && s2.difficulty !== `normal` ? s2.difficulty === `hell` ? `Hell` : `Nightmare` : ``;
      _w(this.areaDiff, c2), this.areaDiff.dataset.diff = s2?.difficulty ?? `normal`, vw(this.areaDiff, `uh-hidden`, !c2);
      let l2 = e4.tracker;
      vw(this.tracker, `uh-hidden`, !l2), l2 && (_w(this.trTitle, l2.title), _w(this.trText, l2.text));
      let u2 = s2 ? `${s2.name}|${s2.difficulty}` : ``;
      u2 && u2 !== this.lastArea && e4.screen === `game` && (this.lastArea = u2, _w(this.banName, s2.name), _w(this.banSub, s2.difficulty === `normal` ? s2.inTown ? `Sanctuary` : `` : c2), vw(this.banSub, `uh-hidden`, !this.banSub.textContent), this.banner.classList.remove(`is-show`), this.banner.offsetWidth, this.banner.classList.add(`is-show`), this.top.classList.add(`has-banner`), window.clearTimeout(this.bannerTimer), this.bannerTimer = window.setTimeout(() => {
        this.banner.classList.remove(`is-show`), this.top.classList.remove(`has-banner`);
      }, 4200));
      let d2 = e4.merc;
      vw(this.merc, `is-on`, !!d2), vw(this.merc, `is-covered`, n2), d2 && (vw(this.merc, `is-dead`, d2.dead), _w(this.mLevel, String(d2.level)));
    }
    tick(e4) {
      let t2 = this.ctx.model, n2 = t2.target;
      if (n2) {
        let e5 = Math.max(0, Math.min(1, n2.lifeFrac));
        Math.abs(e5 - this.tFrac) > 1e-3 && (this.tFrac = e5, this.tFill.style.transform = `scaleX(${e5.toFixed(4)})`);
      }
      let r2 = t2.boss;
      if (r2) {
        let t3 = Math.max(0, Math.min(1, r2.lifeFrac));
        this.bShown += (t3 - this.bShown) * (1 - Math.exp(-e4 * 14)), t3 < this.bLastF - 5e-4 && (this.bHold = 0.5), this.bLastF = t3, t3 >= this.bTrailV ? this.bTrailV = t3 : this.bHold > 0 ? this.bHold -= e4 : this.bTrailV += (t3 - this.bTrailV) * (1 - Math.exp(-e4 * 3.2)), this.bFill.style.transform = `scaleX(${this.bShown.toFixed(4)})`, this.bTrail.style.transform = `scaleX(${this.bTrailV.toFixed(4)})`;
      }
      let i2 = t2.merc;
      if (i2) {
        let e5 = i2.lifeMax > 0 ? Math.max(0, Math.min(1, i2.life / i2.lifeMax)) : 0;
        Math.abs(e5 - this.mFrac) > 2e-3 && (this.mFrac = e5, this.mFill.style.transform = `scaleX(${e5.toFixed(4)})`, vw(this.merc, `is-low`, e5 < 0.3));
      }
    }
    destroy() {
      window.clearTimeout(this.bannerTimer);
    }
  }, uD = class extends lw {
    deps = [`toasts`];
    el;
    live = /* @__PURE__ */ new Map();
    constructor(e4) {
      super(e4), this.el = W(`uh-toasts`), this.el.setAttribute(`aria-live`, `polite`), (e4.layers.hud.querySelector(`.uh-top`) ?? e4.layers.hud).appendChild(this.el);
    }
    render() {
      let e4 = this.ctx.model.toasts, t2 = /* @__PURE__ */ new Set();
      for (let n2 of e4) {
        t2.add(n2.id);
        let e5 = `uh-toast c-${n2.color}${n2.text.length > 44 ? ` is-long` : ``}`, r2 = this.live.get(n2.id);
        if (!r2) r2 = W(e5, oD(n2.text)), this.live.set(n2.id, r2), this.el.appendChild(r2);
        else {
          let t3 = r2.firstElementChild;
          t3.textContent !== n2.text && t3.replaceWith(oD(n2.text)), r2.className = e5;
        }
      }
      for (let [e5, n2] of this.live) t2.has(e5) || (n2.remove(), this.live.delete(e5));
      e4.forEach((e5, t3) => {
        let n2 = this.live.get(e5.id);
        this.el.children[t3] !== n2 && this.el.insertBefore(n2, this.el.children[t3] ?? null);
      });
    }
    tick() {
      for (let e4 of this.ctx.model.toasts) {
        let t2 = this.live.get(e4.id);
        if (!t2) continue;
        let n2 = Math.max(0, Math.min(1, e4.ttl / 0.6)).toFixed(2);
        t2.style.opacity !== n2 && (t2.style.opacity = n2);
      }
    }
  };
})), fD, pD, mD = t((() => {
  dw(), Cw(), FT(), fD = 58, pD = class extends lw {
    deps = [`dialog`];
    el;
    name;
    title;
    shown;
    rest;
    opts;
    textBox;
    full = ``;
    chars = 0;
    done = true;
    constructor(e4) {
      super(e4), this.name = W(`uh-dialog__name`), this.title = W(`uh-dialog__title`), this.shown = G(`uh-dialog__shown`), this.rest = G(`uh-dialog__rest`), this.textBox = W(`uh-dialog__text`, fw(`p`, ``, this.shown, this.rest)), this.opts = W(`uh-dialog__opts`), this.el = W(`uh-dialog uh-frame`, W(`uh-sc tl`), W(`uh-sc tr`), W(`uh-sc bl`), W(`uh-sc br`), W(`uh-dialog__head`, this.name, this.title, hw(yw(TT()), `uh-dialog__flourish`)), this.textBox, this.opts), this.textBox.addEventListener(`click`, () => this.complete()), this.el.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), e4.layers.dialog.appendChild(this.el);
    }
    complete() {
      this.done || (this.chars = this.full.length, this.paint());
    }
    render() {
      let e4 = this.ctx.model.dialog, t2 = !!e4 && this.ctx.model.screen === `game`;
      if (this.el.classList.toggle(`is-open`, t2), !e4) {
        this.full = ``;
        return;
      }
      this.name.textContent = e4.npcName, this.title.textContent = e4.npcTitle, this.title.classList.toggle(`uh-hidden`, !e4.npcTitle), e4.text !== this.full && (this.full = e4.text, this.chars = 0, this.done = false, this.textBox.scrollTop = 0, this.paint());
      let n2 = e4.options.map((e5) => `${e5.id}:${e5.label}`).join(`|`);
      if (n2 !== this.optSig) {
        this.optSig = n2, this.opts.replaceChildren();
        for (let t3 of e4.options) this.opts.appendChild(gw(`uh-btn uh-dialog__opt`, t3.label, () => {
          this.complete(), this.ctx.actions.chooseDialogOption(t3.id);
        }));
      }
    }
    optSig = ``;
    paint() {
      let e4 = Math.min(this.full.length, Math.floor(this.chars));
      this.shown.textContent = this.full.slice(0, e4), this.rest.textContent = this.full.slice(e4), this.done = e4 >= this.full.length, this.el.classList.toggle(`is-typing`, !this.done);
      let t2 = this.textBox;
      if (t2.scrollHeight > t2.clientHeight + 1) {
        let e5 = this.shown.getBoundingClientRect(), n2 = t2.getBoundingClientRect();
        e5.bottom > n2.bottom && (t2.scrollTop += (e5.bottom - n2.bottom) / (this.ctx.scale || 1) + 4);
      }
    }
    tick(e4) {
      if (this.done || !this.full) return;
      let t2 = Math.floor(this.chars);
      this.chars += e4 * fD, Math.floor(this.chars) !== t2 && this.paint();
    }
  };
})), hD, gD, _D = t((() => {
  dw(), Cw(), QT(), SE(), hD = { character: bE.character, inventory: bE.inventory, skills: bE.skills, quests: bE.quests }, gD = class extends lw {
    id;
    side;
    el;
    body;
    head;
    titleEl;
    subEl;
    open = false;
    constructor(e4, t2, n2, r2) {
      super(e4), this.id = t2, this.side = n2, this.el = fw(`section`, { class: `uh-panel uh-panel--${n2} uh-panel--${t2}`, "data-panel": t2, "aria-label": r2 });
      for (let e5 of [`tl`, `tr`, `bl`, `br`]) this.el.appendChild(fw(`i`, `uh-corner ${e5}`));
      this.titleEl = fw(`span`, `uh-panel__title`, r2), this.subEl = W(`uh-panel__sub`), this.head = fw(`header`, `uh-panel__head`, W(`uh-panel__plate`, this.titleEl), this.subEl);
      let i2 = hD[t2], a2 = gw(`uh-ibtn uh-close`, hw(BT(`close`), ``), () => e4.actions.togglePanel(t2), i2 ? `Close (${i2})` : `Close`);
      this.body = W(`uh-panel__body`), this.el.append(this.head, a2, this.body), this.el.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), e4.layers.panels.appendChild(this.el);
    }
    setTitle(e4) {
      _w(this.titleEl, e4);
    }
    setSub(e4) {
      _w(this.subEl, e4), this.subEl.classList.toggle(`uh-hidden`, !e4);
    }
    isActive() {
      return this.open;
    }
    setOpen(e4) {
      e4 !== this.open && (this.open = e4, this.el.classList.toggle(`is-open`, e4), e4 ? (this.invalidate(), this.onOpen()) : this.onClose());
    }
    onOpen() {
    }
    onClose() {
      this.ctx.tip.hide();
    }
    destroy() {
      this.setOpen(false);
    }
  };
})), vD, yD, bD, xD, SD, CD = t((() => {
  Cw(), aE(), QT(), mE(), _D(), vD = [{ key: `str`, label: `Strength`, icon: `str`, help: `Raises weapon damage and lets you wield heavier gear.` }, { key: `dex`, label: `Dexterity`, icon: `dex`, help: `Raises attack rating, defense and chance to block.` }, { key: `vit`, label: `Vitality`, icon: `vit`, help: `Raises life and stamina.` }, { key: `ene`, label: `Energy`, icon: `ene`, help: `Raises mana.` }], yD = { str: [{ label: `Damage`, icon: `damage`, get: (e4) => `${$T(e4.damageMin)}–${$T(e4.damageMax)}` }], dex: [{ label: `Attack rating`, icon: `attackRating`, get: (e4) => $T(e4.attackRating) }, { label: `Defense`, icon: `defense`, get: (e4) => $T(e4.defense) }, { label: `Chance to block`, icon: `block`, get: (e4) => eE(e4.blockChance) }], vit: [{ label: `Stamina`, icon: `stamina`, get: (e4) => `${$T(e4.stamina)} / ${$T(e4.staminaMax)}` }, { label: `Life`, icon: `life`, get: (e4) => `${$T(e4.life)} / ${$T(e4.lifeMax)}` }], ene: [{ label: `Mana`, icon: `mana`, get: (e4) => `${$T(e4.mana)} / ${$T(e4.manaMax)}` }] }, bD = [{ key: `fire`, label: `Fire`, icon: `resFire` }, { key: `cold`, label: `Cold`, icon: `resCold` }, { key: `lightning`, label: `Lightning`, icon: `resLightning` }, { key: `poison`, label: `Poison`, icon: `resPoison` }], xD = [{ label: `Faster cast rate`, get: (e4) => e4.fasterCastRate, title: `Shortens spell casting animations.` }, { label: `Increased attack speed`, get: (e4) => e4.attackSpeed, title: `Shortens attack animations.` }, { label: `Faster run / walk`, get: (e4) => e4.fasterRunWalk, title: `Raises movement speed.` }, { label: `Magic find`, get: (e4) => e4.magicFind, title: `Better odds of magic, rare, set and unique drops.` }, { label: `Gold find`, get: (e4) => e4.goldFind, title: `More gold from every pile.` }, { label: `Life stolen per hit`, get: (e4) => e4.lifeSteal, title: `Heals you for part of the physical damage you deal.` }, { label: `Mana stolen per hit`, get: (e4) => e4.manaSteal, title: `Restores mana from part of the physical damage you deal.` }], SD = class extends gD {
    deps = [`hero`];
    name;
    cls;
    lvl;
    xp;
    next;
    attrEls = /* @__PURE__ */ new Map();
    derivedEls = [];
    pointsEl;
    pointsNum;
    resEls = /* @__PURE__ */ new Map();
    resCap;
    secEls = [];
    hcBadge;
    constructor(e4) {
      super(e4, `character`, `left`, `Character`), this.name = W(`uh-char__name`), this.cls = W(`uh-char__class`), this.hcBadge = G(`uh-hc-badge`, `Hardcore`);
      let t2 = W(`uh-char__id`, W(`uh-char__namebox`, this.name, this.hcBadge), this.cls);
      this.lvl = W(`uh-well uh-char__lvl`), this.xp = W(`uh-well`), this.next = W(`uh-well`);
      let n2 = W(`uh-char__prog`, W(`uh-stat`, W(`uh-stat__label`, `Level`), this.lvl), W(`uh-stat uh-stat--grow`, W(`uh-stat__label`, `Experience`), this.xp), W(`uh-stat uh-stat--grow`, W(`uh-stat__label`, `Next level`), this.next)), r2 = W(`uh-attrs`);
      for (let t3 of vD) {
        let n3 = W(`uh-well uh-attr__total`), i3 = G(`uh-attr__base uh-num`), a3 = gw(`uh-plus`, hw(BT(`plus`), ``), () => e4.actions.addStatPoint(t3.key), `Add a point to ${t3.label}`), o2 = W(`uh-attr__label`, hw(BT(t3.icon), `uh-attr__icon`), W(`uh-attr__text`, G(`uh-attr__name`, t3.label), i3));
        o2.addEventListener(`pointerenter`, () => e4.tip.show(lE(t3.label, [t3.help], `uh-tip--help`), o2.getBoundingClientRect(), { owner: o2, placement: `side` })), o2.addEventListener(`pointerleave`, () => e4.tip.hide(o2));
        let s2 = W(`uh-attr`, o2, n3, a3), c2 = W(`uh-derived`);
        for (let e5 of yD[t3.key]) {
          let t4 = W(`uh-derived__val uh-num`);
          c2.appendChild(W(`uh-derived__row`, e5.icon ? hw(BT(e5.icon), `uh-derived__icon`) : null, G(`uh-derived__label`, e5.label), t4)), this.derivedEls.push({ el: t4, d: e5 });
        }
        let l2 = W(`uh-attrrow`, s2, c2);
        l2.dataset.attr = t3.key, r2.appendChild(l2), this.attrEls.set(t3.key, { total: n3, base: i3, plus: a3, row: l2 });
      }
      this.pointsNum = G(`uh-num`), this.pointsEl = W(`uh-points uh-points--inline`, this.pointsNum, G(`uh-points__label`, `to spend`)), this.resCap = G(`uh-num`);
      let i2 = W(`uh-res`);
      for (let e5 of bD) {
        let t3 = W(`uh-res__val uh-num`);
        this.resEls.set(e5.key, t3), i2.appendChild(W(`uh-res__item uh-res__item--${e5.key}`, hw(BT(e5.icon), `uh-res__icon`), G(`uh-res__label`, e5.label), t3));
      }
      let a2 = W(`uh-sec`);
      for (let t3 of xD) {
        let n3 = G(`uh-sec__val uh-num`), r3 = W(`uh-sec__row`, G(`uh-sec__label`, t3.label), n3);
        r3.addEventListener(`pointerenter`, () => e4.tip.show(lE(t3.label, [t3.title], `uh-tip--help`), r3.getBoundingClientRect(), { owner: r3, placement: `side` })), r3.addEventListener(`pointerleave`, () => e4.tip.hide(r3)), a2.appendChild(r3), this.secEls.push({ el: n3, get: t3.get });
      }
      this.body.append(t2, n2, W(`uh-section-title uh-section-title--attrs`, G(``, `Attributes`), this.pointsEl), r2, W(`uh-section-title`, G(``, `Resistances`), fw(`span`, `uh-res__cap`, `max `, this.resCap)), i2, W(`uh-section-title`, `Secondary`), a2);
    }
    render() {
      let e4 = this.ctx.model.hero;
      if (!e4) return;
      _w(this.name, e4.name), _w(this.cls, e4.className), vw(this.hcBadge, `uh-hidden`, !e4.hardcore), _w(this.lvl, String(e4.level)), _w(this.xp, $T(e4.xp)), _w(this.next, $T(e4.xpLevelEnd));
      let t2 = e4.statPoints > 0;
      for (let n2 of vD) {
        let r2 = this.attrEls.get(n2.key), i2 = e4.attributes[n2.key];
        _w(r2.total, $T(i2.total)), vw(r2.total, `is-boosted`, i2.total > i2.base), vw(r2.total, `is-reduced`, i2.total < i2.base), _w(r2.base, i2.total === i2.base ? `` : `base ${$T(i2.base)}`), vw(r2.plus, `is-on`, t2), r2.plus.disabled = !t2;
      }
      for (let t3 of this.derivedEls) _w(t3.el, t3.d.get(e4));
      vw(this.pointsEl, `is-on`, t2), _w(this.pointsNum, String(e4.statPoints)), _w(this.resCap, `${e4.resistCap}%`);
      for (let t3 of bD) {
        let n2 = e4.resist[t3.key], r2 = this.resEls.get(t3.key);
        _w(r2, eE(Math.min(n2, e4.resistCap))), vw(r2, `is-neg`, n2 < 0), vw(r2, `is-capped`, n2 >= e4.resistCap), r2.dataset.over = n2 > e4.resistCap ? `+${Math.round(n2 - e4.resistCap)}` : ``;
      }
      for (let t3 of this.secEls) _w(t3.el, eE(t3.get(e4)));
    }
  };
}));
function wD(e4, t2, n2) {
  let r2 = [];
  if (n2 <= 0) return r2;
  if (e4 <= 1 || n2 <= 3) {
    let i3 = e4 / 2;
    for (let e5 = 0; e5 < n2; e5++) r2.push([i3, t2 / n2 * (e5 + 0.5)]);
    return r2;
  }
  let i2 = e4 / 2, a2 = n2 === 4 ? [[2], [2]] : n2 === 5 ? [[2], [1], [2]] : [[2], [2], [2]], o2 = a2.length;
  return a2.forEach(([e5], n3) => {
    let a3 = t2 / o2 * (n3 + 0.5);
    e5 === 1 ? r2.push([i2, a3]) : r2.push([i2 - 0.5, a3], [i2 + 0.5, a3]);
  }), r2;
}
function TD(e4, t2, n2) {
  return `${t2},${n2},${e4.w},${e4.h},${e4.quality},${+!!e4.unusable},${e4.quantity ?? ``},${e4.socketCount},${e4.socketed.length},${e4.icon.length},${e4.icon.slice(-24)},${e4.socketed.map((e5) => e5.slice(-12)).join(`|`)}`;
}
function ED(e4) {
  let t2 = W(`uh-item q-${e4.quality}`), n2 = hw(e4.icon, `uh-item__icon`), r2 = G(`uh-item__qty uh-num`), i2 = W(`uh-item__socks`);
  t2.append(n2, i2, r2);
  let a2 = { el: t2, icon: n2, qty: r2, socks: i2, sig: ``, item: e4 };
  return DD(a2, e4, 0, 0), a2;
}
function DD(e4, t2, n2, r2) {
  e4.item = t2;
  let i2 = TD(t2, n2, r2);
  if (i2 === e4.sig) return;
  e4.sig = i2;
  let a2 = uw.cell;
  e4.el.className = `uh-item q-${t2.quality}${t2.unusable ? ` is-unusable` : ``}${t2.identified ? `` : ` is-unid`}`, e4.el.style.left = `${n2 * a2}px`, e4.el.style.top = `${r2 * a2}px`, e4.el.style.width = `${t2.w * a2}px`, e4.el.style.height = `${t2.h * a2}px`, e4.icon.getAttribute(`src`) !== t2.icon && (e4.icon.src = t2.icon), e4.qty.textContent = t2.quantity !== void 0 && t2.quantity > 1 ? String(t2.quantity) : ``, e4.socks.replaceChildren(), wD(t2.w, t2.h, t2.socketCount).forEach(([n3, r3], i3) => {
    let o2 = W(`uh-sock uh-sock--item`);
    o2.style.left = `${n3 * a2}px`, o2.style.top = `${r3 * a2}px`;
    let s2 = t2.socketed[i3];
    s2 ? o2.appendChild(hw(s2, `uh-sock__gem`)) : o2.classList.add(`is-empty`), e4.socks.appendChild(o2);
  });
}
var OD, kD = t((() => {
  dw(), Cw(), mE(), OD = class {
    ctx;
    id;
    opts;
    el;
    itemsEl;
    preview;
    view = null;
    occ = new Int32Array();
    els = /* @__PURE__ */ new Map();
    hoverUid = -1;
    inside = false;
    swapEl = null;
    constructor(e4, t2, n2 = {}) {
      this.ctx = e4, this.id = t2, this.opts = n2, this.el = W(`uh-grid uh-grid--${t2}`), this.itemsEl = W(`uh-grid__items`), this.preview = W(`uh-grid__preview`), this.el.append(this.itemsEl, this.preview), this.el.addEventListener(`pointerenter`, (e5) => {
        this.inside = true, this.onMove(e5);
      }), this.el.addEventListener(`pointermove`, (e5) => this.onMove(e5)), this.el.addEventListener(`pointerleave`, () => {
        this.inside = false, this.clearHover();
      }), this.el.addEventListener(`pointerdown`, (e5) => this.onDown(e5));
    }
    render(e4) {
      if (this.view = e4, !e4) {
        for (let e5 of this.els.values()) e5.el.remove();
        this.els.clear();
        return;
      }
      this.el.style.setProperty(`--cols`, String(e4.cols)), this.el.style.setProperty(`--rows`, String(e4.rows)), this.el.style.width = `${e4.cols * uw.cell}px`, this.el.style.height = `${e4.rows * uw.cell}px`, this.occ = new Int32Array(e4.cols * e4.rows);
      let t2 = /* @__PURE__ */ new Set();
      e4.items.forEach(({ item: n2, x: r2, y: i2 }, a2) => {
        t2.add(n2.uid);
        let o2 = this.els.get(n2.uid);
        o2 || (o2 = ED(n2), o2.el.dataset.uid = String(n2.uid), this.els.set(n2.uid, o2), this.itemsEl.appendChild(o2.el)), DD(o2, n2, r2, i2);
        for (let t3 = i2; t3 < i2 + n2.h; t3++) for (let i3 = r2; i3 < r2 + n2.w; i3++) i3 >= 0 && t3 >= 0 && i3 < e4.cols && t3 < e4.rows && (this.occ[t3 * e4.cols + i3] = a2 + 1);
      });
      for (let [e5, n2] of this.els) t2.has(e5) || (n2.el.remove(), this.els.delete(e5));
      this.refreshPointer();
    }
    refreshPointer() {
      if (!this.inside) return;
      let e4 = this.ctx.pointer;
      this.evaluate(e4.x, e4.y);
    }
    cellAt(e4, t2) {
      let n2 = this.view;
      if (!n2) return null;
      let r2 = this.el.getBoundingClientRect();
      return r2.width <= 0 ? null : { fx: (e4 - r2.left) / r2.width * n2.cols, fy: (t2 - r2.top) / r2.height * n2.rows };
    }
    onMove(e4) {
      this.evaluate(e4.clientX, e4.clientY);
    }
    target(e4, t2, n2) {
      let r2 = this.view, i2 = e4.w <= r2.cols && e4.h <= r2.rows, a2 = Math.round(t2 - e4.w / 2), o2 = Math.round(n2 - e4.h / 2);
      i2 && (a2 = xw(a2, 0, r2.cols - e4.w), o2 = xw(o2, 0, r2.rows - e4.h));
      let s2 = /* @__PURE__ */ new Set();
      for (let t3 = o2; t3 < o2 + e4.h; t3++) for (let n3 = a2; n3 < a2 + e4.w; n3++) {
        if (n3 < 0 || t3 < 0 || n3 >= r2.cols || t3 >= r2.rows) continue;
        let e5 = this.occ[t3 * r2.cols + n3];
        e5 && s2.add(e5 - 1);
      }
      let c2 = i2 && s2.size <= 1;
      return { tx: a2, ty: o2, fits: i2, hit: s2, ok: c2 };
    }
    evaluate(e4, t2) {
      let n2 = this.view, r2 = this.cellAt(e4, t2);
      if (!n2 || !r2) return;
      let i2 = this.ctx.model.cursorItem;
      if (i2 && !this.opts.sell) {
        this.setHoverUid(-1);
        let e5 = this.target(i2, r2.fx, r2.fy), t3 = uw.cell, a3 = this.preview, o3 = Math.max(0, e5.tx), s3 = Math.max(0, e5.ty), c3 = Math.min(n2.cols, e5.tx + i2.w), l2 = Math.min(n2.rows, e5.ty + i2.h);
        a3.style.left = `${o3 * t3}px`, a3.style.top = `${s3 * t3}px`, a3.style.width = `${Math.max(0, c3 - o3) * t3}px`, a3.style.height = `${Math.max(0, l2 - s3) * t3}px`, a3.className = `uh-grid__preview is-on ${e5.ok ? e5.hit.size === 1 ? `is-swap` : `is-ok` : `is-bad`}`;
        let u2 = e5.ok && e5.hit.size === 1 ? [...e5.hit][0] : -1, d2 = u2 >= 0 ? n2.items[u2]?.item.uid : void 0, f2 = d2 === void 0 ? null : this.els.get(d2)?.el ?? null;
        f2 !== this.swapEl && (this.swapEl?.classList.remove(`is-swap-target`), f2?.classList.add(`is-swap-target`), this.swapEl = f2);
        return;
      }
      if (this.hidePreview(), i2) {
        this.setHoverUid(-1);
        return;
      }
      let a2 = Math.floor(r2.fx), o2 = Math.floor(r2.fy), s2 = a2 >= 0 && o2 >= 0 && a2 < n2.cols && o2 < n2.rows ? this.occ[o2 * n2.cols + a2] : 0, c2 = s2 ? n2.items[s2 - 1].item.uid : -1;
      this.setHoverUid(c2);
    }
    hidePreview() {
      this.preview.classList.contains(`is-on`) && (this.preview.className = `uh-grid__preview`), this.swapEl &&= (this.swapEl.classList.remove(`is-swap-target`), null);
    }
    clearHover() {
      this.hidePreview(), this.setHoverUid(-1);
    }
    setHoverUid(e4) {
      if (e4 === this.hoverUid) {
        e4 >= 0 && this.showTip(e4);
        return;
      }
      if (this.hoverUid >= 0 && this.els.get(this.hoverUid)?.el.classList.remove(`is-hover`), this.hoverUid = e4, e4 < 0) {
        this.ctx.tip.hide(this);
        return;
      }
      this.els.get(e4)?.el.classList.add(`is-hover`), this.showTip(e4);
    }
    showTip(e4) {
      let t2 = this.els.get(e4);
      if (!t2) return;
      let n2 = this.ctx.model, r2 = {}, i2 = !!n2.vendor && this.ctx.isOpen(`vendor`);
      this.id === `vendor` ? (t2.item.priceBuy !== void 0 && (r2.price = { label: `Cost:`, amount: t2.item.priceBuy, bad: !!n2.hero && t2.item.priceBuy > n2.hero.gold }), r2.hint = `Right-click to buy`) : i2 && t2.item.priceSell !== void 0 && (r2.price = { label: `Sell value:`, amount: t2.item.priceSell }), !(this.ctx.tip.isOwner(this) && this.tipUid === e4 && this.tipSig === t2.sig + JSON.stringify(r2) + t2.item.lines.length) && (this.tipUid = e4, this.tipSig = t2.sig + JSON.stringify(r2) + t2.item.lines.length, this.ctx.tip.show(cE(t2.item, r2), t2.el.getBoundingClientRect(), { owner: this, placement: `above` }));
    }
    tipUid = -1;
    tipSig = ``;
    onDown(e4) {
      let t2 = this.view;
      if (!t2) return;
      e4.stopPropagation(), e4.preventDefault();
      let n2 = this.cellAt(e4.clientX, e4.clientY);
      if (!n2) return;
      let r2 = this.ctx.model.cursorItem, i2 = { shift: e4.shiftKey, ctrl: e4.ctrlKey || e4.metaKey }, a2 = this.ctx.actions;
      if (e4.button === 2) {
        if (r2) return;
        let e5 = Math.floor(n2.fx), i3 = Math.floor(n2.fy), o3 = e5 >= 0 && i3 >= 0 && e5 < t2.cols && i3 < t2.rows ? this.occ[i3 * t2.cols + e5] : 0;
        o3 && a2.rightClickGridItem(this.id, t2.items[o3 - 1].item.uid);
        return;
      }
      if (e4.button !== 0) return;
      if (r2) {
        if (this.opts.sell) {
          a2.sellCursorItem();
          return;
        }
        let e5 = this.target(r2, n2.fx, n2.fy);
        a2.clickGridCell(this.id, e5.tx, e5.ty, i2);
        return;
      }
      let o2 = xw(Math.floor(n2.fx), 0, t2.cols - 1), s2 = xw(Math.floor(n2.fy), 0, t2.rows - 1);
      this.ctx.tip.hide(this), this.tipUid = -1, a2.clickGridCell(this.id, o2, s2, i2);
    }
    itemEl(e4) {
      return this.els.get(e4)?.el ?? null;
    }
  };
})), AD, jD = t((() => {
  Cw(), aE(), QT(), AD = class {
    ctx;
    el;
    input;
    title;
    ok;
    mode = `deposit`;
    max = 0;
    constructor(e4) {
      this.ctx = e4, this.el = W(`uh-goldpop uh-frame`);
      for (let e5 of [`tl`, `tr`, `bl`, `br`]) this.el.appendChild(W(`uh-sc ${e5}`));
      this.title = W(`uh-goldpop__title`), this.input = fw(`input`, { class: `uh-goldpop__input uh-num`, type: `text`, inputmode: `numeric`, maxlength: `9`, "aria-label": `Amount of gold` }), this.input.addEventListener(`keydown`, (e5) => {
        e5.stopPropagation(), e5.key === `Enter` ? this.confirm() : e5.key === `Escape` && this.close();
      }), this.input.addEventListener(`input`, () => {
        let e5 = this.value();
        this.ok.disabled = e5 <= 0;
      });
      let t2 = gw(`uh-btn uh-btn--small`, `All`, () => {
        this.input.value = String(this.max), this.ok.disabled = this.max <= 0;
      });
      this.ok = gw(`uh-btn uh-btn--small uh-btn--primary`, `Deposit`, () => this.confirm());
      let n2 = gw(`uh-btn uh-btn--small`, `Cancel`, () => this.close());
      this.el.append(this.title, W(`uh-goldpop__row`, W(`uh-goldpop__coin`, hw(BT(`gold`), ``)), this.input, t2), W(`uh-goldpop__actions`, n2, this.ok)), this.el.addEventListener(`pointerdown`, (e5) => e5.stopPropagation());
    }
    value() {
      let e4 = parseInt(this.input.value.replace(/[^0-9]/g, ``), 10);
      return Number.isFinite(e4) ? Math.min(this.max, Math.max(0, e4)) : 0;
    }
    open(e4, t2, n2) {
      this.mode = t2, this.max = Math.max(0, Math.floor(n2)), this.title.replaceChildren(G(``, t2 === `deposit` ? `Deposit gold` : `Withdraw gold`), G(`uh-goldpop__max uh-num`, `max ${$T(this.max)}`)), this.ok.textContent = t2 === `deposit` ? `Deposit` : `Withdraw`, this.ok.disabled = this.max <= 0, this.input.value = String(this.max), this.el.classList.add(`is-open`), this.anchor = e4, window.addEventListener(`pointerdown`, this.onOutside, true);
      let r2 = this.el.offsetParent;
      if (r2) {
        let t3 = this.ctx.scale, n3 = r2.getBoundingClientRect(), i2 = e4.getBoundingClientRect();
        this.el.style.right = `${Math.max(0, (n3.right - i2.right) / t3).toFixed(1)}px`, this.el.style.bottom = `${Math.max(0, (n3.bottom - i2.top) / t3 + 10).toFixed(1)}px`;
      }
      requestAnimationFrame(() => {
        this.input.focus(), this.input.select();
      });
    }
    close() {
      window.removeEventListener(`pointerdown`, this.onOutside, true), this.el.classList.contains(`is-open`) && (this.el.classList.remove(`is-open`), document.activeElement === this.input && this.input.blur());
    }
    anchor = null;
    onOutside = (e4) => {
      let t2 = e4.target;
      t2 && (this.el.contains(t2) || this.anchor?.contains(t2)) || this.close();
    };
    confirm() {
      let e4 = this.value();
      e4 > 0 && this.ctx.actions.transferGold(this.mode === `deposit` ? e4 : -e4), this.close();
    }
  };
})), MD, ND, PD, FD, ID, LD = t((() => {
  dw(), Cw(), aE(), FT(), QT(), mE(), _D(), kD(), jD(), MD = { head: [188, 0, 2, 2], amulet: [306, 26, 1, 1], mainHand: [12, 54, 2, 4], body: [188, 116, 2, 3], offHand: [364, 54, 2, 4], ringLeft: [126, 286, 1, 1], belt: [188, 286, 2, 1], ringRight: [302, 286, 1, 1], gloves: [12, 266, 2, 2], boots: [364, 266, 2, 2] }, ND = { head: `Helm`, amulet: `Amulet`, mainHand: `Weapon`, body: `Armor`, offHand: `Shield`, ringLeft: `Ring`, belt: `Belt`, ringRight: `Ring`, gloves: `Gloves`, boots: `Boots` }, PD = 4, FD = class {
    ctx;
    slot;
    el;
    rec = null;
    item = null;
    hovering = false;
    constructor(e4, t2) {
      this.ctx = e4, this.slot = t2;
      let [n2, r2, i2, a2] = MD[t2], o2 = uw.cell;
      this.el = W(`uh-slot uh-slot--${t2}`), this.el.style.left = `${n2}px`, this.el.style.top = `${r2}px`, this.el.style.width = `${i2 * o2 + PD * 2}px`, this.el.style.height = `${a2 * o2 + PD * 2}px`, this.el.style.setProperty(`--ghost`, `url("${VT(t2)}")`), this.el.dataset.slot = t2, this.el.addEventListener(`pointerenter`, () => {
        this.hovering = true, this.refresh();
      }), this.el.addEventListener(`pointerleave`, () => {
        this.hovering = false, this.el.classList.remove(`is-target`, `is-target-bad`), this.rec?.el.classList.remove(`is-hover`), e4.tip.hide(this);
      }), this.el.addEventListener(`pointerdown`, (n3) => {
        n3.stopPropagation(), n3.preventDefault(), n3.button === 0 && (e4.tip.hide(this), e4.actions.clickEquipSlot(t2));
      });
    }
    set(e4) {
      if (this.item = e4, !e4) this.rec?.el.remove(), this.rec = null;
      else {
        this.rec || (this.rec = ED(e4), this.rec.el.classList.add(`uh-item--equipped`), this.el.appendChild(this.rec.el)), DD(this.rec, e4, 0, 0), this.rec.el.classList.add(`uh-item--equipped`);
        let [, , t2, n2] = MD[this.slot], r2 = uw.cell;
        this.rec.el.style.left = `${PD + (t2 - e4.w) * r2 / 2}px`, this.rec.el.style.top = `${PD + (n2 - e4.h) * r2 / 2}px`;
      }
      vw(this.el, `is-filled`, !!e4), this.hovering && this.refresh();
    }
    refresh() {
      if (!this.hovering) return;
      let e4 = this.ctx.model.cursorItem;
      if (vw(this.el, `is-target`, !!e4 && !e4.unusable), vw(this.el, `is-target-bad`, !!e4 && e4.unusable), e4 || !this.item) {
        this.ctx.tip.hide(this), this.rec?.el.classList.remove(`is-hover`), !e4 && !this.item && this.ctx.tip.show(W(`uh-tip uh-tip--text`, W(`uh-tip__title`, ND[this.slot])), this.el.getBoundingClientRect(), { owner: this, placement: `above` });
        return;
      }
      this.rec?.el.classList.add(`is-hover`);
      let t2 = this.ctx.model, n2 = {};
      t2.vendor && this.ctx.isOpen(`vendor`) && this.item.priceSell !== void 0 && (n2.price = { label: `Sell value:`, amount: this.item.priceSell }), this.ctx.tip.show(cE(this.item, n2), this.el.getBoundingClientRect(), { owner: this, placement: `above` });
    }
  }, ID = class extends gD {
    deps = [`grids`, `equipment`, `hero`, `panels`, `vendor`, `cursor`, `belt`];
    grid;
    slots = [];
    goldAmt;
    goldMax;
    deposit;
    transfer;
    constructor(e4) {
      super(e4, `inventory`, `right`, `Inventory`);
      let t2 = W(`uh-doll`);
      t2.appendChild(hw(yw(CT()), `uh-doll__shadow`));
      for (let n3 of Object.keys(MD)) {
        let r3 = new FD(e4, n3);
        this.slots.push(r3), t2.appendChild(r3.el);
      }
      this.grid = new OD(e4, `inventory`);
      let n2 = W(`uh-pack`, this.grid.el);
      this.goldAmt = G(`uh-num uh-purse__amt`), this.goldMax = G(`uh-num uh-purse__max`), this.transfer = new AD(e4), this.deposit = gw(`uh-btn uh-btn--small uh-purse__btn`, `Deposit`, () => {
        let t3 = e4.model.hero;
        t3 && this.transfer.open(this.deposit, `deposit`, t3.gold);
      });
      let r2 = W(`uh-purse`, W(`uh-purse__coin`, hw(BT(`gold`), ``)), W(`uh-purse__vals`, W(`uh-purse__label`, `Gold`), W(`uh-purse__nums`, this.goldAmt, this.goldMax)), this.deposit);
      this.body.append(t2, n2, r2, this.transfer.el);
    }
    render() {
      let e4 = this.ctx.model;
      for (let t3 of this.slots) t3.set(e4.equipment[t3.slot] ?? null);
      this.grid.render(e4.inventory);
      let t2 = e4.hero;
      _w(this.goldAmt, t2 ? $T(t2.gold) : `0`), _w(this.goldMax, t2 ? `/ ${$T(t2.goldMax)}` : ``);
      let n2 = this.ctx.isOpen(`stash`);
      vw(this.deposit, `uh-hidden`, !n2), this.deposit.disabled = !t2 || t2.gold <= 0, n2 || this.transfer.close();
      for (let e5 of this.slots) e5.refresh();
    }
    onClose() {
      super.onClose(), this.transfer.close();
    }
    gridEl() {
      return this.grid;
    }
  };
})), RD, zD, BD, VD = t((() => {
  Cw(), aE(), QT(), FT(), _D(), kD(), jD(), RD = class extends gD {
    deps = [`grids`, `hero`, `cursor`];
    grid;
    amt;
    withdraw;
    transfer;
    constructor(e4) {
      super(e4, `stash`, `left`, `Stash`), this.setSub(`Personal stash`), this.grid = new OD(e4, `stash`), this.amt = G(`uh-num uh-purse__amt`), this.transfer = new AD(e4), this.withdraw = gw(`uh-btn uh-btn--small uh-purse__btn`, `Withdraw`, () => {
        let t3 = e4.model.hero;
        if (!t3) return;
        let n2 = Math.max(0, t3.goldMax - t3.gold);
        this.transfer.open(this.withdraw, `withdraw`, Math.min(n2, t3.stashGold));
      });
      let t2 = W(`uh-purse`, W(`uh-purse__coin`, hw(BT(`gold`), ``)), W(`uh-purse__vals`, W(`uh-purse__label`, `Stash gold`), W(`uh-purse__nums`, this.amt)), this.withdraw);
      this.body.append(W(`uh-pack uh-pack--stash`, this.grid.el), t2, this.transfer.el);
    }
    render() {
      let e4 = this.ctx.model;
      this.grid.render(e4.stash);
      let t2 = e4.hero;
      _w(this.amt, $T(t2?.stashGold ?? 0)), this.withdraw.disabled = !t2 || t2.stashGold <= 0 || t2.gold >= t2.goldMax;
    }
    onClose() {
      super.onClose(), this.transfer.close();
    }
  }, zD = class extends gD {
    deps = [`grids`, `cursor`];
    grid;
    btn;
    constructor(e4) {
      super(e4, `cube`, `left`, `Coffer`), this.setSub(`Horned coffer of the old smiths`), this.grid = new OD(e4, `cube`), this.btn = gw(`uh-btn uh-btn--primary uh-btn--big uh-cube__btn`, [hw(yw(wT()), `uh-btn__icon`), G(``, `Transmute`)], () => e4.actions.transmute());
      let t2 = W(`uh-cube__well`, hw(yw(yT()), `uh-cube__art`), this.grid.el), n2 = fw(`p`, `uh-cube__lore`, `Place items inside the coffer and transmute them. Matching offerings are forged into something new; anything else is left untouched.`);
      this.body.append(W(`uh-cube`, t2, this.btn, n2));
    }
    render() {
      let e4 = this.ctx.model.cube;
      this.grid.render(e4), this.btn.disabled = !e4 || e4.items.length === 0;
    }
  }, BD = class extends gD {
    deps = [`vendor`, `hero`, `cursor`];
    grid;
    tabs;
    gold;
    sellHint;
    tab = 0;
    lastNpc = ``;
    tabSig = ``;
    constructor(e4) {
      super(e4, `vendor`, `left`, `Trade`), this.grid = new OD(e4, `vendor`, { sell: true }), this.tabs = W(`uh-tabs`), this.gold = G(`uh-num uh-purse__amt`), this.sellHint = W(`uh-vendor__sell`);
      let t2 = W(`uh-purse uh-purse--vendor`, W(`uh-purse__coin`, hw(BT(`gold`), ``)), W(`uh-purse__vals`, W(`uh-purse__label`, `Your gold`), W(`uh-purse__nums`, this.gold)), W(`uh-vendor__help`, G(``, `Right-click to buy`), G(``, `Drop an item here to sell`)));
      this.body.append(this.tabs, W(`uh-pack uh-pack--vendor`, this.grid.el), t2, this.sellHint), this.el.addEventListener(`pointerdown`, (t3) => {
        t3.button !== 0 || !e4.model.cursorItem || t3.target.closest(`.uh-close, .uh-tab`) || (t3.stopPropagation(), e4.actions.sellCursorItem());
      }), this.el.addEventListener(`pointerenter`, () => this.hover(true)), this.el.addEventListener(`pointerleave`, () => this.hover(false));
    }
    hovering = false;
    hover(e4) {
      this.hovering = e4, this.updateSell();
    }
    updateSell() {
      let e4 = this.ctx.model.cursorItem, t2 = this.hovering && !!e4 && this.open;
      vw(this.el, `is-sell-target`, t2), t2 && e4 ? this.ctx.cursor.setHint(`Sell for `, e4.priceSell ?? 0) : this.ctx.cursor.setHint(null);
    }
    render() {
      let e4 = this.ctx.model.vendor, t2 = this.ctx.model.hero;
      if (!e4) {
        this.grid.render(null);
        return;
      }
      e4.npcName !== this.lastNpc && (this.lastNpc = e4.npcName, this.tab = 0), this.setTitle(e4.npcName), this.setSub(`Trade`), this.tab = Math.min(this.tab, Math.max(0, e4.tabs.length - 1));
      let n2 = `${this.tab}|${e4.tabs.map((e5) => e5.name).join(`|`)}`;
      n2 !== this.tabSig && (this.tabSig = n2, this.tabs.replaceChildren(), e4.tabs.forEach((e5, t3) => {
        let n3 = gw(`uh-tab${t3 === this.tab ? ` is-on` : ``}`, G(`uh-tab__label`, e5.name), () => {
          this.tab = t3, this.invalidate();
        });
        this.tabs.appendChild(n3);
      })), this.grid.render(e4.tabs[this.tab]?.grid ?? null), _w(this.gold, $T(t2?.gold ?? 0)), this.updateSell();
    }
    onClose() {
      super.onClose(), this.hovering = false, this.ctx.cursor.setHint(null), vw(this.el, `is-sell-target`, false);
    }
  };
})), HD, UD, WD, GD, KD, qD = t((() => {
  yE(), Cw(), UE(), QT(), mE(), _D(), HD = [92, 254, 416], UD = [16, 196, 376], WD = 78, GD = [1, 6, 12], KD = class extends gD {
    deps = [`skills`, `hero`];
    tabs;
    tree;
    svg;
    nodesEl;
    points;
    pointsNum;
    tab = 0;
    hoverId = null;
    constructor(e4) {
      super(e4, `skills`, `right`, `Skill Tree`), this.pointsNum = G(`uh-num`), this.points = W(`uh-points uh-points--skills`, G(`uh-points__label`, `Skill points`), this.pointsNum), this.tabs = W(`uh-tabs uh-tabs--skills`), this.svg = document.createElementNS(`http://www.w3.org/2000/svg`, `svg`), this.svg.setAttribute(`class`, `uh-tree__links`), this.nodesEl = W(`uh-tree__nodes`);
      let t2 = W(`uh-tree__tiers`);
      GD.forEach((e5, n2) => {
        let r2 = W(`uh-tier`, G(`uh-tier__label`, `Level`), G(`uh-tier__num uh-num`, String(e5)));
        r2.style.top = `${UD[n2] + WD / 2 - 22}px`, t2.appendChild(r2);
      }), this.hint = W(`uh-tree__hint`), this.tree = W(`uh-tree`, t2, this.svg, this.nodesEl, this.hint), this.body.append(this.points, this.tabs, this.tree);
    }
    hint;
    sig = ``;
    render() {
      let e4 = this.ctx.model.skills, t2 = this.ctx.model.hero?.skillPoints ?? 0;
      if (_w(this.pointsNum, String(t2)), vw(this.points, `is-on`, t2 > 0), !e4) return;
      this.tab = Math.min(this.tab, Math.max(0, e4.trees.length - 1));
      let n2 = `${this.tab}|${t2}|${e4.trees.map((e5) => `${e5.name}:${e5.nodes.map((e6) => `${e6.id},${e6.level},${e6.bonus},${+!!e6.learnable},${e6.lockedReason ?? ``},${e6.lines.length},${e6.lines[2]?.text ?? ``}`).join(`;`)}`).join(`|`)}`;
      if (n2 === this.sig) return;
      this.sig = n2, this.renderTabs(e4.trees, t2), this.renderTree(e4.trees[this.tab], t2);
      let r2 = e4.trees[this.tab];
      _w(this.hint, t2 <= 0 ? `You gain a skill point with every level.` : r2 && r2.nodes.some((e5) => e5.learnable) ? `Click a glowing skill to spend a point.` : `Nothing in this tree can be learned yet.`);
    }
    onOpen() {
      this.sig = ``;
    }
    renderTabs(e4, t2) {
      this.tabs.replaceChildren(), e4.forEach((e5, n2) => {
        let r2 = t2 > 0 && e5.nodes.some((e6) => e6.learnable), i2 = gw(`uh-tab${n2 === this.tab ? ` is-on` : ``}${r2 ? ` has-learnable` : ``}`, [G(`uh-tab__label`, e5.name), G(`uh-tab__dot`)], () => {
          this.tab = n2, this.ctx.tip.hide(), this.invalidate();
        });
        this.tabs.appendChild(i2);
      });
    }
    center(e4) {
      return [HD[Math.max(0, Math.min(2, e4.col))], UD[Math.max(0, Math.min(2, e4.row))]];
    }
    renderTree(e4, t2) {
      for (this.nodesEl.replaceChildren(); this.svg.firstChild; ) this.svg.firstChild.remove();
      if (!e4) return;
      let n2 = new Map(e4.nodes.map((e5) => [e5.id, e5])), r2 = /* @__PURE__ */ new Map();
      for (let t3 of e4.nodes) {
        let e5 = vE[t3.id]?.element ?? `physical`;
        r2.set(e5, (r2.get(e5) ?? 0) + 1);
      }
      let i2 = [...r2.entries()].sort((e5, t3) => t3[1] - e5[1])[0]?.[0] ?? `physical`;
      this.tree.dataset.element = i2;
      let a2 = new Set(e4.nodes.map((e5) => `${e5.row},${e5.col}`));
      for (let e5 = 0; e5 < 3; e5++) for (let t3 = 0; t3 < 3; t3++) {
        if (a2.has(`${e5},${t3}`)) continue;
        let n3 = W(`uh-tree__socket`);
        n3.style.left = `${HD[t3] - WD / 2}px`, n3.style.top = `${UD[e5]}px`, this.nodesEl.appendChild(n3);
      }
      let o2 = `http://www.w3.org/2000/svg`, s2 = document.createElementNS(o2, `defs`);
      s2.innerHTML = `<linearGradient id="uhLinkLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset="1" stop-color="#c8a24a"/></linearGradient>
<marker id="uhArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#5a4a32"/></marker>
<marker id="uhArrowLit" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#e9cf8a"/></marker>`, this.svg.appendChild(s2);
      for (let t3 of e4.nodes) for (let e5 of t3.prereqs) {
        let r3 = n2.get(e5);
        if (!r3) continue;
        let [i3, a3] = this.center(r3), [s3, c2] = this.center(t3), l2 = a3 + WD + 32, u2 = c2 - 17, d2 = (l2 + u2) / 2, f2 = i3 === s3 ? `M${i3} ${l2} L${s3} ${u2}` : `M${i3} ${l2} L${i3} ${d2} L${s3} ${d2} L${s3} ${u2}`, p2 = r3.level > 0, m2 = document.createElementNS(o2, `path`);
        m2.setAttribute(`d`, f2), m2.setAttribute(`class`, `uh-link__groove`);
        let h2 = document.createElementNS(o2, `path`);
        h2.setAttribute(`d`, f2), h2.setAttribute(`class`, `uh-link__line${p2 ? ` is-lit` : ``}`), h2.setAttribute(`marker-end`, p2 ? `url(#uhArrowLit)` : `url(#uhArrow)`), this.svg.append(m2, h2);
      }
      for (let n3 of e4.nodes) {
        let [e5, r3] = this.center(n3), i3 = n3.level >= n3.maxLevel && n3.maxLevel > 0, a3 = n3.learnable && t2 > 0, o3 = !n3.learnable && n3.level === 0, s3 = W([`uh-node`, n3.level > 0 ? `is-learned` : ``, a3 ? `is-learnable` : ``, o3 ? `is-locked` : ``, i3 ? `is-maxed` : ``, n3.passive ? `is-passive` : ``].filter(Boolean).join(` `), W(`uh-node__icon`, hw(PE(n3.id), ``)), W(`uh-node__lvl`, G(`uh-num`, String(n3.level)), n3.bonus > 0 ? G(`uh-node__bonus uh-num`, `+${n3.bonus}`) : null), o3 ? hw(BT(`lock`), `uh-node__lock`) : null, W(`uh-node__name`, n3.name));
        s3.style.left = `${e5 - WD / 2}px`, s3.style.top = `${r3}px`, s3.dataset.skill = n3.id, s3.addEventListener(`pointerenter`, () => {
          this.hoverId = n3.id, this.showTip(n3, s3, t2);
        }), s3.addEventListener(`pointerleave`, () => {
          this.hoverId === n3.id && (this.hoverId = null), this.ctx.tip.hide(this);
        }), s3.addEventListener(`click`, (e6) => {
          e6.stopPropagation(), a3 && (s3.classList.remove(`is-pop`), s3.offsetWidth, s3.classList.add(`is-pop`), this.ctx.actions.learnSkill(n3.id));
        }), this.nodesEl.appendChild(s3), this.hoverId === n3.id && this.showTip(n3, s3, t2);
      }
    }
    showTip(e4, t2, n2) {
      let r2 = sE(e4.lines, `uh-tip--skilltree`), i2 = W(`uh-tip__foot`);
      e4.passive && i2.appendChild(oE({ text: `Passive`, color: `grey`, size: `small` })), e4.learnable && n2 > 0 ? i2.appendChild(W(`uh-tip__hint is-go`, `Click to learn — costs 1 skill point`)) : e4.lockedReason ? i2.appendChild(W(`uh-tip__hint is-bad`, e4.lockedReason)) : e4.level >= e4.maxLevel && i2.appendChild(W(`uh-tip__hint`, `Mastered`)), i2.childElementCount && r2.appendChild(i2), this.ctx.tip.show(r2, t2.querySelector(`.uh-node__icon`).getBoundingClientRect(), { owner: this, placement: this.side === `right` ? `sideLeft` : `side` });
    }
  };
})), JD, YD, XD, ZD, QD = t((() => {
  Cw(), aE(), FT(), QT(), _D(), JD = { locked: `Not yet revealed`, active: `In progress`, complete: `Completed`, rewardPending: `Reward waiting` }, YD = class extends gD {
    deps = [`quests`];
    list;
    detail;
    selected = null;
    constructor(e4) {
      super(e4, `quests`, `left`, `Quests`), this.setSub(`Act I`), this.list = W(`uh-quests`), this.detail = W(`uh-quest`), this.body.append(this.list, this.detail);
    }
    render() {
      let e4 = this.ctx.model.quests;
      (!this.selected || !e4.some((e5) => e5.id === this.selected)) && (this.selected = (e4.find((e5) => e5.status === `rewardPending`) ?? e4.find((e5) => e5.status === `active`) ?? e4[0])?.id ?? null), this.list.replaceChildren(), e4.forEach((e5, t3) => {
        let n3 = W(`uh-medal is-${e5.status}`, hw(yw(ET(t3)), `uh-medal__glyph`));
        e5.status === `complete` && n3.appendChild(hw(BT(`check`), `uh-medal__mark`)), e5.status === `rewardPending` && n3.appendChild(hw(BT(`exclaim`), `uh-medal__mark is-pending`)), e5.status === `locked` && n3.appendChild(hw(BT(`lock`), `uh-medal__mark is-lock`));
        let r2 = gw(`uh-questbtn is-${e5.status}${e5.id === this.selected ? ` is-selected` : ``}`, [n3, G(`uh-questbtn__name`, e5.status === `locked` ? `???` : e5.name)], () => {
          this.selected = e5.id, this.invalidate();
        });
        this.list.appendChild(r2);
      }), e4.length || this.list.appendChild(W(`uh-empty`, `No quests yet. Speak with the folk of Grayvigil.`));
      let t2 = e4.find((e5) => e5.id === this.selected);
      if (this.detail.replaceChildren(), !t2) return;
      let n2 = t2.status === `locked`;
      this.detail.append(W(`uh-quest__head`, W(`uh-quest__name`, n2 ? `Unknown quest` : t2.name), W(`uh-quest__status is-${t2.status}`, JD[t2.status])), fw(`p`, `uh-quest__desc`, n2 ? `Rumours have not reached you yet.` : t2.description)), !n2 && t2.stepText && this.detail.append(W(`uh-quest__block`, W(`uh-quest__label`, t2.status === `complete` ? `Outcome` : `Current step`), fw(`p`, `uh-quest__step`, t2.stepText))), !n2 && t2.rewardText && this.detail.append(W(`uh-quest__block`, W(`uh-quest__label`, `Reward`), fw(`p`, `uh-quest__reward`, t2.rewardText)));
    }
  }, XD = class extends gD {
    deps = [`waypoints`, `area`];
    tabs;
    list;
    act = -1;
    constructor(e4) {
      super(e4, `waypoint`, `left`, `Waypoints`), this.tabs = W(`uh-tabs uh-tabs--acts`), this.list = W(`uh-wps`), this.body.append(this.tabs, this.list, W(`uh-wps__hint`, `Touch a waypoint in the world to add it to this network.`));
    }
    render() {
      let e4 = this.ctx.model.waypoints, t2 = [...new Set(e4.map((e5) => e5.act))].sort((e5, t3) => e5 - t3), n2 = e4.find((e5) => e5.current);
      (this.act < 0 || !t2.includes(this.act)) && (this.act = n2?.act ?? t2[0] ?? 1), this.tabs.replaceChildren();
      for (let e5 of t2) this.tabs.appendChild(gw(`uh-tab${e5 === this.act ? ` is-on` : ``}`, G(`uh-tab__label`, `Act ${tE(e5)}`), () => {
        this.act = e5, this.invalidate();
      }));
      this.list.replaceChildren();
      for (let t3 of e4.filter((e5) => e5.act === this.act)) this.list.appendChild(this.row(t3));
    }
    row(e4) {
      let t2 = e4.current ? `current` : e4.active ? `active` : `inactive`, n2 = gw(`uh-wp is-${t2}`, [hw(yw(DT(t2)), `uh-wp__rune`), G(`uh-wp__name`, (e4.active, e4.name)), G(`uh-wp__tag`, e4.current ? `You are here` : e4.active ? `` : `Undiscovered`)], () => {
        e4.active && !e4.current && this.ctx.actions.travel(e4.areaId);
      }, e4.name);
      return (!e4.active || e4.current) && n2.classList.add(`is-disabled`), n2;
    }
  }, ZD = class extends gD {
    deps = [`merc`, `hero`];
    portrait;
    name;
    meta;
    lifeFill;
    lifeText;
    lifeRow;
    note;
    hire;
    frac = -1;
    constructor(e4) {
      super(e4, `mercenary`, `left`, `Mercenary`), this.portrait = W(`uh-mercp__frame`, hw(yw(ST()), `uh-mercp__img`), W(`uh-mercp__skull`, hw(BT(`skull`), ``))), this.name = W(`uh-mercp__name`), this.meta = W(`uh-mercp__meta`), this.lifeFill = W(`uh-mercp__fill`), this.lifeText = W(`uh-mercp__lifetext uh-num`), this.lifeRow = W(`uh-mercp__life`, W(`uh-mercp__bar`, this.lifeFill, W(`uh-mercp__gloss`)), this.lifeText), this.note = fw(`p`, `uh-mercp__note`), this.hire = gw(`uh-btn uh-btn--primary uh-btn--big`, `Hire`, () => e4.actions.hireMercenary()), this.body.append(W(`uh-mercp`, this.portrait, this.name, this.meta, this.lifeRow, this.note, this.hire));
    }
    render() {
      let e4 = this.ctx.model.merc;
      if (vw(this.portrait, `is-empty`, !e4), vw(this.portrait, `is-dead`, !!e4?.dead), vw(this.lifeRow, `uh-hidden`, !e4), !e4) {
        _w(this.name, `No mercenary`), _w(this.meta, ``), this.note.textContent = `Captain Maera’s archers will guard you for coin. A hireling levels with you and fights at your side.`, this.hire.textContent = `Hire a mercenary`, this.hire.classList.remove(`uh-hidden`);
        return;
      }
      _w(this.name, e4.name), _w(this.meta, `Level ${e4.level} archer`), _w(this.lifeText, `${$T(e4.life)} / ${$T(e4.lifeMax)}`), e4.dead ? (this.note.textContent = `${e4.name} has fallen. Return to the captain to bring your hireling back.`, this.hire.textContent = `Resurrect`, this.hire.classList.remove(`uh-hidden`)) : (this.note.textContent = `Your hireling follows you and attacks whatever you fight.`, this.hire.classList.add(`uh-hidden`));
    }
    tick() {
      let e4 = this.ctx.model.merc;
      if (!e4) return;
      let t2 = e4.lifeMax > 0 ? Math.max(0, Math.min(1, e4.life / e4.lifeMax)) : 0;
      Math.abs(t2 - this.frac) > 2e-3 && (this.frac = t2, this.lifeFill.style.transform = `scaleX(${t2.toFixed(4)})`, _w(this.lifeText, `${$T(e4.life)} / ${$T(e4.lifeMax)}`));
    }
  };
})), $D, eO = t((() => {
  dw(), CD(), LD(), VD(), qD(), QD(), $D = class extends lw {
    deps = [`panels`, `screen`, `vendor`];
    panels = /* @__PURE__ */ new Map();
    constructor(e4) {
      super(e4);
      let t2 = [new SD(e4), new YD(e4), new RD(e4), new BD(e4), new zD(e4), new XD(e4), new ZD(e4), new ID(e4), new KD(e4)];
      for (let e5 of t2) this.panels.set(e5.id, e5);
    }
    render() {
      let e4 = this.ctx.model, t2 = e4.screen === `game`, n2 = null, r2 = null;
      for (let t3 of e4.openPanels) {
        let i2 = this.panels.get(t3);
        i2 && (t3 === `vendor` && !e4.vendor || (i2.side === `left` ? n2 = t3 : r2 = t3));
      }
      for (let [e5, i2] of this.panels) i2.setOpen(t2 && (e5 === n2 || e5 === r2));
    }
    sync() {
      super.sync();
      for (let e4 of this.panels.values()) e4.sync();
    }
    tick(e4) {
      for (let t2 of this.panels.values()) t2.open && t2.tick(e4);
    }
    destroy() {
      for (let e4 of this.panels.values()) e4.destroy();
    }
  };
}));
function tO(e4) {
  for (let t2 of [`tl`, `tr`, `bl`, `br`]) e4.appendChild(fw(`i`, `uh-corner ${t2}`));
}
var nO, rO, iO, aO, oO, sO, cO, lO, uO = t((() => {
  yE(), dw(), Cw(), aE(), FT(), QT(), mE(), nO = { sorceress: { name: `Sorceress`, line: `Commands fire, frost and lightning. Frail, but ruinous at range.` }, barbarian: { name: `Barbarian`, line: `Wields any steel and roars allies to glory. Born for the front line.` }, necromancer: { name: `Necromancer`, line: `Raises the dead to fight for him and withers foes with bone and curses.` } }, rO = [`normal`, `nightmare`, `hell`], iO = class {
    el;
    constructor(e4) {
      let t2 = W(`uh-embers`);
      for (let e5 = 0; e5 < 18; e5++) {
        let n3 = G(`uh-ember`);
        n3.style.setProperty(`--x`, `${e5 * 53 % 100}%`), n3.style.setProperty(`--d`, `${6 + e5 * 7 % 9}s`), n3.style.setProperty(`--delay`, `${-(e5 * 1.7 % 9)}s`), n3.style.setProperty(`--drift`, `${(e5 % 5 - 2) * 18}px`), t2.appendChild(n3);
      }
      let n2 = W(`uh-logo`, G(`uh-logo__glow`, `GAMETEST`), G(`uh-logo__shadow`, `GAMETEST`), G(`uh-logo__metal`, `GAMETEST`), G(`uh-logo__sheen`, `GAMETEST`));
      this.el = W(`uh-screen uh-titlescreen`, W(`uh-titlescreen__vignette`), t2, W(`uh-titlescreen__logo`, n2, hw(yw(TT()), `uh-titlescreen__flourish`), W(`uh-titlescreen__sub`, `Lord of Ruin`)), W(`uh-titlescreen__cta`, G(``, `Click to begin`)), W(`uh-titlescreen__foot`, `An original tribute to the classic action-RPG`)), this.el.addEventListener(`click`, () => e4.actions.titleContinue());
    }
  }, aO = class {
    ctx;
    el;
    list;
    empty;
    diffRow;
    play;
    del;
    confirm;
    confirmText;
    selected = null;
    diff = `normal`;
    constructor(e4) {
      this.ctx = e4, this.list = W(`uh-select__list`), this.empty = W(`uh-select__empty`, hw(yw(wT()), `uh-select__emptysigil`), W(`uh-select__emptytitle`, `No heroes yet`), fw(`p`, ``, `Every legend starts at the campfire. Create a hero to begin.`), gw(`uh-btn uh-btn--primary`, `Create new hero`, () => e4.actions.openCreate()));
      let t2 = W(`uh-bigframe uh-select__frame`, this.list, this.empty);
      tO(t2), this.diffRow = W(`uh-diff`), this.play = gw(`uh-btn uh-btn--primary uh-btn--big`, `Play`, () => this.doPlay()), this.del = gw(`uh-btn uh-btn--danger`, `Delete`, () => this.askDelete());
      let n2 = gw(`uh-btn`, `Create new`, () => e4.actions.openCreate());
      this.confirmText = fw(`p`, `uh-confirm__text`), this.confirm = W(`uh-confirm`, W(`uh-confirm__box uh-frame`, W(`uh-sc tl`), W(`uh-sc tr`), W(`uh-sc bl`), W(`uh-sc br`), W(`uh-confirm__title`, `Delete hero?`), this.confirmText, W(`uh-confirm__actions`, gw(`uh-btn`, `Keep`, () => this.confirm.classList.remove(`is-open`)), gw(`uh-btn uh-btn--danger`, `Delete forever`, () => {
        this.confirm.classList.remove(`is-open`), this.selected && e4.actions.deleteCharacter(this.selected);
      })))), this.el = W(`uh-screen uh-selectscreen`, W(`uh-screen__shade`), W(`uh-screen__head`, fw(`h1`, `uh-screen__title`, `Select Hero`), hw(yw(TT()), `uh-screen__flourish`)), t2, W(`uh-select__footer`, this.diffRow, W(`uh-select__bar`, W(`uh-select__left`, n2, this.del), this.play)), this.confirm);
    }
    slot() {
      return this.ctx.model.characters.find((e4) => e4.id === this.selected);
    }
    doPlay() {
      let e4 = this.slot();
      !e4 || e4.dead || this.ctx.actions.playCharacter(e4.id, this.diff);
    }
    askDelete() {
      let e4 = this.slot();
      e4 && (this.confirmText.textContent = `${e4.name}, level ${e4.level} ${e4.className}, and everything they carry will be lost forever.`, this.confirm.classList.add(`is-open`));
    }
    render() {
      this.ctx.tip.hide();
      let e4 = this.ctx.model.characters;
      if (!e4.some((e5) => e5.id === this.selected)) {
        let t3 = e4.find((e5) => !e5.dead) ?? e4[0];
        this.selected = t3?.id ?? null, t3 && (this.diff = t3.difficulty);
      }
      vw(this.empty, `uh-hidden`, e4.length > 0), vw(this.list, `uh-hidden`, e4.length === 0), this.list.replaceChildren();
      for (let t3 of e4) {
        let e5 = gw(`uh-hero${t3.id === this.selected ? ` is-selected` : ``}${t3.dead ? ` is-dead` : ``}${t3.hardcore ? ` is-hc` : ``}`, [W(`uh-hero__crest`, hw(yw(xT(t3.classId)), ``)), W(`uh-hero__text`, W(`uh-hero__name`, t3.name), W(`uh-hero__meta`, G(`uh-num`, `Level ${t3.level}`), G(``, ` ${t3.className}`)), W(`uh-hero__area`, t3.areaName, t3.difficulty === `normal` ? null : G(`uh-hero__diff is-${t3.difficulty}`, nE(t3.difficulty)))), t3.hardcore ? G(`uh-hc-badge`, t3.dead ? `Fallen` : `Hardcore`) : null, t3.dead ? hw(BT(`skull`), `uh-hero__skull`) : null], () => {
          this.selected = t3.id, this.diff = t3.difficultiesUnlocked.includes(t3.difficulty) ? t3.difficulty : t3.difficultiesUnlocked[0] ?? `normal`, this.render();
        }, `${t3.name}, level ${t3.level} ${t3.className}`);
        e5.addEventListener(`dblclick`, () => {
          t3.dead || this.ctx.actions.playCharacter(t3.id, this.diff);
        }), this.list.appendChild(e5);
      }
      let t2 = this.slot();
      this.diffRow.replaceChildren(G(`uh-diff__label`, `Difficulty`));
      for (let e5 of rO) {
        let n2 = !!t2 && t2.difficultiesUnlocked.includes(e5), r2 = gw(`uh-diffbtn is-${e5}${e5 === this.diff ? ` is-on` : ``}${n2 ? `` : ` is-locked`}`, [n2 ? null : hw(BT(`lock`), `uh-diffbtn__lock`), G(``, nE(e5))], () => {
          n2 && (this.diff = e5, this.render());
        });
        if (!n2) {
          r2.classList.add(`is-disabled`);
          let t3 = e5 === `nightmare` ? `Defeat the Normal campaign to unlock.` : `Defeat the Nightmare campaign to unlock.`;
          r2.addEventListener(`pointerenter`, () => this.ctx.tip.show(lE(`${nE(e5)} is locked`, [t3]), r2.getBoundingClientRect(), { owner: r2, placement: `above` })), r2.addEventListener(`pointerleave`, () => this.ctx.tip.hide(r2));
        }
        this.diffRow.appendChild(r2);
      }
      this.play.disabled = !t2 || t2.dead, this.del.disabled = !t2, vw(this.diffRow, `uh-hidden`, !t2);
    }
  }, oO = /^[A-Za-z]{2,15}$/, sO = class {
    ctx;
    el;
    cards = /* @__PURE__ */ new Map();
    input;
    msg;
    hc;
    hcWarn;
    create;
    cls = null;
    hardcore = false;
    touched = false;
    constructor(e4) {
      this.ctx = e4;
      let t2 = W(`uh-classes`);
      for (let n3 of _E) {
        let r3 = nO[n3], i2 = gw(`uh-classcard is-${n3}`, [W(`uh-classcard__crest`, hw(yw(xT(n3)), ``)), W(`uh-classcard__name`, r3.name), W(`uh-classcard__line`, r3.line)], () => {
          this.cls = n3, e4.actions.previewClass(n3), this.update();
        }, r3.name);
        i2.addEventListener(`pointerenter`, () => e4.actions.previewClass(n3)), i2.addEventListener(`pointerleave`, () => e4.actions.previewClass(this.cls)), this.cards.set(n3, i2), t2.appendChild(i2);
      }
      this.input = fw(`input`, { class: `uh-input uh-create__name`, type: `text`, maxlength: `15`, spellcheck: `false`, autocomplete: `off`, placeholder: `Hero name`, "aria-label": `Hero name` }), this.input.addEventListener(`keydown`, (e5) => {
        e5.stopPropagation(), e5.key === `Enter` && this.submit();
      }), this.input.addEventListener(`input`, () => {
        this.touched = true, this.update();
      }), this.msg = W(`uh-create__msg`), this.hc = gw(`uh-check`, [G(`uh-check__box`), G(`uh-check__label`, `Hardcore`)], () => {
        this.hardcore = !this.hardcore, this.update();
      }), this.hc.setAttribute(`role`, `checkbox`), this.hcWarn = W(`uh-create__warn`, hw(BT(`skull`), ``), G(``, `A hardcore hero who dies is gone forever.`)), this.create = gw(`uh-btn uh-btn--primary uh-btn--big`, `Create`, () => this.submit());
      let n2 = gw(`uh-btn`, `Back`, () => e4.actions.backToCharSelect()), r2 = W(`uh-create__form uh-frame`, W(`uh-sc tl`), W(`uh-sc tr`), W(`uh-sc bl`), W(`uh-sc br`), n2, W(`uh-create__field`, W(`uh-create__label`, `Name`), this.input, this.msg), W(`uh-create__hc`, this.hc, this.hcWarn), this.create);
      this.el = W(`uh-screen uh-createscreen`, W(`uh-screen__shade uh-screen__shade--create`), W(`uh-screen__head`, fw(`h1`, `uh-screen__title`, `Choose Your Class`), hw(yw(TT()), `uh-screen__flourish`)), t2, r2);
    }
    validation() {
      let e4 = this.input.value.trim();
      return e4 ? e4.length < 2 ? `Names need at least 2 letters.` : /^[A-Za-z]+$/.test(e4) ? e4.length > 15 ? `Names can have at most 15 letters.` : this.ctx.model.characters.some((t2) => t2.name.toLowerCase() === e4.toLowerCase()) ? `A hero with that name already exists.` : `` : `Use letters A–Z only.` : this.touched ? `Enter a name for your hero.` : ``;
    }
    update() {
      for (let [e5, t3] of this.cards) vw(t3, `is-selected`, e5 === this.cls);
      this.hc.setAttribute(`aria-checked`, String(this.hardcore)), vw(this.hcWarn, `is-on`, this.hardcore);
      let e4 = this.validation();
      _w(this.msg, e4), vw(this.msg, `is-error`, !!e4);
      let t2 = !!this.cls && oO.test(this.input.value.trim()) && !e4;
      this.create.disabled = !t2, this.cls || (_w(this.msg, e4 || `Choose a class, then name your hero.`), vw(this.msg, `is-error`, !!e4));
    }
    submit() {
      this.touched = true, this.update(), !(this.create.disabled || !this.cls) && this.ctx.actions.createCharacter({ name: this.input.value.trim(), classId: this.cls, hardcore: this.hardcore });
    }
    enter() {
      this.cls = null, this.hardcore = false, this.touched = false, this.input.value = ``, this.update(), requestAnimationFrame(() => this.input.focus({ preventScroll: true }));
    }
    leave() {
      document.activeElement === this.input && this.input.blur();
    }
    prefill(e4, t2, n2) {
      this.cls = e4, this.input.value = t2, this.hardcore = n2, this.touched = true, this.update();
    }
  }, cO = class {
    ctx;
    el;
    title;
    sub;
    fill;
    spark;
    pct;
    tip;
    shown = 0;
    constructor(e4) {
      this.ctx = e4, this.title = W(`uh-loading__title`), this.sub = W(`uh-loading__sub`), this.fill = W(`uh-loading__fill`), this.spark = W(`uh-loading__spark`), this.pct = W(`uh-loading__pct uh-num`), this.tip = fw(`p`, `uh-loading__tip`), this.el = W(`uh-screen uh-loadingscreen`, W(`uh-loading__bg`, hw(yw(wT()), `uh-loading__sigil`)), W(`uh-loading__center`, this.sub, this.title, hw(yw(TT()), `uh-loading__flourish`), W(`uh-loading__bar`, W(`uh-loading__track`, this.fill, this.spark), fw(`i`, `uh-loading__cap is-l`), fw(`i`, `uh-loading__cap is-r`)), this.pct), W(`uh-loading__tipbox`, G(`uh-loading__tiplabel`, `Hint`), this.tip));
    }
    render() {
      let e4 = this.ctx.model.loading;
      _w(this.title, e4?.title ?? `Loading`), _w(this.sub, e4?.subtitle ?? ``), this.tip.textContent = e4?.tip ?? ``;
    }
    tick(e4) {
      let t2 = this.ctx.model.loading, n2 = Math.max(0, Math.min(1, t2?.progress ?? 0));
      this.shown += (n2 - this.shown) * (1 - Math.exp(-e4 * 10)), n2 < this.shown && (this.shown = n2), this.fill.style.transform = `scaleX(${this.shown.toFixed(4)})`, this.spark.style.left = `${(this.shown * 100).toFixed(2)}%`, _w(this.pct, `${Math.round(this.shown * 100)}%`);
    }
  }, lO = class extends lw {
    deps = [`screen`, `characters`, `loading`];
    boot;
    title;
    select;
    create;
    loading;
    current = ``;
    constructor(e4) {
      super(e4), this.boot = W(`uh-screen uh-bootscreen`, hw(yw(wT()), `uh-boot__sigil`)), this.title = new iO(e4), this.select = new aO(e4), this.create = new sO(e4), this.loading = new cO(e4);
      for (let t2 of [this.boot, this.title.el, this.select.el, this.create.el, this.loading.el]) t2.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), e4.layers.screen.appendChild(t2);
    }
    render() {
      let e4 = this.ctx.model.screen;
      e4 !== this.current && (this.current === `charCreate` && this.create.leave(), this.current = e4, vw(this.boot, `is-on`, e4 === `boot`), vw(this.title.el, `is-on`, e4 === `title`), vw(this.select.el, `is-on`, e4 === `charSelect`), vw(this.create.el, `is-on`, e4 === `charCreate`), vw(this.loading.el, `is-on`, e4 === `loading`), e4 === `charCreate` && this.create.enter()), e4 === `charSelect` && this.select.render(), e4 === `loading` && this.loading.render();
    }
    tick(e4) {
      this.current === `loading` && this.loading.tick(e4);
    }
  };
}));
function dO(e4) {
  for (let t2 of [`tl`, `tr`, `bl`, `br`]) e4.appendChild(fw(`i`, `uh-corner ${t2}`));
}
var fO, pO, mO, hO, gO, _O, vO = t((() => {
  dw(), Cw(), SE(), FT(), fO = [`menu`, `options`, `help`], pO = class {
    min;
    max;
    fmtv;
    onInput;
    step;
    el;
    val;
    dragging = false;
    v = 0;
    constructor(e4, t2, n2, r2, i2 = 0.01) {
      this.min = e4, this.max = t2, this.fmtv = n2, this.onInput = r2, this.step = i2, this.el = W(`uh-slider`, W(`uh-slider__track`, W(`uh-slider__fill`)), W(`uh-slider__thumb`)), this.el.setAttribute(`role`, `slider`), this.val = G(`uh-slider__val uh-num`), this.el.addEventListener(`pointerdown`, (e5) => {
        if (e5.button === 0) {
          e5.stopPropagation(), e5.preventDefault(), this.dragging = true;
          try {
            this.el.setPointerCapture(e5.pointerId);
          } catch {
          }
          this.fromPointer(e5.clientX, false);
        }
      }), this.el.addEventListener(`pointermove`, (e5) => {
        this.dragging && this.fromPointer(e5.clientX, false);
      }), this.el.addEventListener(`pointerup`, (e5) => {
        this.dragging && (this.dragging = false, this.fromPointer(e5.clientX, true));
      }), this.el.addEventListener(`pointercancel`, () => {
        this.dragging = false, this.onInput(this.v, true);
      }), this.el.addEventListener(`lostpointercapture`, () => {
        this.dragging && (this.dragging = false, this.onInput(this.v, true));
      });
    }
    get valueEl() {
      return this.val;
    }
    fromPointer(e4, t2) {
      let n2 = this.el.getBoundingClientRect(), r2 = Sw((e4 - n2.left) / Math.max(1, n2.width)), i2 = this.min + r2 * (this.max - this.min);
      i2 = Math.round(i2 / this.step) * this.step, this.paint(i2), this.onInput(i2, t2);
    }
    paint(e4) {
      this.v = e4;
      let t2 = (e4 - this.min) / (this.max - this.min);
      this.el.style.setProperty(`--p`, `${(Sw(t2) * 100).toFixed(2)}%`), this.el.setAttribute(`aria-valuenow`, String(e4)), _w(this.val, this.fmtv(e4));
    }
    set(e4) {
      this.dragging || this.paint(e4);
    }
  }, mO = class {
    el;
    constructor(e4) {
      let t2 = (e5, t3, n2 = ``) => gw(`uh-menuitem ${n2}`, [hw(yw(wT()), `uh-menuitem__sigil is-l`), G(`uh-menuitem__label`, e5), hw(yw(wT()), `uh-menuitem__sigil is-r`)], t3, e5);
      this.el = W(`uh-gamemenu`, W(`uh-gamemenu__title`, `Paused`), hw(yw(TT()), `uh-gamemenu__flourish`), t2(`Resume`, () => e4.actions.resume(), `is-primary`), t2(`Options`, () => e4.actions.togglePanel(`options`)), t2(`Help`, () => e4.actions.togglePanel(`help`)), t2(`Save and Exit`, () => e4.actions.saveAndExit(), `is-exit`));
    }
  }, hO = class {
    ctx;
    el;
    sliders = {};
    checks = {};
    quality;
    constructor(e4) {
      this.ctx = e4;
      let t2 = (e5) => `${Math.round(e5 * 100)}%`, n2 = (n3, r3) => {
        let i3 = new pO(0, 1, t2, (t3) => e4.actions.setOption(n3, t3));
        return this.sliders[n3] = i3, W(`uh-opt`, G(`uh-opt__label`, r3), i3.el, i3.valueEl);
      }, r2 = (t3, n3) => {
        let r3 = gw(`uh-check`, [G(`uh-check__box`), G(`uh-check__label`, n3)], () => e4.actions.setOption(t3, !e4.model.options[t3]));
        return r3.setAttribute(`role`, `checkbox`), this.checks[t3] = r3, W(`uh-opt uh-opt--check`, r3);
      }, i2 = new pO(0.8, 1.25, t2, (t3, n3) => {
        n3 && e4.actions.setOption(`uiScale`, Math.round(t3 * 100) / 100);
      }, 0.05);
      this.sliders.uiScale = i2, this.quality = W(`uh-seg`);
      for (let t3 of [`low`, `medium`, `high`]) this.quality.appendChild(gw(`uh-seg__btn`, t3[0].toUpperCase() + t3.slice(1), () => e4.actions.setOption(`quality`, t3)));
      let a2 = W(`uh-modal uh-bigframe uh-options`, W(`uh-modal__head`, fw(`h2`, `uh-modal__title`, `Options`), hw(yw(TT()), `uh-modal__flourish`)), W(`uh-options__cols`, W(`uh-options__col`, W(`uh-section-title`, `Sound`), n2(`masterVolume`, `Master`), n2(`musicVolume`, `Music`), n2(`sfxVolume`, `Effects`), n2(`ambienceVolume`, `Ambience`)), W(`uh-options__col`, W(`uh-section-title`, `Gameplay`), r2(`screenShake`, `Screen shake`), r2(`damageNumbers`, `Damage numbers`), r2(`alwaysShowItemLabels`, `Always show item labels`), W(`uh-section-title`, `Display`), W(`uh-opt`, G(`uh-opt__label`, `Interface size`), i2.el, i2.valueEl), W(`uh-opt`, G(`uh-opt__label`, `Graphics`), this.quality))), W(`uh-modal__foot`, gw(`uh-btn uh-btn--primary`, `Done`, () => e4.actions.togglePanel(`options`))));
      dO(a2), this.el = a2;
    }
    render() {
      let e4 = this.ctx.model.options;
      for (let t2 of Object.keys(this.sliders)) this.sliders[t2].set(e4[t2]);
      for (let t2 of Object.keys(this.checks)) this.checks[t2].setAttribute(`aria-checked`, String(!!e4[t2]));
      [...this.quality.children].forEach((t2, n2) => vw(t2, `is-on`, [`low`, `medium`, `high`][n2] === e4.quality));
    }
  }, gO = class {
    el;
    constructor(e4) {
      let t2 = xE.map((e5) => W(`uh-help__group`, W(`uh-section-title`, e5.title), ...e5.rows.map((e6) => {
        let t3 = W(`uh-help__keys`);
        return e6.keys.forEach((e7) => {
          e7 === `–` || e7 === `+` ? t3.appendChild(G(`uh-help__sep`, e7)) : t3.appendChild(G(`uh-key${e7.length > 3 ? ` uh-key--wide` : ``}`, e7));
        }), e6.mouse && (e6.keys.length && t3.appendChild(G(`uh-help__sep`, `+`)), t3.appendChild(hw(yw(OT(e6.mouse)), `uh-help__mouse`))), W(`uh-help__row`, t3, G(`uh-help__label`, e6.label));
      }))), n2 = W(`uh-modal uh-bigframe uh-help`, W(`uh-modal__head`, fw(`h2`, `uh-modal__title`, `Help`), hw(yw(TT()), `uh-modal__flourish`)), W(`uh-help__cols`, ...t2), W(`uh-modal__foot`, gw(`uh-btn uh-btn--primary`, `Close`, () => e4.actions.togglePanel(`help`))));
      dO(n2), this.el = n2;
    }
  }, _O = class extends lw {
    deps = [`panels`, `options`, `screen`];
    scrim;
    menu;
    options;
    help;
    shown = null;
    constructor(e4) {
      super(e4), this.scrim = W(`uh-scrim`), this.menu = new mO(e4), this.options = new hO(e4), this.help = new gO(e4);
      let t2 = W(`uh-modals`, this.menu.el, this.options.el, this.help.el);
      this.scrim.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), t2.addEventListener(`pointerdown`, (e5) => e5.stopPropagation()), e4.layers.modal.append(this.scrim, t2);
    }
    render() {
      let e4 = this.ctx.model, t2 = null;
      for (let n2 of e4.openPanels) fO.includes(n2) && (t2 = n2);
      t2 === `menu` && e4.screen !== `game` && (t2 = null), t2 !== this.shown && (this.shown = t2, this.ctx.tip.hide()), vw(this.scrim, `is-on`, !!t2), vw(this.menu.el, `is-open`, t2 === `menu`), vw(this.options.el, `is-open`, t2 === `options`), vw(this.help.el, `is-open`, t2 === `help`), t2 === `options` && this.options.render();
    }
  };
})), yO, bO, xO = t((() => {
  dw(), Cw(), aE(), yO = { fire: `el-fire`, cold: `el-cold`, lightning: `el-lightning`, poison: `el-poison`, magic: `el-magic`, physical: `el-physical` }, bO = class extends lw {
    deps = [`death`, `screen`, `hero`];
    el;
    title;
    killer;
    gold;
    cta;
    epitaph;
    constructor(e4) {
      super(e4), this.title = W(`uh-death__title`), this.epitaph = W(`uh-death__epitaph`), this.killer = W(`uh-death__killer`), this.gold = W(`uh-death__gold`), this.cta = W(`uh-death__cta`), this.el = W(`uh-death`, W(`uh-death__wash`), W(`uh-death__center`, this.title, this.epitaph, W(`uh-death__rule`), this.killer, this.gold), this.cta), this.el.addEventListener(`pointerdown`, (e5) => {
        e5.stopPropagation(), e5.button === 0 && this.ctx.model.death && this.ctx.actions.acknowledgeDeath();
      }), e4.layers.death.appendChild(this.el);
    }
    sig = ``;
    render() {
      let e4 = this.ctx.model, t2 = e4.death, n2 = !!t2 && e4.screen === `game`;
      if (vw(this.el, `is-on`, n2), !t2) {
        this.sig = ``;
        return;
      }
      let r2 = `${t2.killedBy}|${t2.damageType}|${t2.goldLost}|${t2.hardcore}|${e4.hero?.name ?? ``}`;
      if (r2 === this.sig) return;
      this.sig = r2, vw(this.el, `is-hardcore`, t2.hardcore);
      let i2 = t2.hardcore ? `Your hero has fallen forever` : `You have died`;
      this.title.textContent !== i2 && this.title.replaceChildren(G(``, i2));
      let a2 = e4.hero?.name ?? ``;
      _w(this.epitaph, t2.hardcore ? `${a2 ? `${a2}'s` : `This`} legend ends in the dark.` : ``), vw(this.epitaph, `uh-hidden`, !t2.hardcore);
      let o2 = (t2.damageType || ``).toLowerCase();
      this.killer.replaceChildren(G(`uh-death__by`, `Slain by `), G(`uh-death__who`, t2.killedBy)), t2.damageType && this.killer.append(G(`uh-death__type ${yO[o2] ?? ``}`, `${t2.damageType} damage`)), this.gold.replaceChildren(), t2.goldLost > 0 && !t2.hardcore ? this.gold.append(G(``, `You dropped `), G(`uh-num uh-death__amt`, $T(t2.goldLost)), G(``, ` gold.`)) : t2.hardcore || this.gold.append(G(``, `Your corpse keeps your gear. Recover it before you fall again.`)), _w(this.cta, t2.hardcore ? `Click or press Esc to return to character select` : `Click or press Esc to continue`);
    }
  };
})), SO = n({ WORLD_LABEL_CLASSES: () => Dd, loadFonts: () => sT, mountUI: () => TO, ui: () => OO });
function CO(e4) {
  for (let [t2, n2] of Object.entries(sh)) e4.style.setProperty(`--el-${t2}`, n2);
  for (let [t2, n2] of Object.entries(ch)) e4.style.setProperty(`--q-${t2}`, n2);
}
function wO() {
  let e4 = {};
  for (let t2 of [`tl`, `tr`, `bl`, `br`]) e4[`--orn-corner-${t2}`] = bw(yw(mT(t2))), e4[`--orn-sc-${t2}`] = bw(yw(hT(t2)));
  return e4[`--icon-check`] = bw(BT(`check`)), e4[`--icon-coin`] = bw(BT(`gold`)), e4[`--icon-lock`] = bw(BT(`lock`)), e4[`--icon-skull`] = bw(BT(`skull`)), e4[`--icon-exclaim`] = bw(BT(`exclaim`)), e4;
}
function TO(e4, t2, n2) {
  let r2 = new DO(e4, t2, n2);
  return { update: (e5) => r2.update(e5), destroy: () => r2.destroy() };
}
var EO, DO, OO, kO = t((() => {
  $C(), ew(), tw(), nw(), rw(), iw(), aw(), ow(), sw(), uh(), dw(), Cw(), Rw(), uT(), FT(), QT(), mE(), gE(), aD(), dD(), mD(), eO(), uO(), vO(), xO(), Od(), EO = 0.75, DO = class {
    host;
    el;
    ctx;
    comps = [];
    hud;
    ro = null;
    scaleDirty = true;
    tipScale = 1;
    lastUiScale = -1;
    lastScreen = ``;
    destroyed = false;
    constructor(e4, t2, n2) {
      this.host = e4, sT(), this.el = W(`uh-root`), this.el.setAttribute(`data-ui`, `unhallowed`);
      for (let [e5, t3] of Object.entries({ ...Fw(), ...wO() })) this.el.style.setProperty(e5, t3);
      CO(document.documentElement);
      let r2 = W(``);
      r2.id = `world-labels`;
      let i2 = (e5) => W(`uh-layer uh-l-${e5}`), a2 = { world: r2, hud: i2(`hud`), panels: i2(`panels`), dialog: i2(`dialog`), pop: i2(`pop`), modal: i2(`modal`), screen: i2(`screen`), death: i2(`death`), tip: i2(`tip`), cursor: i2(`cursor`) };
      this.el.append(r2, a2.hud, a2.panels, a2.dialog, a2.pop, a2.modal, a2.screen, a2.death, a2.tip, a2.cursor), e4.appendChild(this.el);
      let o2 = () => this.ctx.scale, s2 = () => this.tipScale, c2 = { model: t2, actions: n2, root: this.el, layers: a2, scale: 1, time: 0, tip: null, cursor: null, pointer: { x: -9999, y: -9999, inside: false }, isOpen: (e5) => t2.openPanels.includes(e5), toLayer: (e5) => e5 / (this.ctx.scale || 1) };
      this.ctx = c2, c2.tip = new pE(a2.tip, s2), c2.cursor = new hE(a2.cursor, o2), this.hud = new iD(c2), this.comps.push(this.hud, this.hud.skillChooser, new lD(c2), new uD(c2), new $D(c2), new pD(c2), new _O(c2), new lO(c2), new bO(c2)), window.addEventListener(`pointermove`, this.onMove, { passive: true }), window.addEventListener(`pointerdown`, this.onMove, { passive: true, capture: true }), this.el.addEventListener(`contextmenu`, this.onContext), this.el.addEventListener(`mousedown`, this.onMouseDown, true), window.addEventListener(`resize`, this.onResize), typeof ResizeObserver < `u` && (this.ro = new ResizeObserver(this.onResize), this.ro.observe(this.el)), this.update(0);
    }
    onMove = (e4) => {
      let t2 = this.ctx.pointer;
      t2.x = e4.clientX, t2.y = e4.clientY, t2.inside = true, this.ctx.cursor.move(e4.clientX, e4.clientY);
    };
    onContext = (e4) => {
      let t2 = e4.target;
      t2 && t2.closest(`input[type="text"], textarea`) || e4.preventDefault();
    };
    onMouseDown = (e4) => {
      let t2 = e4.target;
      if (t2 && t2.closest(`input, textarea, select, [contenteditable="true"]`)) return;
      e4.preventDefault();
      let n2 = document.activeElement;
      n2 && n2 !== document.body && this.el.contains(n2) && !n2.matches(`input, textarea`) && n2.blur();
    };
    onResize = () => {
      this.scaleDirty = true;
    };
    updateScale() {
      let e4 = this.el.clientWidth || window.innerWidth, t2 = this.el.clientHeight || window.innerHeight, n2 = cw(e4, t2, this.ctx.model.options.uiScale);
      n2 !== this.ctx.scale && (this.ctx.scale = n2, this.tipScale = Math.max(n2, Math.min(EO, (Math.min(e4, t2 * 1.6) - 16) / 1100)), this.el.style.setProperty(`--s`, String(n2)), this.el.style.setProperty(`--s-tip`, String(this.tipScale)), this.ctx.tip.hide(), this.hud.relayout()), this.scaleDirty = false;
    }
    update(e4) {
      if (this.destroyed) return;
      let t2 = this.ctx, n2 = t2.model;
      if (t2.time += e4, n2.options.uiScale !== this.lastUiScale && (this.lastUiScale = n2.options.uiScale, this.scaleDirty = true), this.scaleDirty && this.updateScale(), n2.screen !== this.lastScreen) {
        this.lastScreen = n2.screen, this.el.dataset.screen = n2.screen;
        let e5 = n2.screen === `game`;
        t2.layers.hud.classList.toggle(`uh-hidden`, !e5), t2.layers.world.classList.toggle(`uh-hidden`, !e5), e5 || t2.tip.hide();
      }
      for (let e5 of this.comps) e5.sync();
      if (n2.screen === `game`) for (let t3 of this.comps) t3.tick(e4);
      else for (let t3 of this.comps) !(t3 instanceof iD) && !(t3 instanceof lD) && t3.tick(e4);
      n2.rev.cursor !== this.cursorRev && (this.cursorRev = n2.rev.cursor, t2.cursor.render(n2.cursorItem));
    }
    cursorRev = -1;
    destroy() {
      if (!this.destroyed) {
        this.destroyed = true, window.removeEventListener(`pointermove`, this.onMove), window.removeEventListener(`pointerdown`, this.onMove, true), window.removeEventListener(`resize`, this.onResize), this.ro?.disconnect();
        for (let e4 of this.comps) e4.destroy();
        this.ctx.cursor.destroy(), this.el.remove(), this.host;
      }
    }
  }, OO = { mountUI: TO };
}));
function AO(e4, t2, n2, r2, i2, a2, o2, s2, c2) {
  let l2 = e4.length / 3, u2 = 1 / 0, d2 = 1 / 0, f2 = 1 / 0, p2 = -1 / 0, m2 = -1 / 0, h2 = -1 / 0;
  for (let t3 = 0; t3 < l2; t3 += 1) {
    let n3 = e4[t3 * 3], r3 = e4[t3 * 3 + 1], i3 = e4[t3 * 3 + 2];
    n3 < u2 && (u2 = n3), r3 < d2 && (d2 = r3), i3 < f2 && (f2 = i3), n3 > p2 && (p2 = n3), r3 > m2 && (m2 = r3), i3 > h2 && (h2 = i3);
  }
  let g2 = Math.max(p2 - u2, m2 - d2, h2 - f2, 0.2), _2 = o2 ?? Math.min(1.5, Math.max(0.35, g2 * 0.22)), v2 = Math.min(0.12, Math.max(0.03, g2 / 120)), y2 = _2 + v2 * 2;
  u2 -= y2, d2 -= y2, f2 -= y2, p2 += y2, m2 += y2, h2 += y2;
  let b2 = Math.ceil((p2 - u2) / v2) + 1, x2 = Math.ceil((m2 - d2) / v2) + 1, S2 = Math.ceil((h2 - f2) / v2) + 1, C2 = new Uint8Array(b2 * x2 * S2), w2 = 1 / v2, T2 = (e5, t3, n3) => {
    let r3 = (e5 - u2) * w2 | 0, i3 = (t3 - d2) * w2 | 0, a3 = (n3 - f2) * w2 | 0;
    C2[(i3 * S2 + a3) * b2 + r3] = 1;
  };
  for (let t3 = 0; t3 < n2.length; t3 += 3) {
    let i3 = n2[t3], a3 = n2[t3 + 1], o3 = n2[t3 + 2];
    if (!(r2[i3] & 2) || !(r2[a3] & 2) || !(r2[o3] & 2)) continue;
    let s3 = e4[i3 * 3], c3 = e4[i3 * 3 + 1], l3 = e4[i3 * 3 + 2], u3 = e4[a3 * 3] - s3, d3 = e4[a3 * 3 + 1] - c3, f3 = e4[a3 * 3 + 2] - l3, p3 = e4[o3 * 3] - s3, m3 = e4[o3 * 3 + 1] - c3, h3 = e4[o3 * 3 + 2] - l3, g3 = Math.max(Math.hypot(u3, d3, f3), Math.hypot(p3, m3, h3), Math.hypot(p3 - u3, m3 - d3, h3 - f3)), _3 = Math.max(1, Math.ceil(g3 / (v2 * 0.7)));
    for (let e5 = 0; e5 <= _3; e5 += 1) for (let t4 = 0; t4 <= _3 - e5; t4 += 1) {
      let n3 = e5 / _3, r3 = t4 / _3;
      T2(s3 + u3 * n3 + p3 * r3, c3 + d3 * n3 + m3 * r3, l3 + f3 * n3 + h3 * r3);
    }
  }
  let E2 = Math.ceil(_2 / v2), D2 = new N(), O2 = new N(), k2 = new N();
  for (let n3 = 0; n3 < l2; n3 += 1) {
    if (!(r2[n3] & 1)) continue;
    k2.set(t2[n3 * 3], t2[n3 * 3 + 1], t2[n3 * 3 + 2]), Math.abs(k2.y) < 0.9 ? D2.set(0, 1, 0).cross(k2).normalize() : D2.set(1, 0, 0).cross(k2).normalize(), O2.copy(k2).cross(D2);
    let o3 = e4[n3 * 3] + k2.x * v2 * 1.7, l3 = e4[n3 * 3 + 1] + k2.y * v2 * 1.7, p3 = e4[n3 * 3 + 2] + k2.z * v2 * 1.7, m3 = 0;
    for (let [e5, t3, n4] of HO) {
      let r3 = D2.x * e5 + O2.x * t3 + k2.x * n4, i3 = D2.y * e5 + O2.y * t3 + k2.y * n4, a3 = D2.z * e5 + O2.z * t3 + k2.z * n4;
      for (let e6 = 1; e6 <= E2; e6 += 1) {
        let t4 = e6 * v2, n5 = o3 + r3 * t4, h4 = l3 + i3 * t4, g4 = p3 + a3 * t4, y4 = s2 && h4 < c2;
        if (!y4) {
          let e7 = (n5 - u2) * w2 | 0, t5 = (h4 - d2) * w2 | 0, r4 = (g4 - f2) * w2 | 0;
          e7 >= 0 && t5 >= 0 && r4 >= 0 && e7 < b2 && t5 < x2 && r4 < S2 && (y4 = C2[(t5 * S2 + r4) * b2 + e7] === 1);
        }
        if (y4) {
          let e7 = 1 - t4 / (_2 + v2);
          m3 += 0.35 + 0.65 * e7;
          break;
        }
      }
    }
    let h3 = 1 - m3 / HO.length, g3 = 1 - a2 * (1 - h3) * (1.15 - 0.35 * h3), y3 = Math.max(0.12, Math.min(1, g3));
    i2[n3 * 3] *= y3, i2[n3 * 3 + 1] *= y3, i2[n3 * 3 + 2] *= y3;
  }
}
function K(e4 = 0, t2 = 0, n2 = 0, r2 = 0, i2 = 0, a2 = 0, o2 = 1, s2 = o2, c2 = o2) {
  let l2 = new wr();
  return l2.compose(new N(e4, t2, n2), new ir().setFromEuler(new Pr(r2, i2, a2, `YXZ`)), new N(o2, s2, c2)), l2;
}
function jO(e4, t2, n2 = 1, r2 = n2) {
  let i2 = new N().subVectors(t2, e4), a2 = i2.length(), o2 = new ir().setFromUnitVectors(new N(0, 1, 0), i2.normalize()), s2 = e4.clone().add(t2).multiplyScalar(0.5);
  return new wr().compose(s2, o2, new N(n2, a2, r2));
}
function MO(e4, t2, n2 = 0) {
  let r2 = new ir().setFromUnitVectors(new N(0, 1, 0), t2.clone().normalize());
  return n2 && r2.multiply(new ir().setFromAxisAngle(new N(0, 1, 0), n2)), new wr().compose(e4, r2, new N(1, 1, 1));
}
function q(e4, t2, n2) {
  return new N(e4, t2, n2);
}

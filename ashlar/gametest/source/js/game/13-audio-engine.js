// ===== game part 13-audio-engine (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var PN, FN = t((() => {
  PN = class {
    s;
    constructor(e4) {
      this.s = e4 >>> 0 || 2654435769;
    }
    next() {
      this.s = this.s + 1831565813 >>> 0;
      let e4 = this.s;
      return e4 = Math.imul(e4 ^ e4 >>> 15, e4 | 1), e4 ^= e4 + Math.imul(e4 ^ e4 >>> 7, e4 | 61), ((e4 ^ e4 >>> 14) >>> 0) / 4294967296;
    }
    range(e4, t2) {
      return e4 + (t2 - e4) * this.next();
    }
    log(e4, t2) {
      return e4 * (t2 / e4) ** +this.next();
    }
    int(e4, t2) {
      return e4 + Math.floor(this.next() * (t2 - e4 + 1));
    }
    chance(e4) {
      return this.next() < e4;
    }
    bi() {
      return this.next() * 2 - 1;
    }
    pick(e4) {
      return e4[Math.floor(this.next() * e4.length) % e4.length];
    }
    weighted(e4) {
      let t2 = 0;
      for (let n3 of e4) t2 += n3[1];
      let n2 = this.next() * t2;
      for (let t3 of e4) if (n2 -= t3[1], n2 <= 0) return t3[0];
      return e4[e4.length - 1][0];
    }
    gauss() {
      let e4 = 0;
      for (; e4 === 0; ) e4 = this.next();
      return Math.sqrt(-2 * Math.log(e4)) * Math.cos(2 * Math.PI * this.next());
    }
    expo(e4) {
      return -Math.log(1 - this.next() * 0.999999) * e4;
    }
    u32() {
      return this.next() * 4294967296 >>> 0;
    }
  };
})), IN, LN, RN = t((() => {
  FN(), IN = class {
    ctx;
    bank;
    out;
    wet;
    r;
    live = [];
    hasPanner;
    constructor(e4, t2, n2, r2, i2) {
      this.ctx = e4, this.bank = t2, this.out = n2, this.wet = r2, this.r = i2, this.hasPanner = typeof e4.createStereoPanner == `function`;
    }
    note(e4, t2, n2, r2, i2 = {}) {
      let a2 = this.bank.nearest(e4, t2);
      if (!a2) return;
      let o2 = a2.clip.get(this.ctx);
      o2 && this.play(o2, a2.clip.loop, 2 ** ((t2 - a2.root) / 12), n2, r2, i2);
    }
    hit(e4, t2, n2 = {}) {
      let r2 = this.bank.instSamples(e4);
      if (!r2.length) return;
      let i2 = r2[(n2.variant ?? this.r.int(0, r2.length - 1)) % r2.length].clip.get(this.ctx);
      if (!i2) return;
      let a2 = n2.rate ?? 1;
      this.play(i2, false, a2, t2, i2.duration / a2, { att: 2e-3, rel: 0.05, ...n2 });
    }
    play(e4, t2, n2, r2, i2, a2) {
      let o2 = this.ctx, s2 = o2.createBufferSource();
      s2.buffer = e4, s2.playbackRate.value = n2, a2.detune && (s2.detune.value = a2.detune), s2.loop = t2;
      let c2 = o2.createGain(), l2 = a2.vel ?? 0.7, u2 = Math.max(2e-3, a2.att ?? 0.01), d2 = Math.max(0.02, a2.rel ?? 0.3), f2 = Math.max(u2, i2), p2 = l2 * (a2.swell ?? 1);
      c2.gain.value = 0, c2.gain.setValueAtTime(0, r2), a2.swell && a2.swell !== 1 ? (c2.gain.linearRampToValueAtTime(l2, r2 + u2), c2.gain.linearRampToValueAtTime(p2, r2 + f2)) : (c2.gain.linearRampToValueAtTime(l2, r2 + u2), c2.gain.setValueAtTime(l2, r2 + f2)), c2.gain.setTargetAtTime(0, r2 + f2, d2 / 4);
      let m2 = [c2];
      if (a2.lp) {
        let e5 = o2.createBiquadFilter();
        e5.type = `lowpass`, e5.frequency.value = a2.lp, e5.Q.value = 0.5, s2.connect(e5).connect(c2), m2.push(e5);
      } else s2.connect(c2);
      let h2 = c2;
      if (a2.pan && this.hasPanner) {
        let e5 = o2.createStereoPanner();
        e5.pan.value = Math.max(-1, Math.min(1, a2.pan)), c2.connect(e5), m2.push(e5), h2 = e5;
      }
      if (h2.connect(this.out), a2.send && a2.send > 0) {
        let e5 = o2.createGain();
        e5.gain.value = a2.send, h2.connect(e5), e5.connect(this.wet), m2.push(e5);
      }
      if (a2.vib && a2.vib > 0) {
        let e5 = o2.createOscillator();
        e5.frequency.value = a2.vibRate ?? 5;
        let t3 = o2.createGain();
        t3.gain.value = 0, t3.gain.setValueAtTime(0, r2), t3.gain.linearRampToValueAtTime(a2.vib, r2 + Math.min(f2, 0.5 + u2)), e5.connect(t3), t3.connect(s2.detune), e5.start(r2), e5.stop(r2 + f2 + d2 * 1.5 + 0.1), m2.push(e5, t3);
      }
      let g2 = r2 + f2 + d2 * 1.5 + 0.05, _2 = t2 ? this.r.next() * e4.duration * 0.95 : 0;
      s2.start(r2, _2), s2.stop(t2 ? g2 : Math.min(g2, r2 + (e4.duration - _2) / n2 + 0.02));
      let v2 = { src: s2, nodes: m2, end: g2 };
      this.live.push(v2), s2.onended = () => {
        try {
          s2.disconnect();
          for (let e6 of m2) e6.disconnect();
        } catch {
        }
        let e5 = this.live.indexOf(v2);
        e5 >= 0 && this.live.splice(e5, 1);
      };
    }
    stopAll(e4) {
      let t2 = e4 ?? this.ctx.currentTime;
      for (let e5 of this.live) try {
        e5.src.stop(t2);
      } catch {
      }
    }
    get count() {
      return this.live.length;
    }
  }, LN = class {
    env;
    out;
    wet;
    v;
    r;
    t = 0;
    ended = false;
    stopped = false;
    disposed = false;
    ctx;
    extras = [];
    level = 1;
    constructor(e4, t2, n2) {
      this.env = e4, this.ctx = e4.ctx, this.out = e4.ctx.createGain(), this.wet = e4.ctx.createGain(), this.out.gain.value = 0, this.wet.gain.value = 0, this.out.connect(t2.inp), this.wet.connect(t2.wet), this.r = new PN(n2), this.v = new IN(e4.ctx, e4.bank, this.out, this.wet, this.r);
    }
    start(e4, t2) {
      this.t = e4;
      for (let n2 of [this.out.gain, this.wet.gain]) n2.setValueAtTime(0, e4), n2.linearRampToValueAtTime(this.level, e4 + Math.max(0.05, t2));
      this.begin(e4);
    }
    stop(e4) {
      if (this.stopped) return;
      this.stopped = true;
      let t2 = this.ctx.currentTime;
      for (let n3 of [this.out.gain, this.wet.gain]) n3.cancelScheduledValues(t2), n3.setValueAtTime(n3.value, t2), n3.linearRampToValueAtTime(0, t2 + Math.max(0.05, e4));
      let n2 = (Math.max(0.05, e4) + 0.25) * 1e3;
      this.env.live && setTimeout(() => this.dispose(), n2);
    }
    get gone() {
      return this.disposed;
    }
    dispose() {
      if (!this.disposed) {
        this.disposed = true, this.v.stopAll();
        for (let e4 of this.extras) try {
          e4.stop();
        } catch {
        }
        try {
          this.out.disconnect(), this.wet.disconnect();
        } catch {
        }
      }
    }
    own(e4) {
      this.extras.push(e4);
    }
    tick(e4, t2 = false) {
      if (this.stopped || this.ended || this.disposed) return;
      if (t2) {
        this.t < e4 && (this.t = e4);
        return;
      }
      let n2 = 0;
      for (; this.t < e4 && !this.ended && n2++ < 64; ) this.t = this.step(this.t);
    }
    begin(e4) {
    }
  };
}));
function zN(e4, t2, n2, r2, i2, a2) {
  let o2 = t2.ambClips(r2.asset)[0]?.get(e4);
  if (!o2) return null;
  let s2 = e4.createBufferSource();
  s2.buffer = o2, s2.loop = true, s2.playbackRate.value = r2.rate ?? 1;
  let c2 = e4.createBiquadFilter();
  c2.type = r2.type, c2.frequency.value = Math.sqrt(r2.f[0] * r2.f[1]), c2.Q.value = r2.q;
  let l2 = e4.createGain();
  l2.gain.value = 0;
  let u2 = (r2.gain[0] + r2.gain[1]) / 2;
  l2.gain.setValueAtTime(0, a2), l2.gain.linearRampToValueAtTime(u2, a2 + 1.5);
  let d2 = [c2, l2];
  s2.connect(c2);
  let f2 = c2;
  if (r2.lp) {
    let t3 = e4.createBiquadFilter();
    t3.type = `lowpass`, t3.frequency.value = r2.lp, c2.connect(t3), d2.push(t3), f2 = t3;
  }
  f2.connect(l2);
  let p2 = l2;
  if (r2.pan && typeof e4.createStereoPanner == `function`) {
    let t3 = e4.createStereoPanner();
    t3.pan.value = r2.pan, l2.connect(t3), d2.push(t3), p2 = t3;
  }
  return p2.connect(i2), s2.start(a2, n2.next() * o2.duration), { def: r2, src: s2, filt: c2, gain: l2, next: a2 + 1.5, nodes: d2 };
}
var BN, VN, HN, UN, WN = t((() => {
  FN(), RN(), BN = { title: { space: `hall`, noise: [{ asset: `noiseP`, type: `bandpass`, f: [300, 700], q: 0.7, gain: [0.08, 0.2], gust: [2, 5], pan: -0.3 }, { asset: `noiseP`, type: `bandpass`, f: [500, 1100], q: 1.1, gain: [0.03, 0.09], gust: [1.5, 4], pan: 0.4, rate: 0.93 }], loops: [{ asset: `crackleA`, gain: 0.3, pan: -0.12 }, { asset: `crackleB`, gain: 0.21, pan: 0.18, rate: 0.97 }], events: [{ src: { sfx: `distantHowl` }, every: [55, 110], first: [25, 50], vol: [0.12, 0.2], pan: [-0.8, 0.8], rate: [0.95, 1.05], send: 0.4, lp: 2200 }, { src: { sfx: `crowCaw` }, every: [35, 80], first: [15, 30], vol: [0.08, 0.14], pan: [-0.9, 0.9], rate: [0.95, 1.05], send: 0.4, lp: 3500 }] }, town: { space: `hall`, noise: [{ asset: `noiseP`, type: `bandpass`, f: [280, 600], q: 0.7, gain: [0.05, 0.13], gust: [2.5, 6], pan: 0.2 }], loops: [{ asset: `crackleA`, gain: 0.24, pan: 0.35, lp: 3200 }], events: [{ src: { amb: `dog` }, every: [25, 60], first: [8, 20], vol: [0.18, 0.3], pan: [-0.9, 0.9], rate: [0.92, 1.08], send: 0.3 }, { src: { sfx: `crowCaw` }, every: [20, 45], first: [5, 15], vol: [0.12, 0.2], pan: [-0.9, 0.9], rate: [0.95, 1.06], send: 0.35, lp: 3e3 }, { src: { amb: `anvil` }, every: [30, 70], first: [10, 25], vol: [0.12, 0.2], pan: [0.3, 0.8], rate: [0.97, 1.03], send: 0.35, burst: [3, 6], gap: [0.65, 0.95] }] }, moor: { space: `hall`, noise: [{ asset: `noiseP`, type: `bandpass`, f: [220, 850], q: 0.75, gain: [0.08, 0.34], gust: [1.5, 4.5], pan: -0.35 }, { asset: `noiseP`, type: `bandpass`, f: [300, 1e3], q: 0.9, gain: [0.05, 0.22], gust: [1.2, 3.5], pan: 0.4, rate: 0.91 }, { asset: `noiseW`, type: `bandpass`, f: [3500, 6500], q: 0.6, gain: [0.015, 0.05], gust: [1, 3], pan: 0 }], loops: [], events: [{ src: { sfx: `distantHowl` }, every: [25, 70], first: [8, 20], vol: [0.2, 0.34], pan: [-0.9, 0.9], rate: [0.94, 1.06], send: 0.4, lp: 2600 }, { src: { sfx: `crowCaw` }, every: [15, 40], first: [4, 12], vol: [0.14, 0.24], pan: [-0.9, 0.9], rate: [0.95, 1.05], send: 0.35, lp: 3800 }] }, cave: { space: `cave`, noise: [{ asset: `noiseB`, type: `lowpass`, f: [80, 130], q: 0.8, gain: [0.16, 0.3], gust: [3, 7], pan: 0 }, { asset: `noiseP`, type: `bandpass`, f: [180, 260], q: 4, gain: [0.012, 0.03], gust: [4, 9], pan: 0.2 }], loops: [], events: [{ src: { inst: `drip` }, every: [0.7, 4], vol: [0.1, 0.32], pan: [-0.9, 0.9], rate: [0.75, 1.35], send: 0.85 }, { src: { inst: `drip` }, every: [14, 30], first: [6, 12], vol: [0.12, 0.2], pan: [-0.7, 0.7], rate: [0.9, 1.1], send: 0.8, burst: [4, 8], gap: [0.9, 1.4] }, { src: { amb: `stoneCreak` }, every: [15, 40], first: [6, 15], vol: [0.16, 0.28], pan: [-0.8, 0.8], rate: [0.8, 1.1], send: 0.7 }, { src: { inst: `boom` }, every: [35, 70], first: [20, 40], vol: [0.08, 0.14], pan: [-0.3, 0.3], rate: [0.6, 0.8], send: 0.6 }] }, graveyard: { space: `hall`, noise: [{ asset: `noiseP`, type: `bandpass`, f: [280, 700], q: 0.7, gain: [0.06, 0.2], gust: [2, 5], pan: -0.2 }, { asset: `noiseP`, type: `bandpass`, f: [480, 1300], q: 9, gain: [0.03, 0.09], gust: [2.5, 6], pan: 0.45, rate: 0.95 }, { asset: `noiseP`, type: `bandpass`, f: [600, 1500], q: 11, gain: [0.02, 0.07], gust: [3, 7], pan: -0.5, rate: 1.07 }], loops: [], events: [{ src: { sfx: `crowCaw` }, every: [8, 25], first: [3, 8], vol: [0.16, 0.28], pan: [-0.9, 0.9], rate: [0.92, 1.06], send: 0.4, lp: 4e3 }, { src: { amb: `chain` }, every: [15, 40], first: [6, 14], vol: [0.12, 0.22], pan: [-0.8, 0.8], rate: [0.9, 1.05], send: 0.45 }, { src: { amb: `owl` }, every: [30, 70], first: [12, 25], vol: [0.12, 0.2], pan: [-0.9, 0.9], rate: [0.97, 1.03], send: 0.4 }, { src: { sfx: `distantHowl` }, every: [40, 90], first: [20, 40], vol: [0.14, 0.24], pan: [-0.9, 0.9], rate: [0.94, 1.04], send: 0.45, lp: 2400 }] } }, VN = class {
    ctx;
    bank;
    id;
    live;
    out;
    wet;
    v;
    r;
    noise = [];
    loops = [];
    events = [];
    stopped = false;
    gone = false;
    constructor(e4, t2, n2, r2, i2, a2) {
      this.ctx = e4, this.bank = t2, this.id = r2, this.live = a2, this.out = e4.createGain(), this.wet = e4.createGain(), this.out.gain.value = 0, this.out.connect(n2.inp), this.wet.connect(n2.wet), this.r = new PN(i2), this.v = new IN(e4, t2, this.out, this.wet, this.r);
    }
    get space() {
      return BN[this.id].space;
    }
    start(e4, t2) {
      let n2 = BN[this.id], r2 = this.r;
      this.out.gain.setValueAtTime(0, e4), this.out.gain.linearRampToValueAtTime(1, e4 + Math.max(0.1, t2));
      for (let t3 of n2.noise) {
        let n3 = zN(this.ctx, this.bank, r2, t3, this.out, e4);
        n3 && this.noise.push(n3);
      }
      for (let t3 of n2.loops) {
        let n3 = this.bank.ambClips(t3.asset)[0]?.get(this.ctx);
        if (!n3) continue;
        let i2 = this.ctx.createBufferSource();
        i2.buffer = n3, i2.loop = true, i2.playbackRate.value = t3.rate ?? 1;
        let a2 = this.ctx.createGain();
        a2.gain.value = t3.gain;
        let o2 = [a2], s2 = i2;
        if (t3.lp) {
          let e5 = this.ctx.createBiquadFilter();
          e5.type = `lowpass`, e5.frequency.value = t3.lp, i2.connect(e5), o2.push(e5), s2 = e5;
        }
        s2.connect(a2);
        let c2 = a2;
        if (t3.pan && typeof this.ctx.createStereoPanner == `function`) {
          let e5 = this.ctx.createStereoPanner();
          e5.pan.value = t3.pan, a2.connect(e5), o2.push(e5), c2 = e5;
        }
        c2.connect(this.out);
        let l2 = this.ctx.createGain();
        l2.gain.value = 0.12, c2.connect(l2).connect(this.wet), o2.push(l2), i2.start(e4, r2.next() * n3.duration), this.loops.push({ src: i2, nodes: o2 });
      }
      this.events = n2.events.map((t3) => ({ def: t3, next: e4 + (t3.first ? r2.range(t3.first[0], t3.first[1]) : r2.range(t3.every[0], t3.every[1]) * 0.5) }));
    }
    stop(e4) {
      if (this.stopped) return;
      this.stopped = true;
      let t2 = this.ctx.currentTime, n2 = this.out.gain;
      n2.cancelScheduledValues(t2), n2.setValueAtTime(n2.value, t2), n2.linearRampToValueAtTime(0, t2 + Math.max(0.1, e4)), this.live && setTimeout(() => this.dispose(), (e4 + 0.3) * 1e3);
    }
    dispose() {
      if (!this.gone) {
        this.gone = true;
        for (let e4 of this.noise) try {
          e4.src.stop(), e4.src.disconnect();
          for (let t2 of e4.nodes) t2.disconnect();
        } catch {
        }
        for (let e4 of this.loops) try {
          e4.src.stop(), e4.src.disconnect();
          for (let t2 of e4.nodes) t2.disconnect();
        } catch {
        }
        this.v.stopAll();
        try {
          this.out.disconnect(), this.wet.disconnect();
        } catch {
        }
      }
    }
    tick(e4, t2) {
      if (this.stopped || this.gone) return;
      let n2 = this.r, r2 = this.ctx.currentTime;
      for (let t3 of this.noise) {
        if (!t3.def.gust) continue;
        t3.next < r2 && (t3.next = r2);
        let i2 = 0;
        for (; t3.next < e4 && i2++ < 256; ) {
          let e5 = n2.range(t3.def.gust[0], t3.def.gust[1]), r3 = n2.log(t3.def.f[0], t3.def.f[1]), i3 = n2.range(t3.def.gain[0], t3.def.gain[1]);
          t3.filt.frequency.setTargetAtTime(r3, t3.next, e5 / 3), t3.gain.gain.setTargetAtTime(i3, t3.next, e5 / 3), t3.next += e5;
        }
      }
      for (let i2 of this.events) {
        let a2 = i2.def;
        i2.next < r2 && (i2.next = r2 + n2.range(0, a2.every[0]));
        let o2 = 0;
        for (; i2.next < e4 && o2++ < 512; ) {
          if (!t2) {
            let e5 = a2.burst ? n2.int(a2.burst[0], a2.burst[1]) : 1, t3 = n2.range(a2.pan[0], a2.pan[1]), r3 = n2.range(a2.vol[0], a2.vol[1]), o3 = i2.next;
            for (let i3 = 0; i3 < e5; i3++) this.fire(a2.src, o3, r3 * (1 - i3 * 0.06), t3, n2.range(a2.rate[0], a2.rate[1]), a2.send, a2.lp), o3 += a2.gap ? n2.range(a2.gap[0], a2.gap[1]) : 0;
          }
          i2.next += n2.range(a2.every[0], a2.every[1]);
        }
      }
    }
    fire(e4, t2, n2, r2, i2, a2, o2) {
      let s2 = null;
      if (`amb` in e4) {
        let t3 = this.bank.ambClips(e4.amb);
        s2 = t3.length ? t3[this.r.int(0, t3.length - 1)].get(this.ctx) : null;
      } else if (`sfx` in e4) s2 = this.bank.sfxClip(e4.sfx)?.get(this.ctx) ?? null;
      else {
        let t3 = this.bank.instSamples(e4.inst);
        s2 = t3.length ? t3[this.r.int(0, t3.length - 1)].clip.get(this.ctx) : null;
      }
      s2 && this.v.play(s2, false, i2, t2, s2.duration / i2, { vel: n2, att: 3e-3, rel: 0.1, pan: r2, send: a2, lp: o2 });
    }
  }, HN = class {
    ctx;
    bank;
    out;
    wetG;
    parts = [];
    level = 0;
    nextSplash = 0;
    v;
    r;
    gone = false;
    constructor(e4, t2, n2, r2) {
      this.ctx = e4, this.bank = t2, this.out = e4.createGain(), this.wetG = e4.createGain(), this.out.connect(n2.inp), this.wetG.connect(n2.wet), this.r = new PN(r2), this.v = new IN(e4, t2, this.out, this.wetG, this.r);
      let i2 = e4.currentTime, a2 = (n3, r3, a3, o2, s2) => {
        let c2 = t2.ambClips(n3)[0]?.get(e4);
        if (!c2) return;
        let l2 = e4.createBufferSource();
        l2.buffer = c2, l2.loop = true, l2.playbackRate.value = r3;
        let u2 = [], d2 = l2;
        for (let [t3, n4, r4] of a3) {
          let i3 = e4.createBiquadFilter();
          i3.type = t3, i3.frequency.value = n4, i3.Q.value = r4, d2.connect(i3), u2.push(i3), d2 = i3;
        }
        let f2 = e4.createGain();
        f2.gain.value = 0, d2.connect(f2), u2.push(f2);
        let p2 = f2;
        if (o2 && typeof e4.createStereoPanner == `function`) {
          let t3 = e4.createStereoPanner();
          t3.pan.value = o2, f2.connect(t3), u2.push(t3), p2 = t3;
        }
        p2.connect(this.out), l2.start(i2, this.r.next() * c2.duration), this.parts.push({ src: l2, gain: f2, nodes: u2, k: s2 });
      };
      a2(`noiseW`, 1, [[`highpass`, 500, 0.6], [`lowpass`, 6500, 0.5]], -0.45, (e5) => 0.16 * e5), a2(`noiseW`, 0.93, [[`highpass`, 700, 0.6], [`lowpass`, 8e3, 0.5]], 0.45, (e5) => 0.14 * e5), a2(`rainDrops`, 1, [], 0, (e5) => 0.42 * Math.sqrt(e5)), a2(`noiseB`, 1, [[`lowpass`, 420, 0.7]], 0, (e5) => 0.32 * e5 * e5);
    }
    set(e4, t2 = 2.5) {
      this.level = Math.max(0, Math.min(1, e4));
      let n2 = this.ctx.currentTime;
      for (let e5 of this.parts) e5.gain.gain.setTargetAtTime(e5.k(this.level), n2, t2 / 3);
    }
    get value() {
      return this.level;
    }
    tick(e4, t2) {
      if (this.gone || this.level < 0.05) return;
      this.nextSplash < this.ctx.currentTime && (this.nextSplash = this.ctx.currentTime + 0.1);
      let n2 = 0;
      for (; this.nextSplash < e4 && n2++ < 4096; ) {
        if (!t2) {
          let e5 = this.bank.ambClips(`splash`), t3 = e5.length ? e5[this.r.int(0, e5.length - 1)].get(this.ctx) : null;
          t3 && this.v.play(t3, false, this.r.range(0.85, 1.2), this.nextSplash, t3.duration, { vel: this.r.range(0.05, 0.16) * (0.5 + this.level), att: 2e-3, rel: 0.05, pan: this.r.range(-0.9, 0.9), send: 0.2 });
        }
        this.nextSplash += this.r.range(0.12, 0.6) / Math.max(0.15, this.level);
      }
    }
    dispose() {
      if (!this.gone) {
        this.gone = true;
        for (let e4 of this.parts) try {
          e4.src.stop(), e4.src.disconnect();
          for (let t2 of e4.nodes) t2.disconnect();
        } catch {
        }
        this.v.stopAll();
        try {
          this.out.disconnect(), this.wetG.disconnect();
        } catch {
        }
      }
    }
  }, UN = class {
    ctx;
    bank;
    bus;
    live;
    cur = null;
    curId = `none`;
    fading = [];
    rain = null;
    rainLevel = 0;
    seed;
    onSpace = null;
    constructor(e4, t2, n2, r2, i2) {
      this.ctx = e4, this.bank = t2, this.bus = n2, this.live = r2, this.seed = (i2 ?? Math.floor(Math.random() * 2147483647)) >>> 0;
    }
    get id() {
      return this.curId;
    }
    set(e4, t2, n2 = 3) {
      if (e4 !== this.curId) if (this.cur &&= (this.cur.stop(n2), this.fading.push(this.cur), null), this.curId = e4, e4 !== `none`) {
        this.seed = Math.imul(this.seed ^ 2654435769, 2246822507) + 47 >>> 0;
        let t3 = new VN(this.ctx, this.bank, this.bus, e4, this.seed, this.live);
        t3.start(this.ctx.currentTime + 0.05, n2), this.cur = t3, this.onSpace?.(t3.space);
      } else this.onSpace?.(`hall`);
      this.setRain(e4 === `none` ? 0 : t2);
    }
    setRain(e4) {
      let t2 = Math.max(0, Math.min(1, e4 || 0));
      t2 === this.rainLevel && (t2 === 0 || this.rain) || (this.rainLevel = t2, t2 > 0 && !this.rain && (this.rain = new HN(this.ctx, this.bank, this.bus, this.seed ^ 4660)), this.rain?.set(t2));
    }
    tick(e4, t2) {
      this.cur?.tick(e4, t2), this.rain?.tick(e4, t2), this.fading.length && (this.fading = this.fading.filter((e5) => !e5.gone));
    }
    dispose() {
      this.cur?.dispose();
      for (let e4 of this.fading) e4.dispose();
      this.rain?.dispose(), this.cur = null, this.rain = null, this.fading = [];
    }
  };
}));
function GN(e4, t2) {
  return { sr: e4, r: new PN(t2) };
}
function KN(e4) {
  if (vP > 0 && gP && _P + e4 <= gP.length) {
    let t2 = gP.subarray(_P, _P + e4);
    return _P += e4, t2.fill(0), t2;
  }
  return new Float32Array(e4);
}
function qN(e4) {
  let t2 = KN(e4.length);
  return t2.set(e4), t2;
}
function JN(e4) {
  gP ||= new Float32Array(hP);
  let t2 = _P;
  vP++;
  try {
    return e4();
  } finally {
    vP--, _P = vP > 0 ? t2 : 0;
  }
}
function YN() {
  vP === 0 && (gP = null);
}
function XN(e4, t2, n2, r2) {
  let i2 = Math.min(e4.length, t2.length);
  for (let a2 = 0; a2 < i2; a2++) e4[a2] *= n2 + r2 * t2[a2];
  return e4;
}
function ZN(e4) {
  for (let t2 = 0; t2 < e4.length; t2++) e4[t2] < 0 && (e4[t2] = -e4[t2]);
  return e4;
}
function QN(e4, t2) {
  let n2 = Math.min(e4.length, t2.length);
  for (let r2 = 0; r2 < n2; r2++) e4[r2] *= t2[r2];
  return e4;
}
function $N(e4, t2, n2, r2) {
  let i2 = Math.min(e4.length, t2.length);
  for (let a2 = 0; a2 < i2; a2++) e4[a2] *= n2 + r2 * (t2[a2] < 0 ? -t2[a2] : t2[a2]);
  return e4;
}
function eP(e4, t2, n2, r2) {
  let i2 = Math.min(e4.length, t2.length, n2.length);
  for (let a2 = 0; a2 < i2; a2++) e4[a2] += t2[a2] * n2[a2] * r2;
  return e4;
}
function tP(e4, t2, n2, r2 = 0) {
  let i2 = t2.length, a2 = e4.sr, o2 = r2, s2 = n2[0][1], c2 = r2 + Math.round(n2[0][0] * a2), l2 = Math.min(c2, i2);
  for (; o2 < l2; o2++) t2[o2] *= s2;
  for (let e5 = 1; e5 < n2.length && o2 < i2; e5++) {
    let l3 = n2[e5], u2 = r2 + Math.round(l3[0] * a2), d2 = l3[1], f2 = l3[2] ?? 0, p2 = u2 - c2;
    if (p2 <= 0) {
      s2 = d2, c2 = u2;
      continue;
    }
    let m2 = Math.min(u2, i2);
    if (Math.abs(f2) < 1e-4) {
      let e6 = (d2 - s2) / p2;
      nP(t2, o2, m2, s2 + e6 * (o2 - c2), e6);
    } else {
      let e6 = 1 - Math.exp(f2);
      rP(t2, o2, m2, s2, (d2 - s2) / e6, Math.exp(f2 * (o2 - c2) / p2), Math.exp(f2 / p2));
    }
    o2 = Math.max(o2, m2), s2 = d2, c2 = u2;
  }
  if (s2 !== 1) for (; o2 < i2; o2++) t2[o2] *= s2;
  return t2;
}
function nP(e4, t2, n2, r2, i2) {
  for (let a2 = t2; a2 < n2; a2++) e4[a2] *= r2, r2 += i2;
}
function rP(e4, t2, n2, r2, i2, a2, o2) {
  for (let s2 = t2; s2 < n2; s2++) e4[s2] *= r2 + i2 * (1 - a2), a2 *= o2;
}
function iP(e4, t2, n2 = -5, r2 = 1) {
  return [[0, 0], [e4, r2], [e4 + t2, 0, n2]];
}
function Z(e4, t2, n2 = 0, r2 = 1) {
  let i2 = Math.round(n2), a2 = Math.max(0, -i2), o2 = Math.min(t2.length, e4.length - i2);
  for (let n3 = a2; n3 < o2; n3++) e4[i2 + n3] += t2[n3] * r2;
  return e4;
}
function aP(e4, t2, n2, r2, i2 = 1) {
  return Z(t2, n2, r2 * e4.sr, i2);
}
function oP(e4, t2) {
  for (let n2 = 0; n2 < e4.length; n2++) e4[n2] *= t2;
  return e4;
}
function sP(e4, t2, n2) {
  let r2 = Math.min(t2.length, yP(e4, n2)), i2 = t2.length;
  for (let e5 = 0; e5 < r2; e5++) t2[i2 - 1 - e5] *= e5 / r2;
  return t2;
}
function cP(e4, t2) {
  let n2 = Math.max(64, Math.round(0.05 * e4.sr)), r2 = Math.exp(-2 * Math.PI * 120 / e4.sr), i2 = 0;
  for (let e5 of t2) {
    i2 = Math.max(i2, lP(e5, n2, r2));
    let t3 = e5.length % n2;
    t3 * 4 > n2 && (i2 = Math.max(i2, SP * n2 / t3));
  }
  return Math.sqrt(i2 / n2);
}
function lP(e4, t2, n2) {
  let r2 = 0, i2 = 0, a2 = 0, o2 = 0, s2 = mP;
  for (let c2 = 0; c2 < e4.length; c2++) {
    i2 = n2 * i2 + (1 - n2) * (e4[c2] + s2), s2 = -s2;
    let l2 = e4[c2] - i2;
    a2 += l2 * l2, ++o2 === t2 && (a2 > r2 && (r2 = a2), a2 = 0, o2 = 0);
  }
  return SP = a2, r2;
}
function uP(e4, t2) {
  let n2 = 0;
  for (let r2 of e4) for (let e5 = r2.length - 1; e5 > n2; e5--) if (r2[e5] > t2 || r2[e5] < -t2) {
    n2 = e5;
    break;
  }
  return n2;
}
function dP(e4, t2) {
  let n2 = 0, r2 = 0, i2 = 0, a2 = mP;
  for (let o2 = 0; o2 < e4.length; o2++) {
    let s2 = e4[o2];
    if ((s2 !== s2 || s2 > 64 || s2 < -64) && (s2 = 0), t2 < 1) {
      let e5 = s2 + a2;
      a2 = -a2, s2 = e5 - r2 + t2 * i2, r2 = e5, i2 = s2;
    }
    e4[o2] = s2, s2 > n2 ? n2 = s2 : -s2 > n2 && (n2 = -s2);
  }
  return n2;
}
function fP(e4, t2, n2 = {}) {
  let r2 = n2.rms ?? 0.2, i2 = n2.peak ?? 0.95, a2 = 0, o2 = n2.keepDc ? 1 : 1 - 2 * Math.PI * 18 / e4.sr;
  for (let e5 of t2) a2 = Math.max(a2, dP(e5, o2));
  if (a2 < 1e-9) return t2;
  let s2 = cP(e4, t2), c2 = s2 > 1e-9 ? r2 / s2 : i2 / a2;
  a2 * c2 > i2 && (c2 = i2 / a2);
  for (let e5 of t2) oP(e5, c2);
  let l2 = t2;
  if (n2.trim !== false) {
    let n3 = uP(t2, i2 * 32e-4), r3 = Math.min(t2[0].length, n3 + Math.round(0.02 * e4.sr));
    r3 < t2[0].length - 32 && (l2 = t2.map((e5) => e5.subarray(0, r3)));
  }
  let u2 = n2.tail ?? 0.012;
  if (u2 > 0) for (let t3 of l2) sP(e4, t3, Math.min(u2, t3.length / e4.sr * 0.5));
  return l2;
}
function pP(e4, t2, n2) {
  let r2 = Math.min(Math.floor(t2.length / 3), yP(e4, n2)), i2 = t2.length - r2, a2 = t2.subarray(0, i2);
  for (let e5 = 0; e5 < r2; e5++) {
    let n3 = e5 / r2, o2 = Math.sin(n3 * Math.PI * 0.5), s2 = Math.cos(n3 * Math.PI * 0.5);
    a2[e5] = t2[e5] * o2 + t2[i2 + e5] * s2;
  }
  return a2;
}
var mP, hP, gP, _P, vP, yP, Q, bP, xP, SP, CP = t((() => {
  FN(), mP = 1e-20, hP = 3e6, gP = null, _P = 0, vP = 0, yP = (e4, t2) => Math.max(1, Math.round(t2 * e4.sr)), Q = (e4, t2) => KN(yP(e4, t2)), bP = (e4) => 440 * 2 ** ((e4 - 69) / 12), xP = class {
    t;
    v;
    c;
    k = 0;
    expo;
    constant;
    constructor(e4, t2 = false) {
      this.expo = t2;
      let n2 = typeof e4 == `number` ? [[0, e4]] : e4.length ? e4 : [[0, 0]], r2 = n2.length;
      this.t = Array(r2), this.v = Array(r2), this.c = Array(r2);
      for (let e5 = 0; e5 < r2; e5++) this.t[e5] = n2[e5][0], this.v[e5] = t2 ? Math.log(Math.max(1e-6, n2[e5][1])) : n2[e5][1], this.c[e5] = n2[e5][2] ?? 0;
      this.constant = r2 === 1;
    }
    at(e4) {
      let t2 = this.t, n2 = t2.length;
      if (n2 === 1 || e4 <= t2[0]) return this.out(this.v[0]);
      if (e4 >= t2[n2 - 1]) return this.out(this.v[n2 - 1]);
      for (e4 < t2[this.k] && (this.k = 0); this.k < n2 - 2 && e4 >= t2[this.k + 1]; ) this.k++;
      let r2 = this.k, i2 = t2[r2 + 1] - t2[r2], a2 = i2 > 0 ? (e4 - t2[r2]) / i2 : 1, o2 = this.c[r2 + 1];
      return o2 !== 0 && (a2 = (1 - Math.exp(o2 * a2)) / (1 - Math.exp(o2))), this.out(this.v[r2] + (this.v[r2 + 1] - this.v[r2]) * a2);
    }
    out(e4) {
      return this.expo ? Math.exp(e4) : e4;
    }
  }, SP = 0;
}));
function wP(e4, t2, n2) {
  let r2 = e4.length;
  for (let n3 = 1, i3 = 0; n3 < r2; n3++) {
    let a2 = r2 >> 1;
    for (; i3 & a2; a2 >>= 1) i3 ^= a2;
    if (i3 ^= a2, n3 < i3) {
      let r3 = e4[n3];
      e4[n3] = e4[i3], e4[i3] = r3, r3 = t2[n3], t2[n3] = t2[i3], t2[i3] = r3;
    }
  }
  let i2 = n2 ? 1 : -1;
  for (let n3 = 2; n3 <= r2; n3 <<= 1) {
    let a2 = i2 * 2 * Math.PI / n3, o2 = Math.cos(a2), s2 = Math.sin(a2), c2 = n3 >> 1;
    for (let i3 = 0; i3 < r2; i3 += n3) {
      let n4 = 1, r3 = 0;
      for (let a3 = 0; a3 < c2; a3++) {
        let l2 = i3 + a3, u2 = l2 + c2, d2 = e4[u2] * n4 - t2[u2] * r3, f2 = e4[u2] * r3 + t2[u2] * n4;
        e4[u2] = e4[l2] - d2, t2[u2] = t2[l2] - f2, e4[l2] += d2, t2[l2] += f2;
        let p2 = n4 * o2 - r3 * s2;
        r3 = n4 * s2 + r3 * o2, n4 = p2;
      }
    }
  }
}
function TP(e4) {
  let t2 = FP.get(e4);
  return t2 || (t2 = [new Float64Array(e4), new Float64Array(e4), new Float64Array(e4 >> 1), new Float64Array(e4 >> 1)], FP.set(e4, t2)), t2;
}
function EP() {
  FP.clear();
}
function DP(e4, t2, n2, r2) {
  let i2 = t2 >> 1;
  r2.fill(0);
  let a2 = e4.bwScale ?? 1, o2 = Math.min(e4.maxF ?? n2 * 0.45, n2 * 0.45);
  for (let s2 = 1; ; s2++) {
    let c2 = e4.f0 * s2 * (1 + (e4.stretch ?? 0) * (s2 - 1));
    if (c2 >= o2) break;
    let l2 = e4.amp(s2, c2);
    if (l2 <= 1e-5) continue;
    let u2 = (2 ** (e4.bw / 1200) - 1) * e4.f0 * s2 ** +a2, d2 = Math.max(u2 / 2, n2 / t2), f2 = c2 / n2 * t2, p2 = d2 / n2 * t2, m2 = Math.max(1, Math.floor(f2 - 3 * p2)), h2 = Math.min(i2 - 1, Math.ceil(f2 + 3 * p2)), g2 = l2 / Math.sqrt(p2);
    for (let e5 = m2; e5 <= h2; e5++) {
      let t3 = (e5 - f2) / p2;
      r2[e5] += Math.exp(-t3 * t3) * g2;
    }
  }
  for (let a3 of e4.noise ?? []) {
    let e5 = a3.f / n2 * t2, o3 = Math.max(1, a3.w / n2 * t2), s2 = Math.max(1, Math.floor(e5 - 3 * o3)), c2 = Math.min(i2 - 1, Math.ceil(e5 + 3 * o3)), l2 = a3.a / Math.sqrt(o3);
    for (let t3 = s2; t3 <= c2; t3++) {
      let n3 = (t3 - e5) / o3;
      r2[t3] += Math.exp(-n3 * n3) * l2;
    }
  }
  return r2;
}
function OP(e4, t2, n2, r2, i2 = 0.8) {
  let a2 = new PN(r2), o2 = [];
  for (let r3 = 0; r3 < n2.length; r3 += 2) {
    let [s2, c2, l2, u2] = TP(t2);
    s2.fill(0), c2.fill(0);
    let d2 = DP(n2[r3], t2, e4, l2), f2 = r3 + 1 < n2.length ? DP(n2[r3 + 1], t2, e4, u2) : null;
    kP(s2, c2, d2, f2, a2), wP(s2, c2, true), o2.push(AP(s2, i2)), f2 && o2.push(AP(c2, i2));
  }
  return o2;
}
function kP(e4, t2, n2, r2, i2) {
  let a2 = e4.length, o2 = a2 >> 1;
  for (let s2 = 1; s2 < o2; s2++) {
    let o3 = n2[s2], c2 = r2 ? r2[s2] : 0;
    if (o3 === 0 && c2 === 0) continue;
    let l2 = i2.u32() & MP - 1, u2 = o3 * NP[l2], d2 = o3 * PP[l2], f2 = 0, p2 = 0;
    if (c2 !== 0) {
      let e5 = i2.u32() & MP - 1;
      f2 = c2 * NP[e5], p2 = c2 * PP[e5];
    }
    e4[s2] = u2 - p2, t2[s2] = d2 + f2, e4[a2 - s2] = u2 + p2, t2[a2 - s2] = f2 - d2;
  }
}
function AP(e4, t2) {
  let n2 = e4.length, r2 = 0;
  for (let t3 = 0; t3 < n2; t3++) {
    let n3 = e4[t3] < 0 ? -e4[t3] : e4[t3];
    n3 > r2 && (r2 = n3);
  }
  let i2 = r2 > 0 ? t2 / r2 : 0, a2 = new Float32Array(n2);
  for (let t3 = 0; t3 < n2; t3++) a2[t3] = e4[t3] * i2;
  return a2;
}
function jP(e4, t2, n2) {
  let r2 = (e4 - t2) / n2;
  return Math.exp(-r2 * r2);
}
var MP, NP, PP, FP, IP = t((() => {
  FN(), MP = 4096, NP = new Float64Array(MP), PP = new Float64Array(MP);
  for (let e4 = 0; e4 < MP; e4++) NP[e4] = Math.cos(2 * Math.PI * e4 / MP), PP[e4] = Math.sin(2 * Math.PI * e4 / MP);
  FP = /* @__PURE__ */ new Map();
}));
function LP(e4) {
  let t2 = (e4 - Math.floor(e4)) * QP, n2 = t2 | 0;
  return $P[n2] + ($P[n2 + 1] - $P[n2]) * (t2 - n2);
}
function RP(e4, t2) {
  return e4 < t2 ? (e4 /= t2, e4 + e4 - e4 * e4 - 1) : e4 > 1 - t2 ? (e4 = (e4 - 1) / t2, e4 * e4 + e4 + e4 + 1) : 0;
}
function zP(e4, t2, n2, r2 = `sine`, i2 = 1, a2 = 0, o2, s2 = 0, c2 = 0.5) {
  let l2 = o2 ?? KN(t2), u2 = e4.sr, d2 = new xP(n2, true), f2 = d2.constant, p2 = eF[r2], m2 = a2 - Math.floor(a2), h2 = d2.at(0) / u2, g2 = Math.min(t2, l2.length - s2);
  for (let e5 = 0; e5 < g2; e5++) {
    !f2 && !(e5 & 15) && (h2 = Math.min(0.49, d2.at(e5 / u2) / u2));
    let t3;
    switch (p2) {
      case 0: {
        let e6 = m2 * QP, n3 = e6 | 0;
        t3 = $P[n3] + ($P[n3 + 1] - $P[n3]) * (e6 - n3);
        break;
      }
      case 1:
        t3 = m2 < 0.5 ? 4 * m2 - 1 : 3 - 4 * m2;
        break;
      case 2:
        t3 = 2 * m2 - 1 - RP(m2, h2);
        break;
      default: {
        t3 = m2 < c2 ? 1 : -1, t3 += RP(m2, h2);
        let e6 = m2 - c2;
        e6 < 0 && (e6 += 1), t3 -= RP(e6, h2);
      }
    }
    l2[s2 + e5] += t3 * i2, m2 += h2, m2 >= 1 && --m2;
  }
  return l2;
}
function BP(e4, t2, n2, r2, i2, a2 = 1, o2, s2 = 0) {
  let c2 = o2 ?? KN(t2), l2 = e4.sr, u2 = new xP(n2, true), d2 = new xP(i2, false), f2 = 0, p2 = 0, m2 = u2.at(0) / l2, h2 = d2.at(0) / (2 * Math.PI), g2 = Math.min(t2, c2.length - s2);
  for (let e5 = 0; e5 < g2; e5++) {
    if (!(e5 & 15)) {
      let t4 = e5 / l2;
      m2 = Math.min(0.49, u2.at(t4) / l2), h2 = d2.at(t4) / (2 * Math.PI);
    }
    let t3 = LP(p2);
    c2[s2 + e5] += LP(f2 + h2 * t3) * a2, f2 += m2, p2 += m2 * r2, f2 >= 1 && --f2, p2 >= 1 && (p2 -= Math.floor(p2));
  }
  return c2;
}
function VP(e4, t2, n2 = 1) {
  let r2 = KN(t2), i2 = e4.r.u32() | 1, a2 = n2 * 4656612873e-19;
  for (let e5 = 0; e5 < t2; e5++) i2 ^= i2 << 13, i2 ^= i2 >>> 17, i2 ^= i2 << 5, r2[e5] = (i2 | 0) * a2;
  return r2;
}
function HP(e4, t2, n2 = 1) {
  let r2 = VP(e4, t2, 1), i2 = 0, a2 = 0, o2 = 0, s2 = n2 * 0.32;
  for (let e5 = 0; e5 < t2; e5++) {
    let t3 = r2[e5];
    i2 = 0.99765 * i2 + t3 * 0.099046, a2 = 0.963 * a2 + t3 * 0.2965164, o2 = 0.57 * o2 + t3 * 1.0526913, r2[e5] = (i2 + a2 + o2 + t3 * 0.1848) * s2;
  }
  return r2;
}
function UP(e4, t2, n2 = 1) {
  let r2 = VP(e4, t2, 1), i2 = 0, a2 = 1 - 20 / e4.sr, o2 = n2 * Math.sqrt(e4.sr / 22050) * 0.09;
  for (let e5 = 0; e5 < t2; e5++) i2 = i2 * a2 + r2[e5], r2[e5] = i2 * o2;
  return r2;
}
function WP(e4, t2, n2, r2 = 2, i2 = 1, a2) {
  let o2 = a2 ?? KN(t2), s2 = e4.r, c2 = new xP(n2, false), l2 = e4.sr, u2 = 0, d2 = t2 / l2;
  for (; ; ) {
    let e5 = Math.max(0.01, c2.at(u2));
    if (u2 += s2.expo(1 / e5), u2 >= d2) break;
    let t3 = Math.floor(u2 * l2);
    o2[t3] += i2 * s2.next() ** +r2 * (s2.next() < 0.5 ? -1 : 1);
  }
  return o2;
}
function GP(e4, t2, n2, r2, i2 = 0) {
  let a2 = r2 ?? KN(t2), o2 = e4.sr;
  for (let e5 of n2) {
    if (e5.f <= 0 || e5.f >= o2 * 0.46 || e5.a === 0) continue;
    let n3 = 2 * Math.PI * e5.f / o2, r3 = Math.exp(-6.9078 / (Math.max(2e-3, e5.d) * o2)), s2 = 2 * r3 * Math.cos(n3), c2 = r3 * r3, l2 = 2 * Math.PI * (e5.ph ?? 0), u2 = e5.a * Math.sin(l2 - n3) / r3, d2 = e5.a * Math.sin(l2 - 2 * n3) / c2;
    KP(a2, i2, Math.min(t2, a2.length - i2, Math.ceil(e5.d * 1.15 * o2)), s2, c2, u2, d2);
  }
  return a2;
}
function KP(e4, t2, n2, r2, i2, a2, o2) {
  for (let s2 = 0; s2 < n2; s2++) {
    let n3 = r2 * a2 - i2 * o2;
    e4[t2 + s2] += n3, o2 = a2, a2 = n3;
  }
}
function qP(e4, t2, n2, r2) {
  let i2 = r2 ?? KN(t2.length), a2 = e4.sr, o2 = Math.min(t2.length, i2.length);
  for (let e5 of n2) {
    if (e5.f <= 0 || e5.f >= a2 * 0.46 || e5.a === 0) continue;
    let n3 = 2 * Math.PI * e5.f / a2, r3 = Math.exp(-6.9078 / (Math.max(2e-3, e5.d) * a2)), s2 = 2 * r3 * Math.cos(n3), c2 = r3 * r3;
    JP(t2, i2, o2, e5.a * (1 - r3) * 2 * Math.max(0.05, Math.sin(n3)), s2, c2);
  }
  return i2;
}
function JP(e4, t2, n2, r2, i2, a2) {
  let o2 = 0, s2 = 0;
  for (let c2 = 0; c2 < n2; c2++) {
    let n3 = r2 * (e4[c2] + (c2 & 1 ? mP : -mP)) + i2 * o2 - a2 * s2;
    t2[c2] += n3, s2 = o2, o2 = n3;
  }
}
function YP(e4, t2, n2, r2, i2) {
  let a2 = KN(t2), o2 = 0, s2 = 0.08 + r2 * 0.85, c2 = n2 | 1;
  for (let e5 = 0; e5 < t2; e5++) c2 ^= c2 << 13, c2 ^= c2 >>> 17, c2 ^= c2 << 5, o2 += s2 * ((c2 | 0) * 4656612873e-19 - o2), a2[e5] = o2;
  let l2 = Math.max(1, Math.round(i2 * t2)), u2 = 0;
  for (let n3 = 0; n3 < t2; n3++) {
    let t3 = a2[n3] - (n3 >= l2 ? a2[n3 - l2] : 0);
    e4[n3] = t3, u2 += t3;
  }
  u2 /= t2;
  for (let n3 = 0; n3 < t2; n3++) e4[n3] -= u2;
}
function XP(e4, t2, n2, r2, i2, a2, o2, s2, c2) {
  let l2 = 0, u2 = 0, d2 = 0, f2 = 0;
  for (let p2 = 0; p2 < i2; p2++) {
    let i3 = e4[l2], m2 = a2 * ((1 - o2) * i3 + o2 * u2) + (p2 & 1 ? mP : -mP);
    u2 = i3;
    let h2 = s2 * m2 + d2 - s2 * f2;
    d2 = m2, f2 = h2, e4[l2] = h2, n2[r2 + p2] += i3 * c2, l2++, l2 >= t2 && (l2 = 0);
  }
}
function ZP(e4, t2, n2, r2, i2, a2 = 0, o2 = 1) {
  let s2 = i2 ?? KN(t2), c2 = e4.sr, l2 = 0.5 - (r2.bright ?? 0.2) * 0.42, u2 = Math.min(t2, s2.length - a2);
  for (let t3 = 0; t3 < 2; t3++) {
    let i3 = t3 === 0 ? n2 : n2 * 2 ** ((r2.detune ?? 0.9) / 1200), d2 = c2 / i3 - l2, f2 = Math.max(2, Math.floor(d2 - 0.15)), p2 = d2 - f2, m2 = (1 - p2) / (1 + p2), h2 = 10 ** (-3 / (r2.t60 * i3)), g2 = KN(f2 + 2);
    YP(g2, f2, e4.r.u32(), r2.hard ?? 0.5, r2.pick ?? 0.18), XP(g2, f2, s2, a2, u2, h2, l2, m2, o2 * (t3 === 0 ? 1 : 0.55));
  }
  return s2;
}
var QP, $P, eF, tF = t((() => {
  CP(), QP = 4096, $P = (() => {
    let e4 = new Float32Array(QP + 1);
    for (let t2 = 0; t2 <= QP; t2++) e4[t2] = Math.sin(2 * Math.PI * t2 / QP);
    return e4;
  })(), eF = { sine: 0, tri: 1, saw: 2, square: 3 };
}));
function nF(e4, t2, n2, r2, i2 = 0.707, a2 = 0, o2 = 0, s2 = t2.length) {
  let c2 = e4.sr, l2 = 1 / Math.max(0.05, i2), u2 = c2 * 0.45, d2 = new xP(r2, true), f2 = d2.constant, p2 = 0, m2 = 0, h2 = 0;
  switch (n2) {
    case `lp`:
      p2 = 1;
      break;
    case `bp`:
      m2 = l2;
      break;
    case `hp`:
      p2 = -1, m2 = -l2, h2 = 1;
      break;
    case `notch`:
      m2 = -l2, h2 = 1;
      break;
    case `peak`:
      m2 = (10 ** (a2 / 20) - 1) * l2, h2 = 1;
      break;
  }
  let g2 = 0, _2 = 0, v2 = 0, y2 = 0, b2 = 0;
  {
    let e5 = Math.min(u2, Math.max(8, d2.at(o2 / c2))), t3 = Math.tan(Math.PI * e5 / c2);
    v2 = 1 / (1 + t3 * (t3 + l2)), y2 = t3 * v2, b2 = t3 * y2;
  }
  let x2 = mP;
  for (let e5 = o2; e5 < s2; e5++) {
    if (!f2 && !(e5 - o2 & 15)) {
      let t3 = Math.min(u2, Math.max(8, d2.at(e5 / c2))), n4 = Math.tan(Math.PI * t3 / c2);
      v2 = 1 / (1 + n4 * (n4 + l2)), y2 = n4 * v2, b2 = n4 * y2;
    }
    let n3 = t2[e5] + x2;
    x2 = -x2;
    let r3 = n3 - _2, i3 = v2 * g2 + y2 * r3, a3 = _2 + y2 * g2 + b2 * r3;
    g2 = 2 * i3 - g2, _2 = 2 * a3 - _2, t2[e5] = p2 * a3 + m2 * i3 + h2 * n3;
  }
  return t2;
}
function rF(e4, t2, n2) {
  let r2 = 1 - Math.exp(-2 * Math.PI * n2 / e4.sr), i2 = 0, a2 = mP;
  for (let e5 = 0; e5 < t2.length; e5++) i2 += r2 * (t2[e5] + a2 - i2), a2 = -a2, t2[e5] = i2;
  return t2;
}
function iF(e4, t2, n2, r2 = 0.6, i2 = 0.5) {
  let a2 = e4.sr, o2 = new xP(n2, false), s2 = Math.ceil(a2 * 0.03) + 4, c2 = KN(s2), l2 = 0, u2 = o2.at(0) * a2 / 1e3;
  for (let e5 = 0; e5 < t2.length; e5++) {
    e5 & 7 || (u2 = Math.min(s2 - 3, Math.max(1, o2.at(e5 / a2) * a2 / 1e3)));
    let n3 = l2 - u2;
    n3 < 0 && (n3 += s2), n3 >= s2 && (n3 -= s2);
    let d2 = n3 | 0, f2 = n3 - d2, p2 = d2 + 1 >= s2 ? 0 : d2 + 1, m2 = c2[d2] + (c2[p2] - c2[d2]) * f2, h2 = t2[e5];
    c2[l2] = h2 + m2 * r2 + (e5 & 1 ? mP : -mP), t2[e5] = h2 * (1 - i2) + m2 * i2, ++l2 >= s2 && (l2 = 0);
  }
  return t2;
}
function aF(e4, t2, n2, r2 = 1, i2 = 1, a2 = 3) {
  let o2 = KN(t2.length), s2 = new xP(r2, false);
  for (let r3 = 0; r3 < a2; r3++) {
    let a3 = [];
    for (let [e5, t3] of n2) a3.push([e5, sF[t3].f[r3]]);
    let c2 = [];
    for (let [e5, t3] of n2) c2.push([e5, 10 ** (sF[t3].g[r3] / 20)]);
    oF(t2, o2, e4.sr, new xP(a3, true), new xP(c2, false), s2, sF[n2[0][1]].bw[r3] * i2);
  }
  return o2;
}
function oF(e4, t2, n2, r2, i2, a2, o2) {
  let s2 = n2 * 0.45, c2 = 0, l2 = 0, u2 = 0, d2 = 0, f2 = 0, p2 = 1, m2 = e4.length;
  for (let h2 = 0; h2 < m2; h2++) {
    if (!(h2 & 15)) {
      let e5 = h2 / n2, t3 = a2.at(e5), c3 = Math.min(s2, Math.max(40, r2.at(e5) * t3)), l3 = Math.max(20, o2 * Math.sqrt(t3)) / c3, m4 = Math.tan(Math.PI * c3 / n2);
      u2 = 1 / (1 + m4 * (m4 + l3)), d2 = m4 * u2, f2 = m4 * d2, p2 = i2.at(e5) * l3;
    }
    let m3 = e4[h2] + (h2 & 1 ? mP : -mP) - l2, g2 = u2 * c2 + d2 * m3, _2 = l2 + d2 * c2 + f2 * m3;
    c2 = 2 * g2 - c2, l2 = 2 * _2 - l2, t2[h2] += g2 * p2;
  }
}
var sF, cF = t((() => {
  CP(), sF = { a: { f: [730, 1090, 2440, 3400], bw: [90, 110, 160, 250], g: [0, -5, -16, -22] }, e: { f: [530, 1840, 2480, 3500], bw: [70, 100, 160, 250], g: [0, -8, -14, -22] }, i: { f: [290, 2250, 3e3, 3700], bw: [60, 100, 170, 250], g: [0, -14, -18, -24] }, o: { f: [570, 840, 2410, 3400], bw: [80, 90, 160, 250], g: [0, -3, -22, -28] }, u: { f: [320, 870, 2240, 3300], bw: [60, 90, 160, 250], g: [0, -10, -26, -30] }, ae: { f: [660, 1720, 2410, 3400], bw: [90, 110, 160, 250], g: [0, -4, -14, -22] }, uh: { f: [560, 1190, 2390, 3400], bw: [80, 100, 160, 250], g: [0, -5, -18, -24] }, er: { f: [490, 1350, 1690, 3300], bw: [80, 100, 150, 250], g: [0, -6, -10, -24] } };
}));
function lF(e4) {
  if (e4 > 3) return 1;
  if (e4 < -3) return -1;
  let t2 = e4 * e4;
  return e4 * (27 + t2) / (27 + 9 * t2);
}
function uF(e4, t2, n2 = 0) {
  let r2 = lF(n2), i2 = 1 / Math.max(0.05, lF(t2 + n2) - r2);
  for (let a2 = 0; a2 < e4.length; a2++) e4[a2] = (lF(e4[a2] * t2 + n2) - r2) * i2;
  return e4;
}
function dF(e4, t2) {
  for (let n2 = 0; n2 < e4.length; n2++) e4[n2] = lF(e4[n2] * t2);
  return e4;
}
function fF(e4, t2, n2 = 1) {
  let r2 = 2 ** (t2 - 1), i2 = 0, a2 = 0;
  for (let t3 = 0; t3 < e4.length; t3++) i2-- <= 0 && (a2 = Math.round(e4[t3] * r2) / r2, i2 = n2 - 1), e4[t3] = a2;
  return e4;
}
function pF(e4, t2, n2, r2, i2 = 0) {
  let a2 = new xP(n2, true), o2 = i2, s2 = a2.at(0) / e4.sr;
  for (let n3 = 0; n3 < t2.length; n3++) n3 & 15 || (s2 = a2.at(n3 / e4.sr) / e4.sr), t2[n3] *= 1 - r2 * (0.5 + 0.5 * LP(o2)), o2 += s2;
  return t2;
}
function mF(e4, t2, n2) {
  let r2 = KN(t2), i2 = 0, a2 = e4.length;
  for (let o2 = 0; o2 < a2; o2++) {
    let a3 = r2[i2], s2 = e4[o2] + n2 * a3 + (o2 & 1 ? mP : -mP);
    r2[i2] = s2, e4[o2] = a3 - n2 * s2, ++i2 >= t2 && (i2 = 0);
  }
}
function hF(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2) {
  let u2 = i2[0], d2 = i2[1], f2 = i2[2], p2 = i2[3], m2 = i2[4], h2 = i2[5], g2 = i2[6], _2 = i2[7], v2 = a2[0], y2 = a2[1], b2 = a2[2], x2 = a2[3], S2 = a2[4], C2 = a2[5], w2 = a2[6], T2 = a2[7], E2 = KN(u2), D2 = KN(d2), O2 = KN(f2), k2 = KN(p2), A2 = KN(m2), ee2 = KN(h2), te2 = KN(g2), ne2 = KN(_2), re2 = o2, ie2 = 1 - o2, ae2 = s2 * 0.7, oe2 = 0, se2 = 0, ce2 = 0, le2 = 0, ue2 = 0, de2 = 0, fe2 = 0, pe2 = 0, me2 = 0, he2 = 0, ge2 = 0, _e2 = 0, ve2 = 0, ye2 = 0, be2 = 0, xe2 = 0, Se2 = t2.length, Ce2 = e4.length;
  for (let i3 = 0; i3 < Ce2; i3++) {
    let a3 = e4[i3] * 0.5 + (i3 & 1 ? mP : -mP);
    me2 = ie2 * E2[oe2] + re2 * me2, he2 = ie2 * D2[se2] + re2 * he2, ge2 = ie2 * O2[ce2] + re2 * ge2, _e2 = ie2 * k2[le2] + re2 * _e2, ve2 = ie2 * A2[ue2] + re2 * ve2, ye2 = ie2 * ee2[de2] + re2 * ye2, be2 = ie2 * te2[fe2] + re2 * be2, xe2 = ie2 * ne2[pe2] + re2 * xe2;
    let o3 = me2 + he2, Ce3 = me2 - he2, we2 = ge2 + _e2, Te2 = ge2 - _e2, Ee2 = ve2 + ye2, De2 = ve2 - ye2, Oe2 = be2 + xe2, j2 = be2 - xe2, ke2 = o3 + we2, Ae2 = o3 - we2, je2 = Ce3 + Te2, Me2 = Ce3 - Te2, Ne2 = Ee2 + Oe2, Pe2 = Ee2 - Oe2, Fe2 = De2 + j2, Ie2 = De2 - j2;
    E2[oe2] = a3 + (ke2 + Ne2) * v2, D2[se2] = a3 - (je2 + Fe2) * y2, O2[ce2] = a3 + (Ae2 + Pe2) * b2, k2[le2] = a3 - (Me2 + Ie2) * x2, A2[ue2] = a3 + (ke2 - Ne2) * S2, ee2[de2] = a3 - (je2 - Fe2) * C2, te2[fe2] = a3 + (Ae2 - Pe2) * w2, ne2[pe2] = a3 - (Me2 - Ie2) * T2, ++oe2 >= u2 && (oe2 = 0), ++se2 >= d2 && (se2 = 0), ++ce2 >= f2 && (ce2 = 0), ++le2 >= p2 && (le2 = 0), ++ue2 >= m2 && (ue2 = 0), ++de2 >= h2 && (de2 = 0), ++fe2 >= g2 && (fe2 = 0), ++pe2 >= _2 && (pe2 = 0);
    let Le2 = i3 < Se2 ? t2[i3] * c2 : 0;
    l2 ? (n2[i3] = Le2 + (me2 - ge2 + ve2 - be2) * s2, r2[i3] = Le2 + (he2 - _e2 + ye2 - xe2) * s2) : n2[i3] = Le2 + (me2 - _e2 + ye2 - be2) * ae2;
  }
}
function gF(e4, t2, n2) {
  let r2 = e4.sr, i2 = n2.tail ?? n2.t60 * 0.8, a2 = t2.length + Math.round(i2 * r2), o2 = n2.size ?? 1, s2 = Math.min(0.95, Math.max(0, n2.damp ?? 0.35)), c2 = Math.round((n2.pre ?? 0.012) * r2), l2 = KN(a2);
  l2.set(t2.subarray(0, Math.max(0, Math.min(t2.length, a2 - c2))), c2);
  for (let e5 of yF) mF(l2, Math.max(1, Math.round(e5 * o2 * r2 / 1e3)), 0.62);
  let u2 = vF.map((e5) => Math.max(8, Math.round(e5 * o2 * r2 / 1e3))), d2 = 1 / Math.sqrt(8), f2 = u2.map((e5) => d2 * 10 ** (-3 * e5 / (r2 * n2.t60))), p2 = KN(a2), m2 = n2.stereo ? KN(a2) : p2;
  return hF(l2, t2, p2, m2, u2, f2, s2, n2.wet ?? 0.35, n2.dry ?? 1, !!n2.stereo), n2.stereo ? [p2, m2] : [p2];
}
function _F(e4, t2, n2) {
  return gF(e4, t2, { ...n2, stereo: false })[0];
}
var vF, yF, bF = t((() => {
  CP(), tF(), vF = [29.7, 37.1, 41.1, 43.7, 47.3, 53.9, 59.6, 67.3], yF = [4.71, 3.63, 11.3];
}));
function xF(e4, t2, n2) {
  let r2 = n2.bi(), i2 = n2.bi(), a2 = 0, o2 = e4.length;
  for (let s2 = 0; s2 < o2; s2++) a2 >= t2 && (a2 = 0, r2 = i2, i2 = n2.bi()), e4[s2] = r2 + (i2 - r2) * (a2 / t2), a2++;
}
function SF(e4, t2, n2) {
  let r2 = KN(t2);
  return xF(r2, Math.max(2, Math.round(e4.sr / Math.max(0.05, n2))), e4.r), rF(e4, r2, n2 * 1.5);
}
function CF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = t2.sweep ?? t2.dur * 0.35, i2 = [[0, t2.f0], [r2, t2.f1, -3]], a2 = zP(e4, n2, i2, `sine`);
  return t2.h2 && zP(e4, n2, i2.map(([e5, t3, n3]) => [e5, t3 * 2, n3]), `sine`, t2.h2, 0.25, a2), tP(e4, a2, [[0, 0], [t2.att ?? 15e-4, 1], [t2.dur, 0, t2.curve ?? -5]]), t2.drive && uF(a2, t2.drive), a2;
}
function $(e4, t2) {
  let n2 = qF(e4, yP(e4, t2.dur), t2.color);
  t2.bp !== void 0 && nF(e4, n2, `bp`, t2.bp, t2.q ?? 1), t2.lp !== void 0 && nF(e4, n2, `lp`, t2.lp, t2.lpq ?? 0.707), t2.hp !== void 0 && nF(e4, n2, `hp`, t2.hp, 0.707);
  let r2 = t2.att ?? 2e-3;
  return tP(e4, n2, t2.env ?? iP(r2, Math.max(1e-3, t2.dur - r2), t2.curve ?? -5)), n2;
}
function wF(e4, t2 = 3e3, n2 = 5e-3, r2 = 0.8) {
  return $(e4, { dur: n2, bp: t2, q: r2, att: 3e-4, curve: -6 });
}
function TF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = qF(e4, n2, t2.color ?? `pink`), i2 = [[0, t2.f0], [t2.peak, t2.fp, 2], [t2.dur, t2.f1, -2]];
  if (nF(e4, r2, `bp`, i2, t2.q ?? 1.3), t2.body) {
    let a2 = qF(e4, n2, `pink`);
    nF(e4, a2, `lp`, i2.map(([e5, t3, n3]) => [e5, t3 * 0.45, n3]), 0.9), Z(r2, a2, 0, t2.body);
  }
  return t2.ring && Z(r2, zP(e4, n2, [[0, t2.ring * 1.04], [t2.dur, t2.ring * 0.96]]), 0, (t2.ringAmt ?? 0.08) * 1), tP(e4, r2, [[0, 0], [t2.peak, 1, 2.5], [t2.dur, 0, -3.2]]), r2;
}
function EF(e4, t2) {
  let n2 = WP(e4, yP(e4, t2.dur), t2.rate, t2.pow ?? 2.5);
  return nF(e4, n2, `bp`, t2.f, t2.q ?? 0.9), t2.hp && nF(e4, n2, `hp`, t2.hp), t2.env && tP(e4, n2, t2.env), n2;
}
function DF(e4, t2, n2, r2, i2, a2 = 0.01) {
  return n2.map((n3, o2) => ({ f: t2 * n3 * (1 + e4.r.bi() * a2), a: (r2[o2] ?? r2[r2.length - 1]) * (0.75 + 0.25 * e4.r.next()), d: typeof i2 == `number` ? i2 : i2[o2] ?? i2[i2.length - 1], ph: e4.r.next() }));
}
function OF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r, a2 = t2.t0 ?? 0;
  for (let o2 = 0; o2 < t2.count; o2++) {
    let s2 = i2.range(t2.fLo ?? 2600, t2.fHi ?? 5200), c2 = (1 - o2 / t2.count * 0.55) * i2.range(0.45, 1), l2 = (t2.decay ?? 0.22) * i2.range(0.6, 1.4), u2 = DF(e4, s2, JF, YF, [l2, l2 * 0.8, l2 * 0.6, l2 * 0.5, l2 * 0.4, l2 * 0.3], 0.015).map((e5) => ({ ...e5, a: e5.a * c2 })), d2 = Math.floor(a2 * e4.sr);
    if (d2 >= n2) break;
    if (GP(e4, n2, u2, r2, d2), Z(r2, wF(e4, i2.range(5e3, 8e3), 2e-3), d2, c2 * 0.5), i2.chance(0.35)) {
      let t3 = d2 + Math.floor(i2.range(8e-3, 0.03) * e4.sr);
      t3 < n2 && GP(e4, n2, u2.map((e5) => ({ ...e5, a: e5.a * 0.4 })), r2, t3);
    }
    a2 += i2.expo(t2.spread / t2.count) + 0.012;
  }
  return r2;
}
function kF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r;
  for (let a2 = 0; a2 < t2.count; a2++) {
    let a3 = (t2.t0 ?? 0) + i2.expo(t2.spread), o2 = Math.floor(a3 * e4.sr);
    if (o2 >= n2) continue;
    let s2 = i2.log(t2.fLo, t2.fHi), c2 = Math.exp(-(a3 - (t2.t0 ?? 0)) * (t2.fall ?? 2.5)), l2 = (t2.amp ?? 1) * c2 * i2.next() ** 1.5, u2 = (t2.decay ?? 0.04) * i2.range(0.5, 1.6);
    GP(e4, n2, [{ f: s2, a: l2, d: u2, ph: i2.next() }, { f: s2 * i2.range(1.5, 2.9), a: l2 * 0.6, d: u2 * 0.6, ph: i2.next() }], r2, o2), Z(r2, wF(e4, Math.min(e4.sr * 0.4, s2 * 2), 25e-4), o2, l2 * 0.7);
  }
  return r2;
}
function AF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = UP(e4, n2);
  return nF(e4, r2, `lp`, t2.lp, t2.q ?? 0.8), t2.wob && XN(r2, SF(e4, n2, t2.wob), 0.65, 0.35), tP(e4, r2, t2.env), r2;
}
function jF(e4, t2, n2, r2, i2, a2) {
  let o2 = 0, s2 = n2.log(r2, i2), c2 = e4.length;
  for (let l2 = 0; l2 < c2; l2++) l2 % a2 === 0 && (s2 = n2.log(r2, i2)), o2 += s2 / t2, o2 >= 1 && --o2, e4[l2] = 2 * o2 - 1;
}
function MF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r;
  return jF(r2, e4.sr, i2, t2.fLo, t2.fHi, Math.max(8, Math.round((t2.hold ?? 6e-3) * e4.sr))), t2.crackle && Z(r2, WP(e4, n2, 900, 1.2, t2.crackle * 3)), nF(e4, r2, `hp`, t2.hp ?? 600, 0.7), uF(r2, t2.drive ?? 3), tP(e4, r2, t2.env), r2;
}
function NF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r, a2 = new xP(t2.rate, true), o2 = 0, s2 = t2.dur;
  for (; o2 < s2; ) {
    let s3 = Math.max(2, a2.at(o2));
    o2 += 1 / s3 * (1 + (t2.jitter ?? 0.25) * i2.bi());
    let c3 = Math.floor(o2 * e4.sr);
    if (c3 >= n2) break;
    r2[c3] += i2.range(0.6, 1);
  }
  let c2 = qP(e4, r2, t2.res.map((e5) => ({ f: e5.f * (1 + i2.bi() * 0.02), a: e5.a, d: e5.d })));
  if (t2.noise) {
    let i3 = VP(e4, n2);
    nF(e4, i3, `bp`, t2.res[0].f * 2.2, 1.2);
    let a3 = qN(r2);
    ZN(a3), rF(e4, a3, 40), eP(c2, i3, a3, t2.noise * 30);
  }
  return tP(e4, c2, t2.env), c2;
}
function PF(e4, t2, n2, r2) {
  let i2 = e4.length;
  for (let a2 = 0; a2 < n2 && t2 + a2 < i2; a2++) e4[t2 + a2] += r2 * (1 - a2 / n2) * (a2 < 6 ? a2 / 6 : 1);
}
function FF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = VP(e4, n2), i2 = KN(n2), a2 = e4.r, o2 = new xP(t2.rate, false), [s2, c2] = t2.grain ?? [3e-3, 0.02], l2 = 0;
  for (; l2 < t2.dur; ) l2 += a2.expo(1 / Math.max(1, o2.at(l2))), PF(i2, Math.floor(l2 * e4.sr), Math.max(4, Math.floor(a2.log(s2, c2) * e4.sr)), a2.next() ** 1.6);
  return QN(r2, i2), nF(e4, r2, `hp`, t2.fLo, 0.6), nF(e4, r2, `lp`, t2.fHi, 0.6), tP(e4, r2, t2.env), r2;
}
function IF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = e4.r, i2 = VP(e4, n2);
  nF(e4, i2, `bp`, [[0, t2.f * 1.4], [t2.dur, t2.f * 0.6]], 1.1), tP(e4, i2, iP(t2.att ?? 2e-3, t2.dur * 0.5, -6));
  let a2 = WP(e4, n2, [[0, 400], [t2.dur, 15]], 1.5);
  nF(e4, a2, `bp`, t2.f * 0.8, 2.5), tP(e4, a2, iP(4e-3, t2.dur, -4)), Z(i2, a2, 0, (t2.wet ?? 0.6) * 4);
  let o2 = Math.max(2, Math.round(e4.sr / (t2.f * r2.range(0.35, 0.55)))), s2 = KN(o2), c2 = 0;
  for (let e5 = 0; e5 < n2; e5++) {
    let t3 = s2[c2];
    s2[c2] = i2[e5] + t3 * 0.55, i2[e5] += t3 * 0.6, ++c2 >= o2 && (c2 = 0);
  }
  return i2;
}
function LF(e4, t2, n2, r2, i2) {
  let a2 = e4.length, o2 = i2.voiced ?? 1, s2 = i2.jitter ?? 0.02, c2 = i2.shimmer ?? 0.1, l2 = i2.rough ?? 0, u2 = i2.vibrato ?? 0, d2 = i2.vibRate ?? 5.5, f2 = i2.breath ?? 0.15, p2 = i2.growl ?? 0, m2 = i2.growlRate ?? 38, h2 = 0, g2 = 0, _2 = 1, v2 = 1, y2 = n2.next(), b2 = r2.at(0), x2 = n2.u32() | 1, S2 = 0;
  for (let i3 = 0; i3 < a2; i3++) {
    i3 & 15 || (b2 = r2.at(i3 / t2) * (1 + u2 * LP(y2))), y2 += d2 / t2;
    let a3 = b2 * _2 / t2;
    h2 += a3, h2 >= 1 && (--h2, g2++, _2 = 1 + s2 * n2.bi(), v2 = (1 - c2 * n2.next()) * (l2 > 0 && g2 & 1 ? 1 - l2 : 1));
    let C2 = h2, w2 = 2 * C2 - 1;
    C2 < a3 ? (C2 /= a3, w2 -= C2 + C2 - C2 * C2 - 1) : C2 > 1 - a3 && (C2 = (C2 - 1) / a3, w2 -= C2 * C2 + C2 + C2 + 1), x2 ^= x2 << 13, x2 ^= x2 >>> 17, x2 ^= x2 << 5;
    let T2 = (x2 | 0) * 4656612873e-19 * f2 * (0.4 + 0.6 * (1 - h2)), E2 = 1;
    p2 > 0 && (S2 += m2 * (1 + 0.15 * LP(i3 * 11e-5)) / t2, E2 = 1 - p2 * (0.5 + 0.5 * LP(S2))), e4[i3] = (-w2 * v2 * o2 + T2) * E2;
  }
}
function RF(e4, t2) {
  let n2 = KN(yP(e4, t2.dur));
  LF(n2, e4.sr, e4.r, new xP(t2.f0, true), t2), rF(e4, n2, t2.tilt ?? 2600);
  let r2 = aF(e4, n2, t2.vowels, t2.scale ?? 1, t2.bwMul ?? 1);
  return t2.drive && uF(r2, t2.drive), tP(e4, r2, t2.env), r2;
}
function zF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r;
  for (let a2 of t2.freqs) for (let o2 = 0; o2 < 2; o2++) zP(e4, n2, a2 * (1 + (o2 ? 1 : -1) * (t2.detune ?? 3e-3) * i2.range(0.5, 1.5)), `sine`, 1 / t2.freqs.length, i2.next(), r2);
  return t2.trem && XN(r2, SF(e4, n2, t2.trem), 0.7, 0.3), tP(e4, r2, t2.env), r2;
}
function BF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r, a2 = t2.t0 ?? 0, o2 = t2.t1 ?? t2.dur * 0.8;
  for (let s2 = 0; s2 < t2.count; s2++) {
    let s3 = i2.range(a2, o2), c2 = i2.log(t2.fLo, t2.fHi), l2 = (t2.amp ?? 1) * i2.range(0.3, 1), u2 = (t2.decay ?? 0.18) * i2.range(0.5, 1.5);
    GP(e4, n2, [{ f: c2, a: l2, d: u2, ph: i2.next() }, { f: c2 * 2.76, a: l2 * 0.3, d: u2 * 0.5, ph: i2.next() }], r2, Math.floor(s3 * e4.sr));
  }
  return r2;
}
function VF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = HP(e4, n2);
  if (nF(e4, r2, `lp`, t2.lp, 0.9), t2.bpF) {
    let i3 = VP(e4, n2);
    nF(e4, i3, `bp`, t2.bpF, 0.8), Z(r2, i3, 0, 0.35);
  }
  let i2 = t2.flicker ?? 0.6;
  if (i2 > 0) {
    let t3 = SF(e4, n2, 14);
    Z(t3, SF(e4, n2, 5), 0, 0.67), XN(r2, t3, 1 - i2 * 0.5, i2 * 0.3);
  }
  return tP(e4, r2, t2.env), r2;
}
function HF(e4, t2) {
  let n2 = yP(e4, t2.dur), r2 = KN(n2), i2 = e4.r, a2 = t2.t0 ?? 0;
  for (let o2 = 0; o2 < t2.count; o2++) {
    let s2 = Math.floor(a2 * e4.sr);
    if (s2 >= n2) break;
    let c2 = i2.log(t2.fLo ?? 900, t2.fHi ?? 3200), l2 = i2.range(0.35, 1) * (1 - o2 / t2.count * 0.5), u2 = (t2.decay ?? 0.035) * i2.range(0.6, 1.4);
    GP(e4, n2, [{ f: c2, a: l2, d: u2, ph: i2.next() }, { f: c2 * i2.range(2.2, 3.1), a: l2 * 0.5, d: u2 * 0.5, ph: i2.next() }, { f: c2 * i2.range(0.45, 0.6), a: l2 * 0.4, d: u2 * 1.2, ph: i2.next() }], r2, s2), Z(r2, wF(e4, c2 * 2.5, 15e-4), s2, l2 * 0.8);
    let d2 = i2.chance(t2.bursty ?? 0.3) ? i2.range(0.04, 0.12) : i2.range(8e-3, 0.035);
    a2 += d2 * (t2.spread / 0.3);
  }
  return r2;
}
function UF(e4, t2, n2, r2 = 0.35) {
  return ZP(e4, yP(e4, n2), t2, { t60: r2, bright: 0.6, hard: 0.9, pick: 0.12, detune: 3 });
}
function WF(e4, t2) {
  let n2 = KN(yP(e4, t2.dur)), r2 = t2.size;
  Z(n2, $(e4, { dur: 0.06, color: `white`, att: 4e-4, curve: -7, hp: 400, lp: 9e3 }), 0, (t2.crack ?? 0.8) * 1.2);
  let [i2, a2] = t2.subF ?? [95 - r2 * 25, 32 - r2 * 6];
  Z(n2, CF(e4, { f0: i2, f1: a2, dur: 0.5 + r2 * 0.9, sweep: 0.25 + r2 * 0.35, curve: -4, drive: 1.6, h2: 0.25 }), 0, 1);
  let o2 = Math.min(t2.dur, 0.7 + r2 * 1.6);
  if (Z(n2, $(e4, { dur: o2, color: `brown`, lp: [[0, t2.bodyLp ?? 3500], [0.08, 1600], [o2, 120, -2]], env: [[0, 0], [6e-3, 1], [0.12, 0.55, -2], [o2, 0, -3]] }), 0, 1.6), Z(n2, $(e4, { dur: 0.35 + r2 * 0.3, color: `pink`, bp: [[0, 1800], [0.3, 500]], q: 0.7, att: 2e-3, curve: -4 }), 0, 0.7), t2.roar) {
    let i3 = Math.min(t2.dur, 0.6 + r2);
    Z(n2, VF(e4, { dur: i3, lp: [[0, 2500], [i3, 400]], env: [[0, 0], [0.05, 1], [i3, 0, -3]], flicker: 0.7 }), Math.floor(0.01 * e4.sr), t2.roar * 0.7);
  }
  return t2.debris && Z(n2, kF(e4, { dur: t2.dur, count: Math.round(14 + r2 * 30), t0: 0.08, spread: 0.25 + r2 * 0.35, fLo: 500, fHi: 4200, decay: 0.03, amp: 0.5, fall: 2.2 }), 0, t2.debris), dF(n2, 1.2);
}
function GF(e4, t2, n2 = 0.12, r2 = 2.2) {
  let i2 = zP(e4, yP(e4, n2), [[0, t2], [0.03, t2 * r2, -2], [n2, t2 * r2 * 1.05]]);
  return tP(e4, i2, [[0, 0], [2e-3, 1], [n2, 0, -6]]), Z(i2, wF(e4, Math.min(e4.sr * 0.4, t2 * 3), 2e-3), 0, 0.3), i2;
}
function KF(e4, t2 = 0.16, n2 = 320) {
  let r2 = yP(e4, t2), i2 = e4.r, a2 = zP(e4, r2, [[0, n2 * 0.8], [t2, n2 * 1.6, 2]], `tri`);
  return nF(e4, a2, `bp`, [[0, 500], [t2, 1300 * i2.range(0.9, 1.1)]], 4), tP(e4, a2, [[0, 0], [0.015, 1], [t2, 0, -3]]), Z(a2, GF(e4, i2.range(500, 800), Math.min(t2, 0.1), 1.8), Math.floor(t2 * 0.4 * e4.sr), 0.3), a2;
}
var qF, JF, YF, XF = t((() => {
  CP(), tF(), cF(), bF(), qF = (e4, t2, n2 = `white`) => n2 === `pink` ? HP(e4, t2) : n2 === `brown` ? UP(e4, t2) : VP(e4, t2), JF = [1, 1.73, 2.33, 3.01, 3.88, 4.62], YF = [1, 0.75, 0.55, 0.4, 0.24, 0.14];
}));
function ZF(e4, t2, n2, r2, i2, a2 = 1.2, o2 = 1) {
  let s2 = rI.map((t3, r3) => ({ f: n2 * t3 * (1 + e4.r.bi() * 2e-3), a: i2 * iI[r3] * o2 ** (r3 * 0.5), d: a2 / (1 + r3 * 0.7), ph: 0 }));
  s2.push({ f: n2 * 1.0025, a: i2 * 0.3, d: a2 * 0.9, ph: 0.25 }), GP(e4, t2.length, s2, t2, Math.floor(r2 * e4.sr));
}
function QF(e4, t2, n2, r2, i2, a2 = 0.3) {
  let o2 = aI.map((t3, r3) => ({ f: n2 * t3 * (1 + e4.r.bi() * 6e-3), a: i2 * oI[r3], d: a2 / (1 + r3 * 0.6), ph: e4.r.next() }));
  GP(e4, t2.length, o2, t2, Math.floor(r2 * e4.sr));
}
function $F(e4, t2, n2, r2, i2, a2 = 0.7, o2 = 4e-3) {
  let s2 = [];
  sI.forEach((t3, r3) => {
    let c2 = a2 / (1 + r3 * 0.25);
    s2.push({ f: n2 * t3 * (1 + e4.r.bi() * 0.01), a: i2 * cI[r3], d: c2, ph: e4.r.next() }), s2.push({ f: n2 * t3 * (1 + o2) * (1 + e4.r.bi() * 5e-3), a: i2 * cI[r3] * 0.45, d: c2 * 0.9, ph: e4.r.next() });
  }), GP(e4, t2.length, s2, t2, Math.floor(r2 * e4.sr));
}
function eI(e4, t2, n2, r2, i2, a2 = 0.06) {
  GP(e4, t2.length, [{ f: n2, a: i2, d: a2, ph: 0 }, { f: n2 * 2.57, a: i2 * 0.5, d: a2 * 0.6, ph: 0.3 }, { f: n2 * 4.1, a: i2 * 0.25, d: a2 * 0.4, ph: 0.6 }, { f: n2 * 0.62, a: i2 * 0.4, d: a2 * 1.4, ph: 0.1 }], t2, Math.floor(r2 * e4.sr));
}
function tI(e4, t2, n2, r2, i2 = 0.4, a2 = 1) {
  return gF(e4, t2, { t60: n2, wet: r2, damp: i2, size: a2, stereo: true, tail: Math.min(1.6, n2 * 0.5) });
}
function nI(e4, t2, n2, r2, i2 = 0.45, a2 = 1) {
  return gF(e4, t2, { t60: n2, wet: r2, damp: i2, size: a2, stereo: false, tail: Math.min(1.2, n2 * 0.45) })[0];
}
var rI, iI, aI, oI, sI, cI, lI, uI = t((() => {
  tF(), bF(), rI = [1, 2, 2.99, 4.07, 5.2, 6.4], iI = [1, 0.55, 0.32, 0.22, 0.12, 0.07], aI = [1, 2.32, 4.25, 6.63, 9.38], oI = [1, 0.55, 0.4, 0.25, 0.12], sI = [1, 2.32, 3.86, 5.12, 6.73, 8.21, 9.9], cI = [0.6, 1, 0.8, 0.6, 0.45, 0.35, 0.25], lI = (e4, t2) => e4 * 2 ** (t2 / 12);
}));
function dI(e4, t2, n2, r2) {
  return fP(e4, [pP(e4, t2, n2)], { rms: r2, trim: false, tail: 0, keepDc: true })[0];
}
function fI(e4, t2) {
  let n2 = e4 === `w` ? 24e3 : e4 === `p` ? 22050 : 8e3, r2 = GN(n2, t2), i2 = Math.round(((e4 === `w` ? 2.6 : e4 === `p` ? 4.4 : 4) + 0.3) * n2), a2 = e4 === `w` ? VP(r2, i2) : e4 === `p` ? HP(r2, i2) : UP(r2, i2);
  return e4 === `b` && rF(r2, a2, 900), { chans: [dI(r2, a2, 0.3, 0.25)], sr: n2, loop: true };
}
function pI(e4, t2) {
  let n2 = 22050, r2 = GN(n2, e4), i2 = 0.25, a2 = Math.round((t2 + i2) * n2), o2 = KN(a2), s2 = WP(r2, a2, 32, 2.6);
  nF(r2, s2, `bp`, 2900, 0.8), Z(o2, s2, 0, 2.2);
  let c2 = WP(r2, a2, 7, 1.6);
  nF(r2, c2, `bp`, 1150, 1.6), Z(o2, c2, 0, 2.4);
  for (let e5 = 0; e5 < Math.round(t2 * 0.7); e5++) {
    let e6 = r2.r.range(0, t2);
    aP(r2, o2, $(r2, { dur: 0.03, bp: r2.r.range(700, 1600), q: 1.2, att: 3e-4, curve: -6 }), e6, r2.r.range(0.5, 1));
  }
  let l2 = HP(r2, a2);
  nF(r2, l2, `lp`, 260, 0.7), XN(l2, SF(r2, a2, 1.3), 0.6, 0.4), Z(o2, l2, 0, 1.2);
  let u2 = VP(r2, a2);
  return nF(r2, u2, `hp`, 3500), XN(u2, SF(r2, a2, 3), 0.5, 0.5), Z(o2, u2, 0, 0.05), { chans: [dI(r2, o2, i2, 0.18)], sr: n2, loop: true };
}
function mI(e4) {
  let t2 = 22050, n2 = GN(t2, e4), r2 = 3.6, i2 = 0.2, a2 = Math.round((r2 + i2) * t2), o2 = [];
  for (let e5 = 0; e5 < 2; e5++) {
    let e6 = KN(a2), s2 = WP(n2, a2, 260, 2.2);
    nF(n2, s2, `bp`, 3800, 0.6), Z(e6, s2, 0, 2.5);
    let c2 = WP(n2, a2, 45, 1.8);
    nF(n2, c2, `bp`, 1500, 1.4), Z(e6, c2, 0, 1.6);
    for (let i3 = 0; i3 < 14; i3++) {
      let i4 = n2.r.range(1400, 3800), a3 = zP(n2, Math.round(0.05 * t2), [[0, i4], [0.012, i4 * 1.7, -2]]);
      tP(n2, a3, iP(8e-4, 0.045, -6)), Z(e6, a3, Math.floor(n2.r.range(0, r2) * t2), n2.r.range(0.05, 0.15));
    }
    o2.push(dI(n2, e6, i2, 0.12));
  }
  return { chans: o2, sr: t2, loop: true };
}
function hI(e4) {
  let t2 = 32e3, n2 = GN(t2, e4), r2 = Q(n2, 0.25);
  Z(r2, $(n2, { dur: 0.05, bp: n2.r.range(2500, 4500), q: 0.9, att: 5e-4, curve: -5 }), 0, 0.8);
  let i2 = n2.r.range(1200, 2600), a2 = zP(n2, Math.round(0.08 * t2), [[0, i2], [0.02, i2 * 1.9, -2]]);
  return tP(n2, a2, iP(1e-3, 0.07, -6)), Z(r2, a2, Math.round(4e-3 * t2), 0.4), { chans: fP(n2, [r2], { rms: 0.15 }), sr: t2, loop: false };
}
function gI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4);
  return { chans: fP(n2, [NF(n2, { dur: 1.4, rate: [[0, 9], [0.7, 26], [1.4, 12]], jitter: 0.4, res: [{ f: 150, d: 0.06, a: 1 }, { f: 330, d: 0.05, a: 0.7 }, { f: 610, d: 0.04, a: 0.45 }, { f: 900, d: 0.03, a: 0.25 }], env: [[0, 0], [0.4, 1, 2], [1, 0.8], [1.4, 0, -3]], noise: 0.25 })], { rms: 0.16 }), sr: t2, loop: false };
}
function _I(e4) {
  let t2 = 24e3, n2 = GN(t2, e4), r2 = Q(n2, 1), i2 = 0.01, a2 = n2.r.int(8, 14);
  for (let e5 = 0; e5 < a2; e5++) {
    let o2 = n2.r.range(0.3, 1) * (1 - e5 / a2 * 0.6);
    GP(n2, r2.length, [{ f: n2.r.range(1600, 3200), a: o2, d: n2.r.range(0.06, 0.16), ph: n2.r.next() }, { f: n2.r.range(3800, 6500), a: o2 * 0.5, d: n2.r.range(0.03, 0.08), ph: n2.r.next() }], r2, Math.floor(i2 * t2)), Z(r2, wF(n2, 5e3, 2e-3), Math.floor(i2 * t2), o2 * 0.4), i2 += n2.r.chance(0.25) ? n2.r.range(0.06, 0.14) : n2.r.range(0.015, 0.045);
  }
  return { chans: fP(n2, [r2], { rms: 0.14 }), sr: t2, loop: false };
}
function vI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4), r2 = Q(n2, 1.6), i2 = n2.r.int(2, 3), a2 = 0.02;
  for (let e5 = 0; e5 < i2; e5++) {
    let e6 = n2.r.range(330, 420), i3 = n2.r.range(0.11, 0.15);
    Z(r2, RF(n2, { dur: i3, f0: [[0, e6 * 1.15], [i3, e6 * 0.8]], vowels: [[0, `a`], [i3, `uh`]], scale: 1.1, rough: 0.5, breath: 0.5, jitter: 0.05, drive: 2.2, env: iP(6e-3, i3 - 6e-3, -3) }), Math.floor(a2 * t2), 1), a2 += i3 + n2.r.range(0.18, 0.3);
  }
  return rF(n2, r2, 1800), { chans: fP(n2, [_F(n2, r2, { t60: 1.8, wet: 0.45, damp: 0.6 })], { rms: 0.14 }), sr: t2, loop: false };
}
function yI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4), r2 = Q(n2, 2), i2 = n2.r.range(330, 380), a2 = (e5, a3, o2) => {
    Z(r2, RF(n2, { dur: a3, f0: [[0, i2 * 0.92], [a3 * 0.3, i2], [a3, i2 * 0.9]], vowels: [[0, `u`]], breath: 0.2, jitter: 4e-3, scale: 1.3, tilt: 1200, env: [[0, 0], [a3 * 0.25, 1, 2], [a3, 0, -3]] }), Math.floor(e5 * t2), o2);
  };
  return a2(0.02, 0.35, 1), a2(0.55, 0.18, 0.7), a2(0.8, 0.45, 0.9), { chans: fP(n2, [_F(n2, r2, { t60: 2, wet: 0.45, damp: 0.6 })], { rms: 0.12 }), sr: t2, loop: false };
}
function bI(e4) {
  let t2 = 22050, n2 = GN(t2, e4), r2 = Q(n2, 1.6);
  return $F(n2, r2, n2.r.range(780, 900), 0, 0.6, 1.1, 3e-3), Z(r2, $(n2, { dur: 8e-3, hp: 1500, att: 2e-4 }), 0, 0.8), Z(r2, CF(n2, { f0: 200, f1: 120, dur: 0.05 }), 0, 0.3), rF(n2, r2, 3500), { chans: fP(n2, [_F(n2, r2, { t60: 1.6, wet: 0.4, damp: 0.55 })], { rms: 0.13 }), sr: t2, loop: false };
}
function xI(e4, t2, n2, r2, i2) {
  return { name: e4, weight: n2, run: () => {
    let e5 = [];
    for (let n3 = 0; n3 < t2; n3++) e5.push(r2(i2 + n3 * 7907));
    return e5;
  } };
}
function SI() {
  return [{ name: `noiseW`, weight: 0.6, run: () => [fI(`w`, 71)] }, { name: `noiseP`, weight: 0.6, run: () => [fI(`p`, 72)] }, { name: `noiseB`, weight: 0.2, run: () => [fI(`b`, 73)] }, { name: `crackleA`, weight: 1, run: () => [pI(81, 4.3)] }, { name: `crackleB`, weight: 0.8, run: () => [pI(82, 3.1)] }, { name: `rainDrops`, weight: 1.5, run: () => [mI(91)] }, xI(`splash`, 3, 0.2, hI, 95), xI(`stoneCreak`, 2, 0.4, gI, 101), xI(`chain`, 2, 0.4, _I, 111), xI(`dog`, 2, 0.5, vI, 121), xI(`owl`, 1, 0.4, yI, 131), xI(`anvil`, 2, 0.4, bI, 141)];
}
var CI = t((() => {
  CP(), tF(), cF(), bF(), XF(), uI();
}));
function wI(e4) {
  return { f0: bP(e4), bw: 38, bwScale: 1, amp: (e5, t2) => (e5 % 2 ? 1 : 0.72) * e5 ** -1.1 * Math.exp(-((t2 / 1900) ** 2)) * (1 + 0.6 * jP(t2, 300, 200)) };
}
function TI(e4, t2) {
  let n2 = bP(e4), r2 = e4 >= 57, i2 = t2 ? [340, 760, 2400, 3200] : r2 ? [820, 1200, 2900, 3500] : [680, 1080, 2550, 3300], a2 = t2 ? [110, 140, 260, 300] : [140, 170, 260, 300], o2 = t2 ? [1, 0.35, 0.07, 0.04] : [1, 0.62, 0.24, 0.14];
  return { f0: n2, bw: r2 ? 40 : 46, bwScale: 0.8, maxF: 7e3, noise: [{ f: 2900, w: 1100, a: 0.02 }], amp: (e5, t3) => {
    let n3 = 0.025;
    for (let e6 = 0; e6 < 4; e6++) n3 += o2[e6] * jP(t3, i2[e6], a2[e6]);
    return n3 * e5 ** -0.45;
  } };
}
function EI(e4) {
  return { f0: bP(e4), bw: 17, bwScale: 0.9, maxF: 9e3, amp: (e5, t2) => {
    let n2 = 0.45 + 0.7 * jP(t2, 290, 140) + 0.5 * jP(t2, 540, 220) + 0.6 * jP(t2, 1150, 450) + 0.45 * jP(t2, 2700, 900);
    return 1 / e5 * n2 * Math.exp(-((t2 / 5200) ** 2));
  } };
}
function DI(e4) {
  let t2 = bP(e4), n2 = [1, 0.3, 0.14, 0.05, 0.03, 0.015, 0.01];
  return { f0: t2, bw: 6, bwScale: 2.2, maxF: 8e3, amp: (e5) => n2[e5 - 1] ?? 0, noise: [{ f: t2, w: t2 * 0.3, a: 0.03 }, { f: t2 * 2.2, w: t2 * 1.2, a: 0.02 }, { f: 3200, w: 1800, a: 0.014 }] };
}
function OI(e4) {
  return { f0: bP(e4), bw: 24, bwScale: 1, stretch: 9e-4, maxF: 3e3, amp: (e5, t2) => e5 ** -0.8 * Math.exp(-((t2 / 650) ** 2)) * (e5 % 3 == 0 ? 1.3 : 1) };
}
function kI(e4, t2, n2, r2, i2, a2, o2 = 1) {
  let s2 = [];
  for (let c2 = 0; c2 < t2.length; c2 += 2) {
    let l2 = t2.slice(c2, c2 + 2);
    s2.push({ inst: e4, weight: r2 / 16e3, run() {
      return OP(n2, r2, l2.map(i2), a2 + c2 * 7919, 0.8 * o2).map((e5, t3) => ({ root: l2[t3], chans: [e5], sr: n2, loop: true }));
    } });
  }
  return s2;
}
function AI(e4, t2, n2 = 0.2, r2 = true) {
  return fP(e4, [t2], { rms: n2, trim: r2, tail: 0.02 });
}
function jI(e4, t2) {
  let n2 = 22050, r2 = GN(n2, t2), i2 = bP(e4), a2 = Math.max(2, Math.min(3.8, 3.8 - (e4 - 38) * 0.055)), o2 = ZP(r2, Math.round(a2 * n2), i2, { t60: a2 * 0.9, bright: 0.12, hard: 0.42, pick: 0.17, detune: 0.8 }), s2 = qN(o2);
  nF(r2, s2, `bp`, 105, 4);
  let c2 = qN(o2);
  return nF(r2, c2, `bp`, 215, 5), Z(o2, s2, 0, 0.6), Z(o2, c2, 0, 0.35), Z(o2, $(r2, { dur: 0.012, color: `pink`, lp: 2500, att: 8e-4 }), 0, 0.12), nF(r2, o2, `lp`, 5200, 0.6), { root: e4, chans: AI(r2, o2, 0.2), sr: n2, loop: false };
}
function MI(e4, t2, n2, r2, i2) {
  let a2 = GN(r2, t2), o2 = bP(e4), s2 = Math.round(n2 * r2), c2 = KN(s2), l2 = i2 ? [1, 2, 2.76, 4.07, 5.4, 6.8] : [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011, 4.166, 5.433], u2 = i2 ? [1, 0.45, 0.35, 0.18, 0.12, 0.06] : [0.55, 0.8, 0.6, 0.32, 0.9, 0.3, 0.22, 0.2, 0.12, 0.07], d2 = i2 ? [n2 * 0.9, n2 * 0.45, n2 * 0.3, n2 * 0.2, n2 * 0.12, n2 * 0.08] : [n2, n2 * 0.8, n2 * 0.6, n2 * 0.5, n2 * 0.42, n2 * 0.3, n2 * 0.25, n2 * 0.2, n2 * 0.12, n2 * 0.08], f2 = [];
  return l2.forEach((e5, t3) => {
    f2.push({ f: o2 * e5, a: u2[t3], d: d2[t3], ph: a2.r.next() }), f2.push({ f: o2 * e5 * (1 + (i2 ? 12e-4 : 22e-4)), a: u2[t3] * 0.4, d: d2[t3] * 0.9, ph: a2.r.next() });
  }), GP(a2, s2, f2, c2, 0), Z(c2, $(a2, { dur: i2 ? 6e-3 : 0.012, bp: i2 ? 4e3 : 1800, q: 0.8, att: 5e-4 }), 0, i2 ? 0.25 : 0.4), { root: e4, chans: AI(a2, c2, 0.16), sr: r2, loop: false };
}
function NI(e4, t2) {
  let n2 = 22050, r2 = GN(n2, t2), i2 = bP(e4), a2 = 1.5, o2 = Math.round(a2 * n2), s2 = KN(o2);
  for (let e5 of [-7, 0, 6]) zP(r2, o2, i2 * 2 ** (e5 / 1200), `saw`, 0.4, r2.r.next(), s2);
  return zP(r2, o2, i2 / 2, `square`, 0.25, 0, s2, 0, 0.42), nF(r2, s2, `lp`, [[0, 160], [0.045, 1900, -2], [0.35, 750], [a2, 420]], 1.3), XN(s2, zP(r2, o2, 29, `sine`), 0.85, 0.15), tP(r2, s2, [[0, 0], [0.018, 1], [0.3, 0.62, -2], [1, 0.45], [a2, 0, -3]]), Z(s2, $(r2, { dur: 0.05, color: `pink`, bp: 900, q: 1, att: 3e-3 }), 0, 0.2), uF(s2, 1.6), { root: e4, chans: AI(r2, s2, 0.22), sr: n2, loop: false };
}
function PI(e4, t2) {
  let n2 = 24e3, r2 = GN(n2, e4), i2 = Math.round(1.4 * n2), a2 = KN(i2), o2 = [1, 1.59, 2.14, 2.3, 2.65, 2.92, 3.16, 3.5], s2 = [1, 0.5, 0.35, 0.3, 0.22, 0.18, 0.12, 0.1], c2 = [1.1, 0.55, 0.4, 0.35, 0.3, 0.25, 0.2, 0.18];
  return GP(r2, i2, o2.map((e5, n3) => ({ f: t2 * e5 * (1 + r2.r.bi() * 0.01), a: s2[n3], d: c2[n3], ph: 0.25 })), a2, 0), Z(a2, CF(r2, { f0: t2 * 1.9, f1: t2, dur: 0.25, sweep: 0.05, curve: -3 }), 0, 0.9), Z(a2, $(r2, { dur: 0.012, color: `pink`, lp: 2200, att: 5e-4 }), 0, 0.8), Z(a2, $(r2, { dur: 0.05, bp: 650, q: 1.2, att: 1e-3 }), 0, 0.4), uF(a2, 1.3), { root: 60, chans: AI(r2, a2, 0.24), sr: n2, loop: false };
}
function FI(e4) {
  let t2 = 32e3, n2 = GN(t2, e4), r2 = Q(n2, 0.25), i2 = n2.r.range(780, 900);
  return GP(n2, r2.length, [{ f: i2, a: 1, d: 0.06 }, { f: i2 * 2.4, a: 0.6, d: 0.04, ph: 0.3 }, { f: i2 * 3.9, a: 0.35, d: 0.025, ph: 0.6 }], r2, 0), Z(r2, wF(n2, 3500, 3e-3), 0, 0.8), { root: 60, chans: AI(n2, r2, 0.2), sr: t2, loop: false };
}
function II(e4) {
  let t2 = 32e3, n2 = GN(t2, e4), r2 = Q(n2, 0.6), i2 = n2.r.range(135, 160);
  return GP(n2, r2.length, [1, 1.59, 2.14, 2.65].map((e5, t3) => ({ f: i2 * e5, a: [1, 0.5, 0.3, 0.2][t3], d: [0.35, 0.2, 0.15, 0.1][t3], ph: 0.25 })), r2, 0), Z(r2, $(n2, { dur: 0.04, bp: n2.r.range(1600, 2400), q: 0.8, att: 5e-4, curve: -5 }), 0, 0.9), Z(r2, $(n2, { dur: 0.015, hp: 4e3, att: 3e-4 }), 0, 0.3), { root: 60, chans: AI(n2, r2, 0.2), sr: t2, loop: false };
}
function LI(e4) {
  let t2 = 24e3, n2 = GN(t2, e4), r2 = Q(n2, 0.9), i2 = n2.r.range(92, 120);
  return GP(n2, r2.length, [1, 1.5, 1.98, 2.44].map((e5, t3) => ({ f: i2 * e5, a: [1, 0.45, 0.25, 0.15][t3], d: [0.6, 0.35, 0.25, 0.18][t3], ph: 0.25 })), r2, 0), Z(r2, CF(n2, { f0: i2 * 1.6, f1: i2, dur: 0.15, sweep: 0.03 }), 0, 0.6), Z(r2, $(n2, { dur: 0.02, color: `pink`, lp: 3e3, att: 5e-4 }), 0, 0.5), { root: 60, chans: AI(n2, r2, 0.22), sr: t2, loop: false };
}
function RI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4), r2 = Q(n2, 0.9);
  return Z(r2, CF(n2, { f0: 70, f1: 40, dur: 0.18, sweep: 0.06, curve: -4, drive: 1.4, h2: 0.3 }), 0, 1), aP(n2, r2, CF(n2, { f0: 62, f1: 38, dur: 0.16, sweep: 0.05, curve: -4, drive: 1.3, h2: 0.25 }), 0.26, 0.65), rF(n2, r2, 240), { root: 60, chans: AI(n2, r2, 0.2), sr: t2, loop: false };
}
function zI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4), r2 = Q(n2, 3.2);
  return Z(r2, CF(n2, { f0: 62, f1: 27, dur: 2.8, sweep: 1.1, curve: -3, drive: 1.4, h2: 0.2 }), 0, 1), Z(r2, AF(n2, { dur: 3, lp: [[0, 500], [3, 70]], env: [[0, 0], [0.01, 1], [3, 0, -3]] }), 0, 1.2), Z(r2, $(n2, { dur: 0.03, color: `pink`, lp: 3e3, att: 5e-4 }), 0, 0.4), { root: 60, chans: AI(n2, r2, 0.2), sr: t2, loop: false };
}
function BI(e4) {
  let t2 = 16e3, n2 = GN(t2, e4), r2 = Math.round(3 * t2), i2 = VP(n2, r2);
  $N(i2, SF(n2, r2, 18), 0.5, 0.5);
  let a2 = KN(r2);
  for (let e5 = 0; e5 < 12; e5++) {
    let e6 = n2.r.log(260, 4200), t3 = qN(i2);
    nF(n2, t3, `bp`, e6, n2.r.range(40, 90)), Z(a2, t3, 0, n2.r.range(0.4, 1) * (e6 < 800 ? 1 : 0.7));
  }
  return tP(n2, a2, [[0, 0], [n2.r.range(0.6, 1.1), 1, 2], [3, 0, -2.5]]), { root: 60, chans: AI(n2, a2, 0.18), sr: t2, loop: false };
}
function VI(e4) {
  let t2 = 32e3, n2 = GN(t2, e4), r2 = Q(n2, 0.35), i2 = n2.r.range(700, 1300), a2 = zP(n2, Math.round(0.12 * t2), [[0, i2], [0.025, i2 * 2.3, -2], [0.12, i2 * 2.4]]);
  return tP(n2, a2, [[0, 0], [2e-3, 1], [0.12, 0, -6]]), Z(r2, a2, 0, 1), Z(r2, wF(n2, 4e3, 2e-3), 0, 0.3), { root: 60, chans: AI(n2, r2, 0.2), sr: t2, loop: false };
}
function HI(e4) {
  let t2 = 24e3, n2 = GN(t2, e4), r2 = 2.6, i2 = VP(n2, Math.round(r2 * t2));
  nF(n2, i2, `bp`, [[0, 2500], [r2, 8e3, 2]], 0.7);
  let a2 = HP(n2, i2.length);
  return nF(n2, a2, `hp`, 6e3), Z(i2, a2, 0, 0.5), tP(n2, i2, [[0, 0], [r2 - 0.02, 1, 4], [r2, 0]]), { root: 60, chans: fP(n2, [i2], { rms: 0.15, trim: false, tail: 4e-3 }), sr: t2, loop: false };
}
function UI(e4, t2, n2, r2, i2) {
  return { inst: e4, weight: n2, run: () => {
    let e5 = [];
    for (let n3 = 0; n3 < t2; n3++) e5.push(r2(i2 + n3 * 104729, n3));
    return e5;
  } };
}
function WI() {
  let e4 = [];
  e4.push(...kI(`choir`, GI.choir, 22050, 65536, (e5) => TI(e5, false), 11)), e4.push(...kI(`pad`, GI.pad, 16e3, 65536, wI, 23)), e4.push(...kI(`strings`, GI.strings, 22050, 65536, EI, 37)), e4.push(...kI(`choirO`, GI.choirO, 22050, 65536, (e5) => TI(e5, true), 41)), e4.push(...kI(`flute`, GI.flute, 24e3, 32768, DI, 53)), e4.push(...kI(`drone`, GI.drone, 16e3, 65536, OI, 67));
  for (let t2 of GI.guitar) e4.push({ inst: `guitar`, weight: 1.5, run: () => [jI(t2, 1e3 + t2)] });
  return e4.push({ inst: `bell`, weight: 1.5, run: () => [MI(38, 2038, 6.5, 16e3, false)] }), e4.push({ inst: `bell`, weight: 1.2, run: () => [MI(50, 2050, 5, 16e3, false)] }), e4.push({ inst: `chime`, weight: 0.8, run: () => GI.chime.map((e5, t2) => MI(e5, 3e3 + e5, t2 ? 1.8 : 2.4, 24e3, true)) }), e4.push({ inst: `brass`, weight: 1, run: () => GI.brass.map((e5) => NI(e5, 4e3 + e5)) }), e4.push(UI(`taiko`, 3, 1, (e5, t2) => PI(e5, [58, 64, 70][t2]), 5e3)), e4.push(UI(`rim`, 2, 0.2, (e5) => FI(e5), 5100)), e4.push(UI(`frame`, 3, 0.4, (e5) => II(e5), 5200)), e4.push(UI(`tom`, 2, 0.4, (e5) => LI(e5), 5300)), e4.push(UI(`heart`, 2, 0.3, (e5) => RI(e5), 5400)), e4.push(UI(`boom`, 2, 1.2, (e5) => zI(e5), 5500)), e4.push(UI(`scrape`, 2, 1.5, (e5) => BI(e5), 5600)), e4.push(UI(`drip`, 4, 0.3, (e5) => VI(e5), 5700)), e4.push(UI(`swell`, 1, 0.5, (e5) => HI(e5), 5800)), e4;
}
var GI, KI = t((() => {
  CP(), tF(), cF(), bF(), IP(), XF(), GI = { guitar: [38, 45, 52, 59, 66, 73], pad: [38, 45, 52, 59, 66], choir: [43, 50, 57, 64, 71], choirO: [48, 60, 72], strings: [38, 45, 52, 59, 66, 73], flute: [67, 74, 81], drone: [26, 33], bell: [38, 50], chime: [72, 84], brass: [36, 43, 50] };
}));
function qI(e4, t2) {
  let n2 = e4.r, r2 = n2.int(t2.syl[0], t2.syl[1]), i2 = 0.01, a2 = [], o2 = [], s2 = [[0, 0]], c2 = [];
  for (let e5 = 0; e5 < r2; e5++) {
    let l3 = n2.range(t2.sd[0], t2.sd[1]), u2 = n2.range(t2.f[0], t2.f[1]) * (1 + (t2.rise ?? 0) * (e5 / Math.max(1, r2 - 1)));
    a2.push([i2, u2 * n2.range(0.88, 1.1)], [i2 + l3, u2 * n2.range(0.78, 1.22)]), o2.push([i2, n2.pick(t2.vowels)]), s2.push([i2, 0], [i2 + 8e-3, n2.range(0.6, 1)], [i2 + l3 - 0.012, n2.range(0.45, 0.85)], [i2 + l3, 0]), n2.chance(0.45) && c2.push(i2), i2 += l3 + n2.range(t2.gap[0], t2.gap[1]);
  }
  let l2 = RF(e4, { dur: i2 + 0.05, f0: a2, vowels: o2, env: s2, scale: t2.scale, rough: t2.rough, breath: t2.breath ?? 0.3, jitter: 0.05, shimmer: 0.2, drive: t2.drive ?? 2, tilt: 3800 });
  for (let t3 of c2) aP(e4, l2, $(e4, { dur: 0.012, bp: n2.range(2500, 4500), q: 1.2, att: 5e-4 }), t3 - 4e-3, 0.35);
  return l2;
}
var JI, YI, XI, ZI = t((() => {
  CP(), tF(), cF(), bF(), XF(), uI(), JI = (e4, t2 = 6, n2 = 0.1) => ({ lvl: e4, send: n2, cap: t2, prio: 6, bus: `sfx` }), YI = (e4, t2 = 4, n2 = 0.15, r2 = 3) => ({ lvl: e4, send: n2, cap: t2, prio: r2, bus: `sfx` }), XI = { swingLight: { r: { sr: 24e3, dur: 0.32, v: 3, render(e4) {
    let t2 = Q(e4, 0.32), n2 = e4.r.range(0.17, 0.24), r2 = n2 * e4.r.range(0.38, 0.5);
    return Z(t2, TF(e4, { dur: n2, peak: r2, f0: 500, fp: e4.r.range(1800, 2600), f1: 700, q: 1.6, body: 0.3, ring: e4.r.chance(0.5) ? e4.r.range(2600, 3400) : 0, ringAmt: 0.03 }), 0, 1), Z(t2, TF(e4, { dur: n2 * 0.9, peak: r2 * 1.1, f0: 900, fp: e4.r.range(3200, 4200), f1: 1500, q: 2.5, color: `white` }), 0, 0.25), t2;
  } }, m: { lvl: 0.42, send: 0.04, cap: 4, prio: 4, bus: `sfx` } }, swingHeavy: { r: { sr: 24e3, dur: 0.5, v: 3, render(e4) {
    let t2 = Q(e4, 0.5), n2 = e4.r.range(0.32, 0.4), r2 = n2 * 0.45;
    Z(t2, TF(e4, { dur: n2, peak: r2, f0: 230, fp: e4.r.range(1e3, 1400), f1: 300, q: 1.1, body: 0.8 }), 0, 1);
    let i2 = zP(e4, t2.length, [[0, 60], [r2, 85], [n2, 55]], `sine`, 0.5);
    return tP(e4, i2, [[0, 0], [r2, 1, 2], [n2 + 0.05, 0, -3]]), Z(t2, i2, 0, 0.6), t2;
  } }, m: { lvl: 0.5, send: 0.04, cap: 3, prio: 4, bus: `sfx` } }, hitFlesh: { r: { sr: 24e3, dur: 0.36, v: 3, render(e4) {
    let t2 = Q(e4, 0.36);
    return Z(t2, CF(e4, { f0: e4.r.range(118, 150), f1: e4.r.range(46, 58), dur: 0.17, sweep: 0.05, drive: 1.8, h2: 0.3 }), 0, 1), Z(t2, $(e4, { dur: 0.12, color: `pink`, lp: [[0, 2600], [0.08, 300]], att: 8e-4, curve: -5 }), 0, 0.9), aP(e4, t2, IF(e4, { dur: 0.2, f: e4.r.range(650, 1100), wet: 0.7 }), 3e-3, 0.5), Z(t2, fF($(e4, { dur: 0.035, bp: e4.r.range(2600, 3600), q: 0.9, att: 4e-4, curve: -6 }), 6, 2), 0, 0.32), Z(t2, wF(e4, 4e3, 3e-3), 0, 0.35), uF(t2, 1.3), t2;
  } }, m: JI(0.62) }, hitBone: { r: { sr: 24e3, dur: 0.32, v: 3, render(e4) {
    let t2 = Q(e4, 0.32);
    Z(t2, wF(e4, 3500, 4e-3), 0, 0.9);
    let n2 = e4.r.range(780, 1100);
    return GP(e4, t2.length, [{ f: n2, a: 1, d: 0.05 }, { f: n2 * 1.83, a: 0.7, d: 0.04, ph: 0.3 }, { f: n2 * 2.7, a: 0.5, d: 0.03, ph: 0.6 }, { f: n2 * 3.9, a: 0.3, d: 0.02, ph: 0.2 }], t2, 0), Z(t2, CF(e4, { f0: 210, f1: 120, dur: 0.06 }), 0, 0.5), Z(t2, HF(e4, { dur: 0.32, count: 4, spread: 0.08, t0: 0.03, fLo: 1400, fHi: 3500, decay: 0.02 }), 0, 0.4), Z(t2, $(e4, { dur: 0.03, bp: 2e3, q: 1.5 }), 0, 0.4), t2;
  } }, m: JI(0.58) }, hitMetal: { r: { sr: 24e3, dur: 1, v: 3, render(e4) {
    let t2 = Q(e4, 1);
    return Z(t2, $(e4, { dur: 0.012, hp: 1500, att: 2e-4, curve: -7 }), 0, 1), $F(e4, t2, e4.r.range(420, 560), 0, 0.5, 0.85, 5e-3), GP(e4, t2.length, [{ f: e4.r.range(3500, 5e3), a: 0.25, d: 0.4 }, { f: e4.r.range(5200, 7e3), a: 0.15, d: 0.25 }], t2, 0), Z(t2, CF(e4, { f0: 160, f1: 90, dur: 0.08 }), 0, 0.6), uF(t2, 1.2), t2;
  } }, m: JI(0.5, 4, 0.14) }, hitBlocked: { r: { sr: 24e3, dur: 0.6, v: 3, render(e4) {
    let t2 = Q(e4, 0.6);
    return eI(e4, t2, e4.r.range(290, 380), 0, 1, 0.15), $F(e4, t2, e4.r.range(1100, 1350), 0, 0.25, 0.35, 8e-3), Z(t2, CF(e4, { f0: 150, f1: 80, dur: 0.1, drive: 1.3 }), 0, 0.8), Z(t2, $(e4, { dur: 0.13, bp: 2500, q: 2, att: 0.01, curve: -3 }), 0, 0.3), Z(t2, wF(e4, 2600, 4e-3), 0, 0.6), t2;
  } }, m: JI(0.58, 4) }, critHit: { r: { sr: 32e3, dur: 0.7, v: 3, render(e4) {
    let t2 = Q(e4, 0.6);
    Z(t2, $(e4, { dur: 0.012, hp: 2500, att: 2e-4, curve: -8 }), 0, 1.4), aP(e4, t2, $(e4, { dur: 0.01, bp: 5200, q: 0.8, att: 2e-4, curve: -8 }), 4e-3, 0.9);
    let n2 = zP(e4, Math.round(0.022 * e4.sr), [[0, 3200], [0.022, 300]], `saw`, 0.3);
    return tP(e4, n2, iP(5e-4, 0.021, -4)), Z(t2, n2, 0, 1), Z(t2, CF(e4, { f0: 110, f1: 40, dur: 0.32, sweep: 0.08, drive: 2, h2: 0.3 }), 0, 1.1), Z(t2, $(e4, { dur: 0.18, color: `pink`, lp: [[0, 3e3], [0.1, 250]], att: 8e-4 }), 0, 0.9), Z(t2, fF($(e4, { dur: 0.05, bp: 2500, q: 0.8, att: 4e-4, curve: -6 }), 5, 2), 0, 0.5), GP(e4, t2.length, [{ f: e4.r.range(2400, 3e3), a: 0.12, d: 0.3 }, { f: e4.r.range(3600, 4200), a: 0.08, d: 0.2 }], t2, 0), uF(t2, 1.6), t2;
  } }, m: JI(0.78, 3, 0.14) }, playerHurt: { r: { sr: 22050, dur: 0.5, v: 3, render(e4) {
    let t2 = Q(e4, 0.5), n2 = e4.r.range(150, 200);
    return Z(t2, RF(e4, { dur: 0.32, f0: [[0, n2 * 1.1], [0.3, n2 * 0.85]], vowels: [[0, `uh`], [0.2, `a`]], breath: 0.45, voiced: 0.55, rough: 0.2, jitter: 0.03, env: iP(0.012, 0.28, -3), scale: 1.05, drive: 1.4 }), 0.01, 0.6), Z(t2, CF(e4, { f0: 120, f1: 58, dur: 0.11, drive: 1.5 }), 0, 0.7), Z(t2, $(e4, { dur: 0.06, color: `pink`, lp: 1300 }), 0, 0.6), t2;
  } }, m: { lvl: 0.5, send: 0.05, cap: 2, prio: 8, bus: `sfx`, gap: 0.12 } }, playerDeath: { r: { sr: 22050, dur: 2.4, v: 2, render(e4) {
    let t2 = Q(e4, 2.2);
    return Z(t2, RF(e4, { dur: 1.6, f0: [[0, 250], [0.25, 300], [1.1, 175], [1.55, 115]], vowels: [[0, `a`], [0.7, `o`], [1.3, `u`]], breath: 0.4, rough: 0.35, jitter: 0.03, vibrato: 0.02, drive: 1.5, env: [[0, 0], [0.05, 1], [0.9, 0.7], [1.55, 0, -3]] }), 0, 0.75), aP(e4, t2, CF(e4, { f0: 95, f1: 45, dur: 0.26, drive: 1.6 }), 1.25, 1), aP(e4, t2, $(e4, { dur: 0.2, color: `brown`, lp: 600 }), 1.25, 0.8), Z(t2, kF(e4, { dur: 2.2, count: 8, t0: 1.27, spread: 0.12, fLo: 500, fHi: 1800, decay: 0.03, amp: 0.4 }), 0, 1), t2;
  } }, m: { lvl: 0.68, send: 0.2, cap: 1, prio: 10, bus: `sfx` } }, lowLifeWarning: { r: { sr: 16e3, dur: 0.9, v: 2, render(e4) {
    let t2 = Q(e4, 0.9);
    return Z(t2, CF(e4, { f0: 82, f1: 48, dur: 0.17, sweep: 0.06, curve: -4, drive: 1.3, h2: 0.3 }), 0, 1), aP(e4, t2, CF(e4, { f0: 72, f1: 44, dur: 0.15, sweep: 0.05, curve: -4, drive: 1.2, h2: 0.25 }), 0.27, 0.7), rF(e4, t2, 280), t2;
  } }, m: { lvl: 0.45, send: 0, cap: 1, prio: 9, bus: `ui` } }, gutterkinAggro: { r: { sr: 24e3, dur: 1, v: 3, render(e4) {
    return qI(e4, { syl: [5, 9], f: [380, 650], sd: [0.05, 0.11], gap: [0.01, 0.04], scale: 1.38, rough: 0.3, vowels: [`i`, `e`, `a`, `ae`, `u`] });
  } }, m: YI(0.42, 3) }, gutterkinDeath: { r: { sr: 24e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8), n2 = e4.r.range(650, 780);
    return Z(t2, RF(e4, { dur: 0.6, f0: [[0, n2], [0.08, n2 * 1.18], [0.5, n2 * 0.42, -1]], vowels: [[0, `i`], [0.15, `a`], [0.45, `u`]], scale: 1.38, rough: 0.5, breath: 0.3, jitter: 0.05, drive: 2.5, env: [[0, 0], [0.02, 1], [0.35, 0.6], [0.6, 0, -3]] }), 0, 0.8), aP(e4, t2, IF(e4, { dur: 0.18, f: 700, wet: 0.5 }), 0.3, 0.3), aP(e4, t2, CF(e4, { f0: 140, f1: 70, dur: 0.1 }), 0.5, 0.6), t2;
  } }, m: YI(0.5, 3, 0.15, 4) }, gutterkinFlee: { r: { sr: 24e3, dur: 0.8, v: 2, render(e4) {
    return qI(e4, { syl: [4, 6], f: [450, 560], sd: [0.04, 0.07], gap: [8e-3, 0.025], rise: 0.6, scale: 1.42, rough: 0.2, vowels: [`i`, `e`, `i`, `ae`] });
  } }, m: YI(0.4, 2) }, shamanCast: { r: { sr: 24e3, dur: 0.95, v: 2, render(e4) {
    let t2 = Q(e4, 0.95), n2 = e4.r.range(240, 290);
    return Z(t2, RF(e4, { dur: 0.5, f0: [[0, n2], [0.3, n2 * 1.15], [0.45, n2 * 0.9]], vowels: [[0, `o`], [0.25, `a`]], scale: 1.3, rough: 0.4, breath: 0.5, vibrato: 0.03, vibRate: 7, drive: 1.8, env: [[0, 0], [0.05, 1], [0.35, 0.8], [0.5, 0, -3]] }), 0, 0.7), aP(e4, t2, $(e4, { dur: 0.45, color: `pink`, lp: [[0, 2400], [0.45, 600]], env: [[0, 0], [0.03, 1], [0.45, 0, -3]] }), 0.3, 0.8), aP(e4, t2, TF(e4, { dur: 0.3, peak: 0.08, f0: 400, fp: 1600, f1: 500, q: 0.9 }), 0.3, 0.5), t2;
  } }, m: YI(0.5, 3) }, shamanResurrect: { r: { sr: 24e3, dur: 2, v: 2, render(e4) {
    let t2 = Q(e4, 1.8);
    Z(t2, RF(e4, { dur: 1.4, f0: [[0, 200], [1.2, 380, 1], [1.4, 360]], vowels: [[0, `a`], [0.9, `i`]], scale: 1.25, breath: 0.5, vibrato: 0.04, vibRate: 6, rough: 0.25, drive: 1.5, env: [[0, 0], [0.3, 1, 2], [1.1, 0.9], [1.4, 0, -3]] }), 0, 0.6);
    let n2 = KN(t2.length);
    return zP(e4, n2.length, 659.3, `sine`, 0.5, 0, n2), zP(e4, n2.length, 698.5, `sine`, 0.5, 0.2, n2), tP(e4, n2, [[0, 0], [0.9, 1, 2], [1.7, 0, -3]]), Z(t2, n2, 0, 0.18), Z(t2, AF(e4, { dur: 1.8, lp: 140, env: [[0, 0], [0.8, 1, 2], [1.7, 0, -3]] }), 0, 0.9), Z(t2, HF(e4, { dur: 1.8, count: 10, spread: 0.4, t0: 1.1, fLo: 800, fHi: 2800 }), 0, 0.5), t2;
  } }, m: YI(0.55, 2, 0.3, 5) }, rotwalkerGroan: { r: { sr: 16e3, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.6), n2 = e4.r.range(70, 86);
    return Z(t2, RF(e4, { dur: 1.45, f0: [[0, n2], [0.5, n2 * 1.16], [1.3, n2 * 0.88]], vowels: [[0, `o`], [0.5, `uh`], [1.2, `u`]], scale: 0.85, rough: 0.6, jitter: 0.05, breath: 0.35, growl: 0.3, growlRate: 30, drive: 1.6, tilt: 1800, env: [[0, 0], [0.25, 1, 2], [1, 0.85], [1.45, 0, -3]] }), 0, 1), aP(e4, t2, IF(e4, { dur: 0.4, f: 400, wet: 0.5 }), 0.6, 0.15), t2;
  } }, m: YI(0.5, 3, 0.15) }, rotwalkerDeath: { r: { sr: 16e3, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.6);
    return Z(t2, RF(e4, { dur: 1.1, f0: [[0, 92], [0.3, 100], [1, 55]], vowels: [[0, `a`], [0.6, `u`]], scale: 0.82, rough: 0.7, jitter: 0.06, breath: 0.4, growl: 0.35, drive: 1.8, tilt: 1800, env: [[0, 0], [0.08, 1], [0.7, 0.7], [1.1, 0, -3]] }), 0, 0.9), aP(e4, t2, CF(e4, { f0: 110, f1: 48, dur: 0.3, drive: 1.6 }), 0.85, 1), aP(e4, t2, IF(e4, { dur: 0.3, f: 500, wet: 0.8 }), 0.86, 0.6), Z(t2, kF(e4, { dur: 1.6, count: 6, t0: 0.88, spread: 0.1, fLo: 400, fHi: 1400, decay: 0.03, amp: 0.4 }), 0, 1), t2;
  } }, m: YI(0.58, 3, 0.15, 4) }, spinehogShoot: { r: { sr: 24e3, dur: 0.5, v: 2, render(e4) {
    let t2 = Q(e4, 0.5), n2 = $(e4, { dur: 0.1, bp: [[0, 900], [0.1, 600]], q: 2.2, att: 5e-3, curve: -3 }), r2 = zP(e4, n2.length, 45, `sine`);
    for (let e5 = 0; e5 < n2.length; e5++) n2[e5] *= 0.6 + 0.4 * r2[e5];
    return Z(t2, n2, 0, 0.8), Z(t2, RF(e4, { dur: 0.1, f0: [[0, 180], [0.1, 150]], vowels: [[0, `u`]], voiced: 0.4, breath: 0.8, scale: 1.2, env: iP(5e-3, 0.09, -3) }), 0, 0.5), aP(e4, t2, $(e4, { dur: 0.15, color: `white`, bp: [[0, 6500], [0.15, 2500]], q: 3, att: 3e-3, curve: -3 }), 0.08, 0.6), aP(e4, t2, wF(e4, 5e3, 3e-3), 0.08, 0.6), aP(e4, t2, ZP(e4, Math.round(0.15 * e4.sr), e4.r.range(300, 360), { t60: 0.1, bright: 0.7, hard: 1 }), 0.08, 0.2), t2;
  } }, m: YI(0.5, 4, 0.08) }, spinehogDeath: { r: { sr: 24e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8), n2 = e4.r.range(850, 1e3);
    return Z(t2, RF(e4, { dur: 0.4, f0: [[0, n2], [0.05, n2 * 1.2], [0.38, n2 * 0.5]], vowels: [[0, `i`], [0.2, `e`]], scale: 1.6, rough: 0.3, breath: 0.35, drive: 2, env: [[0, 0], [0.015, 1], [0.38, 0, -3]] }), 0, 0.7), aP(e4, t2, CF(e4, { f0: 150, f1: 75, dur: 0.12 }), 0.3, 0.7), Z(t2, HF(e4, { dur: 0.8, count: 6, spread: 0.12, t0: 0.32, fLo: 2500, fHi: 5e3, decay: 0.015 }), 0, 0.35), t2;
  } }, m: YI(0.5, 3) }, boneRattle: { r: { sr: 24e3, dur: 0.8, v: 3, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, HF(e4, { dur: 0.8, count: 14, spread: 0.45, fLo: 700, fHi: 2800, decay: 0.03, bursty: 0.35 }), 0, 1), Z(t2, $(e4, { dur: 0.5, bp: 480, q: 3, att: 0.02, curve: -2 }), 0, 0.2), t2;
  } }, m: YI(0.45, 3, 0.12) }, boneShatter: { r: { sr: 24e3, dur: 1.2, v: 2, render(e4) {
    let t2 = Q(e4, 1.2);
    return Z(t2, wF(e4, 3e3, 5e-3), 0, 1), Z(t2, fF($(e4, { dur: 0.05, bp: 2e3, q: 0.9, att: 5e-4 }), 6, 2), 0, 0.6), Z(t2, HF(e4, { dur: 1.2, count: 28, spread: 0.8, t0: 0.02, fLo: 600, fHi: 3e3, decay: 0.035, bursty: 0.25 }), 0, 0.9), aP(e4, t2, CF(e4, { f0: 190, f1: 100, dur: 0.07 }), 0.28, 0.5), aP(e4, t2, CF(e4, { f0: 170, f1: 95, dur: 0.07 }), 0.5, 0.4), Z(t2, kF(e4, { dur: 1.2, count: 10, t0: 0.05, spread: 0.3, fLo: 500, fHi: 2e3, decay: 0.03, amp: 0.4 }), 0, 1), t2;
  } }, m: YI(0.58, 3, 0.12, 4) }, arrowShoot: { r: { sr: 24e3, dur: 0.45, v: 3, render(e4) {
    let t2 = Q(e4, 0.45);
    return Z(t2, UF(e4, e4.r.range(95, 125), 0.35, 0.22), 0, 0.7), Z(t2, wF(e4, 2500, 4e-3), 0, 0.6), aP(e4, t2, $(e4, { dur: 0.22, color: `white`, bp: [[0, 3200], [0.22, 1500]], q: 2.5, att: 0.02, curve: -3 }), 0.01, 0.35), t2;
  } }, m: YI(0.45, 4, 0.06, 4) }, arrowImpact: { r: { sr: 24e3, dur: 0.4, v: 3, render(e4) {
    let t2 = Q(e4, 0.4);
    return Z(t2, CF(e4, { f0: 260, f1: 140, dur: 0.06 }), 0, 0.8), Z(t2, wF(e4, 2e3, 4e-3), 0, 0.7), Z(t2, $(e4, { dur: 0.04, bp: 1200, q: 1.5 }), 0, 0.5), Z(t2, UF(e4, e4.r.range(130, 160), 0.3, 0.18), 2e-3 * e4.sr, 0.2), t2;
  } }, m: YI(0.48, 4, 0.06, 4) }, bossRoar: { r: { sr: 22050, dur: 3.2, v: 2, rms: 0.22, render(e4) {
    let t2 = Q(e4, 2.6), n2 = e4.r.range(68, 78), r2 = [[0, 0], [0.25, 1, 2], [1.4, 0.85], [2.2, 0, -3]], i2 = [[0, n2], [0.3, n2 * 1.35], [1.4, n2 * 1.2], [2.1, n2 * 0.78]], a2 = [[0, `a`], [0.6, `o`], [1.6, `u`]];
    Z(t2, RF(e4, { dur: 2.2, f0: i2, vowels: a2, scale: 0.62, rough: 0.7, jitter: 0.06, breath: 0.6, growl: 0.5, growlRate: 32, drive: 3, tilt: 2200, env: r2 }), 0, 1), Z(t2, RF(e4, { dur: 2.2, f0: i2.map(([e5, t3, n3]) => [e5, t3 * 0.5, n3]), vowels: a2, scale: 0.55, rough: 0.5, breath: 0.3, drive: 2, tilt: 1500, env: r2 }), 0, 0.5);
    let o2 = HP(e4, t2.length);
    nF(e4, o2, `bp`, 500, 0.7), tP(e4, o2, r2), Z(t2, o2, 0, 0.5);
    let s2 = zP(e4, t2.length, 40, `sine`);
    return tP(e4, s2, r2), Z(t2, s2, 0, 0.35), t2;
  } }, m: { lvl: 0.82, send: 0.3, cap: 2, prio: 9, bus: `sfx` } }, bossPhase: { r: { sr: 22050, dur: 2.6, v: 2, render(e4) {
    let t2 = Q(e4, 2.4);
    Z(t2, $(e4, { dur: 1.25, color: `pink`, lp: [[0, 200], [1.2, 4500, 3]], env: [[0, 0], [1.2, 1, 3.5], [1.25, 0.3]] }), 0, 0.9), aP(e4, t2, WF(e4, { dur: 1.2, size: 0.6, crack: 0.7, debris: 0.3 }), 1.2, 1);
    let n2 = BP(e4, Math.round(1.4 * e4.sr), [[0, 900], [1, 1400], [1.4, 1100]], 1.41, [[0, 1], [1, 5]], 0.25);
    return tP(e4, n2, [[0, 0], [1, 1, 2], [1.4, 0, -3]]), Z(t2, n2, 0, 1), Z(t2, RF(e4, { dur: 1.3, f0: 55, vowels: [[0, `o`]], scale: 0.6, rough: 0.8, voiced: 0.7, breath: 0.6, growl: 0.5, drive: 2.5, env: [[0, 0], [1.1, 1, 2], [1.3, 0, -3]] }), 0, 0.4), t2;
  } }, m: { lvl: 0.78, send: 0.3, cap: 1, prio: 9, bus: `sfx` } }, bossTelegraph: { r: { sr: 22050, dur: 1.3, v: 2, render(e4) {
    let t2 = Q(e4, 1.2), n2 = t2.length, r2 = KN(n2);
    for (let t3 of [1, 1.012, 0.991, 1.5]) zP(e4, n2, [[0, 110 * t3], [1, 220 * t3, 1]], `saw`, 0.25, e4.r.next(), r2);
    return nF(e4, r2, `lp`, [[0, 300], [1, 2200, 2]], 2), XN(r2, zP(e4, n2, [[0, 4], [1, 16, 1]], `sine`), 0.55, 0.45), tP(e4, r2, [[0, 0], [0.95, 1, 2], [1.15, 0, -4]]), Z(t2, r2, 0, 0.8), Z(t2, $(e4, { dur: 1.1, color: `pink`, bp: [[0, 300], [1, 2e3, 2]], q: 1.4, env: [[0, 0], [1, 1, 3], [1.1, 0, -3]] }), 0, 0.5), t2;
  } }, m: { lvl: 0.62, send: 0.15, cap: 2, prio: 9, bus: `sfx` } }, bossDeath: { r: { sr: 16e3, dur: 4.2, v: 2, rms: 0.22, render(e4) {
    let t2 = Q(e4, 3.6);
    return Z(t2, RF(e4, { dur: 2.6, f0: [[0, 120], [0.3, 150], [1.5, 72], [2.5, 40]], vowels: [[0, `a`], [1, `o`], [2, `u`]], scale: 0.6, rough: 0.6, jitter: 0.05, breath: 0.55, growl: 0.4, drive: 2.5, tilt: 2e3, env: [[0, 0], [0.1, 1], [1.5, 0.75], [2.5, 0, -3]] }), 0, 1), aP(e4, t2, WF(e4, { dur: 1.8, size: 0.85, crack: 0.5, debris: 0.8 }), 1.8, 1.1), t2;
  } }, m: { lvl: 0.88, send: 0.32, cap: 1, prio: 10, bus: `sfx` } } };
}));
function QI(e4, t2, n2, r2) {
  let i2 = Math.round(t2 * e4.sr), a2 = zP(e4, i2, [[0, n2], [t2, r2, -3]], `saw`, 0.7);
  return zP(e4, i2, [[0, n2 * 1.51], [t2, r2 * 1.3, -3]], `square`, 0.3, 0, a2), uF(a2, 3), nF(e4, a2, `hp`, 300), tP(e4, a2, iP(1e-3, t2, -4)), a2;
}
function $I(e4, t2, n2, r2) {
  let i2 = e4.r, a2 = [], o2 = [`a`, `e`, `i`, `o`, `u`, `uh`, `er`], s2 = 0;
  for (; s2 < t2; ) a2.push([s2, i2.pick(o2)]), s2 += i2.range(0.07, 0.16);
  let c2 = RF(e4, { dur: t2, f0: 120, vowels: a2, voiced: 0, breath: 1, scale: n2, bwMul: 1.6, env: r2, tilt: 6e3 }), l2 = SF(e4, c2.length, 9);
  for (let e5 = 0; e5 < c2.length; e5++) c2[e5] *= 0.45 + 0.55 * Math.max(0, l2[e5]);
  return c2;
}
function eL(e4, t2, n2, r2, i2, a2, o2, s2, c2) {
  let l2 = e4.r;
  for (let u2 = 0; u2 < n2; u2++) {
    let n3 = r2 + l2.expo(i2);
    QF(e4, t2, l2.log(a2, o2), n3, c2 * l2.range(0.3, 1) * Math.exp(-(n3 - r2) * 3), s2 * l2.range(0.4, 1.4));
  }
}
function tL(e4) {
  let t2 = 5.1, n2 = 6 / t2, r2 = Math.round(n2 * e4.sr), i2 = Q(e4, n2 + 0.24);
  for (let n3 = 0; n3 < 6; n3++) aP(e4, i2, TF(e4, { dur: 0.21, peak: 0.095, f0: 600, fp: e4.r.range(1700, 2300), f1: 800, q: 1.4, body: 0.4, ring: e4.r.range(2600, 3200), ringAmt: 0.05 }), n3 / t2, n3 % 2 ? 0.8 : 1);
  let a2 = qN(i2.subarray(0, r2));
  for (let e5 = r2; e5 < i2.length; e5++) a2[e5 - r2] += i2[e5];
  let o2 = 0.08, s2 = HP(e4, r2 + Math.round(o2 * e4.sr));
  return nF(e4, s2, `lp`, 500, 0.8), Z(a2, pP(e4, s2, o2), 0, 0.25), a2;
}
function nL(e4) {
  let t2 = 0.25, n2 = 2.4 + t2, r2 = VF(e4, { dur: n2, lp: 1400, env: [[0, 1]], flicker: 0.7, bpF: 700 });
  return Z(r2, EF(e4, { dur: n2, rate: 38, f: 2600, q: 0.8, pow: 2.2 }), 0, 1.6), Z(r2, EF(e4, { dur: n2, rate: 6, f: 900, q: 2, pow: 1.5 }), 0, 1.2), pP(e4, r2, t2);
}
var rL, iL, aL = t((() => {
  CP(), tF(), cF(), bF(), XF(), uI(), rL = (e4, t2 = 4, n2 = 0.12, r2 = 6) => ({ lvl: e4, send: n2, cap: t2, prio: r2, bus: `sfx` }), iL = { fireCast: { r: { sr: 24e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, TF(e4, { dur: 0.35, peak: 0.08, f0: 400, fp: e4.r.range(1500, 2100), f1: 600, q: 0.8, body: 0.6 }), 0, 0.7), Z(t2, VF(e4, { dur: 0.6, lp: [[0, 3e3], [0.6, 700]], env: [[0, 0], [0.04, 1], [0.6, 0, -3]] }), 0, 0.9), Z(t2, EF(e4, { dur: 0.6, rate: 70, f: 2600, env: iP(0.02, 0.58, -2) }), 0, 1.2), Z(t2, CF(e4, { f0: 100, f1: 58, dur: 0.12 }), 0, 0.5), t2;
  } }, m: rL(0.5, 4, 0.1) }, fireImpact: { r: { sr: 24e3, dur: 0.8, v: 3, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, $(e4, { dur: 0.02, hp: 800, att: 3e-4, curve: -7 }), 0, 0.7), Z(t2, CF(e4, { f0: 120, f1: 55, dur: 0.18, drive: 1.5 }), 0, 0.8), Z(t2, VF(e4, { dur: 0.5, lp: [[0, 2600], [0.5, 500]], env: [[0, 0], [0.01, 1], [0.5, 0, -3]] }), 0, 1), Z(t2, EF(e4, { dur: 0.75, rate: [[0, 130], [0.7, 18]], f: 2200 }), 0, 1.3), t2;
  } }, m: rL(0.52, 5) }, fireballExplode: { r: { sr: 24e3, dur: 1.9, v: 2, render(e4) {
    let t2 = Q(e4, 1.9);
    return Z(t2, WF(e4, { dur: 1.6, size: 0.55, crack: 0.8, roar: 1, debris: 0.4 }), 0, 1), Z(t2, EF(e4, { dur: 1.8, rate: [[0, 90], [1.8, 8]], f: 2400 }), 0, 1), t2;
  } }, m: rL(0.75, 4, 0.12, 7) }, meteorIncoming: { r: { sr: 24e3, dur: 1.4, v: 2, render(e4) {
    let t2 = Q(e4, 1.4);
    Z(t2, VF(e4, { dur: 1.3, lp: [[0, 600], [1.25, 3200, 2]], env: [[0, 0], [1.2, 1, 3], [1.3, 0, -3]], flicker: 0.5 }), 0, 1), Z(t2, $(e4, { dur: 1.3, color: `white`, bp: [[0, 2600], [1.25, 850, -1]], q: 8, env: [[0, 0], [1.2, 1, 2.5], [1.3, 0, -3]] }), 0, 0.6);
    let n2 = zP(e4, Math.round(1.3 * e4.sr), [[0, 1800], [1.25, 650, -1]], `sine`, 0.15);
    return tP(e4, n2, [[0, 0], [1.1, 1, 2], [1.3, 0, -3]]), Z(t2, n2, 0, 1), Z(t2, EF(e4, { dur: 1.3, rate: [[0, 10], [1.2, 160]], f: 2500, env: [[0, 0], [1.2, 1, 2], [1.3, 0]] }), 0, 1), t2;
  } }, m: rL(0.55, 3, 0.1, 7) }, meteorImpact: { r: { sr: 22050, dur: 3, v: 2, render(e4) {
    let t2 = Q(e4, 3);
    return Z(t2, WF(e4, { dur: 2.4, size: 1, crack: 1, roar: 1.2, debris: 0.8, subF: [80, 26] }), 0, 1), Z(t2, AF(e4, { dur: 2.8, lp: 150, env: [[0, 0], [0.05, 1], [2.8, 0, -3]], wob: 4 }), 0, 0.7), Z(t2, EF(e4, { dur: 2.8, rate: [[0, 120], [2.8, 6]], f: 2300 }), 0, 0.8), t2;
  } }, m: rL(0.9, 3, 0.2, 8) }, burnLoop: { r: { sr: 22050, dur: 2.7, v: 2, loop: true, rms: 0.16, render: (e4) => nL(e4) }, m: { lvl: 0.38, send: 0.05, cap: 4, prio: 5, bus: `sfx`, oneShot: 1.6 } }, coldCast: { r: { sr: 32e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, TF(e4, { dur: 0.4, peak: 0.12, f0: 1500, fp: e4.r.range(4500, 5500), f1: 2500, q: 2.5, color: `white` }), 0, 0.6), Z(t2, BF(e4, { dur: 0.8, count: 8, fLo: 3500, fHi: 9e3, t0: 0, t1: 0.3, decay: 0.25, amp: 0.5 }), 0, 1), QF(e4, t2, e4.r.range(2400, 2800), 0.02, 0.5, 0.5), Z(t2, $(e4, { dur: 0.5, color: `white`, hp: 6e3, env: [[0, 0], [0.1, 1], [0.5, 0, -3]] }), 0, 0.2), t2;
  } }, m: rL(0.48, 4, 0.1) }, iceImpact: { r: { sr: 32e3, dur: 0.8, v: 3, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, $(e4, { dur: 0.015, hp: 3e3, att: 2e-4, curve: -7 }), 0, 1), eL(e4, t2, 18, 0, 0.05, 2500, 9e3, 0.1, 0.55), Z(t2, fF($(e4, { dur: 0.06, bp: 4e3, q: 0.8, att: 5e-4 }), 6, 2), 0, 0.5), Z(t2, CF(e4, { f0: 150, f1: 80, dur: 0.08 }), 0, 0.6), t2;
  } }, m: rL(0.52, 5) }, frostNova: { r: { sr: 24e3, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.4);
    return Z(t2, TF(e4, { dur: 0.7, peak: 0.12, f0: 800, fp: 4e3, f1: 1500, q: 1.2, body: 0.4, color: `white` }), 0, 0.8), Z(t2, CF(e4, { f0: 110, f1: 50, dur: 0.35, drive: 1.5 }), 0, 0.7), Z(t2, EF(e4, { dur: 1.2, rate: [[0, 50], [0.3, 400], [1, 60]], f: 6e3, hp: 3e3 }), 0, 1.2), Z(t2, BF(e4, { dur: 1.4, count: 20, fLo: 3e3, fHi: 1e4, t0: 0.05, t1: 0.8, decay: 0.25, amp: 0.4 }), 0, 1), Z(t2, zF(e4, { dur: 1.4, freqs: [2349, 3136, 3520], env: [[0, 0], [0.15, 1], [1.4, 0, -3]], trem: 9 }), 0, 0.12), t2;
  } }, m: rL(0.62, 3, 0.18, 7) }, orbLaunch: { r: { sr: 24e3, dur: 1, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    Z(t2, TF(e4, { dur: 0.6, peak: 0.15, f0: 300, fp: 1400, f1: 600, q: 1.5, body: 0.5 }), 0, 0.8);
    let n2 = BP(e4, t2.length, [[0, 220], [0.8, 262]], 1.5, 1.5, 0.3);
    return tP(e4, n2, [[0, 0], [0.12, 1], [0.9, 0, -3]]), Z(t2, n2, 0, 1), Z(t2, BF(e4, { dur: 1, count: 6, fLo: 4e3, fHi: 9e3, t0: 0.05, t1: 0.5, amp: 0.35 }), 0, 1), t2;
  } }, m: rL(0.5, 3) }, freezeShatter: { r: { sr: 32e3, dur: 1, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    return Z(t2, $(e4, { dur: 0.02, hp: 2e3, att: 2e-4, curve: -7 }), 0, 1.2), eL(e4, t2, 30, 0, 0.09, 2e3, 11e3, 0.25, 0.6), Z(t2, fF($(e4, { dur: 0.07, bp: 3e3, q: 0.8, att: 5e-4 }), 6, 2), 0, 0.5), Z(t2, CF(e4, { f0: 160, f1: 75, dur: 0.12, drive: 1.3 }), 0, 0.7), Z(t2, kF(e4, { dur: 1, count: 10, t0: 0.03, spread: 0.15, fLo: 2500, fHi: 7e3, decay: 0.02, amp: 0.4 }), 0, 1), t2;
  } }, m: rL(0.6, 4) }, lightningCast: { r: { sr: 24e3, dur: 0.7, v: 2, render(e4) {
    let t2 = Q(e4, 0.7);
    Z(t2, MF(e4, { dur: 0.5, fLo: 60, fHi: 260, hold: 5e-3, env: [[0, 0], [0.3, 1, 2], [0.5, 0, -2]], hp: 500, drive: 3, crackle: 1 }), 0, 0.7);
    let n2 = zP(e4, t2.length, [[0, 400], [0.45, 1600, 1]], `saw`, 0.2);
    nF(e4, n2, `lp`, 3e3), tP(e4, n2, [[0, 0], [0.4, 1, 2], [0.5, 0, -3]]), Z(t2, n2, 0, 0.6);
    let r2 = WP(e4, t2.length, [[0, 40], [0.4, 500], [0.6, 30]], 1.3);
    return nF(e4, r2, `hp`, 3e3), Z(t2, r2, 0, 1), t2;
  } }, m: rL(0.45, 4, 0.08) }, zap: { r: { sr: 24e3, dur: 0.35, v: 3, render(e4) {
    let t2 = Q(e4, 0.35);
    return Z(t2, $(e4, { dur: 8e-3, hp: 2e3, att: 2e-4, curve: -7 }), 0, 0.9), Z(t2, QI(e4, e4.r.range(0.09, 0.14), e4.r.range(2200, 3e3), e4.r.range(150, 250)), 0, 0.8), Z(t2, MF(e4, { dur: 0.2, fLo: 80, fHi: 400, hold: 4e-3, env: iP(2e-3, 0.19, -3), hp: 700, drive: 4, crackle: 0.8 }), 0, 0.6), t2;
  } }, m: rL(0.42, 6, 0.06, 5) }, chainLightning: { r: { sr: 24e3, dur: 1.1, v: 2, render(e4) {
    let t2 = Q(e4, 1.1);
    Z(t2, $(e4, { dur: 0.015, hp: 1e3, att: 2e-4, curve: -8 }), 0, 1.3);
    let n2 = [[0, 0]];
    for (let t3 = 0; t3 < 4; t3++) {
      let r3 = t3 * 0.15 + e4.r.range(0, 0.03);
      n2.push([r3 + 2e-3, 1 - t3 * 0.15], [r3 + 0.12, 0.25]);
    }
    n2.push([0.95, 0, -3]), Z(t2, MF(e4, { dur: 1, fLo: 50, fHi: 400, hold: 4e-3, env: n2, hp: 500, drive: 4, crackle: 1.2 }), 0, 0.7);
    for (let n3 = 0; n3 < 4; n3++) aP(e4, t2, QI(e4, 0.11, e4.r.range(2e3, 3200), e4.r.range(150, 300)), n3 * 0.15 + e4.r.range(0, 0.02), 0.7 - n3 * 0.12);
    let r2 = WP(e4, t2.length, [[0, 600], [1, 40]], 1.2);
    return nF(e4, r2, `hp`, 2500), Z(t2, r2, 0, 1.2), t2;
  } }, m: rL(0.58, 3, 0.1, 7) }, teleport: { r: { sr: 24e3, dur: 0.9, v: 2, render(e4) {
    let t2 = Q(e4, 0.9), n2 = VP(e4, t2.length);
    return nF(e4, n2, `bp`, [[0, 400], [0.25, 4e3], [0.7, 1200]], 1), iF(e4, n2, [[0, 6], [0.3, 0.6], [0.7, 4]], 0.8, 0.5), tP(e4, n2, [[0, 0], [0.18, 1, 2], [0.7, 0, -3]]), Z(t2, n2, 0, 0.9), Z(t2, zF(e4, { dur: 0.8, freqs: [1760, 2637], env: [[0, 0], [0.18, 1], [0.8, 0, -3]], trem: 12 }), 0, 0.15), aP(e4, t2, CF(e4, { f0: 300, f1: 120, dur: 0.05 }), 0.18, 0.5), aP(e4, t2, wF(e4, 3e3, 4e-3), 0.18, 0.4), t2;
  } }, m: rL(0.5, 3, 0.12) }, bashImpact: { r: { sr: 24e3, dur: 0.8, v: 3, render(e4) {
    let t2 = Q(e4, 0.8);
    return Z(t2, CF(e4, { f0: 100, f1: 38, dur: 0.36, sweep: 0.08, drive: 2.2, h2: 0.3 }), 0, 1), Z(t2, $(e4, { dur: 0.25, color: `pink`, lp: [[0, 4e3], [0.15, 250]], att: 8e-4 }), 0, 1), Z(t2, fF($(e4, { dur: 0.06, bp: 1800, q: 0.9, att: 5e-4 }), 5, 2), 0, 0.5), $F(e4, t2, e4.r.range(560, 680), 0, 0.22, 0.3, 6e-3), Z(t2, $(e4, { dur: 0.01, hp: 2e3, att: 2e-4, curve: -7 }), 0, 0.8), Z(t2, kF(e4, { dur: 0.8, count: 6, t0: 0.01, spread: 0.08, fLo: 500, fHi: 2e3, decay: 0.03, amp: 0.4 }), 0, 1), uF(t2, 1.4), t2;
  } }, m: rL(0.8, 3, 0.1, 7) }, leap: { r: { sr: 24e3, dur: 0.6, v: 2, render(e4) {
    let t2 = Q(e4, 0.6);
    return Z(t2, TF(e4, { dur: 0.45, peak: 0.2, f0: 200, fp: 900, f1: 400, q: 0.9, body: 0.7 }), 0, 0.9), Z(t2, RF(e4, { dur: 0.25, f0: [[0, 150], [0.25, 130]], vowels: [[0, `uh`]], voiced: 0.45, breath: 0.7, env: iP(0.02, 0.22, -3) }), 0, 0.3), t2;
  } }, m: rL(0.5, 2, 0.05) }, leapLand: { r: { sr: 24e3, dur: 1, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    return Z(t2, CF(e4, { f0: 90, f1: 32, dur: 0.46, sweep: 0.1, drive: 2.5, h2: 0.3 }), 0, 1), Z(t2, $(e4, { dur: 0.35, color: `brown`, lp: [[0, 1500], [0.3, 150]], att: 1e-3 }), 0, 1.2), Z(t2, kF(e4, { dur: 1, count: 22, t0: 0.01, spread: 0.25, fLo: 400, fHi: 2500, decay: 0.03, amp: 0.6 }), 0, 1), Z(t2, fF($(e4, { dur: 0.05, bp: 1500, q: 0.9, att: 5e-4 }), 6, 2), 0, 0.4), Z(t2, AF(e4, { dur: 0.8, lp: 200, env: [[0, 0], [0.02, 1], [0.8, 0, -3]] }), 0, 0.6), t2;
  } }, m: rL(0.82, 2, 0.1, 7) }, whirlwindLoop: { r: { sr: 24e3, dur: 1.6, v: 2, loop: true, rms: 0.17, render: (e4) => tL(e4) }, m: { lvl: 0.5, send: 0.05, cap: 2, prio: 6, bus: `sfx`, oneShot: 2.2 } }, howl: { r: { sr: 22050, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.4), n2 = [[0, 0], [0.15, 1, 2], [0.9, 0.85], [1.3, 0, -3]];
    Z(t2, RF(e4, { dur: 1.3, f0: [[0, 110], [0.2, 140], [0.9, 128], [1.2, 100]], vowels: [[0, `a`], [0.8, `o`]], scale: 0.8, rough: 0.4, breath: 0.5, growl: 0.3, drive: 2.5, env: n2 }), 0, 1);
    let r2 = HP(e4, t2.length);
    nF(e4, r2, `bp`, 400, 0.8), tP(e4, r2, n2), Z(t2, r2, 0, 0.35);
    let i2 = zP(e4, t2.length, 55, `sine`);
    return tP(e4, i2, n2), Z(t2, i2, 0, 0.25), t2;
  } }, m: rL(0.62, 2, 0.2, 7) }, warCry: { r: { sr: 22050, dur: 1.8, v: 2, render(e4) {
    let t2 = Q(e4, 1.6);
    return Z(t2, RF(e4, { dur: 0.95, f0: [[0, 150], [0.1, 195], [0.6, 175], [0.9, 125]], vowels: [[0, `a`], [0.3, `ae`], [0.7, `a`]], scale: 0.9, rough: 0.3, breath: 0.4, drive: 2.8, env: [[0, 0], [0.05, 1], [0.7, 0.8], [0.95, 0, -3]] }), 0, 0.9), aP(e4, t2, CF(e4, { f0: 70, f1: 35, dur: 0.6, drive: 1.6, h2: 0.2 }), 0.15, 0.9), aP(e4, t2, TF(e4, { dur: 0.7, peak: 0.1, f0: 200, fp: 1500, f1: 300, q: 0.8, body: 0.6 }), 0.15, 0.6), t2;
  } }, m: rL(0.72, 2, 0.2, 7) }, roarBuff: { r: { sr: 24e3, dur: 1.9, v: 2, render(e4) {
    let t2 = Q(e4, 1.8);
    return Z(t2, RF(e4, { dur: 0.9, f0: [[0, 120], [0.15, 155], [0.8, 120]], vowels: [[0, `a`], [0.6, `o`]], scale: 0.85, rough: 0.35, breath: 0.45, growl: 0.25, drive: 2.4, env: [[0, 0], [0.08, 1], [0.6, 0.8], [0.9, 0, -3]] }), 0, 0.8), Z(t2, zF(e4, { dur: 1.8, freqs: [1046.5, 1318.5, 1568, 2093], env: [[0, 0], [0.35, 1, 2], [1.7, 0, -3]], trem: 6 }), 0, 0.3), Z(t2, BF(e4, { dur: 1.8, count: 12, fLo: 4e3, fHi: 1e4, t0: 0.2, t1: 1.3, amp: 0.3 }), 0, 1), t2;
  } }, m: rL(0.62, 2, 0.2, 7) }, boneCast: { r: { sr: 24e3, dur: 0.7, v: 2, render(e4) {
    let t2 = Q(e4, 0.7);
    Z(t2, HF(e4, { dur: 0.7, count: 8, spread: 0.15, fLo: 900, fHi: 2800 }), 0, 0.7), Z(t2, TF(e4, { dur: 0.4, peak: 0.1, f0: 600, fp: 2e3, f1: 900, q: 1.6 }), 0, 0.6);
    let n2 = BP(e4, t2.length, 180, 2.01, [[0, 3], [0.5, 0.5]], 0.3);
    return tP(e4, n2, iP(0.01, 0.5, -3)), Z(t2, n2, 0, 0.8), t2;
  } }, m: rL(0.5, 4) }, boneImpact: { r: { sr: 24e3, dur: 0.5, v: 2, render(e4) {
    let t2 = Q(e4, 0.5);
    Z(t2, wF(e4, 3e3, 4e-3), 0, 1);
    let n2 = e4.r.range(900, 1200);
    return GP(e4, t2.length, [{ f: n2, a: 1, d: 0.05 }, { f: n2 * 1.83, a: 0.6, d: 0.035, ph: 0.3 }, { f: n2 * 2.7, a: 0.4, d: 0.025, ph: 0.6 }], t2, 0), Z(t2, fF($(e4, { dur: 0.05, bp: 2200, q: 0.9, att: 5e-4 }), 6, 2), 0, 0.5), Z(t2, HF(e4, { dur: 0.5, count: 6, spread: 0.15, t0: 0.02, fLo: 1200, fHi: 3500, decay: 0.02 }), 0, 0.4), Z(t2, CF(e4, { f0: 180, f1: 100, dur: 0.06 }), 0, 0.5), t2;
  } }, m: rL(0.55, 5) }, teethCast: { r: { sr: 24e3, dur: 0.6, v: 2, render(e4) {
    let t2 = Q(e4, 0.6);
    Z(t2, HF(e4, { dur: 0.6, count: 16, spread: 0.18, fLo: 2e3, fHi: 4500, decay: 0.012, bursty: 0.1 }), 0, 0.9), Z(t2, TF(e4, { dur: 0.3, peak: 0.08, f0: 700, fp: 2500, f1: 1e3, q: 1.6 }), 0, 0.4);
    let n2 = zP(e4, t2.length, 98, `saw`, 0.3);
    return nF(e4, n2, `lp`, 600), tP(e4, n2, iP(0.01, 0.4, -3)), Z(t2, n2, 0, 0.6), t2;
  } }, m: rL(0.48, 4) }, corpseExplode: { r: { sr: 22050, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.6);
    Z(t2, WF(e4, { dur: 1, size: 0.4, crack: 0.4 }), 0, 0.9), Z(t2, IF(e4, { dur: 0.5, f: 600, wet: 1 }), 0, 1.2);
    for (let n2 = 0; n2 < 12; n2++) {
      let n3 = 0.04 + e4.r.expo(0.18);
      aP(e4, t2, IF(e4, { dur: e4.r.range(0.06, 0.15), f: e4.r.range(400, 1500), wet: 0.6 }), n3, 0.5 * Math.exp(-n3 * 2));
    }
    for (let n2 = 0; n2 < 6; n2++) aP(e4, t2, GF(e4, e4.r.range(300, 600), 0.1, 1.6), e4.r.range(0.3, 1.2), 0.25);
    return Z(t2, HF(e4, { dur: 1.6, count: 8, spread: 0.3, t0: 0.05, fLo: 800, fHi: 2500 }), 0, 0.4), t2;
  } }, m: rL(0.78, 4, 0.12, 7) }, curse: { r: { sr: 22050, dur: 2, v: 2, render(e4) {
    let t2 = Q(e4, 1.8), n2 = [[0, 0], [0.7, 1, 2], [1.1, 0.9], [1.6, 0, -3]];
    Z(t2, $I(e4, 1.6, 1, n2), 0, 0.8), Z(t2, $I(e4, 1.6, 0.85, n2), 0, 0.6);
    let r2 = KN(t2.length);
    return zP(e4, r2.length, 55, `sine`, 0.5, 0, r2), zP(e4, r2.length, 58.27, `sine`, 0.4, 0.3, r2), zP(e4, r2.length, 110, `tri`, 0.15, 0.1, r2), tP(e4, r2, n2), Z(t2, r2, 0, 0.5), Z(t2, $(e4, { dur: 1.3, color: `pink`, lp: [[0, 200], [1.25, 1600, 2]], env: [[0, 0], [1.25, 1, 3], [1.3, 0]] }), 0, 0.4), nI(e4, t2, 1.6, 0.38, 0.5);
  } }, m: rL(0.55, 2, 0.15, 6) }, terror: { r: { sr: 22050, dur: 2.2, v: 2, render(e4) {
    let t2 = Q(e4, 2);
    return Z(t2, RF(e4, { dur: 1.5, f0: [[0, 500], [0.4, 900], [1, 700], [1.4, 400]], vowels: [[0, `i`], [0.5, `a`], [1.2, `u`]], voiced: 0.7, breath: 0.8, scale: 1.2, vibrato: 0.04, vibRate: 7, env: [[0, 0], [0.3, 1, 2], [1, 0.8], [1.5, 0, -3]] }), 0, 0.6), Z(t2, $I(e4, 1.6, 0.9, [[0, 0], [0.5, 1, 2], [1.6, 0, -3]]), 0, 0.5), Z(t2, CF(e4, { f0: 70, f1: 30, dur: 0.6, drive: 1.5 }), 0, 0.8), nI(e4, t2, 2, 0.42, 0.5);
  } }, m: rL(0.6, 2, 0.15, 6) }, summonRise: { r: { sr: 16e3, dur: 1.8, v: 2, render(e4) {
    let t2 = Q(e4, 1.8);
    Z(t2, AF(e4, { dur: 1.7, lp: 160, env: [[0, 0], [0.6, 1, 2], [1.7, 0, -3]] }), 0, 1.1), Z(t2, kF(e4, { dur: 1.8, count: 30, t0: 0.05, spread: 0.6, fLo: 250, fHi: 1500, decay: 0.03, amp: 0.5, fall: 0.8 }), 0, 1), Z(t2, HF(e4, { dur: 1.8, count: 10, spread: 0.6, t0: 0.6, fLo: 900, fHi: 2800 }), 0, 0.5);
    let n2 = KN(t2.length);
    return zP(e4, n2.length, 110, `sine`, 0.5, 0, n2), zP(e4, n2.length, 164.8, `sine`, 0.35, 0.2, n2), tP(e4, n2, [[0, 0], [0.8, 1, 2], [1.7, 0, -3]]), Z(t2, n2, 0, 0.3), t2;
  } }, m: rL(0.6, 3, 0.12) }, golemSummon: { r: { sr: 16e3, dur: 2.3, v: 2, render(e4) {
    let t2 = Q(e4, 2.2);
    return Z(t2, AF(e4, { dur: 2.1, lp: 120, env: [[0, 0], [1, 1, 2], [2.1, 0, -3]], wob: 3 }), 0, 1.3), Z(t2, kF(e4, { dur: 2.2, count: 40, t0: 0.05, spread: 0.9, fLo: 150, fHi: 900, decay: 0.05, amp: 0.6, fall: 0.6 }), 0, 1), Z(t2, NF(e4, { dur: 1.4, rate: [[0, 12], [1.4, 30]], res: [{ f: 120, d: 0.08, a: 1 }, { f: 310, d: 0.06, a: 0.6 }, { f: 700, d: 0.04, a: 0.3 }], env: [[0, 0], [0.6, 1], [1.4, 0, -2]] }), 0.2, 0.5), aP(e4, t2, CF(e4, { f0: 75, f1: 30, dur: 0.5, drive: 2, h2: 0.3 }), 1.6, 1.1), aP(e4, t2, kF(e4, { dur: 0.6, count: 12, t0: 0.01, spread: 0.15, fLo: 300, fHi: 1500, decay: 0.03, amp: 0.6 }), 1.6, 1), Z(t2, RF(e4, { dur: 1.5, f0: 60, vowels: [[0, `o`], [1, `u`]], scale: 0.6, rough: 0.8, voiced: 0.6, breath: 0.6, drive: 2, env: [[0, 0], [0.8, 1, 2], [1.5, 0, -3]] }), 0.5, 0.4), t2;
  } }, m: rL(0.75, 2, 0.12, 7) }, lifeTapHeal: { r: { sr: 24e3, dur: 1.3, v: 2, render(e4) {
    let t2 = Q(e4, 1.3), n2 = KN(t2.length);
    return zP(e4, n2.length, 220, `sine`, 0.4, 0, n2), zP(e4, n2.length, 329.6 * 1.002, `sine`, 0.3, 0.3, n2), zP(e4, n2.length, 440 * 0.998, `sine`, 0.25, 0.6, n2), tP(e4, n2, [[0, 0], [0.35, 1, 2], [1.2, 0, -3]]), Z(t2, n2, 0, 0.5), Z(t2, $(e4, { dur: 0.45, color: `pink`, bp: [[0, 300], [0.4, 1200, 1]], q: 6, env: [[0, 0], [0.1, 1], [0.45, 0, -3]] }), 0, 0.6), QF(e4, t2, 1760, 0.25, 0.25, 0.8), t2;
  } }, m: rL(0.5, 3, 0.2) } };
}));
function oL(e4, t2, n2) {
  Z(t2, CF(e4, { f0: 170, f1: 85, dur: 0.1, sweep: 0.04 }), 0, n2), Z(t2, $(e4, { dur: 0.06, color: `pink`, lp: 1400, curve: -6 }), 0, n2 * 0.6);
}
var sL, cL, lL, uL = t((() => {
  CP(), tF(), cF(), bF(), XF(), uI(), sL = (e4, t2 = 3) => ({ lvl: e4, send: 0, cap: t2, prio: 9, bus: `ui` }), cL = (e4, t2 = 0.08, n2 = 4) => ({ lvl: e4, send: t2, cap: n2, prio: 5, bus: `sfx` }), lL = { uiHover: { r: { sr: 24e3, dur: 0.07, v: 2, render(e4) {
    let t2 = Q(e4, 0.07);
    return Z(t2, $(e4, { dur: 0.03, bp: e4.r.range(3e3, 3800), q: 1.4, att: 5e-4, curve: -6 }), 0, 0.6), Z(t2, zP(e4, t2.length, e4.r.range(1900, 2300), `sine`, 0.25), 0, 1), tP(e4, t2, iP(1e-3, 0.05, -6)), t2;
  } }, m: sL(0.16, 2) }, uiClick: { r: { sr: 24e3, dur: 0.14, v: 3, render(e4) {
    let t2 = Q(e4, 0.14);
    return Z(t2, CF(e4, { f0: e4.r.range(240, 290), f1: 130, dur: 0.06, sweep: 0.02 }), 0, 0.55), Z(t2, wF(e4, e4.r.range(2600, 3400), 4e-3), 0, 0.9), GP(e4, t2.length, [{ f: e4.r.range(2900, 3300), a: 0.22, d: 0.06 }, { f: e4.r.range(6800, 7400), a: 0.08, d: 0.03 }], t2, 0), Z(t2, $(e4, { dur: 0.035, bp: 900, q: 3, att: 5e-4 }), 0, 0.35), t2;
  } }, m: sL(0.42) }, uiOpen: { r: { sr: 24e3, dur: 0.42, v: 2, render(e4) {
    let t2 = Q(e4, 0.42);
    return Z(t2, TF(e4, { dur: 0.22, peak: 0.1, f0: 500, fp: e4.r.range(1200, 1600), f1: 700, q: 0.9 }), 0, 0.55), aP(e4, t2, CF(e4, { f0: 140, f1: 78, dur: 0.13, sweep: 0.05 }), 0.085, 0.75), aP(e4, t2, FF(e4, { dur: 0.26, rate: 140, fLo: 2400, fHi: 7e3, env: iP(0.02, 0.24, -3) }), 0.02, 0.35), aP(e4, t2, wF(e4, 1800, 6e-3), 0.088, 0.35), t2;
  } }, m: sL(0.42) }, uiClose: { r: { sr: 24e3, dur: 0.32, v: 2, render(e4) {
    let t2 = Q(e4, 0.32);
    return Z(t2, TF(e4, { dur: 0.16, peak: 0.05, f0: 1300, fp: 900, f1: 380, q: 0.9 }), 0, 0.5), aP(e4, t2, CF(e4, { f0: 125, f1: 70, dur: 0.12, sweep: 0.04 }), 0.05, 0.8), aP(e4, t2, wF(e4, 1500, 6e-3), 0.052, 0.3), aP(e4, t2, FF(e4, { dur: 0.14, rate: 120, fLo: 2200, fHi: 6500, env: iP(0.01, 0.13, -3) }), 0, 0.25), t2;
  } }, m: sL(0.4) }, uiError: { r: { sr: 24e3, dur: 0.32, v: 2, render(e4) {
    let t2 = Q(e4, 0.32), n2 = t2.length, r2 = Q(e4, 0.32);
    return zP(e4, n2, 98, `square`, 0.5, 0, r2), zP(e4, n2, 103.8, `square`, 0.5, 0.3, r2), nF(e4, r2, `lp`, 650, 0.9), tP(e4, r2, [[0, 0], [6e-3, 1], [0.09, 0.45], [0.11, 0.9], [0.28, 0, -4]]), Z(t2, r2, 0, 0.8), Z(t2, CF(e4, { f0: 170, f1: 110, dur: 0.07 }), 0, 0.6), aP(e4, t2, CF(e4, { f0: 160, f1: 105, dur: 0.08 }), 0.1, 0.55), uF(t2, 1.4), t2;
  } }, m: sL(0.38) }, uiLearn: { r: { sr: 24e3, dur: 1.3, v: 2, render(e4, t2) {
    let n2 = Q(e4, 1), r2 = t2 ? lI(880, 2) : 880;
    [0, 4, 7, 12].forEach((t3, i3) => ZF(e4, n2, lI(r2, t3), i3 * 0.065, 0.55 + i3 * 0.1, 0.7, 0.8)), Z(n2, BF(e4, { dur: 1, count: 9, fLo: 4e3, fHi: 9500, t0: 0.05, t1: 0.6, amp: 0.25 }), 0, 1), Z(n2, TF(e4, { dur: 0.45, peak: 0.25, f0: 900, fp: 4500, f1: 5e3, q: 1.5, color: `white` }), 0, 0.18);
    let i2 = zP(e4, n2.length, lI(r2, -12), `sine`, 0.25);
    return tP(e4, i2, iP(0.05, 0.8, -3)), Z(n2, i2, 0, 1), nI(e4, n2, 1.2, 0.25, 0.3);
  } }, m: sL(0.45, 2) }, uiStat: { r: { sr: 24e3, dur: 0.55, v: 2, render(e4) {
    let t2 = Q(e4, 0.55);
    return Z(t2, wF(e4, 3500, 3e-3), 0, 0.6), ZF(e4, t2, e4.r.pick([1568, 1661, 1760]), 4e-3, 0.7, 0.4, 0.9), t2;
  } }, m: sL(0.36) }, uiBuy: { r: { sr: 32e3, dur: 0.7, v: 2, render(e4) {
    let t2 = Q(e4, 0.7);
    return Z(t2, OF(e4, { dur: 0.7, count: e4.r.int(4, 6), spread: 0.16, t0: 0.02 }), 0, 0.8), aP(e4, t2, CF(e4, { f0: 150, f1: 90, dur: 0.09 }), 0.16, 0.5), aP(e4, t2, FF(e4, { dur: 0.15, rate: 160, fLo: 1500, fHi: 5e3, env: iP(0.01, 0.14, -3) }), 0.14, 0.3), t2;
  } }, m: sL(0.45) }, uiSell: { r: { sr: 32e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8);
    return eI(e4, t2, e4.r.range(200, 240), 0, 0.6, 0.08), Z(t2, wF(e4, 1800, 4e-3), 0, 0.5), Z(t2, OF(e4, { dur: 0.8, count: e4.r.int(7, 10), spread: 0.32, t0: 0.03, fLo: 3e3, fHi: 5600 }), 0, 0.85), t2;
  } }, m: sL(0.45) }, uiTransmute: { r: { sr: 24e3, dur: 1.9, v: 2, render(e4) {
    let t2 = Q(e4, 1.5), n2 = $(e4, { dur: 0.9, color: `white`, bp: [[0, 300], [0.6, 2600], [0.9, 900]], q: 1.6, env: [[0, 0], [0.55, 1, 2.5], [0.9, 0, -3]] });
    return iF(e4, n2, [[0, 7], [0.6, 0.7], [0.9, 3]], 0.75, 0.55), Z(t2, n2, 0, 0.7), $F(e4, t2, e4.r.range(620, 700), 0.55, 0.35, 1.1, 6e-3), aP(e4, t2, CF(e4, { f0: 120, f1: 55, dur: 0.3, drive: 1.4 }), 0.55, 0.7), Z(t2, BF(e4, { dur: 1.5, count: 12, fLo: 3e3, fHi: 9e3, t0: 0.55, t1: 1.1, amp: 0.3 }), 0, 1), nI(e4, t2, 1.4, 0.3, 0.35);
  } }, m: sL(0.5, 2) }, goldPickup: { r: { sr: 32e3, dur: 0.6, v: 3, render(e4) {
    let t2 = Q(e4, 0.6);
    return Z(t2, OF(e4, { dur: 0.6, count: e4.r.int(5, 8), spread: 0.22, fLo: 2800, fHi: 5600 }), 0, 1), Z(t2, $(e4, { dur: 0.04, color: `pink`, lp: 1500 }), 0, 0.3), t2;
  } }, m: { ...cL(0.5, 0.05), bus: `ui` } }, itemPickup: { r: { sr: 24e3, dur: 0.3, v: 3, render(e4) {
    let t2 = Q(e4, 0.3);
    return Z(t2, TF(e4, { dur: 0.14, peak: 0.05, f0: 900, fp: e4.r.range(2e3, 2700), f1: 1200, q: 0.8 }), 0, 0.6), aP(e4, t2, CF(e4, { f0: 220, f1: 125, dur: 0.06 }), 0.06, 0.6), aP(e4, t2, FF(e4, { dur: 0.12, rate: 200, fLo: 1500, fHi: 6e3, env: iP(0.01, 0.11, -3) }), 0.02, 0.35), t2;
  } }, m: { ...cL(0.42), bus: `ui` } }, itemPlace: { r: { sr: 24e3, dur: 0.24, v: 2, render(e4) {
    let t2 = Q(e4, 0.24);
    return Z(t2, CF(e4, { f0: e4.r.range(165, 195), f1: 100, dur: 0.08 }), 0, 0.8), Z(t2, $(e4, { dur: 0.05, color: `pink`, lp: 1500 }), 0, 0.5), Z(t2, wF(e4, 1500, 4e-3), 0, 0.3), t2;
  } }, m: { ...cL(0.42), bus: `ui` } }, itemEquipMetal: { r: { sr: 24e3, dur: 0.7, v: 2, render(e4) {
    let t2 = Q(e4, 0.7);
    return [0, 0.028, 0.065, 0.11].forEach((n2, r2) => {
      GP(e4, t2.length, [{ f: e4.r.range(900, 2400), a: 0.5 / (r2 + 1), d: 0.25 }, { f: e4.r.range(2600, 5200), a: 0.3 / (r2 + 1), d: 0.15 }, { f: e4.r.range(5200, 8e3), a: 0.15 / (r2 + 1), d: 0.08 }], t2, Math.floor(n2 * e4.sr)), aP(e4, t2, wF(e4, 4500, 2e-3), n2, 0.4 / (r2 + 1));
    }), Z(t2, HF(e4, { dur: 0.6, count: 7, spread: 0.2, t0: 0.03, fLo: 2500, fHi: 6500, decay: 0.05 }), 0, 0.35), Z(t2, $(e4, { dur: 0.15, bp: 3e3, q: 2, att: 0.01, curve: -3 }), 0, 0.15), Z(t2, CF(e4, { f0: 180, f1: 100, dur: 0.07 }), 0, 0.4), t2;
  } }, m: { ...cL(0.48), bus: `ui` } }, itemEquipCloth: { r: { sr: 24e3, dur: 0.45, v: 2, render(e4) {
    let t2 = Q(e4, 0.45);
    return Z(t2, FF(e4, { dur: 0.3, rate: 220, fLo: 1400, fHi: 6e3, env: iP(0.03, 0.27, -2) }), 0, 0.8), Z(t2, TF(e4, { dur: 0.25, peak: 0.1, f0: 500, fp: 1300, f1: 600, q: 0.8 }), 0, 0.4), aP(e4, t2, CF(e4, { f0: 150, f1: 90, dur: 0.08 }), 0.18, 0.45), t2;
  } }, m: { ...cL(0.45), bus: `ui` } }, dropGeneric: { r: { sr: 24e3, dur: 0.4, v: 3, render(e4) {
    let t2 = Q(e4, 0.4);
    return Z(t2, CF(e4, { f0: e4.r.range(140, 170), f1: 70, dur: 0.13, sweep: 0.04, drive: 1.3 }), 0, 0.9), Z(t2, $(e4, { dur: 0.1, color: `brown`, lp: 900 }), 0, 0.8), Z(t2, kF(e4, { dur: 0.4, count: 4, t0: 0.01, spread: 0.05, fLo: 600, fHi: 1800, decay: 0.025, amp: 0.4 }), 0, 1), t2;
  } }, m: cL(0.5) }, dropRing: { r: { sr: 32e3, dur: 0.85, v: 2, render(e4) {
    let t2 = Q(e4, 0.85), n2 = e4.r.range(3700, 4600), r2 = 0, i2 = e4.r.range(0.14, 0.18);
    for (let a2 = 0; a2 < 6; a2++) {
      let o2 = 0.6 ** a2;
      GP(e4, t2.length, [{ f: n2 * (1 + e4.r.bi() * 4e-3), a: o2, d: 0.28, ph: e4.r.next() }, { f: n2 * 2.41, a: o2 * 0.45, d: 0.15, ph: e4.r.next() }, { f: n2 * 4.1, a: o2 * 0.2, d: 0.08, ph: e4.r.next() }], t2, Math.floor(r2 * e4.sr)), aP(e4, t2, wF(e4, 7e3, 15e-4), r2, o2 * 0.4), r2 += i2, i2 *= 0.62;
    }
    return t2;
  } }, m: cL(0.42) }, dropAmulet: { r: { sr: 24e3, dur: 0.85, v: 2, render(e4) {
    let t2 = Q(e4, 0.85);
    Z(t2, HF(e4, { dur: 0.85, count: 9, spread: 0.14, fLo: 2600, fHi: 6500, decay: 0.06, bursty: 0.15 }), 0, 0.55);
    let n2 = e4.r.range(2400, 2900);
    return [0.02, 0.17, 0.26].forEach((r2, i2) => QF(e4, t2, n2 * (1 + i2 * 0.01), r2, 0.6 * 0.55 ** i2, 0.35)), t2;
  } }, m: cL(0.42) }, dropGem: { r: { sr: 32e3, dur: 0.75, v: 2, render(e4) {
    let t2 = Q(e4, 0.75), n2 = e4.r.range(4800, 6200), r2 = 0, i2 = 0.12;
    for (let a2 = 0; a2 < 4; a2++) QF(e4, t2, n2 * (1 + e4.r.bi() * 0.01), r2, 0.55 ** a2, 0.22), r2 += i2, i2 *= 0.65;
    return Z(t2, BF(e4, { dur: 0.75, count: 2, fLo: 7e3, fHi: 1e4, t0: 0.05, t1: 0.2, amp: 0.25 }), 0, 1), t2;
  } }, m: cL(0.38) }, dropRune: { r: { sr: 24e3, dur: 0.45, v: 2, render(e4) {
    let t2 = Q(e4, 0.45), n2 = e4.r.range(1150, 1550);
    return [0, 0.085, 0.135].forEach((r2, i2) => {
      let a2 = 0.5 ** i2;
      GP(e4, t2.length, [{ f: n2, a: a2, d: 0.035, ph: 0 }, { f: n2 * 1.93, a: a2 * 0.6, d: 0.025, ph: 0.4 }, { f: n2 * 3.3, a: a2 * 0.3, d: 0.015, ph: 0.7 }], t2, Math.floor(r2 * e4.sr)), aP(e4, t2, wF(e4, 2600, 3e-3), r2, a2 * 0.7);
    }), Z(t2, CF(e4, { f0: 210, f1: 120, dur: 0.05 }), 0, 0.45), t2;
  } }, m: cL(0.48) }, dropPotion: { r: { sr: 24e3, dur: 0.6, v: 2, render(e4) {
    let t2 = Q(e4, 0.6), n2 = e4.r.range(2100, 2700);
    return QF(e4, t2, n2, 0, 0.9, 0.35), QF(e4, t2, n2 * 1.01, 0.085, 0.35, 0.25), Z(t2, wF(e4, 5e3, 2e-3), 0, 0.4), aP(e4, t2, $(e4, { dur: 0.22, color: `pink`, bp: [[0, 900], [0.22, 480]], q: 3, att: 0.02, curve: -3 }), 0.02, 0.5), aP(e4, t2, KF(e4, 0.1, e4.r.range(380, 460)), 0.08, 0.2), t2;
  } }, m: cL(0.42) }, dropScroll: { r: { sr: 24e3, dur: 0.4, v: 2, render(e4) {
    let t2 = Q(e4, 0.4);
    return Z(t2, FF(e4, { dur: 0.26, rate: 170, fLo: 1800, fHi: 6500, env: iP(0.02, 0.24, -2) }), 0, 0.8), aP(e4, t2, CF(e4, { f0: 300, f1: 180, dur: 0.035 }), 0.2, 0.4), t2;
  } }, m: cL(0.4) }, dropMagic: { r: { sr: 24e3, dur: 1.1, v: 2, render(e4, t2) {
    let n2 = Q(e4, 1.1);
    oL(e4, n2, 0.5);
    let r2 = lI(1318.5, t2 - 1);
    return ZF(e4, n2, r2, 0.04, 0.5, 0.6, 0.8), ZF(e4, n2, lI(r2, 7), 0.13, 0.6, 0.7, 0.8), Z(n2, BF(e4, { dur: 1.1, count: 3, fLo: 5e3, fHi: 9e3, t0: 0.1, t1: 0.4, amp: 0.2 }), 0, 1), n2;
  } }, m: cL(0.5, 0.22, 3) }, dropRare: { r: { sr: 24e3, dur: 1.5, v: 2, render(e4, t2) {
    let n2 = Q(e4, 1.3);
    oL(e4, n2, 0.55);
    let r2 = lI(1174.7, t2);
    [0, 4, 7].forEach((t3, i3) => ZF(e4, n2, lI(r2, t3), 0.04 + i3 * 0.075, 0.5 + i3 * 0.12, 0.8, 0.85)), Z(n2, BF(e4, { dur: 1.3, count: 6, fLo: 4500, fHi: 9500, t0: 0.15, t1: 0.6, amp: 0.22 }), 0, 1);
    let i2 = zP(e4, n2.length, lI(r2, -24), `sine`, 0.3);
    return tP(e4, i2, iP(0.06, 0.9, -3)), aP(e4, n2, i2, 0.04, 1), nI(e4, n2, 1, 0.22, 0.35);
  } }, m: cL(0.55, 0.15, 3) }, dropSet: { r: { sr: 24e3, dur: 1.9, v: 2, render(e4, t2) {
    let n2 = Q(e4, 1.6);
    oL(e4, n2, 0.55);
    let r2 = lI(784, t2 * 2), i2 = n2.length;
    return [0, 4, 6, 7, 11, 14].forEach((t3, a2) => {
      let o2 = Math.floor((0.05 + a2 * 0.07) * e4.sr);
      ZP(e4, i2, lI(r2, t3), { t60: 1.1, bright: 0.75, hard: 0.7, pick: 0.2 }, n2, o2, 0.32);
    }), Z(n2, zF(e4, { dur: 1.6, freqs: [lI(r2, 12), lI(r2, 19), lI(r2, 23)], env: [[0, 0], [0.4, 1, 2], [1.5, 0, -3]], trem: 7 }), 0, 0.12), Z(n2, BF(e4, { dur: 1.6, count: 8, fLo: 4500, fHi: 9500, t0: 0.2, t1: 0.9, amp: 0.2 }), 0, 1), nI(e4, n2, 1.2, 0.26, 0.35);
  } }, m: cL(0.58, 0.18, 3) }, dropUnique: { r: { sr: 24e3, dur: 2.8, v: 2, rms: 0.17, render(e4, t2) {
    let n2 = Q(e4, 2.2);
    oL(e4, n2, 0.7), $F(e4, n2, e4.r.range(108, 116), 0, 0.55, 2.2, 3e-3);
    let r2 = lI(1046.5, t2 ? 2 : 0);
    return [0, 7, 14, 16, 19, 24].forEach((t3, i2) => ZF(e4, n2, lI(r2, t3), 0.06 + i2 * 0.085, 0.45 + i2 * 0.06, 1.1, 0.9)), Z(n2, zF(e4, { dur: 2.2, freqs: [lI(r2, -12), lI(r2, -5), lI(r2, 4), lI(r2, 7)], env: [[0, 0], [0.6, 1, 2], [2.1, 0, -3]], trem: 5 }), 0, 0.22), Z(n2, BF(e4, { dur: 2.2, count: 16, fLo: 4e3, fHi: 1e4, t0: 0.2, t1: 1.4, amp: 0.25 }), 0, 1), rF(e4, n2, 12e3), nI(e4, n2, 1.6, 0.3, 0.35);
  } }, m: cL(0.62, 0.2, 2) }, potionDrink: { r: { sr: 24e3, dur: 0.95, v: 2, render(e4) {
    let t2 = Q(e4, 0.95);
    QF(e4, t2, e4.r.range(2e3, 2400), 0, 0.35, 0.18), Z(t2, $(e4, { dur: 0.05, bp: 1200, q: 2 }), 0, 0.3);
    let n2 = e4.r.int(2, 3);
    for (let r2 = 0; r2 < n2; r2++) aP(e4, t2, KF(e4, e4.r.range(0.13, 0.17), e4.r.range(260, 340)), 0.13 + r2 * e4.r.range(0.18, 0.22), 0.9);
    return aP(e4, t2, $(e4, { dur: 0.25, color: `pink`, bp: 700, q: 1.5, att: 0.05, curve: -2 }), 0.12, 0.15), t2;
  } }, m: { ...cL(0.5, 0.05), bus: `ui` } }, scrollRead: { r: { sr: 24e3, dur: 1, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    return Z(t2, FF(e4, { dur: 0.42, rate: 220, fLo: 1800, fHi: 7e3, env: iP(0.03, 0.39, -2) }), 0, 0.7), aP(e4, t2, $(e4, { dur: 0.7, color: `pink`, bp: [[0, 600], [0.7, 3200]], q: 2, env: [[0, 0], [0.4, 1, 2], [0.7, 0, -3]] }), 0.1, 0.35), Z(t2, zF(e4, { dur: 1, freqs: [1760, 2637], env: [[0, 0], [0.45, 1, 2], [1, 0, -3]], trem: 8 }), 0, 0.08), t2;
  } }, m: { ...cL(0.45, 0.1), bus: `ui` } }, identify: { r: { sr: 24e3, dur: 1.2, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    return Z(t2, $(e4, { dur: 0.35, color: `white`, bp: [[0, 1200], [0.35, 6e3]], q: 2, env: [[0, 0], [0.25, 1, 2], [0.35, 0, -3]] }), 0, 0.3), ZF(e4, t2, e4.r.pick([1318.5, 1396.9]), 0.25, 0.7, 0.7, 0.85), Z(t2, BF(e4, { dur: 1, count: 7, fLo: 4500, fHi: 9500, t0: 0.2, t1: 0.6, amp: 0.25 }), 0, 1), nI(e4, t2, 1, 0.2, 0.3);
  } }, m: { ...cL(0.48, 0.1), bus: `ui` } } };
}));
function dL(e4, t2, n2, r2, i2, a2 = 4) {
  let o2 = Math.round(t2 * e4.sr), s2 = KN(o2);
  for (let t3 of n2) zP(e4, o2, t3 * (1 + e4.r.bi() * 3e-3), `saw`, 1 / n2.length, e4.r.next(), s2), zP(e4, o2, t3 * 1.004, `saw`, 0.5 / n2.length, e4.r.next(), s2);
  return nF(e4, s2, `lp`, [[0, r2], [t2 * 0.75, i2, 2], [t2, i2 * 0.7]], a2), tP(e4, s2, [[0, 0], [t2 * 0.6, 1, 2], [t2, 0, -3]]), s2;
}
function fL(e4, t2, n2, r2, i2, a2) {
  let o2 = Math.min(n2, r2);
  for (let r3 = 0; r3 < o2; r3++) {
    let a3 = r3 / n2;
    e4[t2 + r3] += i2 * a3 * a3;
  }
  let s2 = i2;
  for (let i3 = n2; i3 < r2; i3++) e4[t2 + i3] += s2, s2 *= a2;
}
function pL(e4, t2) {
  let n2 = 4.6, r2 = Math.round(n2 * e4.sr), i2 = t2 === 0, a2 = [], o2 = e4.r, s2 = KN(r2);
  if (i2) {
    let t3 = 0;
    for (let n4 = 0; n4 < 6; n4++) aP(e4, s2, $(e4, { dur: o2.range(0.04, 0.14), color: `white`, hp: 250, lp: 7500, att: 5e-4, curve: -6 }), t3, 0.7 ** n4 * o2.range(0.7, 1)), t3 += o2.range(0.015, 0.06);
    let n3 = WP(e4, Math.round(0.35 * e4.sr), [[0, 3e3], [0.35, 300]], 1.4);
    nF(e4, n3, `bp`, 2400, 0.7), Z(s2, n3, 0, 1.2), Z(s2, CF(e4, { f0: 70, f1: 30, dur: 1.4, sweep: 0.4, drive: 1.5 }), 0, 0.9);
  }
  for (let t3 = 0; t3 < 2; t3++) {
    let t4 = qN(s2), c2 = UP(e4, r2);
    nF(e4, c2, `lp`, [[0, i2 ? 420 : 260], [n2, 90, -2]], 0.7);
    let l2 = KN(r2), u2 = o2.int(4, 6);
    for (let t5 = 0; t5 < u2; t5++) {
      let n3 = (i2 ? 0.1 : 0) + o2.range(0, 2.6) * (t5 / u2 + 0.2), a3 = o2.range(0.4, 1) * (1 - t5 / (u2 + 2)), s3 = o2.range(0.15, 0.5), c3 = o2.range(0.8, 1.8), d2 = Math.floor(n3 * e4.sr), f2 = Math.floor(s3 * e4.sr), p2 = Math.floor(c3 * e4.sr);
      fL(l2, d2, f2, Math.min(r2 - d2, f2 + p2 * 3), a3, Math.exp(-1 / p2));
    }
    QN(c2, l2), XN(c2, SF(e4, r2, 7), 0.75, 0.25), Z(t4, c2, 0, i2 ? 2.2 : 2.8), i2 || rF(e4, t4, 900), a2.push(t4);
  }
  return a2;
}
function mL(e4, t2, n2) {
  return [[0, 0], [e4, 1, 2], [e4 + t2, 1], [e4 + t2 + n2, 0, -3]];
}
var hL, gL, _L = t((() => {
  CP(), tF(), cF(), bF(), XF(), uI(), hL = (e4, t2 = 0.18, n2 = 3, r2 = 7) => ({ lvl: e4, send: t2, cap: n2, prio: r2, bus: `sfx` }), gL = { levelUp: { r: { sr: 24e3, dur: 3.4, v: 2, rms: 0.17, render(e4, t2) {
    let n2 = Q(e4, 2.8), r2 = lI(523.25, t2 ? 2 : 0);
    [0, 7, 12, 16, 19, 24].forEach((t3, i3) => ZF(e4, n2, lI(r2, t3), i3 * 0.07, 0.4 + i3 * 0.07, 1.3 - i3 * 0.1, 0.9)), Z(n2, zF(e4, { dur: 2.8, freqs: [lI(r2, 12), lI(r2, 16), lI(r2, 19), lI(r2, 24)], env: [[0, 0], [0.6, 1, 2], [2.7, 0, -3]], trem: 6 }), 0, 0.3), Z(n2, $(e4, { dur: 0.8, color: `white`, bp: [[0, 400], [0.7, 6500]], q: 1.4, env: [[0, 0], [0.55, 1, 2.5], [0.8, 0, -3]] }), 0, 0.32);
    let i2 = KN(n2.length);
    return zP(e4, i2.length, lI(r2, -24), `sine`, 0.5, 0, i2), zP(e4, i2.length, lI(r2, -17), `sine`, 0.35, 0, i2), zP(e4, i2.length, lI(r2, -12), `tri`, 0.18, 0, i2), tP(e4, i2, [[0, 0], [0.25, 1, 2], [2.6, 0, -3]]), Z(n2, i2, 0, 0.45), Z(n2, CF(e4, { f0: 130, f1: 60, dur: 0.3 }), 0, 0.5), Z(n2, BF(e4, { dur: 2.8, count: 16, fLo: 4e3, fHi: 1e4, t0: 0.3, t1: 2, amp: 0.22 }), 0, 1), tI(e4, n2, 2.2, 0.35, 0.35);
  } }, m: { lvl: 0.62, send: 0.1, cap: 1, prio: 10, bus: `ui` } }, questComplete: { r: { sr: 24e3, dur: 2.8, v: 2, rms: 0.17, render(e4, t2) {
    let n2 = Q(e4, 2.3), r2 = lI(783.99, t2);
    for (let [t3, i2] of [[0, 0], [5, 0.12], [7, 0.24], [12, 0.42]]) ZF(e4, n2, lI(r2, t3), i2, 0.65, 1.2, 0.9);
    return ZF(e4, n2, lI(r2, 16), 0.42, 0.35, 1.4, 0.9), ZF(e4, n2, lI(r2, -12), 0.42, 0.5, 2, 0.6), Z(n2, zF(e4, { dur: 2.3, freqs: [lI(r2, 12), lI(r2, 16), lI(r2, 19)], env: [[0, 0], [0.42, 0], [0.8, 1, 2], [2.2, 0, -3]], trem: 6 }), 0, 0.2), Z(n2, BF(e4, { dur: 2.3, count: 10, fLo: 5e3, fHi: 1e4, t0: 0.4, t1: 1.4, amp: 0.2 }), 0, 1), tI(e4, n2, 2, 0.3, 0.35);
  } }, m: { lvl: 0.55, send: 0.1, cap: 1, prio: 10, bus: `ui` } }, skillPointGained: { r: { sr: 24e3, dur: 1.4, v: 2, render(e4, t2) {
    let n2 = Q(e4, 1.2), r2 = lI(1318.5, t2 ? -2 : 0);
    return ZF(e4, n2, r2, 0, 0.6, 0.8, 0.85), ZF(e4, n2, lI(r2, 5), 0.11, 0.7, 0.9, 0.85), Z(n2, BF(e4, { dur: 1.2, count: 6, fLo: 5e3, fHi: 1e4, t0: 0.1, t1: 0.5, amp: 0.2 }), 0, 1), Z(n2, $(e4, { dur: 0.3, color: `white`, bp: [[0, 1500], [0.3, 7e3]], q: 2, env: [[0, 0], [0.2, 1, 2], [0.3, 0, -3]] }), 0, 0.15), nI(e4, n2, 1.2, 0.22, 0.3);
  } }, m: { lvl: 0.5, send: 0.1, cap: 1, prio: 9, bus: `ui` } }, waypointActivate: { r: { sr: 22050, dur: 3, v: 2, render(e4, t2) {
    let n2 = Q(e4, 2.6), r2 = lI(110, t2 ? 2 : 0);
    return Z(n2, AF(e4, { dur: 2.6, lp: 130, env: mL(0.7, 0.3, 1.6) }), 0, 1.2), Z(n2, dL(e4, 1.4, [r2, lI(r2, 7), lI(r2, 12)], 180, 2600, 5), 0, 0.5), aP(e4, n2, CF(e4, { f0: 90, f1: 42, dur: 0.6, drive: 1.6, h2: 0.25 }), 1, 0.9), [0, 7, 12, 16, 19].forEach((t3, i2) => ZF(e4, n2, lI(r2 * 8, t3), 1 + i2 * 0.06, 0.35, 1.2, 0.8)), Z(n2, zF(e4, { dur: 2.6, freqs: [lI(r2 * 8, 0), lI(r2 * 8, 7), lI(r2 * 8, 12)], env: [[0, 0], [1, 0], [1.4, 1, 2], [2.6, 0, -3]], trem: 5 }), 0, 0.18), Z(n2, BF(e4, { dur: 2.6, count: 12, fLo: 3500, fHi: 9e3, t0: 1, t1: 2, amp: 0.25 }), 0, 1), n2;
  } }, m: hL(0.62, 0.3, 2, 8) }, waypointTravel: { r: { sr: 24e3, dur: 2.4, v: 2, render(e4) {
    let t2 = Q(e4, 1.8), n2 = $(e4, { dur: 1.4, color: `white`, bp: [[0, 300], [0.7, 3200], [1.4, 500]], q: 1.2, env: [[0, 0], [0.7, 1, 2.5], [1.4, 0, -3]] });
    iF(e4, n2, [[0, 1], [0.7, 8], [1.4, 1.5]], 0.78, 0.55), Z(t2, n2, 0, 0.9);
    let r2 = zP(e4, Math.round(1 * e4.sr), [[0, 200], [1, 1600, 2]], `tri`, 0.25);
    return tP(e4, r2, [[0, 0], [0.8, 1, 2], [1, 0, -3]]), Z(t2, r2, 0, 1), aP(e4, t2, CF(e4, { f0: 240, f1: 50, dur: 0.6, sweep: 0.4, drive: 1.5, h2: 0.3 }), 0.85, 0.8), Z(t2, BF(e4, { dur: 1.8, count: 14, fLo: 3500, fHi: 9500, t0: 0.2, t1: 1.3, amp: 0.25 }), 0, 1), nI(e4, t2, 1.2, 0.28, 0.35);
  } }, m: { lvl: 0.6, send: 0.15, cap: 2, prio: 9, bus: `sfx` } }, portalOpen: { r: { sr: 24e3, dur: 2.6, v: 2, render(e4) {
    let t2 = Q(e4, 2.2), n2 = t2.length, r2 = VP(e4, n2), i2 = SF(e4, n2, 1.5);
    nF(e4, r2, `bp`, [[0, 200], [1.2, 1300, 2], [2.2, 900]], 6), XN(r2, i2, 0.7, 0.3), iF(e4, r2, [[0, 6], [1, 1], [2.2, 5]], 0.7, 0.5), tP(e4, r2, mL(0.5, 0.9, 0.8)), Z(t2, r2, 0, 1);
    let a2 = KN(n2);
    return zP(e4, n2, 55, `square`, 0.5, 0, a2), zP(e4, n2, 110.4, `saw`, 0.3, 0, a2), nF(e4, a2, `lp`, 420, 1.2), pF(e4, a2, 6, 0.8), tP(e4, a2, mL(0.4, 1, 0.8)), Z(t2, a2, 0, 0.45), Z(t2, CF(e4, { f0: 140, f1: 50, dur: 0.4, drive: 1.4 }), 0, 0.6), Z(t2, BF(e4, { dur: 2.2, count: 14, fLo: 3e3, fHi: 8e3, t0: 0.3, t1: 1.8, amp: 0.25 }), 0, 1), t2;
  } }, m: hL(0.6, 0.3, 2, 8) }, portalEnter: { r: { sr: 24e3, dur: 2, v: 2, render(e4) {
    let t2 = Q(e4, 1.4);
    return Z(t2, $(e4, { dur: 0.65, color: `pink`, lp: [[0, 300], [0.62, 7e3, 3]], env: [[0, 0], [0.62, 1, 4], [0.66, 0.2]] }), 0, 1.1), aP(e4, t2, CF(e4, { f0: 320, f1: 40, dur: 0.6, sweep: 0.35, drive: 1.8, h2: 0.3 }), 0.6, 1), aP(e4, t2, $(e4, { dur: 0.5, color: `brown`, lp: [[0, 2e3], [0.5, 200]], curve: -4 }), 0.6, 0.9), Z(t2, zF(e4, { dur: 1.4, freqs: [880, 1318.5, 1760], env: [[0, 0], [0.6, 0], [0.7, 1], [1.4, 0, -3]], trem: 9 }), 0, 0.15), nI(e4, t2, 1.2, 0.28, 0.4);
  } }, m: { lvl: 0.62, send: 0.15, cap: 2, prio: 9, bus: `sfx` } }, chestOpen: { r: { sr: 24e3, dur: 1.1, v: 2, render(e4) {
    let t2 = Q(e4, 1.1);
    return $F(e4, t2, e4.r.range(1150, 1450), 0, 0.3, 0.15, 0.01), Z(t2, wF(e4, 2500, 4e-3), 0, 0.6), aP(e4, t2, NF(e4, { dur: 0.6, rate: [[0, 22], [0.3, 70], [0.6, 40]], res: [{ f: 320, d: 0.05, a: 1 }, { f: 740, d: 0.04, a: 0.7 }, { f: 1500, d: 0.03, a: 0.4 }, { f: 2600, d: 0.02, a: 0.2 }], env: mL(0.12, 0.3, 0.18), noise: 0.3 }), 0.08, 0.8), aP(e4, t2, CF(e4, { f0: 120, f1: 68, dur: 0.16, drive: 1.3 }), 0.7, 0.9), aP(e4, t2, $(e4, { dur: 0.12, color: `brown`, lp: 800 }), 0.7, 0.7), eI(e4, t2, e4.r.range(180, 230), 0.7, 0.5, 0.08), t2;
  } }, m: hL(0.6, 0.12, 2, 6) }, barrelBreak: { r: { sr: 24e3, dur: 1, v: 2, render(e4) {
    let t2 = Q(e4, 1);
    Z(t2, $(e4, { dur: 0.03, color: `white`, hp: 900, att: 3e-4, curve: -7 }), 0, 1), Z(t2, CF(e4, { f0: 135, f1: 60, dur: 0.16, drive: 1.5 }), 0, 0.9), [0, 0.018, 0.05, 0.09].forEach((n3, r2) => eI(e4, t2, e4.r.range(240, 700), n3, 0.8 * 0.7 ** r2, 0.07)), Z(t2, kF(e4, { dur: 1, count: 26, t0: 4e-3, spread: 0.12, fLo: 700, fHi: 3600, decay: 0.022, amp: 0.7, fall: 3 }), 0, 1);
    let n2 = WP(e4, Math.round(0.14 * e4.sr), [[0, 1500], [0.14, 100]], 1.2);
    return nF(e4, n2, `hp`, 2200), Z(t2, n2, 0, 1.4), Z(t2, kF(e4, { dur: 1, count: 7, t0: 0.15, spread: 0.22, fLo: 280, fHi: 900, decay: 0.07, amp: 0.6, fall: 1.5 }), 0, 1), t2;
  } }, m: hL(0.68, 0.12, 3, 5) }, doorOpen: { r: { sr: 24e3, dur: 1.5, v: 2, render(e4) {
    let t2 = Q(e4, 1.5);
    return $F(e4, t2, e4.r.range(800, 1e3), 0, 0.25, 0.15, 0.01), eI(e4, t2, 160, 0, 0.6, 0.1), Z(t2, wF(e4, 2200, 5e-3), 0, 0.5), aP(e4, t2, NF(e4, { dur: 1.1, rate: [[0, 16], [0.5, 48], [1.1, 24]], jitter: 0.3, res: [{ f: 180, d: 0.07, a: 1 }, { f: 430, d: 0.05, a: 0.8 }, { f: 920, d: 0.035, a: 0.45 }, { f: 1750, d: 0.025, a: 0.25 }], env: mL(0.2, 0.6, 0.3), noise: 0.35 }), 0.1, 0.9), aP(e4, t2, TF(e4, { dur: 0.9, peak: 0.5, f0: 150, fp: 400, f1: 200, q: 0.7 }), 0.2, 0.3), aP(e4, t2, CF(e4, { f0: 110, f1: 60, dur: 0.15 }), 1.25, 0.5), t2;
  } }, m: hL(0.6, 0.15, 2, 6) }, shrine: { r: { sr: 24e3, dur: 3, v: 2, rms: 0.16, render(e4, t2) {
    let n2 = Q(e4, 2.5), r2 = lI(220, t2 ? 2 : 0);
    for (let t3 of [0, 4, 7, 12]) Z(n2, RF(e4, { dur: 2.5, f0: lI(r2, t3), vowels: [[0, `a`], [1.5, `o`]], breath: 0.3, jitter: 4e-3, shimmer: 0.04, vibrato: 8e-3, vibRate: 5 + e4.r.next(), env: mL(0.6, 0.9, 0.9), scale: t3 >= 7 ? 1.12 : 1, tilt: 3200 }), 0, 0.25);
    ZF(e4, n2, lI(r2, 12), 0, 0.6, 2.2, 0.7), Z(n2, BF(e4, { dur: 2.5, count: 10, fLo: 3500, fHi: 8e3, t0: 0.2, t1: 1.6, amp: 0.2 }), 0, 1);
    let i2 = zP(e4, n2.length, lI(r2, -12), `sine`, 0.3);
    return tP(e4, i2, mL(0.5, 1, 0.9)), Z(n2, i2, 0, 1), nI(e4, n2, 1.8, 0.36, 0.4);
  } }, m: { lvl: 0.6, send: 0.15, cap: 1, prio: 8, bus: `sfx` } }, stashOpen: { r: { sr: 24e3, dur: 0.8, v: 2, render(e4) {
    let t2 = Q(e4, 0.8);
    return $F(e4, t2, e4.r.range(1e3, 1300), 0, 0.35, 0.18, 0.01), Z(t2, wF(e4, 3e3, 3e-3), 0, 0.6), aP(e4, t2, NF(e4, { dur: 0.32, rate: [[0, 30], [0.32, 60]], res: [{ f: 350, d: 0.04, a: 1 }, { f: 800, d: 0.03, a: 0.6 }, { f: 1700, d: 0.02, a: 0.3 }], env: mL(0.06, 0.18, 0.08) }), 0.06, 0.6), aP(e4, t2, CF(e4, { f0: 125, f1: 70, dur: 0.14 }), 0.42, 0.8), eI(e4, t2, 200, 0.42, 0.5, 0.07), t2;
  } }, m: { lvl: 0.55, send: 0.08, cap: 1, prio: 7, bus: `ui` } }, footstepDirt: { r: { sr: 22050, dur: 0.16, v: 3, render(e4) {
    let t2 = Q(e4, 0.16);
    return Z(t2, CF(e4, { f0: e4.r.range(80, 100), f1: 52, dur: 0.06 }), 0, 0.6), Z(t2, kF(e4, { dur: 0.16, count: 6, t0: 2e-3, spread: 0.02, fLo: 600, fHi: 2200, decay: 0.012, amp: 0.6 }), 0, 1), Z(t2, $(e4, { dur: 0.07, color: `pink`, lp: 1200, att: 4e-3 }), 0, 0.6), t2;
  } }, m: { lvl: 0.15, send: 0, cap: 3, prio: 1, bus: `sfx` } }, footstepStone: { r: { sr: 22050, dur: 0.14, v: 3, render(e4) {
    let t2 = Q(e4, 0.14);
    return Z(t2, wF(e4, e4.r.range(1800, 2600), 4e-3), 0, 0.7), Z(t2, CF(e4, { f0: e4.r.range(130, 150), f1: 90, dur: 0.045 }), 0, 0.5), Z(t2, kF(e4, { dur: 0.14, count: 3, t0: 3e-3, spread: 0.015, fLo: 1500, fHi: 4e3, decay: 8e-3, amp: 0.3 }), 0, 1), Z(t2, $(e4, { dur: 0.03, bp: 1e3, q: 2 }), 0, 0.35), t2;
  } }, m: { lvl: 0.13, send: 0, cap: 3, prio: 1, bus: `sfx` } }, footstepGrass: { r: { sr: 22050, dur: 0.18, v: 3, render(e4) {
    let t2 = Q(e4, 0.18);
    return Z(t2, FF(e4, { dur: 0.15, rate: 420, fLo: 1800, fHi: 7e3, env: iP(0.01, 0.14, -3), grain: [2e-3, 0.012] }), 0, 0.8), Z(t2, CF(e4, { f0: 80, f1: 50, dur: 0.05 }), 0, 0.35), t2;
  } }, m: { lvl: 0.12, send: 0, cap: 3, prio: 1, bus: `sfx` } }, thunder: { r: { sr: 16e3, dur: 4.6, v: 2, rms: 0.2, render: (e4, t2) => pL(e4, t2) }, m: { lvl: 0.75, send: 0.25, cap: 2, prio: 6, bus: `sfx` } }, crowCaw: { r: { sr: 22050, dur: 1.6, v: 2, render(e4) {
    let t2 = Q(e4, 1.6), n2 = e4.r.int(2, 3), r2 = 0.02;
    for (let i2 = 0; i2 < n2; i2++) {
      let n3 = e4.r.range(0.22, 0.3), a2 = e4.r.range(480, 600);
      aP(e4, t2, RF(e4, { dur: n3, f0: [[0, a2 * 0.9], [n3 * 0.3, a2 * 1.08], [n3, a2 * 0.82]], vowels: [[0, `ae`], [n3 * 0.6, `a`]], scale: 1.55, rough: 0.55, breath: 0.55, jitter: 0.07, drive: 2.5, tilt: 4e3, env: [[0, 0], [0.02, 1], [n3 * 0.7, 0.8], [n3, 0, -3]] }), r2, 0.8 ** i2), r2 += n3 + e4.r.range(0.12, 0.22);
    }
    return t2;
  } }, m: { lvl: 0.42, send: 0.35, cap: 2, prio: 2, bus: `sfx` } }, distantHowl: { r: { sr: 16e3, dur: 4, v: 2, render(e4, t2) {
    let n2 = Q(e4, 3.2), r2 = (t3, r3, i2) => {
      aP(e4, n2, RF(e4, { dur: 2.7, f0: [[0, t3 * 0.62], [0.35, t3, -2], [1.6, t3 * 1.03], [2.25, t3 * 0.78, -1], [2.7, t3 * 0.56]], vowels: [[0, `u`], [0.4, `o`], [2, `u`]], breath: 0.12, jitter: 4e-3, shimmer: 0.03, vibrato: 0.012, vibRate: 5.2, scale: 1.15, tilt: 2200, env: [[0, 0], [0.3, 1, 2], [2, 0.8], [2.7, 0, -3]] }), r3, i2);
    };
    return r2(e4.r.range(500, 560), 0, 1), t2 === 1 && r2(e4.r.range(600, 660), 0.7, 0.6), rF(e4, n2, 2600), nI(e4, n2, 2.4, 0.5, 0.6);
  } }, m: { lvl: 0.45, send: 0.35, cap: 2, prio: 2, bus: `sfx` } } };
}));
function vL(e4) {
  return yL[e4];
}
var yL, bL, xL = t((() => {
  ZI(), aL(), uL(), _L(), yL = { ...lL, ...gL, ...XI, ...iL }, bL = Object.keys(yL);
}));
function SL(e4) {
  return e4.byteOffset === 0 && e4.byteLength === e4.buffer.byteLength ? e4 : e4.slice();
}
function CL() {
  let e4 = [];
  kL().forEach((t2, n2) => e4.push({ desc: { k: `inst`, i: n2 }, w: t2.weight, music: true })), AL().forEach((t2, n2) => e4.push({ desc: { k: `amb`, i: n2 }, w: t2.weight, music: true }));
  for (let t2 of bL) {
    let n2 = vL(t2);
    if (!n2) continue;
    let r2 = n2.r.v ?? 2;
    for (let i2 = 0; i2 < r2; i2++) e4.push({ desc: { k: `sfx`, id: t2, v: i2 }, w: n2.r.dur * (n2.r.sr / 24e3) * 0.8, music: false });
  }
  return e4;
}
function wL(e4, t2) {
  return NN(e4) + Math.imul(t2 + 1, 2654435761) >>> 0;
}
function TL(e4, t2) {
  let n2 = vL(e4);
  return n2 ? JN(() => {
    let r2 = GN(n2.r.sr, wL(e4, t2)), i2 = n2.r.render(r2, t2), a2 = Array.isArray(i2) ? i2 : [i2], o2 = !!n2.r.loop;
    return { name: e4, root: 0, variant: t2, chans: fP(r2, a2, { rms: n2.r.rms ?? 0.2, trim: !o2, tail: o2 ? 0 : 0.012, keepDc: o2 }).map(SL), sr: n2.r.sr, loop: o2 };
  }) : null;
}
function EL(e4) {
  let t2 = typeof performance < `u` ? performance.now() : Date.now(), n2 = [];
  if (e4.k === `inst`) {
    let t3 = kL()[e4.i];
    n2 = JN(() => t3.run().map((e5) => ({ name: t3.inst, root: e5.root, variant: 0, chans: e5.chans.map(SL), sr: e5.sr, loop: e5.loop })));
  } else if (e4.k === `amb`) {
    let t3 = AL()[e4.i];
    n2 = JN(() => t3.run().map((e5, n3) => ({ name: t3.name, root: 0, variant: n3, chans: e5.chans.map(SL), sr: e5.sr, loop: e5.loop })));
  } else {
    let t3 = TL(e4.id, e4.v);
    t3 && (n2 = [t3]);
  }
  let r2 = (typeof performance < `u` ? performance.now() : Date.now()) - t2;
  return { desc: e4, items: n2, ms: r2 };
}
var DL, OL, kL, AL, jL = t((() => {
  CI(), CP(), FN(), KI(), xL(), DL = null, OL = null, kL = () => DL ??= WI(), AL = () => OL ??= SI();
}));
function ML(e4) {
  let t2;
  try {
    if (t2 = PL && (self.URL || self.webkitURL).createObjectURL(PL), !t2) throw ``;
    let n2 = new Worker(t2, { name: e4?.name });
    return n2.addEventListener(`error`, () => {
      (self.URL || self.webkitURL).revokeObjectURL(t2);
    }), n2;
  } catch {
    return new Worker(`data:text/javascript;charset=utf-8,` + encodeURIComponent(NL), { name: e4?.name });
  }
}
var NL, PL, FL = t((() => {
  NL = "(function(){var e=class{s;constructor(e){this.s=e>>>0||2654435769}next(){this.s=this.s+1831565813>>>0;let e=this.s;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}log(e,t){return e*(t/e)**+this.next()}int(e,t){return e+Math.floor(this.next()*(t-e+1))}chance(e){return this.next()<e}bi(){return this.next()*2-1}pick(e){return e[Math.floor(this.next()*e.length)%e.length]}weighted(e){let t=0;for(let n of e)t+=n[1];let n=this.next()*t;for(let t of e)if(n-=t[1],n<=0)return t[0];return e[e.length-1][0]}gauss(){let e=0;for(;e===0;)e=this.next();return Math.sqrt(-2*Math.log(e))*Math.cos(2*Math.PI*this.next())}expo(e){return-Math.log(1-this.next()*.999999)*e}u32(){return this.next()*4294967296>>>0}};function t(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return t>>>0}function n(t,n){return{sr:t,r:new e(n)}}let r=1e-20,i=null,a=0,o=0;function s(e){if(o>0&&i&&a+e<=i.length){let t=i.subarray(a,a+e);return a+=e,t.fill(0),t}return new Float32Array(e)}function c(e){let t=s(e.length);return t.set(e),t}function l(e){i||=new Float32Array(3e6);let t=a;o++;try{return e()}finally{o--,a=o>0?t:0}}function u(){o===0&&(i=null)}let d=(e,t)=>Math.max(1,Math.round(t*e.sr)),f=(e,t)=>s(d(e,t)),p=e=>440*2**((e-69)/12);var m=class{t;v;c;k=0;expo;constant;constructor(e,t=!1){this.expo=t;let n=typeof e==`number`?[[0,e]]:e.length?e:[[0,0]],r=n.length;this.t=Array(r),this.v=Array(r),this.c=Array(r);for(let e=0;e<r;e++)this.t[e]=n[e][0],this.v[e]=t?Math.log(Math.max(1e-6,n[e][1])):n[e][1],this.c[e]=n[e][2]??0;this.constant=r===1}at(e){let t=this.t,n=t.length;if(n===1||e<=t[0])return this.out(this.v[0]);if(e>=t[n-1])return this.out(this.v[n-1]);for(e<t[this.k]&&(this.k=0);this.k<n-2&&e>=t[this.k+1];)this.k++;let r=this.k,i=t[r+1]-t[r],a=i>0?(e-t[r])/i:1,o=this.c[r+1];return o!==0&&(a=(1-Math.exp(o*a))/(1-Math.exp(o))),this.out(this.v[r]+(this.v[r+1]-this.v[r])*a)}out(e){return this.expo?Math.exp(e):e}};function h(e,t,n,r){let i=Math.min(e.length,t.length);for(let a=0;a<i;a++)e[a]*=n+r*t[a];return e}function g(e){for(let t=0;t<e.length;t++)e[t]<0&&(e[t]=-e[t]);return e}function _(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)e[r]*=t[r];return e}function v(e,t,n,r){let i=Math.min(e.length,t.length);for(let a=0;a<i;a++)e[a]*=n+r*(t[a]<0?-t[a]:t[a]);return e}function ee(e,t,n,r){let i=Math.min(e.length,t.length,n.length);for(let a=0;a<i;a++)e[a]+=t[a]*n[a]*r;return e}function y(e,t,n,r=0){let i=t.length,a=e.sr,o=r,s=n[0][1],c=r+Math.round(n[0][0]*a),l=Math.min(c,i);for(;o<l;o++)t[o]*=s;for(let e=1;e<n.length&&o<i;e++){let l=n[e],u=r+Math.round(l[0]*a),d=l[1],f=l[2]??0,p=u-c;if(p<=0){s=d,c=u;continue}let m=Math.min(u,i);if(Math.abs(f)<1e-4){let e=(d-s)/p;b(t,o,m,s+e*(o-c),e)}else{let e=1-Math.exp(f);te(t,o,m,s,(d-s)/e,Math.exp(f*(o-c)/p),Math.exp(f/p))}o=Math.max(o,m),s=d,c=u}if(s!==1)for(;o<i;o++)t[o]*=s;return t}function b(e,t,n,r,i){for(let a=t;a<n;a++)e[a]*=r,r+=i}function te(e,t,n,r,i,a,o){for(let s=t;s<n;s++)e[s]*=r+i*(1-a),a*=o}function x(e,t,n=-5,r=1){return[[0,0],[e,r],[e+t,0,n]]}function S(e,t,n=0,r=1){let i=Math.round(n),a=Math.max(0,-i),o=Math.min(t.length,e.length-i);for(let n=a;n<o;n++)e[i+n]+=t[n]*r;return e}function C(e,t,n,r,i=1){return S(t,n,r*e.sr,i)}function ne(e,t){for(let n=0;n<e.length;n++)e[n]*=t;return e}function re(e,t,n){let r=Math.min(t.length,d(e,n)),i=t.length;for(let e=0;e<r;e++)t[i-1-e]*=e/r;return t}function ie(e,t){let n=Math.max(64,Math.round(.05*e.sr)),r=Math.exp(-2*Math.PI*120/e.sr),i=0;for(let e of t){i=Math.max(i,oe(e,n,r));let t=e.length%n;t*4>n&&(i=Math.max(i,ae*n/t))}return Math.sqrt(i/n)}let ae=0;function oe(e,t,n){let i=0,a=0,o=0,s=0,c=r;for(let r=0;r<e.length;r++){a=n*a+(1-n)*(e[r]+c),c=-c;let l=e[r]-a;o+=l*l,++s===t&&(o>i&&(i=o),o=0,s=0)}return ae=o,i}function se(e,t){let n=0;for(let r of e)for(let e=r.length-1;e>n;e--)if(r[e]>t||r[e]<-t){n=e;break}return n}function ce(e,t){let n=0,i=0,a=0,o=r;for(let r=0;r<e.length;r++){let s=e[r];if((s!==s||s>64||s<-64)&&(s=0),t<1){let e=s+o;o=-o,s=e-i+t*a,i=e,a=s}e[r]=s,s>n?n=s:-s>n&&(n=-s)}return n}function w(e,t,n={}){let r=n.rms??.2,i=n.peak??.95,a=0,o=n.keepDc?1:1-2*Math.PI*18/e.sr;for(let e of t)a=Math.max(a,ce(e,o));if(a<1e-9)return t;let s=ie(e,t),c=s>1e-9?r/s:i/a;a*c>i&&(c=i/a);for(let e of t)ne(e,c);let l=t;if(n.trim!==!1){let n=se(t,i*.0032),r=Math.min(t[0].length,n+Math.round(.02*e.sr));r<t[0].length-32&&(l=t.map(e=>e.subarray(0,r)))}let u=n.tail??.012;if(u>0)for(let t of l)re(e,t,Math.min(u,t.length/e.sr*.5));return l}function le(e,t,n){let r=Math.min(Math.floor(t.length/3),d(e,n)),i=t.length-r,a=t.subarray(0,i);for(let e=0;e<r;e++){let n=e/r,o=Math.sin(n*Math.PI*.5),s=Math.cos(n*Math.PI*.5);a[e]=t[e]*o+t[i+e]*s}return a}function ue(e,t,n){let r=e.length;for(let n=1,i=0;n<r;n++){let a=r>>1;for(;i&a;a>>=1)i^=a;if(i^=a,n<i){let r=e[n];e[n]=e[i],e[i]=r,r=t[n],t[n]=t[i],t[i]=r}}let i=n?1:-1;for(let n=2;n<=r;n<<=1){let a=i*2*Math.PI/n,o=Math.cos(a),s=Math.sin(a),c=n>>1;for(let i=0;i<r;i+=n){let n=1,r=0;for(let a=0;a<c;a++){let l=i+a,u=l+c,d=e[u]*n-t[u]*r,f=e[u]*r+t[u]*n;e[u]=e[l]-d,t[u]=t[l]-f,e[l]+=d,t[l]+=f;let p=n*o-r*s;r=n*s+r*o,n=p}}}}let T=4096,E=new Float64Array(T),de=new Float64Array(T);for(let e=0;e<T;e++)E[e]=Math.cos(2*Math.PI*e/T),de[e]=Math.sin(2*Math.PI*e/T);let fe=new Map;function pe(e){let t=fe.get(e);return t||(t=[new Float64Array(e),new Float64Array(e),new Float64Array(e>>1),new Float64Array(e>>1)],fe.set(e,t)),t}function me(){fe.clear()}function he(e,t,n,r){let i=t>>1;r.fill(0);let a=e.bwScale??1,o=Math.min(e.maxF??n*.45,n*.45);for(let s=1;;s++){let c=e.f0*s*(1+(e.stretch??0)*(s-1));if(c>=o)break;let l=e.amp(s,c);if(l<=1e-5)continue;let u=(2**(e.bw/1200)-1)*e.f0*s**+a,d=Math.max(u/2,n/t),f=c/n*t,p=d/n*t,m=Math.max(1,Math.floor(f-3*p)),h=Math.min(i-1,Math.ceil(f+3*p)),g=l/Math.sqrt(p);for(let e=m;e<=h;e++){let t=(e-f)/p;r[e]+=Math.exp(-t*t)*g}}for(let a of e.noise??[]){let e=a.f/n*t,o=Math.max(1,a.w/n*t),s=Math.max(1,Math.floor(e-3*o)),c=Math.min(i-1,Math.ceil(e+3*o)),l=a.a/Math.sqrt(o);for(let t=s;t<=c;t++){let n=(t-e)/o;r[t]+=Math.exp(-n*n)*l}}return r}function ge(t,n,r,i,a=.8){let o=new e(i),s=[];for(let e=0;e<r.length;e+=2){let[i,c,l,u]=pe(n);i.fill(0),c.fill(0);let d=he(r[e],n,t,l),f=e+1<r.length?he(r[e+1],n,t,u):null;_e(i,c,d,f,o),ue(i,c,!0),s.push(ve(i,a)),f&&s.push(ve(c,a))}return s}function _e(e,t,n,r,i){let a=e.length,o=a>>1;for(let s=1;s<o;s++){let o=n[s],c=r?r[s]:0;if(o===0&&c===0)continue;let l=i.u32()&T-1,u=o*E[l],d=o*de[l],f=0,p=0;if(c!==0){let e=i.u32()&T-1;f=c*E[e],p=c*de[e]}e[s]=u-p,t[s]=d+f,e[a-s]=u+p,t[a-s]=f-d}}function ve(e,t){let n=e.length,r=0;for(let t=0;t<n;t++){let n=e[t]<0?-e[t]:e[t];n>r&&(r=n)}let i=r>0?t/r:0,a=new Float32Array(n);for(let t=0;t<n;t++)a[t]=e[t]*i;return a}function D(e,t,n){let r=(e-t)/n;return Math.exp(-r*r)}let O=4096,k=(()=>{let e=new Float32Array(O+1);for(let t=0;t<=O;t++)e[t]=Math.sin(2*Math.PI*t/O);return e})();function A(e){let t=(e-Math.floor(e))*O,n=t|0;return k[n]+(k[n+1]-k[n])*(t-n)}let ye={sine:0,tri:1,saw:2,square:3};function be(e,t){return e<t?(e/=t,e+e-e*e-1):e>1-t?(e=(e-1)/t,e*e+e+e+1):0}function j(e,t,n,r=`sine`,i=1,a=0,o,c=0,l=.5){let u=o??s(t),d=e.sr,f=new m(n,!0),p=f.constant,h=ye[r],g=a-Math.floor(a),_=f.at(0)/d,v=Math.min(t,u.length-c);for(let e=0;e<v;e++){!p&&!(e&15)&&(_=Math.min(.49,f.at(e/d)/d));let t;switch(h){case 0:{let e=g*O,n=e|0;t=k[n]+(k[n+1]-k[n])*(e-n);break}case 1:t=g<.5?4*g-1:3-4*g;break;case 2:t=2*g-1-be(g,_);break;default:{t=g<l?1:-1,t+=be(g,_);let e=g-l;e<0&&(e+=1),t-=be(e,_)}}u[c+e]+=t*i,g+=_,g>=1&&--g}return u}function xe(e,t,n,r,i,a=1,o,c=0){let l=o??s(t),u=e.sr,d=new m(n,!0),f=new m(i,!1),p=0,h=0,g=d.at(0)/u,_=f.at(0)/(2*Math.PI),v=Math.min(t,l.length-c);for(let e=0;e<v;e++){if(!(e&15)){let t=e/u;g=Math.min(.49,d.at(t)/u),_=f.at(t)/(2*Math.PI)}let t=A(h);l[c+e]+=A(p+_*t)*a,p+=g,h+=g*r,p>=1&&--p,h>=1&&(h-=Math.floor(h))}return l}function M(e,t,n=1){let r=s(t),i=e.r.u32()|1,a=n*4656612873e-19;for(let e=0;e<t;e++)i^=i<<13,i^=i>>>17,i^=i<<5,r[e]=(i|0)*a;return r}function Se(e,t,n=1){let r=M(e,t,1),i=0,a=0,o=0,s=n*.32;for(let e=0;e<t;e++){let t=r[e];i=.99765*i+t*.099046,a=.963*a+t*.2965164,o=.57*o+t*1.0526913,r[e]=(i+a+o+t*.1848)*s}return r}function Ce(e,t,n=1){let r=M(e,t,1),i=0,a=1-20/e.sr,o=n*Math.sqrt(e.sr/22050)*.09;for(let e=0;e<t;e++)i=i*a+r[e],r[e]=i*o;return r}function N(e,t,n,r=2,i=1,a){let o=a??s(t),c=e.r,l=new m(n,!1),u=e.sr,d=0,f=t/u;for(;;){let e=Math.max(.01,l.at(d));if(d+=c.expo(1/e),d>=f)break;let t=Math.floor(d*u);o[t]+=i*c.next()**+r*(c.next()<.5?-1:1)}return o}function P(e,t,n,r,i=0){let a=r??s(t),o=e.sr;for(let e of n){if(e.f<=0||e.f>=o*.46||e.a===0)continue;let n=2*Math.PI*e.f/o,r=Math.exp(-6.9078/(Math.max(.002,e.d)*o)),s=2*r*Math.cos(n),c=r*r,l=2*Math.PI*(e.ph??0),u=e.a*Math.sin(l-n)/r,d=e.a*Math.sin(l-2*n)/c;we(a,i,Math.min(t,a.length-i,Math.ceil(e.d*1.15*o)),s,c,u,d)}return a}function we(e,t,n,r,i,a,o){for(let s=0;s<n;s++){let n=r*a-i*o;e[t+s]+=n,o=a,a=n}}function Te(e,t,n,r){let i=r??s(t.length),a=e.sr,o=Math.min(t.length,i.length);for(let e of n){if(e.f<=0||e.f>=a*.46||e.a===0)continue;let n=2*Math.PI*e.f/a,r=Math.exp(-6.9078/(Math.max(.002,e.d)*a)),s=2*r*Math.cos(n),c=r*r;Ee(t,i,o,e.a*(1-r)*2*Math.max(.05,Math.sin(n)),s,c)}return i}function Ee(e,t,n,i,a,o){let s=0,c=0;for(let l=0;l<n;l++){let n=i*(e[l]+(l&1?r:-r))+a*s-o*c;t[l]+=n,c=s,s=n}}function De(e,t,n,r,i){let a=s(t),o=0,c=.08+r*.85,l=n|1;for(let e=0;e<t;e++)l^=l<<13,l^=l>>>17,l^=l<<5,o+=c*((l|0)*4656612873e-19-o),a[e]=o;let u=Math.max(1,Math.round(i*t)),d=0;for(let n=0;n<t;n++){let t=a[n]-(n>=u?a[n-u]:0);e[n]=t,d+=t}d/=t;for(let n=0;n<t;n++)e[n]-=d}function Oe(e,t,n,i,a,o,s,c,l){let u=0,d=0,f=0,p=0;for(let m=0;m<a;m++){let a=e[u],h=o*((1-s)*a+s*d)+(m&1?r:-r);d=a;let g=c*h+f-c*p;f=h,p=g,e[u]=g,n[i+m]+=a*l,u++,u>=t&&(u=0)}}function ke(e,t,n,r,i,a=0,o=1){let c=i??s(t),l=e.sr,u=.5-(r.bright??.2)*.42,d=Math.min(t,c.length-a);for(let t=0;t<2;t++){let i=t===0?n:n*2**((r.detune??.9)/1200),f=l/i-u,p=Math.max(2,Math.floor(f-.15)),m=f-p,h=(1-m)/(1+m),g=10**(-3/(r.t60*i)),_=s(p+2);De(_,p,e.r.u32(),r.hard??.5,r.pick??.18),Oe(_,p,c,a,d,g,u,h,o*(t===0?1:.55))}return c}function F(e,t,n,i,a=.707,o=0,s=0,c=t.length){let l=e.sr,u=1/Math.max(.05,a),d=l*.45,f=new m(i,!0),p=f.constant,h=0,g=0,_=0;switch(n){case`lp`:h=1;break;case`bp`:g=u;break;case`hp`:h=-1,g=-u,_=1;break;case`notch`:g=-u,_=1;break;case`peak`:g=(10**(o/20)-1)*u,_=1;break}let v=0,ee=0,y=0,b=0,te=0;{let e=Math.min(d,Math.max(8,f.at(s/l))),t=Math.tan(Math.PI*e/l);y=1/(1+t*(t+u)),b=t*y,te=t*b}let x=r;for(let e=s;e<c;e++){if(!p&&!(e-s&15)){let t=Math.min(d,Math.max(8,f.at(e/l))),n=Math.tan(Math.PI*t/l);y=1/(1+n*(n+u)),b=n*y,te=n*b}let n=t[e]+x;x=-x;let r=n-ee,i=y*v+b*r,a=ee+b*v+te*r;v=2*i-v,ee=2*a-ee,t[e]=h*a+g*i+_*n}return t}function I(e,t,n){let i=1-Math.exp(-2*Math.PI*n/e.sr),a=0,o=r;for(let e=0;e<t.length;e++)a+=i*(t[e]+o-a),o=-o,t[e]=a;return t}function Ae(e,t,n,i=.6,a=.5){let o=e.sr,c=new m(n,!1),l=Math.ceil(o*.03)+4,u=s(l),d=0,f=c.at(0)*o/1e3;for(let e=0;e<t.length;e++){e&7||(f=Math.min(l-3,Math.max(1,c.at(e/o)*o/1e3)));let n=d-f;n<0&&(n+=l),n>=l&&(n-=l);let s=n|0,p=n-s,m=s+1>=l?0:s+1,h=u[s]+(u[m]-u[s])*p,g=t[e];u[d]=g+h*i+(e&1?r:-r),t[e]=g*(1-a)+h*a,++d>=l&&(d=0)}return t}let je={a:{f:[730,1090,2440,3400],bw:[90,110,160,250],g:[0,-5,-16,-22]},e:{f:[530,1840,2480,3500],bw:[70,100,160,250],g:[0,-8,-14,-22]},i:{f:[290,2250,3e3,3700],bw:[60,100,170,250],g:[0,-14,-18,-24]},o:{f:[570,840,2410,3400],bw:[80,90,160,250],g:[0,-3,-22,-28]},u:{f:[320,870,2240,3300],bw:[60,90,160,250],g:[0,-10,-26,-30]},ae:{f:[660,1720,2410,3400],bw:[90,110,160,250],g:[0,-4,-14,-22]},uh:{f:[560,1190,2390,3400],bw:[80,100,160,250],g:[0,-5,-18,-24]},er:{f:[490,1350,1690,3300],bw:[80,100,150,250],g:[0,-6,-10,-24]}};function Me(e,t,n,r=1,i=1,a=3){let o=s(t.length),c=new m(r,!1);for(let r=0;r<a;r++){let a=[];for(let[e,t]of n)a.push([e,je[t].f[r]]);let s=[];for(let[e,t]of n)s.push([e,10**(je[t].g[r]/20)]);Ne(t,o,e.sr,new m(a,!0),new m(s,!1),c,je[n[0][1]].bw[r]*i)}return o}function Ne(e,t,n,i,a,o,s){let c=n*.45,l=0,u=0,d=0,f=0,p=0,m=1,h=e.length;for(let g=0;g<h;g++){if(!(g&15)){let e=g/n,t=o.at(e),r=Math.min(c,Math.max(40,i.at(e)*t)),l=Math.max(20,s*Math.sqrt(t))/r,u=Math.tan(Math.PI*r/n);d=1/(1+u*(u+l)),f=u*d,p=u*f,m=a.at(e)*l}let h=e[g]+(g&1?r:-r)-u,_=d*l+f*h,v=u+f*l+p*h;l=2*_-l,u=2*v-u,t[g]+=_*m}}function Pe(e){if(e>3)return 1;if(e<-3)return-1;let t=e*e;return e*(27+t)/(27+9*t)}function L(e,t,n=0){let r=Pe(n),i=1/Math.max(.05,Pe(t+n)-r);for(let a=0;a<e.length;a++)e[a]=(Pe(e[a]*t+n)-r)*i;return e}function Fe(e,t){for(let n=0;n<e.length;n++)e[n]=Pe(e[n]*t);return e}function Ie(e,t,n=1){let r=2**(t-1),i=0,a=0;for(let t=0;t<e.length;t++)i--<=0&&(a=Math.round(e[t]*r)/r,i=n-1),e[t]=a;return e}function Le(e,t,n,r,i=0){let a=new m(n,!0),o=i,s=a.at(0)/e.sr;for(let n=0;n<t.length;n++)n&15||(s=a.at(n/e.sr)/e.sr),t[n]*=1-r*(.5+.5*A(o)),o+=s;return t}let Re=[29.7,37.1,41.1,43.7,47.3,53.9,59.6,67.3],ze=[4.71,3.63,11.3];function Be(e,t,n){let i=s(t),a=0,o=e.length;for(let s=0;s<o;s++){let o=i[a],c=e[s]+n*o+(s&1?r:-r);i[a]=c,e[s]=o-n*c,++a>=t&&(a=0)}}function Ve(e,t,n,i,a,o,c,l,u,d){let f=a[0],p=a[1],m=a[2],h=a[3],g=a[4],_=a[5],v=a[6],ee=a[7],y=o[0],b=o[1],te=o[2],x=o[3],S=o[4],C=o[5],ne=o[6],re=o[7],ie=s(f),ae=s(p),oe=s(m),se=s(h),ce=s(g),w=s(_),le=s(v),ue=s(ee),T=c,E=1-c,de=l*.7,fe=0,pe=0,me=0,he=0,ge=0,_e=0,ve=0,D=0,O=0,k=0,A=0,ye=0,be=0,j=0,xe=0,M=0,Se=t.length,Ce=e.length;for(let a=0;a<Ce;a++){let o=e[a]*.5+(a&1?r:-r);O=E*ie[fe]+T*O,k=E*ae[pe]+T*k,A=E*oe[me]+T*A,ye=E*se[he]+T*ye,be=E*ce[ge]+T*be,j=E*w[_e]+T*j,xe=E*le[ve]+T*xe,M=E*ue[D]+T*M;let s=O+k,c=O-k,Ce=A+ye,N=A-ye,P=be+j,we=be-j,Te=xe+M,Ee=xe-M,De=s+Ce,Oe=s-Ce,ke=c+N,F=c-N,I=P+Te,Ae=P-Te,je=we+Ee,Me=we-Ee;ie[fe]=o+(De+I)*y,ae[pe]=o-(ke+je)*b,oe[me]=o+(Oe+Ae)*te,se[he]=o-(F+Me)*x,ce[ge]=o+(De-I)*S,w[_e]=o-(ke-je)*C,le[ve]=o+(Oe-Ae)*ne,ue[D]=o-(F-Me)*re,++fe>=f&&(fe=0),++pe>=p&&(pe=0),++me>=m&&(me=0),++he>=h&&(he=0),++ge>=g&&(ge=0),++_e>=_&&(_e=0),++ve>=v&&(ve=0),++D>=ee&&(D=0);let Ne=a<Se?t[a]*u:0;d?(n[a]=Ne+(O-A+be-xe)*l,i[a]=Ne+(k-ye+j-M)*l):n[a]=Ne+(O-ye+j-xe)*de}}function He(e,t,n){let r=e.sr,i=n.tail??n.t60*.8,a=t.length+Math.round(i*r),o=n.size??1,c=Math.min(.95,Math.max(0,n.damp??.35)),l=Math.round((n.pre??.012)*r),u=s(a);u.set(t.subarray(0,Math.max(0,Math.min(t.length,a-l))),l);for(let e of ze)Be(u,Math.max(1,Math.round(e*o*r/1e3)),.62);let d=Re.map(e=>Math.max(8,Math.round(e*o*r/1e3))),f=1/Math.sqrt(8),p=d.map(e=>f*10**(-3*e/(r*n.t60))),m=s(a),h=n.stereo?s(a):m;return Ve(u,t,m,h,d,p,c,n.wet??.35,n.dry??1,!!n.stereo),n.stereo?[m,h]:[m]}function Ue(e,t,n){return He(e,t,{...n,stereo:!1})[0]}let We=(e,t,n=`white`)=>n===`pink`?Se(e,t):n===`brown`?Ce(e,t):M(e,t);function Ge(e,t,n){let r=n.bi(),i=n.bi(),a=0,o=e.length;for(let s=0;s<o;s++)a>=t&&(a=0,r=i,i=n.bi()),e[s]=r+(i-r)*(a/t),a++}function R(e,t,n){let r=s(t);return Ge(r,Math.max(2,Math.round(e.sr/Math.max(.05,n))),e.r),I(e,r,n*1.5)}function z(e,t){let n=d(e,t.dur),r=t.sweep??t.dur*.35,i=[[0,t.f0],[r,t.f1,-3]],a=j(e,n,i,`sine`);return t.h2&&j(e,n,i.map(([e,t,n])=>[e,t*2,n]),`sine`,t.h2,.25,a),y(e,a,[[0,0],[t.att??.0015,1],[t.dur,0,t.curve??-5]]),t.drive&&L(a,t.drive),a}function B(e,t){let n=We(e,d(e,t.dur),t.color);t.bp!==void 0&&F(e,n,`bp`,t.bp,t.q??1),t.lp!==void 0&&F(e,n,`lp`,t.lp,t.lpq??.707),t.hp!==void 0&&F(e,n,`hp`,t.hp,.707);let r=t.att??.002;return y(e,n,t.env??x(r,Math.max(.001,t.dur-r),t.curve??-5)),n}function V(e,t=3e3,n=.005,r=.8){return B(e,{dur:n,bp:t,q:r,att:3e-4,curve:-6})}function H(e,t){let n=d(e,t.dur),r=We(e,n,t.color??`pink`),i=[[0,t.f0],[t.peak,t.fp,2],[t.dur,t.f1,-2]];if(F(e,r,`bp`,i,t.q??1.3),t.body){let a=We(e,n,`pink`);F(e,a,`lp`,i.map(([e,t,n])=>[e,t*.45,n]),.9),S(r,a,0,t.body)}return t.ring&&S(r,j(e,n,[[0,t.ring*1.04],[t.dur,t.ring*.96]]),0,(t.ringAmt??.08)*1),y(e,r,[[0,0],[t.peak,1,2.5],[t.dur,0,-3.2]]),r}function Ke(e,t){let n=N(e,d(e,t.dur),t.rate,t.pow??2.5);return F(e,n,`bp`,t.f,t.q??.9),t.hp&&F(e,n,`hp`,t.hp),t.env&&y(e,n,t.env),n}function qe(e,t,n,r,i,a=.01){return n.map((n,o)=>({f:t*n*(1+e.r.bi()*a),a:(r[o]??r[r.length-1])*(.75+.25*e.r.next()),d:typeof i==`number`?i:i[o]??i[i.length-1],ph:e.r.next()}))}let Je=[1,1.73,2.33,3.01,3.88,4.62],Ye=[1,.75,.55,.4,.24,.14];function Xe(e,t){let n=d(e,t.dur),r=s(n),i=e.r,a=t.t0??0;for(let o=0;o<t.count;o++){let s=i.range(t.fLo??2600,t.fHi??5200),c=(1-o/t.count*.55)*i.range(.45,1),l=(t.decay??.22)*i.range(.6,1.4),u=qe(e,s,Je,Ye,[l,l*.8,l*.6,l*.5,l*.4,l*.3],.015).map(e=>({...e,a:e.a*c})),d=Math.floor(a*e.sr);if(d>=n)break;if(P(e,n,u,r,d),S(r,V(e,i.range(5e3,8e3),.002),d,c*.5),i.chance(.35)){let t=d+Math.floor(i.range(.008,.03)*e.sr);t<n&&P(e,n,u.map(e=>({...e,a:e.a*.4})),r,t)}a+=i.expo(t.spread/t.count)+.012}return r}function U(e,t){let n=d(e,t.dur),r=s(n),i=e.r;for(let a=0;a<t.count;a++){let a=(t.t0??0)+i.expo(t.spread),o=Math.floor(a*e.sr);if(o>=n)continue;let s=i.log(t.fLo,t.fHi),c=Math.exp(-(a-(t.t0??0))*(t.fall??2.5)),l=(t.amp??1)*c*i.next()**1.5,u=(t.decay??.04)*i.range(.5,1.6);P(e,n,[{f:s,a:l,d:u,ph:i.next()},{f:s*i.range(1.5,2.9),a:l*.6,d:u*.6,ph:i.next()}],r,o),S(r,V(e,Math.min(e.sr*.4,s*2),.0025),o,l*.7)}return r}function Ze(e,t){let n=d(e,t.dur),r=Ce(e,n);return F(e,r,`lp`,t.lp,t.q??.8),t.wob&&h(r,R(e,n,t.wob),.65,.35),y(e,r,t.env),r}function Qe(e,t,n,r,i,a){let o=0,s=n.log(r,i),c=e.length;for(let l=0;l<c;l++)l%a===0&&(s=n.log(r,i)),o+=s/t,o>=1&&--o,e[l]=2*o-1}function $e(e,t){let n=d(e,t.dur),r=s(n),i=e.r;return Qe(r,e.sr,i,t.fLo,t.fHi,Math.max(8,Math.round((t.hold??.006)*e.sr))),t.crackle&&S(r,N(e,n,900,1.2,t.crackle*3)),F(e,r,`hp`,t.hp??600,.7),L(r,t.drive??3),y(e,r,t.env),r}function et(e,t){let n=d(e,t.dur),r=s(n),i=e.r,a=new m(t.rate,!0),o=0,l=t.dur;for(;o<l;){let s=Math.max(2,a.at(o));o+=1/s*(1+(t.jitter??.25)*i.bi());let c=Math.floor(o*e.sr);if(c>=n)break;r[c]+=i.range(.6,1)}let u=Te(e,r,t.res.map(e=>({f:e.f*(1+i.bi()*.02),a:e.a,d:e.d})));if(t.noise){let i=M(e,n);F(e,i,`bp`,t.res[0].f*2.2,1.2);let a=c(r);g(a),I(e,a,40),ee(u,i,a,t.noise*30)}return y(e,u,t.env),u}function tt(e,t,n,r){let i=e.length;for(let a=0;a<n&&t+a<i;a++)e[t+a]+=r*(1-a/n)*(a<6?a/6:1)}function nt(e,t){let n=d(e,t.dur),r=M(e,n),i=s(n),a=e.r,o=new m(t.rate,!1),[c,l]=t.grain??[.003,.02],u=0;for(;u<t.dur;)u+=a.expo(1/Math.max(1,o.at(u))),tt(i,Math.floor(u*e.sr),Math.max(4,Math.floor(a.log(c,l)*e.sr)),a.next()**1.6);return _(r,i),F(e,r,`hp`,t.fLo,.6),F(e,r,`lp`,t.fHi,.6),y(e,r,t.env),r}function rt(e,t){let n=d(e,t.dur),r=e.r,i=M(e,n);F(e,i,`bp`,[[0,t.f*1.4],[t.dur,t.f*.6]],1.1),y(e,i,x(t.att??.002,t.dur*.5,-6));let a=N(e,n,[[0,400],[t.dur,15]],1.5);F(e,a,`bp`,t.f*.8,2.5),y(e,a,x(.004,t.dur,-4)),S(i,a,0,(t.wet??.6)*4);let o=Math.max(2,Math.round(e.sr/(t.f*r.range(.35,.55)))),c=s(o),l=0;for(let e=0;e<n;e++){let t=c[l];c[l]=i[e]+t*.55,i[e]+=t*.6,++l>=o&&(l=0)}return i}function it(e,t,n,r,i){let a=e.length,o=i.voiced??1,s=i.jitter??.02,c=i.shimmer??.1,l=i.rough??0,u=i.vibrato??0,d=i.vibRate??5.5,f=i.breath??.15,p=i.growl??0,m=i.growlRate??38,h=0,g=0,_=1,v=1,ee=n.next(),y=r.at(0),b=n.u32()|1,te=0;for(let i=0;i<a;i++){i&15||(y=r.at(i/t)*(1+u*A(ee))),ee+=d/t;let a=y*_/t;h+=a,h>=1&&(--h,g++,_=1+s*n.bi(),v=(1-c*n.next())*(l>0&&g&1?1-l:1));let x=h,S=2*x-1;x<a?(x/=a,S-=x+x-x*x-1):x>1-a&&(x=(x-1)/a,S-=x*x+x+x+1),b^=b<<13,b^=b>>>17,b^=b<<5;let C=(b|0)*4656612873e-19*f*(.4+.6*(1-h)),ne=1;p>0&&(te+=m*(1+.15*A(i*11e-5))/t,ne=1-p*(.5+.5*A(te))),e[i]=(-S*v*o+C)*ne}}function W(e,t){let n=s(d(e,t.dur));it(n,e.sr,e.r,new m(t.f0,!0),t),I(e,n,t.tilt??2600);let r=Me(e,n,t.vowels,t.scale??1,t.bwMul??1);return t.drive&&L(r,t.drive),y(e,r,t.env),r}function at(e,t){let n=d(e,t.dur),r=s(n),i=e.r;for(let a of t.freqs)for(let o=0;o<2;o++)j(e,n,a*(1+(o?1:-1)*(t.detune??.003)*i.range(.5,1.5)),`sine`,1/t.freqs.length,i.next(),r);return t.trem&&h(r,R(e,n,t.trem),.7,.3),y(e,r,t.env),r}function G(e,t){let n=d(e,t.dur),r=s(n),i=e.r,a=t.t0??0,o=t.t1??t.dur*.8;for(let s=0;s<t.count;s++){let s=i.range(a,o),c=i.log(t.fLo,t.fHi),l=(t.amp??1)*i.range(.3,1),u=(t.decay??.18)*i.range(.5,1.5);P(e,n,[{f:c,a:l,d:u,ph:i.next()},{f:c*2.76,a:l*.3,d:u*.5,ph:i.next()}],r,Math.floor(s*e.sr))}return r}function ot(e,t){let n=d(e,t.dur),r=Se(e,n);if(F(e,r,`lp`,t.lp,.9),t.bpF){let i=M(e,n);F(e,i,`bp`,t.bpF,.8),S(r,i,0,.35)}let i=t.flicker??.6;if(i>0){let t=R(e,n,14);S(t,R(e,n,5),0,.67),h(r,t,1-i*.5,i*.3)}return y(e,r,t.env),r}function K(e,t){let n=d(e,t.dur),r=s(n),i=e.r,a=t.t0??0;for(let o=0;o<t.count;o++){let s=Math.floor(a*e.sr);if(s>=n)break;let c=i.log(t.fLo??900,t.fHi??3200),l=i.range(.35,1)*(1-o/t.count*.5),u=(t.decay??.035)*i.range(.6,1.4);P(e,n,[{f:c,a:l,d:u,ph:i.next()},{f:c*i.range(2.2,3.1),a:l*.5,d:u*.5,ph:i.next()},{f:c*i.range(.45,.6),a:l*.4,d:u*1.2,ph:i.next()}],r,s),S(r,V(e,c*2.5,.0015),s,l*.8);let d=i.chance(t.bursty??.3)?i.range(.04,.12):i.range(.008,.035);a+=d*(t.spread/.3)}return r}function st(e,t,n,r=.35){return ke(e,d(e,n),t,{t60:r,bright:.6,hard:.9,pick:.12,detune:3})}function ct(e,t){let n=s(d(e,t.dur)),r=t.size;S(n,B(e,{dur:.06,color:`white`,att:4e-4,curve:-7,hp:400,lp:9e3}),0,(t.crack??.8)*1.2);let[i,a]=t.subF??[95-r*25,32-r*6];S(n,z(e,{f0:i,f1:a,dur:.5+r*.9,sweep:.25+r*.35,curve:-4,drive:1.6,h2:.25}),0,1);let o=Math.min(t.dur,.7+r*1.6);if(S(n,B(e,{dur:o,color:`brown`,lp:[[0,t.bodyLp??3500],[.08,1600],[o,120,-2]],env:[[0,0],[.006,1],[.12,.55,-2],[o,0,-3]]}),0,1.6),S(n,B(e,{dur:.35+r*.3,color:`pink`,bp:[[0,1800],[.3,500]],q:.7,att:.002,curve:-4}),0,.7),t.roar){let i=Math.min(t.dur,.6+r);S(n,ot(e,{dur:i,lp:[[0,2500],[i,400]],env:[[0,0],[.05,1],[i,0,-3]],flicker:.7}),Math.floor(.01*e.sr),t.roar*.7)}return t.debris&&S(n,U(e,{dur:t.dur,count:Math.round(14+r*30),t0:.08,spread:.25+r*.35,fLo:500,fHi:4200,decay:.03,amp:.5,fall:2.2}),0,t.debris),Fe(n,1.2)}function lt(e,t,n=.12,r=2.2){let i=j(e,d(e,n),[[0,t],[.03,t*r,-2],[n,t*r*1.05]]);return y(e,i,[[0,0],[.002,1],[n,0,-6]]),S(i,V(e,Math.min(e.sr*.4,t*3),.002),0,.3),i}function ut(e,t=.16,n=320){let r=d(e,t),i=e.r,a=j(e,r,[[0,n*.8],[t,n*1.6,2]],`tri`);return F(e,a,`bp`,[[0,500],[t,1300*i.range(.9,1.1)]],4),y(e,a,[[0,0],[.015,1],[t,0,-3]]),S(a,lt(e,i.range(500,800),Math.min(t,.1),1.8),Math.floor(t*.4*e.sr),.3),a}let dt=[1,2,2.99,4.07,5.2,6.4],ft=[1,.55,.32,.22,.12,.07],pt=[1,2.32,4.25,6.63,9.38],mt=[1,.55,.4,.25,.12];function q(e,t,n,r,i,a=1.2,o=1){let s=dt.map((t,r)=>({f:n*t*(1+e.r.bi()*.002),a:i*ft[r]*o**(r*.5),d:a/(1+r*.7),ph:0}));s.push({f:n*1.0025,a:i*.3,d:a*.9,ph:.25}),P(e,t.length,s,t,Math.floor(r*e.sr))}function ht(e,t,n,r,i,a=.3){let o=pt.map((t,r)=>({f:n*t*(1+e.r.bi()*.006),a:i*mt[r],d:a/(1+r*.6),ph:e.r.next()}));P(e,t.length,o,t,Math.floor(r*e.sr))}let gt=[1,2.32,3.86,5.12,6.73,8.21,9.9],_t=[.6,1,.8,.6,.45,.35,.25];function vt(e,t,n,r,i,a=.7,o=.004){let s=[];gt.forEach((t,r)=>{let c=a/(1+r*.25);s.push({f:n*t*(1+e.r.bi()*.01),a:i*_t[r],d:c,ph:e.r.next()}),s.push({f:n*t*(1+o)*(1+e.r.bi()*.005),a:i*_t[r]*.45,d:c*.9,ph:e.r.next()})}),P(e,t.length,s,t,Math.floor(r*e.sr))}function yt(e,t,n,r,i,a=.06){P(e,t.length,[{f:n,a:i,d:a,ph:0},{f:n*2.57,a:i*.5,d:a*.6,ph:.3},{f:n*4.1,a:i*.25,d:a*.4,ph:.6},{f:n*.62,a:i*.4,d:a*1.4,ph:.1}],t,Math.floor(r*e.sr))}function bt(e,t,n,r,i=.4,a=1){return He(e,t,{t60:n,wet:r,damp:i,size:a,stereo:!0,tail:Math.min(1.6,n*.5)})}function J(e,t,n,r,i=.45,a=1){return He(e,t,{t60:n,wet:r,damp:i,size:a,stereo:!1,tail:Math.min(1.2,n*.45)})[0]}let Y=(e,t)=>e*2**(t/12);function xt(e,t,n,r){return w(e,[le(e,t,n)],{rms:r,trim:!1,tail:0,keepDc:!0})[0]}function St(e,t){let r=e===`w`?24e3:e===`p`?22050:8e3,i=n(r,t),a=Math.round(((e===`w`?2.6:e===`p`?4.4:4)+.3)*r),o=e===`w`?M(i,a):e===`p`?Se(i,a):Ce(i,a);return e===`b`&&I(i,o,900),{chans:[xt(i,o,.3,.25)],sr:r,loop:!0}}function Ct(e,t){let r=22050,i=n(r,e),a=.25,o=Math.round((t+a)*r),c=s(o),l=N(i,o,32,2.6);F(i,l,`bp`,2900,.8),S(c,l,0,2.2);let u=N(i,o,7,1.6);F(i,u,`bp`,1150,1.6),S(c,u,0,2.4);for(let e=0;e<Math.round(t*.7);e++){let e=i.r.range(0,t);C(i,c,B(i,{dur:.03,bp:i.r.range(700,1600),q:1.2,att:3e-4,curve:-6}),e,i.r.range(.5,1))}let d=Se(i,o);F(i,d,`lp`,260,.7),h(d,R(i,o,1.3),.6,.4),S(c,d,0,1.2);let f=M(i,o);return F(i,f,`hp`,3500),h(f,R(i,o,3),.5,.5),S(c,f,0,.05),{chans:[xt(i,c,a,.18)],sr:r,loop:!0}}function wt(e){let t=22050,r=n(t,e),i=3.6,a=.2,o=Math.round((i+a)*t),c=[];for(let e=0;e<2;e++){let e=s(o),n=N(r,o,260,2.2);F(r,n,`bp`,3800,.6),S(e,n,0,2.5);let l=N(r,o,45,1.8);F(r,l,`bp`,1500,1.4),S(e,l,0,1.6);for(let n=0;n<14;n++){let n=r.r.range(1400,3800),a=j(r,Math.round(.05*t),[[0,n],[.012,n*1.7,-2]]);y(r,a,x(8e-4,.045,-6)),S(e,a,Math.floor(r.r.range(0,i)*t),r.r.range(.05,.15))}c.push(xt(r,e,a,.12))}return{chans:c,sr:t,loop:!0}}function Tt(e){let t=32e3,r=n(t,e),i=f(r,.25);S(i,B(r,{dur:.05,bp:r.r.range(2500,4500),q:.9,att:5e-4,curve:-5}),0,.8);let a=r.r.range(1200,2600),o=j(r,Math.round(.08*t),[[0,a],[.02,a*1.9,-2]]);return y(r,o,x(.001,.07,-6)),S(i,o,Math.round(.004*t),.4),{chans:w(r,[i],{rms:.15}),sr:t,loop:!1}}function Et(e){let t=16e3,r=n(t,e);return{chans:w(r,[et(r,{dur:1.4,rate:[[0,9],[.7,26],[1.4,12]],jitter:.4,res:[{f:150,d:.06,a:1},{f:330,d:.05,a:.7},{f:610,d:.04,a:.45},{f:900,d:.03,a:.25}],env:[[0,0],[.4,1,2],[1,.8],[1.4,0,-3]],noise:.25})],{rms:.16}),sr:t,loop:!1}}function Dt(e){let t=24e3,r=n(t,e),i=f(r,1),a=.01,o=r.r.int(8,14);for(let e=0;e<o;e++){let n=r.r.range(.3,1)*(1-e/o*.6);P(r,i.length,[{f:r.r.range(1600,3200),a:n,d:r.r.range(.06,.16),ph:r.r.next()},{f:r.r.range(3800,6500),a:n*.5,d:r.r.range(.03,.08),ph:r.r.next()}],i,Math.floor(a*t)),S(i,V(r,5e3,.002),Math.floor(a*t),n*.4),a+=r.r.chance(.25)?r.r.range(.06,.14):r.r.range(.015,.045)}return{chans:w(r,[i],{rms:.14}),sr:t,loop:!1}}function Ot(e){let t=16e3,r=n(t,e),i=f(r,1.6),a=r.r.int(2,3),o=.02;for(let e=0;e<a;e++){let e=r.r.range(330,420),n=r.r.range(.11,.15);S(i,W(r,{dur:n,f0:[[0,e*1.15],[n,e*.8]],vowels:[[0,`a`],[n,`uh`]],scale:1.1,rough:.5,breath:.5,jitter:.05,drive:2.2,env:x(.006,n-.006,-3)}),Math.floor(o*t),1),o+=n+r.r.range(.18,.3)}return I(r,i,1800),{chans:w(r,[Ue(r,i,{t60:1.8,wet:.45,damp:.6})],{rms:.14}),sr:t,loop:!1}}function kt(e){let t=16e3,r=n(t,e),i=f(r,2),a=r.r.range(330,380),o=(e,n,o)=>{S(i,W(r,{dur:n,f0:[[0,a*.92],[n*.3,a],[n,a*.9]],vowels:[[0,`u`]],breath:.2,jitter:.004,scale:1.3,tilt:1200,env:[[0,0],[n*.25,1,2],[n,0,-3]]}),Math.floor(e*t),o)};return o(.02,.35,1),o(.55,.18,.7),o(.8,.45,.9),{chans:w(r,[Ue(r,i,{t60:2,wet:.45,damp:.6})],{rms:.12}),sr:t,loop:!1}}function At(e){let t=22050,r=n(t,e),i=f(r,1.6);return vt(r,i,r.r.range(780,900),0,.6,1.1,.003),S(i,B(r,{dur:.008,hp:1500,att:2e-4}),0,.8),S(i,z(r,{f0:200,f1:120,dur:.05}),0,.3),I(r,i,3500),{chans:w(r,[Ue(r,i,{t60:1.6,wet:.4,damp:.55})],{rms:.13}),sr:t,loop:!1}}function jt(e,t,n,r,i){return{name:e,weight:n,run:()=>{let e=[];for(let n=0;n<t;n++)e.push(r(i+n*7907));return e}}}function Mt(){return[{name:`noiseW`,weight:.6,run:()=>[St(`w`,71)]},{name:`noiseP`,weight:.6,run:()=>[St(`p`,72)]},{name:`noiseB`,weight:.2,run:()=>[St(`b`,73)]},{name:`crackleA`,weight:1,run:()=>[Ct(81,4.3)]},{name:`crackleB`,weight:.8,run:()=>[Ct(82,3.1)]},{name:`rainDrops`,weight:1.5,run:()=>[wt(91)]},jt(`splash`,3,.2,Tt,95),jt(`stoneCreak`,2,.4,Et,101),jt(`chain`,2,.4,Dt,111),jt(`dog`,2,.5,Ot,121),jt(`owl`,1,.4,kt,131),jt(`anvil`,2,.4,At,141)]}function Nt(e){return{f0:p(e),bw:38,bwScale:1,amp:(e,t)=>(e%2?1:.72)*e**-1.1*Math.exp(-((t/1900)**2))*(1+.6*D(t,300,200))}}function Pt(e,t){let n=p(e),r=e>=57,i=t?[340,760,2400,3200]:r?[820,1200,2900,3500]:[680,1080,2550,3300],a=t?[110,140,260,300]:[140,170,260,300],o=t?[1,.35,.07,.04]:[1,.62,.24,.14];return{f0:n,bw:r?40:46,bwScale:.8,maxF:7e3,noise:[{f:2900,w:1100,a:.02}],amp:(e,t)=>{let n=.025;for(let e=0;e<4;e++)n+=o[e]*D(t,i[e],a[e]);return n*e**-.45}}}function Ft(e){return{f0:p(e),bw:17,bwScale:.9,maxF:9e3,amp:(e,t)=>{let n=.45+.7*D(t,290,140)+.5*D(t,540,220)+.6*D(t,1150,450)+.45*D(t,2700,900);return 1/e*n*Math.exp(-((t/5200)**2))}}}function It(e){let t=p(e),n=[1,.3,.14,.05,.03,.015,.01];return{f0:t,bw:6,bwScale:2.2,maxF:8e3,amp:e=>n[e-1]??0,noise:[{f:t,w:t*.3,a:.03},{f:t*2.2,w:t*1.2,a:.02},{f:3200,w:1800,a:.014}]}}function Lt(e){return{f0:p(e),bw:24,bwScale:1,stretch:9e-4,maxF:3e3,amp:(e,t)=>e**-.8*Math.exp(-((t/650)**2))*(e%3==0?1.3:1)}}function Rt(e,t,n,r,i,a,o=1){let s=[];for(let c=0;c<t.length;c+=2){let l=t.slice(c,c+2);s.push({inst:e,weight:r/16e3,run(){return ge(n,r,l.map(i),a+c*7919,.8*o).map((e,t)=>({root:l[t],chans:[e],sr:n,loop:!0}))}})}return s}function X(e,t,n=.2,r=!0){return w(e,[t],{rms:n,trim:r,tail:.02})}function zt(e,t){let r=22050,i=n(r,t),a=p(e),o=Math.max(2,Math.min(3.8,3.8-(e-38)*.055)),s=ke(i,Math.round(o*r),a,{t60:o*.9,bright:.12,hard:.42,pick:.17,detune:.8}),l=c(s);F(i,l,`bp`,105,4);let u=c(s);return F(i,u,`bp`,215,5),S(s,l,0,.6),S(s,u,0,.35),S(s,B(i,{dur:.012,color:`pink`,lp:2500,att:8e-4}),0,.12),F(i,s,`lp`,5200,.6),{root:e,chans:X(i,s,.2),sr:r,loop:!1}}function Bt(e,t,r,i,a){let o=n(i,t),c=p(e),l=Math.round(r*i),u=s(l),d=a?[1,2,2.76,4.07,5.4,6.8]:[.5,1,1.183,1.506,2,2.514,2.662,3.011,4.166,5.433],f=a?[1,.45,.35,.18,.12,.06]:[.55,.8,.6,.32,.9,.3,.22,.2,.12,.07],m=a?[r*.9,r*.45,r*.3,r*.2,r*.12,r*.08]:[r,r*.8,r*.6,r*.5,r*.42,r*.3,r*.25,r*.2,r*.12,r*.08],h=[];return d.forEach((e,t)=>{h.push({f:c*e,a:f[t],d:m[t],ph:o.r.next()}),h.push({f:c*e*(1+(a?.0012:.0022)),a:f[t]*.4,d:m[t]*.9,ph:o.r.next()})}),P(o,l,h,u,0),S(u,B(o,{dur:a?.006:.012,bp:a?4e3:1800,q:.8,att:5e-4}),0,a?.25:.4),{root:e,chans:X(o,u,.16),sr:i,loop:!1}}function Vt(e,t){let r=22050,i=n(r,t),a=p(e),o=1.5,c=Math.round(o*r),l=s(c);for(let e of[-7,0,6])j(i,c,a*2**(e/1200),`saw`,.4,i.r.next(),l);return j(i,c,a/2,`square`,.25,0,l,0,.42),F(i,l,`lp`,[[0,160],[.045,1900,-2],[.35,750],[o,420]],1.3),h(l,j(i,c,29,`sine`),.85,.15),y(i,l,[[0,0],[.018,1],[.3,.62,-2],[1,.45],[o,0,-3]]),S(l,B(i,{dur:.05,color:`pink`,bp:900,q:1,att:.003}),0,.2),L(l,1.6),{root:e,chans:X(i,l,.22),sr:r,loop:!1}}function Ht(e,t){let r=24e3,i=n(r,e),a=Math.round(1.4*r),o=s(a),c=[1,1.59,2.14,2.3,2.65,2.92,3.16,3.5],l=[1,.5,.35,.3,.22,.18,.12,.1],u=[1.1,.55,.4,.35,.3,.25,.2,.18];return P(i,a,c.map((e,n)=>({f:t*e*(1+i.r.bi()*.01),a:l[n],d:u[n],ph:.25})),o,0),S(o,z(i,{f0:t*1.9,f1:t,dur:.25,sweep:.05,curve:-3}),0,.9),S(o,B(i,{dur:.012,color:`pink`,lp:2200,att:5e-4}),0,.8),S(o,B(i,{dur:.05,bp:650,q:1.2,att:.001}),0,.4),L(o,1.3),{root:60,chans:X(i,o,.24),sr:r,loop:!1}}function Ut(e){let t=32e3,r=n(t,e),i=f(r,.25),a=r.r.range(780,900);return P(r,i.length,[{f:a,a:1,d:.06},{f:a*2.4,a:.6,d:.04,ph:.3},{f:a*3.9,a:.35,d:.025,ph:.6}],i,0),S(i,V(r,3500,.003),0,.8),{root:60,chans:X(r,i,.2),sr:t,loop:!1}}function Wt(e){let t=32e3,r=n(t,e),i=f(r,.6),a=r.r.range(135,160);return P(r,i.length,[1,1.59,2.14,2.65].map((e,t)=>({f:a*e,a:[1,.5,.3,.2][t],d:[.35,.2,.15,.1][t],ph:.25})),i,0),S(i,B(r,{dur:.04,bp:r.r.range(1600,2400),q:.8,att:5e-4,curve:-5}),0,.9),S(i,B(r,{dur:.015,hp:4e3,att:3e-4}),0,.3),{root:60,chans:X(r,i,.2),sr:t,loop:!1}}function Gt(e){let t=24e3,r=n(t,e),i=f(r,.9),a=r.r.range(92,120);return P(r,i.length,[1,1.5,1.98,2.44].map((e,t)=>({f:a*e,a:[1,.45,.25,.15][t],d:[.6,.35,.25,.18][t],ph:.25})),i,0),S(i,z(r,{f0:a*1.6,f1:a,dur:.15,sweep:.03}),0,.6),S(i,B(r,{dur:.02,color:`pink`,lp:3e3,att:5e-4}),0,.5),{root:60,chans:X(r,i,.22),sr:t,loop:!1}}function Kt(e){let t=16e3,r=n(t,e),i=f(r,.9);return S(i,z(r,{f0:70,f1:40,dur:.18,sweep:.06,curve:-4,drive:1.4,h2:.3}),0,1),C(r,i,z(r,{f0:62,f1:38,dur:.16,sweep:.05,curve:-4,drive:1.3,h2:.25}),.26,.65),I(r,i,240),{root:60,chans:X(r,i,.2),sr:t,loop:!1}}function qt(e){let t=16e3,r=n(t,e),i=f(r,3.2);return S(i,z(r,{f0:62,f1:27,dur:2.8,sweep:1.1,curve:-3,drive:1.4,h2:.2}),0,1),S(i,Ze(r,{dur:3,lp:[[0,500],[3,70]],env:[[0,0],[.01,1],[3,0,-3]]}),0,1.2),S(i,B(r,{dur:.03,color:`pink`,lp:3e3,att:5e-4}),0,.4),{root:60,chans:X(r,i,.2),sr:t,loop:!1}}function Jt(e){let t=16e3,r=n(t,e),i=Math.round(3*t),a=M(r,i);v(a,R(r,i,18),.5,.5);let o=s(i);for(let e=0;e<12;e++){let e=r.r.log(260,4200),t=c(a);F(r,t,`bp`,e,r.r.range(40,90)),S(o,t,0,r.r.range(.4,1)*(e<800?1:.7))}return y(r,o,[[0,0],[r.r.range(.6,1.1),1,2],[3,0,-2.5]]),{root:60,chans:X(r,o,.18),sr:t,loop:!1}}function Yt(e){let t=32e3,r=n(t,e),i=f(r,.35),a=r.r.range(700,1300),o=j(r,Math.round(.12*t),[[0,a],[.025,a*2.3,-2],[.12,a*2.4]]);return y(r,o,[[0,0],[.002,1],[.12,0,-6]]),S(i,o,0,1),S(i,V(r,4e3,.002),0,.3),{root:60,chans:X(r,i,.2),sr:t,loop:!1}}function Xt(e){let t=24e3,r=n(t,e),i=2.6,a=M(r,Math.round(i*t));F(r,a,`bp`,[[0,2500],[i,8e3,2]],.7);let o=Se(r,a.length);return F(r,o,`hp`,6e3),S(a,o,0,.5),y(r,a,[[0,0],[i-.02,1,4],[i,0]]),{root:60,chans:w(r,[a],{rms:.15,trim:!1,tail:.004}),sr:t,loop:!1}}function Zt(e,t,n,r,i){return{inst:e,weight:n,run:()=>{let e=[];for(let n=0;n<t;n++)e.push(r(i+n*104729,n));return e}}}let Qt={guitar:[38,45,52,59,66,73],pad:[38,45,52,59,66],choir:[43,50,57,64,71],choirO:[48,60,72],strings:[38,45,52,59,66,73],flute:[67,74,81],drone:[26,33],bell:[38,50],chime:[72,84],brass:[36,43,50]};function $t(){let e=[];e.push(...Rt(`choir`,Qt.choir,22050,65536,e=>Pt(e,!1),11)),e.push(...Rt(`pad`,Qt.pad,16e3,65536,Nt,23)),e.push(...Rt(`strings`,Qt.strings,22050,65536,Ft,37)),e.push(...Rt(`choirO`,Qt.choirO,22050,65536,e=>Pt(e,!0),41)),e.push(...Rt(`flute`,Qt.flute,24e3,32768,It,53)),e.push(...Rt(`drone`,Qt.drone,16e3,65536,Lt,67));for(let t of Qt.guitar)e.push({inst:`guitar`,weight:1.5,run:()=>[zt(t,1e3+t)]});return e.push({inst:`bell`,weight:1.5,run:()=>[Bt(38,2038,6.5,16e3,!1)]}),e.push({inst:`bell`,weight:1.2,run:()=>[Bt(50,2050,5,16e3,!1)]}),e.push({inst:`chime`,weight:.8,run:()=>Qt.chime.map((e,t)=>Bt(e,3e3+e,t?1.8:2.4,24e3,!0))}),e.push({inst:`brass`,weight:1,run:()=>Qt.brass.map(e=>Vt(e,4e3+e))}),e.push(Zt(`taiko`,3,1,(e,t)=>Ht(e,[58,64,70][t]),5e3)),e.push(Zt(`rim`,2,.2,e=>Ut(e),5100)),e.push(Zt(`frame`,3,.4,e=>Wt(e),5200)),e.push(Zt(`tom`,2,.4,e=>Gt(e),5300)),e.push(Zt(`heart`,2,.3,e=>Kt(e),5400)),e.push(Zt(`boom`,2,1.2,e=>qt(e),5500)),e.push(Zt(`scrape`,2,1.5,e=>Jt(e),5600)),e.push(Zt(`drip`,4,.3,e=>Yt(e),5700)),e.push(Zt(`swell`,1,.5,e=>Xt(e),5800)),e}let en=(e,t=6,n=.1)=>({lvl:e,send:n,cap:t,prio:6,bus:`sfx`}),Z=(e,t=4,n=.15,r=3)=>({lvl:e,send:n,cap:t,prio:r,bus:`sfx`});function tn(e,t){let n=e.r,r=n.int(t.syl[0],t.syl[1]),i=.01,a=[],o=[],s=[[0,0]],c=[];for(let e=0;e<r;e++){let l=n.range(t.sd[0],t.sd[1]),u=n.range(t.f[0],t.f[1])*(1+(t.rise??0)*(e/Math.max(1,r-1)));a.push([i,u*n.range(.88,1.1)],[i+l,u*n.range(.78,1.22)]),o.push([i,n.pick(t.vowels)]),s.push([i,0],[i+.008,n.range(.6,1)],[i+l-.012,n.range(.45,.85)],[i+l,0]),n.chance(.45)&&c.push(i),i+=l+n.range(t.gap[0],t.gap[1])}let l=W(e,{dur:i+.05,f0:a,vowels:o,env:s,scale:t.scale,rough:t.rough,breath:t.breath??.3,jitter:.05,shimmer:.2,drive:t.drive??2,tilt:3800});for(let t of c)C(e,l,B(e,{dur:.012,bp:n.range(2500,4500),q:1.2,att:5e-4}),t-.004,.35);return l}let nn={swingLight:{r:{sr:24e3,dur:.32,v:3,render(e){let t=f(e,.32),n=e.r.range(.17,.24),r=n*e.r.range(.38,.5);return S(t,H(e,{dur:n,peak:r,f0:500,fp:e.r.range(1800,2600),f1:700,q:1.6,body:.3,ring:e.r.chance(.5)?e.r.range(2600,3400):0,ringAmt:.03}),0,1),S(t,H(e,{dur:n*.9,peak:r*1.1,f0:900,fp:e.r.range(3200,4200),f1:1500,q:2.5,color:`white`}),0,.25),t}},m:{lvl:.42,send:.04,cap:4,prio:4,bus:`sfx`}},swingHeavy:{r:{sr:24e3,dur:.5,v:3,render(e){let t=f(e,.5),n=e.r.range(.32,.4),r=n*.45;S(t,H(e,{dur:n,peak:r,f0:230,fp:e.r.range(1e3,1400),f1:300,q:1.1,body:.8}),0,1);let i=j(e,t.length,[[0,60],[r,85],[n,55]],`sine`,.5);return y(e,i,[[0,0],[r,1,2],[n+.05,0,-3]]),S(t,i,0,.6),t}},m:{lvl:.5,send:.04,cap:3,prio:4,bus:`sfx`}},hitFlesh:{r:{sr:24e3,dur:.36,v:3,render(e){let t=f(e,.36);return S(t,z(e,{f0:e.r.range(118,150),f1:e.r.range(46,58),dur:.17,sweep:.05,drive:1.8,h2:.3}),0,1),S(t,B(e,{dur:.12,color:`pink`,lp:[[0,2600],[.08,300]],att:8e-4,curve:-5}),0,.9),C(e,t,rt(e,{dur:.2,f:e.r.range(650,1100),wet:.7}),.003,.5),S(t,Ie(B(e,{dur:.035,bp:e.r.range(2600,3600),q:.9,att:4e-4,curve:-6}),6,2),0,.32),S(t,V(e,4e3,.003),0,.35),L(t,1.3),t}},m:en(.62)},hitBone:{r:{sr:24e3,dur:.32,v:3,render(e){let t=f(e,.32);S(t,V(e,3500,.004),0,.9);let n=e.r.range(780,1100);return P(e,t.length,[{f:n,a:1,d:.05},{f:n*1.83,a:.7,d:.04,ph:.3},{f:n*2.7,a:.5,d:.03,ph:.6},{f:n*3.9,a:.3,d:.02,ph:.2}],t,0),S(t,z(e,{f0:210,f1:120,dur:.06}),0,.5),S(t,K(e,{dur:.32,count:4,spread:.08,t0:.03,fLo:1400,fHi:3500,decay:.02}),0,.4),S(t,B(e,{dur:.03,bp:2e3,q:1.5}),0,.4),t}},m:en(.58)},hitMetal:{r:{sr:24e3,dur:1,v:3,render(e){let t=f(e,1);return S(t,B(e,{dur:.012,hp:1500,att:2e-4,curve:-7}),0,1),vt(e,t,e.r.range(420,560),0,.5,.85,.005),P(e,t.length,[{f:e.r.range(3500,5e3),a:.25,d:.4},{f:e.r.range(5200,7e3),a:.15,d:.25}],t,0),S(t,z(e,{f0:160,f1:90,dur:.08}),0,.6),L(t,1.2),t}},m:en(.5,4,.14)},hitBlocked:{r:{sr:24e3,dur:.6,v:3,render(e){let t=f(e,.6);return yt(e,t,e.r.range(290,380),0,1,.15),vt(e,t,e.r.range(1100,1350),0,.25,.35,.008),S(t,z(e,{f0:150,f1:80,dur:.1,drive:1.3}),0,.8),S(t,B(e,{dur:.13,bp:2500,q:2,att:.01,curve:-3}),0,.3),S(t,V(e,2600,.004),0,.6),t}},m:en(.58,4)},critHit:{r:{sr:32e3,dur:.7,v:3,render(e){let t=f(e,.6);S(t,B(e,{dur:.012,hp:2500,att:2e-4,curve:-8}),0,1.4),C(e,t,B(e,{dur:.01,bp:5200,q:.8,att:2e-4,curve:-8}),.004,.9);let n=j(e,Math.round(.022*e.sr),[[0,3200],[.022,300]],`saw`,.3);return y(e,n,x(5e-4,.021,-4)),S(t,n,0,1),S(t,z(e,{f0:110,f1:40,dur:.32,sweep:.08,drive:2,h2:.3}),0,1.1),S(t,B(e,{dur:.18,color:`pink`,lp:[[0,3e3],[.1,250]],att:8e-4}),0,.9),S(t,Ie(B(e,{dur:.05,bp:2500,q:.8,att:4e-4,curve:-6}),5,2),0,.5),P(e,t.length,[{f:e.r.range(2400,3e3),a:.12,d:.3},{f:e.r.range(3600,4200),a:.08,d:.2}],t,0),L(t,1.6),t}},m:en(.78,3,.14)},playerHurt:{r:{sr:22050,dur:.5,v:3,render(e){let t=f(e,.5),n=e.r.range(150,200);return S(t,W(e,{dur:.32,f0:[[0,n*1.1],[.3,n*.85]],vowels:[[0,`uh`],[.2,`a`]],breath:.45,voiced:.55,rough:.2,jitter:.03,env:x(.012,.28,-3),scale:1.05,drive:1.4}),.01,.6),S(t,z(e,{f0:120,f1:58,dur:.11,drive:1.5}),0,.7),S(t,B(e,{dur:.06,color:`pink`,lp:1300}),0,.6),t}},m:{lvl:.5,send:.05,cap:2,prio:8,bus:`sfx`,gap:.12}},playerDeath:{r:{sr:22050,dur:2.4,v:2,render(e){let t=f(e,2.2);return S(t,W(e,{dur:1.6,f0:[[0,250],[.25,300],[1.1,175],[1.55,115]],vowels:[[0,`a`],[.7,`o`],[1.3,`u`]],breath:.4,rough:.35,jitter:.03,vibrato:.02,drive:1.5,env:[[0,0],[.05,1],[.9,.7],[1.55,0,-3]]}),0,.75),C(e,t,z(e,{f0:95,f1:45,dur:.26,drive:1.6}),1.25,1),C(e,t,B(e,{dur:.2,color:`brown`,lp:600}),1.25,.8),S(t,U(e,{dur:2.2,count:8,t0:1.27,spread:.12,fLo:500,fHi:1800,decay:.03,amp:.4}),0,1),t}},m:{lvl:.68,send:.2,cap:1,prio:10,bus:`sfx`}},lowLifeWarning:{r:{sr:16e3,dur:.9,v:2,render(e){let t=f(e,.9);return S(t,z(e,{f0:82,f1:48,dur:.17,sweep:.06,curve:-4,drive:1.3,h2:.3}),0,1),C(e,t,z(e,{f0:72,f1:44,dur:.15,sweep:.05,curve:-4,drive:1.2,h2:.25}),.27,.7),I(e,t,280),t}},m:{lvl:.45,send:0,cap:1,prio:9,bus:`ui`}},gutterkinAggro:{r:{sr:24e3,dur:1,v:3,render(e){return tn(e,{syl:[5,9],f:[380,650],sd:[.05,.11],gap:[.01,.04],scale:1.38,rough:.3,vowels:[`i`,`e`,`a`,`ae`,`u`]})}},m:Z(.42,3)},gutterkinDeath:{r:{sr:24e3,dur:.8,v:2,render(e){let t=f(e,.8),n=e.r.range(650,780);return S(t,W(e,{dur:.6,f0:[[0,n],[.08,n*1.18],[.5,n*.42,-1]],vowels:[[0,`i`],[.15,`a`],[.45,`u`]],scale:1.38,rough:.5,breath:.3,jitter:.05,drive:2.5,env:[[0,0],[.02,1],[.35,.6],[.6,0,-3]]}),0,.8),C(e,t,rt(e,{dur:.18,f:700,wet:.5}),.3,.3),C(e,t,z(e,{f0:140,f1:70,dur:.1}),.5,.6),t}},m:Z(.5,3,.15,4)},gutterkinFlee:{r:{sr:24e3,dur:.8,v:2,render(e){return tn(e,{syl:[4,6],f:[450,560],sd:[.04,.07],gap:[.008,.025],rise:.6,scale:1.42,rough:.2,vowels:[`i`,`e`,`i`,`ae`]})}},m:Z(.4,2)},shamanCast:{r:{sr:24e3,dur:.95,v:2,render(e){let t=f(e,.95),n=e.r.range(240,290);return S(t,W(e,{dur:.5,f0:[[0,n],[.3,n*1.15],[.45,n*.9]],vowels:[[0,`o`],[.25,`a`]],scale:1.3,rough:.4,breath:.5,vibrato:.03,vibRate:7,drive:1.8,env:[[0,0],[.05,1],[.35,.8],[.5,0,-3]]}),0,.7),C(e,t,B(e,{dur:.45,color:`pink`,lp:[[0,2400],[.45,600]],env:[[0,0],[.03,1],[.45,0,-3]]}),.3,.8),C(e,t,H(e,{dur:.3,peak:.08,f0:400,fp:1600,f1:500,q:.9}),.3,.5),t}},m:Z(.5,3)},shamanResurrect:{r:{sr:24e3,dur:2,v:2,render(e){let t=f(e,1.8);S(t,W(e,{dur:1.4,f0:[[0,200],[1.2,380,1],[1.4,360]],vowels:[[0,`a`],[.9,`i`]],scale:1.25,breath:.5,vibrato:.04,vibRate:6,rough:.25,drive:1.5,env:[[0,0],[.3,1,2],[1.1,.9],[1.4,0,-3]]}),0,.6);let n=s(t.length);return j(e,n.length,659.3,`sine`,.5,0,n),j(e,n.length,698.5,`sine`,.5,.2,n),y(e,n,[[0,0],[.9,1,2],[1.7,0,-3]]),S(t,n,0,.18),S(t,Ze(e,{dur:1.8,lp:140,env:[[0,0],[.8,1,2],[1.7,0,-3]]}),0,.9),S(t,K(e,{dur:1.8,count:10,spread:.4,t0:1.1,fLo:800,fHi:2800}),0,.5),t}},m:Z(.55,2,.3,5)},rotwalkerGroan:{r:{sr:16e3,dur:1.6,v:2,render(e){let t=f(e,1.6),n=e.r.range(70,86);return S(t,W(e,{dur:1.45,f0:[[0,n],[.5,n*1.16],[1.3,n*.88]],vowels:[[0,`o`],[.5,`uh`],[1.2,`u`]],scale:.85,rough:.6,jitter:.05,breath:.35,growl:.3,growlRate:30,drive:1.6,tilt:1800,env:[[0,0],[.25,1,2],[1,.85],[1.45,0,-3]]}),0,1),C(e,t,rt(e,{dur:.4,f:400,wet:.5}),.6,.15),t}},m:Z(.5,3,.15)},rotwalkerDeath:{r:{sr:16e3,dur:1.6,v:2,render(e){let t=f(e,1.6);return S(t,W(e,{dur:1.1,f0:[[0,92],[.3,100],[1,55]],vowels:[[0,`a`],[.6,`u`]],scale:.82,rough:.7,jitter:.06,breath:.4,growl:.35,drive:1.8,tilt:1800,env:[[0,0],[.08,1],[.7,.7],[1.1,0,-3]]}),0,.9),C(e,t,z(e,{f0:110,f1:48,dur:.3,drive:1.6}),.85,1),C(e,t,rt(e,{dur:.3,f:500,wet:.8}),.86,.6),S(t,U(e,{dur:1.6,count:6,t0:.88,spread:.1,fLo:400,fHi:1400,decay:.03,amp:.4}),0,1),t}},m:Z(.58,3,.15,4)},spinehogShoot:{r:{sr:24e3,dur:.5,v:2,render(e){let t=f(e,.5),n=B(e,{dur:.1,bp:[[0,900],[.1,600]],q:2.2,att:.005,curve:-3}),r=j(e,n.length,45,`sine`);for(let e=0;e<n.length;e++)n[e]*=.6+.4*r[e];return S(t,n,0,.8),S(t,W(e,{dur:.1,f0:[[0,180],[.1,150]],vowels:[[0,`u`]],voiced:.4,breath:.8,scale:1.2,env:x(.005,.09,-3)}),0,.5),C(e,t,B(e,{dur:.15,color:`white`,bp:[[0,6500],[.15,2500]],q:3,att:.003,curve:-3}),.08,.6),C(e,t,V(e,5e3,.003),.08,.6),C(e,t,ke(e,Math.round(.15*e.sr),e.r.range(300,360),{t60:.1,bright:.7,hard:1}),.08,.2),t}},m:Z(.5,4,.08)},spinehogDeath:{r:{sr:24e3,dur:.8,v:2,render(e){let t=f(e,.8),n=e.r.range(850,1e3);return S(t,W(e,{dur:.4,f0:[[0,n],[.05,n*1.2],[.38,n*.5]],vowels:[[0,`i`],[.2,`e`]],scale:1.6,rough:.3,breath:.35,drive:2,env:[[0,0],[.015,1],[.38,0,-3]]}),0,.7),C(e,t,z(e,{f0:150,f1:75,dur:.12}),.3,.7),S(t,K(e,{dur:.8,count:6,spread:.12,t0:.32,fLo:2500,fHi:5e3,decay:.015}),0,.35),t}},m:Z(.5,3)},boneRattle:{r:{sr:24e3,dur:.8,v:3,render(e){let t=f(e,.8);return S(t,K(e,{dur:.8,count:14,spread:.45,fLo:700,fHi:2800,decay:.03,bursty:.35}),0,1),S(t,B(e,{dur:.5,bp:480,q:3,att:.02,curve:-2}),0,.2),t}},m:Z(.45,3,.12)},boneShatter:{r:{sr:24e3,dur:1.2,v:2,render(e){let t=f(e,1.2);return S(t,V(e,3e3,.005),0,1),S(t,Ie(B(e,{dur:.05,bp:2e3,q:.9,att:5e-4}),6,2),0,.6),S(t,K(e,{dur:1.2,count:28,spread:.8,t0:.02,fLo:600,fHi:3e3,decay:.035,bursty:.25}),0,.9),C(e,t,z(e,{f0:190,f1:100,dur:.07}),.28,.5),C(e,t,z(e,{f0:170,f1:95,dur:.07}),.5,.4),S(t,U(e,{dur:1.2,count:10,t0:.05,spread:.3,fLo:500,fHi:2e3,decay:.03,amp:.4}),0,1),t}},m:Z(.58,3,.12,4)},arrowShoot:{r:{sr:24e3,dur:.45,v:3,render(e){let t=f(e,.45);return S(t,st(e,e.r.range(95,125),.35,.22),0,.7),S(t,V(e,2500,.004),0,.6),C(e,t,B(e,{dur:.22,color:`white`,bp:[[0,3200],[.22,1500]],q:2.5,att:.02,curve:-3}),.01,.35),t}},m:Z(.45,4,.06,4)},arrowImpact:{r:{sr:24e3,dur:.4,v:3,render(e){let t=f(e,.4);return S(t,z(e,{f0:260,f1:140,dur:.06}),0,.8),S(t,V(e,2e3,.004),0,.7),S(t,B(e,{dur:.04,bp:1200,q:1.5}),0,.5),S(t,st(e,e.r.range(130,160),.3,.18),.002*e.sr,.2),t}},m:Z(.48,4,.06,4)},bossRoar:{r:{sr:22050,dur:3.2,v:2,rms:.22,render(e){let t=f(e,2.6),n=e.r.range(68,78),r=[[0,0],[.25,1,2],[1.4,.85],[2.2,0,-3]],i=[[0,n],[.3,n*1.35],[1.4,n*1.2],[2.1,n*.78]],a=[[0,`a`],[.6,`o`],[1.6,`u`]];S(t,W(e,{dur:2.2,f0:i,vowels:a,scale:.62,rough:.7,jitter:.06,breath:.6,growl:.5,growlRate:32,drive:3,tilt:2200,env:r}),0,1),S(t,W(e,{dur:2.2,f0:i.map(([e,t,n])=>[e,t*.5,n]),vowels:a,scale:.55,rough:.5,breath:.3,drive:2,tilt:1500,env:r}),0,.5);let o=Se(e,t.length);F(e,o,`bp`,500,.7),y(e,o,r),S(t,o,0,.5);let s=j(e,t.length,40,`sine`);return y(e,s,r),S(t,s,0,.35),t}},m:{lvl:.82,send:.3,cap:2,prio:9,bus:`sfx`}},bossPhase:{r:{sr:22050,dur:2.6,v:2,render(e){let t=f(e,2.4);S(t,B(e,{dur:1.25,color:`pink`,lp:[[0,200],[1.2,4500,3]],env:[[0,0],[1.2,1,3.5],[1.25,.3]]}),0,.9),C(e,t,ct(e,{dur:1.2,size:.6,crack:.7,debris:.3}),1.2,1);let n=xe(e,Math.round(1.4*e.sr),[[0,900],[1,1400],[1.4,1100]],1.41,[[0,1],[1,5]],.25);return y(e,n,[[0,0],[1,1,2],[1.4,0,-3]]),S(t,n,0,1),S(t,W(e,{dur:1.3,f0:55,vowels:[[0,`o`]],scale:.6,rough:.8,voiced:.7,breath:.6,growl:.5,drive:2.5,env:[[0,0],[1.1,1,2],[1.3,0,-3]]}),0,.4),t}},m:{lvl:.78,send:.3,cap:1,prio:9,bus:`sfx`}},bossTelegraph:{r:{sr:22050,dur:1.3,v:2,render(e){let t=f(e,1.2),n=t.length,r=s(n);for(let t of[1,1.012,.991,1.5])j(e,n,[[0,110*t],[1,220*t,1]],`saw`,.25,e.r.next(),r);return F(e,r,`lp`,[[0,300],[1,2200,2]],2),h(r,j(e,n,[[0,4],[1,16,1]],`sine`),.55,.45),y(e,r,[[0,0],[.95,1,2],[1.15,0,-4]]),S(t,r,0,.8),S(t,B(e,{dur:1.1,color:`pink`,bp:[[0,300],[1,2e3,2]],q:1.4,env:[[0,0],[1,1,3],[1.1,0,-3]]}),0,.5),t}},m:{lvl:.62,send:.15,cap:2,prio:9,bus:`sfx`}},bossDeath:{r:{sr:16e3,dur:4.2,v:2,rms:.22,render(e){let t=f(e,3.6);return S(t,W(e,{dur:2.6,f0:[[0,120],[.3,150],[1.5,72],[2.5,40]],vowels:[[0,`a`],[1,`o`],[2,`u`]],scale:.6,rough:.6,jitter:.05,breath:.55,growl:.4,drive:2.5,tilt:2e3,env:[[0,0],[.1,1],[1.5,.75],[2.5,0,-3]]}),0,1),C(e,t,ct(e,{dur:1.8,size:.85,crack:.5,debris:.8}),1.8,1.1),t}},m:{lvl:.88,send:.32,cap:1,prio:10,bus:`sfx`}}},Q=(e,t=4,n=.12,r=6)=>({lvl:e,send:n,cap:t,prio:r,bus:`sfx`});function rn(e,t,n,r){let i=Math.round(t*e.sr),a=j(e,i,[[0,n],[t,r,-3]],`saw`,.7);return j(e,i,[[0,n*1.51],[t,r*1.3,-3]],`square`,.3,0,a),L(a,3),F(e,a,`hp`,300),y(e,a,x(.001,t,-4)),a}function an(e,t,n,r){let i=e.r,a=[],o=[`a`,`e`,`i`,`o`,`u`,`uh`,`er`],s=0;for(;s<t;)a.push([s,i.pick(o)]),s+=i.range(.07,.16);let c=W(e,{dur:t,f0:120,vowels:a,voiced:0,breath:1,scale:n,bwMul:1.6,env:r,tilt:6e3}),l=R(e,c.length,9);for(let e=0;e<c.length;e++)c[e]*=.45+.55*Math.max(0,l[e]);return c}function on(e,t,n,r,i,a,o,s,c){let l=e.r;for(let u=0;u<n;u++){let n=r+l.expo(i);ht(e,t,l.log(a,o),n,c*l.range(.3,1)*Math.exp(-(n-r)*3),s*l.range(.4,1.4))}}function sn(e){let t=5.1,n=6/t,r=Math.round(n*e.sr),i=f(e,n+.24);for(let n=0;n<6;n++)C(e,i,H(e,{dur:.21,peak:.095,f0:600,fp:e.r.range(1700,2300),f1:800,q:1.4,body:.4,ring:e.r.range(2600,3200),ringAmt:.05}),n/t,n%2?.8:1);let a=c(i.subarray(0,r));for(let e=r;e<i.length;e++)a[e-r]+=i[e];let o=.08,s=Se(e,r+Math.round(o*e.sr));return F(e,s,`lp`,500,.8),S(a,le(e,s,o),0,.25),a}function cn(e){let t=.25,n=2.4+t,r=ot(e,{dur:n,lp:1400,env:[[0,1]],flicker:.7,bpF:700});return S(r,Ke(e,{dur:n,rate:38,f:2600,q:.8,pow:2.2}),0,1.6),S(r,Ke(e,{dur:n,rate:6,f:900,q:2,pow:1.5}),0,1.2),le(e,r,t)}let ln={fireCast:{r:{sr:24e3,dur:.8,v:2,render(e){let t=f(e,.8);return S(t,H(e,{dur:.35,peak:.08,f0:400,fp:e.r.range(1500,2100),f1:600,q:.8,body:.6}),0,.7),S(t,ot(e,{dur:.6,lp:[[0,3e3],[.6,700]],env:[[0,0],[.04,1],[.6,0,-3]]}),0,.9),S(t,Ke(e,{dur:.6,rate:70,f:2600,env:x(.02,.58,-2)}),0,1.2),S(t,z(e,{f0:100,f1:58,dur:.12}),0,.5),t}},m:Q(.5,4,.1)},fireImpact:{r:{sr:24e3,dur:.8,v:3,render(e){let t=f(e,.8);return S(t,B(e,{dur:.02,hp:800,att:3e-4,curve:-7}),0,.7),S(t,z(e,{f0:120,f1:55,dur:.18,drive:1.5}),0,.8),S(t,ot(e,{dur:.5,lp:[[0,2600],[.5,500]],env:[[0,0],[.01,1],[.5,0,-3]]}),0,1),S(t,Ke(e,{dur:.75,rate:[[0,130],[.7,18]],f:2200}),0,1.3),t}},m:Q(.52,5)},fireballExplode:{r:{sr:24e3,dur:1.9,v:2,render(e){let t=f(e,1.9);return S(t,ct(e,{dur:1.6,size:.55,crack:.8,roar:1,debris:.4}),0,1),S(t,Ke(e,{dur:1.8,rate:[[0,90],[1.8,8]],f:2400}),0,1),t}},m:Q(.75,4,.12,7)},meteorIncoming:{r:{sr:24e3,dur:1.4,v:2,render(e){let t=f(e,1.4);S(t,ot(e,{dur:1.3,lp:[[0,600],[1.25,3200,2]],env:[[0,0],[1.2,1,3],[1.3,0,-3]],flicker:.5}),0,1),S(t,B(e,{dur:1.3,color:`white`,bp:[[0,2600],[1.25,850,-1]],q:8,env:[[0,0],[1.2,1,2.5],[1.3,0,-3]]}),0,.6);let n=j(e,Math.round(1.3*e.sr),[[0,1800],[1.25,650,-1]],`sine`,.15);return y(e,n,[[0,0],[1.1,1,2],[1.3,0,-3]]),S(t,n,0,1),S(t,Ke(e,{dur:1.3,rate:[[0,10],[1.2,160]],f:2500,env:[[0,0],[1.2,1,2],[1.3,0]]}),0,1),t}},m:Q(.55,3,.1,7)},meteorImpact:{r:{sr:22050,dur:3,v:2,render(e){let t=f(e,3);return S(t,ct(e,{dur:2.4,size:1,crack:1,roar:1.2,debris:.8,subF:[80,26]}),0,1),S(t,Ze(e,{dur:2.8,lp:150,env:[[0,0],[.05,1],[2.8,0,-3]],wob:4}),0,.7),S(t,Ke(e,{dur:2.8,rate:[[0,120],[2.8,6]],f:2300}),0,.8),t}},m:Q(.9,3,.2,8)},burnLoop:{r:{sr:22050,dur:2.7,v:2,loop:!0,rms:.16,render:e=>cn(e)},m:{lvl:.38,send:.05,cap:4,prio:5,bus:`sfx`,oneShot:1.6}},coldCast:{r:{sr:32e3,dur:.8,v:2,render(e){let t=f(e,.8);return S(t,H(e,{dur:.4,peak:.12,f0:1500,fp:e.r.range(4500,5500),f1:2500,q:2.5,color:`white`}),0,.6),S(t,G(e,{dur:.8,count:8,fLo:3500,fHi:9e3,t0:0,t1:.3,decay:.25,amp:.5}),0,1),ht(e,t,e.r.range(2400,2800),.02,.5,.5),S(t,B(e,{dur:.5,color:`white`,hp:6e3,env:[[0,0],[.1,1],[.5,0,-3]]}),0,.2),t}},m:Q(.48,4,.1)},iceImpact:{r:{sr:32e3,dur:.8,v:3,render(e){let t=f(e,.8);return S(t,B(e,{dur:.015,hp:3e3,att:2e-4,curve:-7}),0,1),on(e,t,18,0,.05,2500,9e3,.1,.55),S(t,Ie(B(e,{dur:.06,bp:4e3,q:.8,att:5e-4}),6,2),0,.5),S(t,z(e,{f0:150,f1:80,dur:.08}),0,.6),t}},m:Q(.52,5)},frostNova:{r:{sr:24e3,dur:1.6,v:2,render(e){let t=f(e,1.4);return S(t,H(e,{dur:.7,peak:.12,f0:800,fp:4e3,f1:1500,q:1.2,body:.4,color:`white`}),0,.8),S(t,z(e,{f0:110,f1:50,dur:.35,drive:1.5}),0,.7),S(t,Ke(e,{dur:1.2,rate:[[0,50],[.3,400],[1,60]],f:6e3,hp:3e3}),0,1.2),S(t,G(e,{dur:1.4,count:20,fLo:3e3,fHi:1e4,t0:.05,t1:.8,decay:.25,amp:.4}),0,1),S(t,at(e,{dur:1.4,freqs:[2349,3136,3520],env:[[0,0],[.15,1],[1.4,0,-3]],trem:9}),0,.12),t}},m:Q(.62,3,.18,7)},orbLaunch:{r:{sr:24e3,dur:1,v:2,render(e){let t=f(e,1);S(t,H(e,{dur:.6,peak:.15,f0:300,fp:1400,f1:600,q:1.5,body:.5}),0,.8);let n=xe(e,t.length,[[0,220],[.8,262]],1.5,1.5,.3);return y(e,n,[[0,0],[.12,1],[.9,0,-3]]),S(t,n,0,1),S(t,G(e,{dur:1,count:6,fLo:4e3,fHi:9e3,t0:.05,t1:.5,amp:.35}),0,1),t}},m:Q(.5,3)},freezeShatter:{r:{sr:32e3,dur:1,v:2,render(e){let t=f(e,1);return S(t,B(e,{dur:.02,hp:2e3,att:2e-4,curve:-7}),0,1.2),on(e,t,30,0,.09,2e3,11e3,.25,.6),S(t,Ie(B(e,{dur:.07,bp:3e3,q:.8,att:5e-4}),6,2),0,.5),S(t,z(e,{f0:160,f1:75,dur:.12,drive:1.3}),0,.7),S(t,U(e,{dur:1,count:10,t0:.03,spread:.15,fLo:2500,fHi:7e3,decay:.02,amp:.4}),0,1),t}},m:Q(.6,4)},lightningCast:{r:{sr:24e3,dur:.7,v:2,render(e){let t=f(e,.7);S(t,$e(e,{dur:.5,fLo:60,fHi:260,hold:.005,env:[[0,0],[.3,1,2],[.5,0,-2]],hp:500,drive:3,crackle:1}),0,.7);let n=j(e,t.length,[[0,400],[.45,1600,1]],`saw`,.2);F(e,n,`lp`,3e3),y(e,n,[[0,0],[.4,1,2],[.5,0,-3]]),S(t,n,0,.6);let r=N(e,t.length,[[0,40],[.4,500],[.6,30]],1.3);return F(e,r,`hp`,3e3),S(t,r,0,1),t}},m:Q(.45,4,.08)},zap:{r:{sr:24e3,dur:.35,v:3,render(e){let t=f(e,.35);return S(t,B(e,{dur:.008,hp:2e3,att:2e-4,curve:-7}),0,.9),S(t,rn(e,e.r.range(.09,.14),e.r.range(2200,3e3),e.r.range(150,250)),0,.8),S(t,$e(e,{dur:.2,fLo:80,fHi:400,hold:.004,env:x(.002,.19,-3),hp:700,drive:4,crackle:.8}),0,.6),t}},m:Q(.42,6,.06,5)},chainLightning:{r:{sr:24e3,dur:1.1,v:2,render(e){let t=f(e,1.1);S(t,B(e,{dur:.015,hp:1e3,att:2e-4,curve:-8}),0,1.3);let n=[[0,0]];for(let t=0;t<4;t++){let r=t*.15+e.r.range(0,.03);n.push([r+.002,1-t*.15],[r+.12,.25])}n.push([.95,0,-3]),S(t,$e(e,{dur:1,fLo:50,fHi:400,hold:.004,env:n,hp:500,drive:4,crackle:1.2}),0,.7);for(let n=0;n<4;n++)C(e,t,rn(e,.11,e.r.range(2e3,3200),e.r.range(150,300)),n*.15+e.r.range(0,.02),.7-n*.12);let r=N(e,t.length,[[0,600],[1,40]],1.2);return F(e,r,`hp`,2500),S(t,r,0,1.2),t}},m:Q(.58,3,.1,7)},teleport:{r:{sr:24e3,dur:.9,v:2,render(e){let t=f(e,.9),n=M(e,t.length);return F(e,n,`bp`,[[0,400],[.25,4e3],[.7,1200]],1),Ae(e,n,[[0,6],[.3,.6],[.7,4]],.8,.5),y(e,n,[[0,0],[.18,1,2],[.7,0,-3]]),S(t,n,0,.9),S(t,at(e,{dur:.8,freqs:[1760,2637],env:[[0,0],[.18,1],[.8,0,-3]],trem:12}),0,.15),C(e,t,z(e,{f0:300,f1:120,dur:.05}),.18,.5),C(e,t,V(e,3e3,.004),.18,.4),t}},m:Q(.5,3,.12)},bashImpact:{r:{sr:24e3,dur:.8,v:3,render(e){let t=f(e,.8);return S(t,z(e,{f0:100,f1:38,dur:.36,sweep:.08,drive:2.2,h2:.3}),0,1),S(t,B(e,{dur:.25,color:`pink`,lp:[[0,4e3],[.15,250]],att:8e-4}),0,1),S(t,Ie(B(e,{dur:.06,bp:1800,q:.9,att:5e-4}),5,2),0,.5),vt(e,t,e.r.range(560,680),0,.22,.3,.006),S(t,B(e,{dur:.01,hp:2e3,att:2e-4,curve:-7}),0,.8),S(t,U(e,{dur:.8,count:6,t0:.01,spread:.08,fLo:500,fHi:2e3,decay:.03,amp:.4}),0,1),L(t,1.4),t}},m:Q(.8,3,.1,7)},leap:{r:{sr:24e3,dur:.6,v:2,render(e){let t=f(e,.6);return S(t,H(e,{dur:.45,peak:.2,f0:200,fp:900,f1:400,q:.9,body:.7}),0,.9),S(t,W(e,{dur:.25,f0:[[0,150],[.25,130]],vowels:[[0,`uh`]],voiced:.45,breath:.7,env:x(.02,.22,-3)}),0,.3),t}},m:Q(.5,2,.05)},leapLand:{r:{sr:24e3,dur:1,v:2,render(e){let t=f(e,1);return S(t,z(e,{f0:90,f1:32,dur:.46,sweep:.1,drive:2.5,h2:.3}),0,1),S(t,B(e,{dur:.35,color:`brown`,lp:[[0,1500],[.3,150]],att:.001}),0,1.2),S(t,U(e,{dur:1,count:22,t0:.01,spread:.25,fLo:400,fHi:2500,decay:.03,amp:.6}),0,1),S(t,Ie(B(e,{dur:.05,bp:1500,q:.9,att:5e-4}),6,2),0,.4),S(t,Ze(e,{dur:.8,lp:200,env:[[0,0],[.02,1],[.8,0,-3]]}),0,.6),t}},m:Q(.82,2,.1,7)},whirlwindLoop:{r:{sr:24e3,dur:1.6,v:2,loop:!0,rms:.17,render:e=>sn(e)},m:{lvl:.5,send:.05,cap:2,prio:6,bus:`sfx`,oneShot:2.2}},howl:{r:{sr:22050,dur:1.6,v:2,render(e){let t=f(e,1.4),n=[[0,0],[.15,1,2],[.9,.85],[1.3,0,-3]];S(t,W(e,{dur:1.3,f0:[[0,110],[.2,140],[.9,128],[1.2,100]],vowels:[[0,`a`],[.8,`o`]],scale:.8,rough:.4,breath:.5,growl:.3,drive:2.5,env:n}),0,1);let r=Se(e,t.length);F(e,r,`bp`,400,.8),y(e,r,n),S(t,r,0,.35);let i=j(e,t.length,55,`sine`);return y(e,i,n),S(t,i,0,.25),t}},m:Q(.62,2,.2,7)},warCry:{r:{sr:22050,dur:1.8,v:2,render(e){let t=f(e,1.6);return S(t,W(e,{dur:.95,f0:[[0,150],[.1,195],[.6,175],[.9,125]],vowels:[[0,`a`],[.3,`ae`],[.7,`a`]],scale:.9,rough:.3,breath:.4,drive:2.8,env:[[0,0],[.05,1],[.7,.8],[.95,0,-3]]}),0,.9),C(e,t,z(e,{f0:70,f1:35,dur:.6,drive:1.6,h2:.2}),.15,.9),C(e,t,H(e,{dur:.7,peak:.1,f0:200,fp:1500,f1:300,q:.8,body:.6}),.15,.6),t}},m:Q(.72,2,.2,7)},roarBuff:{r:{sr:24e3,dur:1.9,v:2,render(e){let t=f(e,1.8);return S(t,W(e,{dur:.9,f0:[[0,120],[.15,155],[.8,120]],vowels:[[0,`a`],[.6,`o`]],scale:.85,rough:.35,breath:.45,growl:.25,drive:2.4,env:[[0,0],[.08,1],[.6,.8],[.9,0,-3]]}),0,.8),S(t,at(e,{dur:1.8,freqs:[1046.5,1318.5,1568,2093],env:[[0,0],[.35,1,2],[1.7,0,-3]],trem:6}),0,.3),S(t,G(e,{dur:1.8,count:12,fLo:4e3,fHi:1e4,t0:.2,t1:1.3,amp:.3}),0,1),t}},m:Q(.62,2,.2,7)},boneCast:{r:{sr:24e3,dur:.7,v:2,render(e){let t=f(e,.7);S(t,K(e,{dur:.7,count:8,spread:.15,fLo:900,fHi:2800}),0,.7),S(t,H(e,{dur:.4,peak:.1,f0:600,fp:2e3,f1:900,q:1.6}),0,.6);let n=xe(e,t.length,180,2.01,[[0,3],[.5,.5]],.3);return y(e,n,x(.01,.5,-3)),S(t,n,0,.8),t}},m:Q(.5,4)},boneImpact:{r:{sr:24e3,dur:.5,v:2,render(e){let t=f(e,.5);S(t,V(e,3e3,.004),0,1);let n=e.r.range(900,1200);return P(e,t.length,[{f:n,a:1,d:.05},{f:n*1.83,a:.6,d:.035,ph:.3},{f:n*2.7,a:.4,d:.025,ph:.6}],t,0),S(t,Ie(B(e,{dur:.05,bp:2200,q:.9,att:5e-4}),6,2),0,.5),S(t,K(e,{dur:.5,count:6,spread:.15,t0:.02,fLo:1200,fHi:3500,decay:.02}),0,.4),S(t,z(e,{f0:180,f1:100,dur:.06}),0,.5),t}},m:Q(.55,5)},teethCast:{r:{sr:24e3,dur:.6,v:2,render(e){let t=f(e,.6);S(t,K(e,{dur:.6,count:16,spread:.18,fLo:2e3,fHi:4500,decay:.012,bursty:.1}),0,.9),S(t,H(e,{dur:.3,peak:.08,f0:700,fp:2500,f1:1e3,q:1.6}),0,.4);let n=j(e,t.length,98,`saw`,.3);return F(e,n,`lp`,600),y(e,n,x(.01,.4,-3)),S(t,n,0,.6),t}},m:Q(.48,4)},corpseExplode:{r:{sr:22050,dur:1.6,v:2,render(e){let t=f(e,1.6);S(t,ct(e,{dur:1,size:.4,crack:.4}),0,.9),S(t,rt(e,{dur:.5,f:600,wet:1}),0,1.2);for(let n=0;n<12;n++){let n=.04+e.r.expo(.18);C(e,t,rt(e,{dur:e.r.range(.06,.15),f:e.r.range(400,1500),wet:.6}),n,.5*Math.exp(-n*2))}for(let n=0;n<6;n++)C(e,t,lt(e,e.r.range(300,600),.1,1.6),e.r.range(.3,1.2),.25);return S(t,K(e,{dur:1.6,count:8,spread:.3,t0:.05,fLo:800,fHi:2500}),0,.4),t}},m:Q(.78,4,.12,7)},curse:{r:{sr:22050,dur:2,v:2,render(e){let t=f(e,1.8),n=[[0,0],[.7,1,2],[1.1,.9],[1.6,0,-3]];S(t,an(e,1.6,1,n),0,.8),S(t,an(e,1.6,.85,n),0,.6);let r=s(t.length);return j(e,r.length,55,`sine`,.5,0,r),j(e,r.length,58.27,`sine`,.4,.3,r),j(e,r.length,110,`tri`,.15,.1,r),y(e,r,n),S(t,r,0,.5),S(t,B(e,{dur:1.3,color:`pink`,lp:[[0,200],[1.25,1600,2]],env:[[0,0],[1.25,1,3],[1.3,0]]}),0,.4),J(e,t,1.6,.38,.5)}},m:Q(.55,2,.15,6)},terror:{r:{sr:22050,dur:2.2,v:2,render(e){let t=f(e,2);return S(t,W(e,{dur:1.5,f0:[[0,500],[.4,900],[1,700],[1.4,400]],vowels:[[0,`i`],[.5,`a`],[1.2,`u`]],voiced:.7,breath:.8,scale:1.2,vibrato:.04,vibRate:7,env:[[0,0],[.3,1,2],[1,.8],[1.5,0,-3]]}),0,.6),S(t,an(e,1.6,.9,[[0,0],[.5,1,2],[1.6,0,-3]]),0,.5),S(t,z(e,{f0:70,f1:30,dur:.6,drive:1.5}),0,.8),J(e,t,2,.42,.5)}},m:Q(.6,2,.15,6)},summonRise:{r:{sr:16e3,dur:1.8,v:2,render(e){let t=f(e,1.8);S(t,Ze(e,{dur:1.7,lp:160,env:[[0,0],[.6,1,2],[1.7,0,-3]]}),0,1.1),S(t,U(e,{dur:1.8,count:30,t0:.05,spread:.6,fLo:250,fHi:1500,decay:.03,amp:.5,fall:.8}),0,1),S(t,K(e,{dur:1.8,count:10,spread:.6,t0:.6,fLo:900,fHi:2800}),0,.5);let n=s(t.length);return j(e,n.length,110,`sine`,.5,0,n),j(e,n.length,164.8,`sine`,.35,.2,n),y(e,n,[[0,0],[.8,1,2],[1.7,0,-3]]),S(t,n,0,.3),t}},m:Q(.6,3,.12)},golemSummon:{r:{sr:16e3,dur:2.3,v:2,render(e){let t=f(e,2.2);return S(t,Ze(e,{dur:2.1,lp:120,env:[[0,0],[1,1,2],[2.1,0,-3]],wob:3}),0,1.3),S(t,U(e,{dur:2.2,count:40,t0:.05,spread:.9,fLo:150,fHi:900,decay:.05,amp:.6,fall:.6}),0,1),S(t,et(e,{dur:1.4,rate:[[0,12],[1.4,30]],res:[{f:120,d:.08,a:1},{f:310,d:.06,a:.6},{f:700,d:.04,a:.3}],env:[[0,0],[.6,1],[1.4,0,-2]]}),.2,.5),C(e,t,z(e,{f0:75,f1:30,dur:.5,drive:2,h2:.3}),1.6,1.1),C(e,t,U(e,{dur:.6,count:12,t0:.01,spread:.15,fLo:300,fHi:1500,decay:.03,amp:.6}),1.6,1),S(t,W(e,{dur:1.5,f0:60,vowels:[[0,`o`],[1,`u`]],scale:.6,rough:.8,voiced:.6,breath:.6,drive:2,env:[[0,0],[.8,1,2],[1.5,0,-3]]}),.5,.4),t}},m:Q(.75,2,.12,7)},lifeTapHeal:{r:{sr:24e3,dur:1.3,v:2,render(e){let t=f(e,1.3),n=s(t.length);return j(e,n.length,220,`sine`,.4,0,n),j(e,n.length,329.6*1.002,`sine`,.3,.3,n),j(e,n.length,440*.998,`sine`,.25,.6,n),y(e,n,[[0,0],[.35,1,2],[1.2,0,-3]]),S(t,n,0,.5),S(t,B(e,{dur:.45,color:`pink`,bp:[[0,300],[.4,1200,1]],q:6,env:[[0,0],[.1,1],[.45,0,-3]]}),0,.6),ht(e,t,1760,.25,.25,.8),t}},m:Q(.5,3,.2)}},un=(e,t=3)=>({lvl:e,send:0,cap:t,prio:9,bus:`ui`}),$=(e,t=.08,n=4)=>({lvl:e,send:t,cap:n,prio:5,bus:`sfx`});function dn(e,t,n){S(t,z(e,{f0:170,f1:85,dur:.1,sweep:.04}),0,n),S(t,B(e,{dur:.06,color:`pink`,lp:1400,curve:-6}),0,n*.6)}let fn={uiHover:{r:{sr:24e3,dur:.07,v:2,render(e){let t=f(e,.07);return S(t,B(e,{dur:.03,bp:e.r.range(3e3,3800),q:1.4,att:5e-4,curve:-6}),0,.6),S(t,j(e,t.length,e.r.range(1900,2300),`sine`,.25),0,1),y(e,t,x(.001,.05,-6)),t}},m:un(.16,2)},uiClick:{r:{sr:24e3,dur:.14,v:3,render(e){let t=f(e,.14);return S(t,z(e,{f0:e.r.range(240,290),f1:130,dur:.06,sweep:.02}),0,.55),S(t,V(e,e.r.range(2600,3400),.004),0,.9),P(e,t.length,[{f:e.r.range(2900,3300),a:.22,d:.06},{f:e.r.range(6800,7400),a:.08,d:.03}],t,0),S(t,B(e,{dur:.035,bp:900,q:3,att:5e-4}),0,.35),t}},m:un(.42)},uiOpen:{r:{sr:24e3,dur:.42,v:2,render(e){let t=f(e,.42);return S(t,H(e,{dur:.22,peak:.1,f0:500,fp:e.r.range(1200,1600),f1:700,q:.9}),0,.55),C(e,t,z(e,{f0:140,f1:78,dur:.13,sweep:.05}),.085,.75),C(e,t,nt(e,{dur:.26,rate:140,fLo:2400,fHi:7e3,env:x(.02,.24,-3)}),.02,.35),C(e,t,V(e,1800,.006),.088,.35),t}},m:un(.42)},uiClose:{r:{sr:24e3,dur:.32,v:2,render(e){let t=f(e,.32);return S(t,H(e,{dur:.16,peak:.05,f0:1300,fp:900,f1:380,q:.9}),0,.5),C(e,t,z(e,{f0:125,f1:70,dur:.12,sweep:.04}),.05,.8),C(e,t,V(e,1500,.006),.052,.3),C(e,t,nt(e,{dur:.14,rate:120,fLo:2200,fHi:6500,env:x(.01,.13,-3)}),0,.25),t}},m:un(.4)},uiError:{r:{sr:24e3,dur:.32,v:2,render(e){let t=f(e,.32),n=t.length,r=f(e,.32);return j(e,n,98,`square`,.5,0,r),j(e,n,103.8,`square`,.5,.3,r),F(e,r,`lp`,650,.9),y(e,r,[[0,0],[.006,1],[.09,.45],[.11,.9],[.28,0,-4]]),S(t,r,0,.8),S(t,z(e,{f0:170,f1:110,dur:.07}),0,.6),C(e,t,z(e,{f0:160,f1:105,dur:.08}),.1,.55),L(t,1.4),t}},m:un(.38)},uiLearn:{r:{sr:24e3,dur:1.3,v:2,render(e,t){let n=f(e,1),r=t?Y(880,2):880;[0,4,7,12].forEach((t,i)=>q(e,n,Y(r,t),i*.065,.55+i*.1,.7,.8)),S(n,G(e,{dur:1,count:9,fLo:4e3,fHi:9500,t0:.05,t1:.6,amp:.25}),0,1),S(n,H(e,{dur:.45,peak:.25,f0:900,fp:4500,f1:5e3,q:1.5,color:`white`}),0,.18);let i=j(e,n.length,Y(r,-12),`sine`,.25);return y(e,i,x(.05,.8,-3)),S(n,i,0,1),J(e,n,1.2,.25,.3)}},m:un(.45,2)},uiStat:{r:{sr:24e3,dur:.55,v:2,render(e){let t=f(e,.55);return S(t,V(e,3500,.003),0,.6),q(e,t,e.r.pick([1568,1661,1760]),.004,.7,.4,.9),t}},m:un(.36)},uiBuy:{r:{sr:32e3,dur:.7,v:2,render(e){let t=f(e,.7);return S(t,Xe(e,{dur:.7,count:e.r.int(4,6),spread:.16,t0:.02}),0,.8),C(e,t,z(e,{f0:150,f1:90,dur:.09}),.16,.5),C(e,t,nt(e,{dur:.15,rate:160,fLo:1500,fHi:5e3,env:x(.01,.14,-3)}),.14,.3),t}},m:un(.45)},uiSell:{r:{sr:32e3,dur:.8,v:2,render(e){let t=f(e,.8);return yt(e,t,e.r.range(200,240),0,.6,.08),S(t,V(e,1800,.004),0,.5),S(t,Xe(e,{dur:.8,count:e.r.int(7,10),spread:.32,t0:.03,fLo:3e3,fHi:5600}),0,.85),t}},m:un(.45)},uiTransmute:{r:{sr:24e3,dur:1.9,v:2,render(e){let t=f(e,1.5),n=B(e,{dur:.9,color:`white`,bp:[[0,300],[.6,2600],[.9,900]],q:1.6,env:[[0,0],[.55,1,2.5],[.9,0,-3]]});return Ae(e,n,[[0,7],[.6,.7],[.9,3]],.75,.55),S(t,n,0,.7),vt(e,t,e.r.range(620,700),.55,.35,1.1,.006),C(e,t,z(e,{f0:120,f1:55,dur:.3,drive:1.4}),.55,.7),S(t,G(e,{dur:1.5,count:12,fLo:3e3,fHi:9e3,t0:.55,t1:1.1,amp:.3}),0,1),J(e,t,1.4,.3,.35)}},m:un(.5,2)},goldPickup:{r:{sr:32e3,dur:.6,v:3,render(e){let t=f(e,.6);return S(t,Xe(e,{dur:.6,count:e.r.int(5,8),spread:.22,fLo:2800,fHi:5600}),0,1),S(t,B(e,{dur:.04,color:`pink`,lp:1500}),0,.3),t}},m:{...$(.5,.05),bus:`ui`}},itemPickup:{r:{sr:24e3,dur:.3,v:3,render(e){let t=f(e,.3);return S(t,H(e,{dur:.14,peak:.05,f0:900,fp:e.r.range(2e3,2700),f1:1200,q:.8}),0,.6),C(e,t,z(e,{f0:220,f1:125,dur:.06}),.06,.6),C(e,t,nt(e,{dur:.12,rate:200,fLo:1500,fHi:6e3,env:x(.01,.11,-3)}),.02,.35),t}},m:{...$(.42),bus:`ui`}},itemPlace:{r:{sr:24e3,dur:.24,v:2,render(e){let t=f(e,.24);return S(t,z(e,{f0:e.r.range(165,195),f1:100,dur:.08}),0,.8),S(t,B(e,{dur:.05,color:`pink`,lp:1500}),0,.5),S(t,V(e,1500,.004),0,.3),t}},m:{...$(.42),bus:`ui`}},itemEquipMetal:{r:{sr:24e3,dur:.7,v:2,render(e){let t=f(e,.7);return[0,.028,.065,.11].forEach((n,r)=>{P(e,t.length,[{f:e.r.range(900,2400),a:.5/(r+1),d:.25},{f:e.r.range(2600,5200),a:.3/(r+1),d:.15},{f:e.r.range(5200,8e3),a:.15/(r+1),d:.08}],t,Math.floor(n*e.sr)),C(e,t,V(e,4500,.002),n,.4/(r+1))}),S(t,K(e,{dur:.6,count:7,spread:.2,t0:.03,fLo:2500,fHi:6500,decay:.05}),0,.35),S(t,B(e,{dur:.15,bp:3e3,q:2,att:.01,curve:-3}),0,.15),S(t,z(e,{f0:180,f1:100,dur:.07}),0,.4),t}},m:{...$(.48),bus:`ui`}},itemEquipCloth:{r:{sr:24e3,dur:.45,v:2,render(e){let t=f(e,.45);return S(t,nt(e,{dur:.3,rate:220,fLo:1400,fHi:6e3,env:x(.03,.27,-2)}),0,.8),S(t,H(e,{dur:.25,peak:.1,f0:500,fp:1300,f1:600,q:.8}),0,.4),C(e,t,z(e,{f0:150,f1:90,dur:.08}),.18,.45),t}},m:{...$(.45),bus:`ui`}},dropGeneric:{r:{sr:24e3,dur:.4,v:3,render(e){let t=f(e,.4);return S(t,z(e,{f0:e.r.range(140,170),f1:70,dur:.13,sweep:.04,drive:1.3}),0,.9),S(t,B(e,{dur:.1,color:`brown`,lp:900}),0,.8),S(t,U(e,{dur:.4,count:4,t0:.01,spread:.05,fLo:600,fHi:1800,decay:.025,amp:.4}),0,1),t}},m:$(.5)},dropRing:{r:{sr:32e3,dur:.85,v:2,render(e){let t=f(e,.85),n=e.r.range(3700,4600),r=0,i=e.r.range(.14,.18);for(let a=0;a<6;a++){let o=.6**a;P(e,t.length,[{f:n*(1+e.r.bi()*.004),a:o,d:.28,ph:e.r.next()},{f:n*2.41,a:o*.45,d:.15,ph:e.r.next()},{f:n*4.1,a:o*.2,d:.08,ph:e.r.next()}],t,Math.floor(r*e.sr)),C(e,t,V(e,7e3,.0015),r,o*.4),r+=i,i*=.62}return t}},m:$(.42)},dropAmulet:{r:{sr:24e3,dur:.85,v:2,render(e){let t=f(e,.85);S(t,K(e,{dur:.85,count:9,spread:.14,fLo:2600,fHi:6500,decay:.06,bursty:.15}),0,.55);let n=e.r.range(2400,2900);return[.02,.17,.26].forEach((r,i)=>ht(e,t,n*(1+i*.01),r,.6*.55**i,.35)),t}},m:$(.42)},dropGem:{r:{sr:32e3,dur:.75,v:2,render(e){let t=f(e,.75),n=e.r.range(4800,6200),r=0,i=.12;for(let a=0;a<4;a++)ht(e,t,n*(1+e.r.bi()*.01),r,.55**a,.22),r+=i,i*=.65;return S(t,G(e,{dur:.75,count:2,fLo:7e3,fHi:1e4,t0:.05,t1:.2,amp:.25}),0,1),t}},m:$(.38)},dropRune:{r:{sr:24e3,dur:.45,v:2,render(e){let t=f(e,.45),n=e.r.range(1150,1550);return[0,.085,.135].forEach((r,i)=>{let a=.5**i;P(e,t.length,[{f:n,a,d:.035,ph:0},{f:n*1.93,a:a*.6,d:.025,ph:.4},{f:n*3.3,a:a*.3,d:.015,ph:.7}],t,Math.floor(r*e.sr)),C(e,t,V(e,2600,.003),r,a*.7)}),S(t,z(e,{f0:210,f1:120,dur:.05}),0,.45),t}},m:$(.48)},dropPotion:{r:{sr:24e3,dur:.6,v:2,render(e){let t=f(e,.6),n=e.r.range(2100,2700);return ht(e,t,n,0,.9,.35),ht(e,t,n*1.01,.085,.35,.25),S(t,V(e,5e3,.002),0,.4),C(e,t,B(e,{dur:.22,color:`pink`,bp:[[0,900],[.22,480]],q:3,att:.02,curve:-3}),.02,.5),C(e,t,ut(e,.1,e.r.range(380,460)),.08,.2),t}},m:$(.42)},dropScroll:{r:{sr:24e3,dur:.4,v:2,render(e){let t=f(e,.4);return S(t,nt(e,{dur:.26,rate:170,fLo:1800,fHi:6500,env:x(.02,.24,-2)}),0,.8),C(e,t,z(e,{f0:300,f1:180,dur:.035}),.2,.4),t}},m:$(.4)},dropMagic:{r:{sr:24e3,dur:1.1,v:2,render(e,t){let n=f(e,1.1);dn(e,n,.5);let r=Y(1318.5,t-1);return q(e,n,r,.04,.5,.6,.8),q(e,n,Y(r,7),.13,.6,.7,.8),S(n,G(e,{dur:1.1,count:3,fLo:5e3,fHi:9e3,t0:.1,t1:.4,amp:.2}),0,1),n}},m:$(.5,.22,3)},dropRare:{r:{sr:24e3,dur:1.5,v:2,render(e,t){let n=f(e,1.3);dn(e,n,.55);let r=Y(1174.7,t);[0,4,7].forEach((t,i)=>q(e,n,Y(r,t),.04+i*.075,.5+i*.12,.8,.85)),S(n,G(e,{dur:1.3,count:6,fLo:4500,fHi:9500,t0:.15,t1:.6,amp:.22}),0,1);let i=j(e,n.length,Y(r,-24),`sine`,.3);return y(e,i,x(.06,.9,-3)),C(e,n,i,.04,1),J(e,n,1,.22,.35)}},m:$(.55,.15,3)},dropSet:{r:{sr:24e3,dur:1.9,v:2,render(e,t){let n=f(e,1.6);dn(e,n,.55);let r=Y(784,t*2),i=n.length;return[0,4,6,7,11,14].forEach((t,a)=>{let o=Math.floor((.05+a*.07)*e.sr);ke(e,i,Y(r,t),{t60:1.1,bright:.75,hard:.7,pick:.2},n,o,.32)}),S(n,at(e,{dur:1.6,freqs:[Y(r,12),Y(r,19),Y(r,23)],env:[[0,0],[.4,1,2],[1.5,0,-3]],trem:7}),0,.12),S(n,G(e,{dur:1.6,count:8,fLo:4500,fHi:9500,t0:.2,t1:.9,amp:.2}),0,1),J(e,n,1.2,.26,.35)}},m:$(.58,.18,3)},dropUnique:{r:{sr:24e3,dur:2.8,v:2,rms:.17,render(e,t){let n=f(e,2.2);dn(e,n,.7),vt(e,n,e.r.range(108,116),0,.55,2.2,.003);let r=Y(1046.5,t?2:0);return[0,7,14,16,19,24].forEach((t,i)=>q(e,n,Y(r,t),.06+i*.085,.45+i*.06,1.1,.9)),S(n,at(e,{dur:2.2,freqs:[Y(r,-12),Y(r,-5),Y(r,4),Y(r,7)],env:[[0,0],[.6,1,2],[2.1,0,-3]],trem:5}),0,.22),S(n,G(e,{dur:2.2,count:16,fLo:4e3,fHi:1e4,t0:.2,t1:1.4,amp:.25}),0,1),I(e,n,12e3),J(e,n,1.6,.3,.35)}},m:$(.62,.2,2)},potionDrink:{r:{sr:24e3,dur:.95,v:2,render(e){let t=f(e,.95);ht(e,t,e.r.range(2e3,2400),0,.35,.18),S(t,B(e,{dur:.05,bp:1200,q:2}),0,.3);let n=e.r.int(2,3);for(let r=0;r<n;r++)C(e,t,ut(e,e.r.range(.13,.17),e.r.range(260,340)),.13+r*e.r.range(.18,.22),.9);return C(e,t,B(e,{dur:.25,color:`pink`,bp:700,q:1.5,att:.05,curve:-2}),.12,.15),t}},m:{...$(.5,.05),bus:`ui`}},scrollRead:{r:{sr:24e3,dur:1,v:2,render(e){let t=f(e,1);return S(t,nt(e,{dur:.42,rate:220,fLo:1800,fHi:7e3,env:x(.03,.39,-2)}),0,.7),C(e,t,B(e,{dur:.7,color:`pink`,bp:[[0,600],[.7,3200]],q:2,env:[[0,0],[.4,1,2],[.7,0,-3]]}),.1,.35),S(t,at(e,{dur:1,freqs:[1760,2637],env:[[0,0],[.45,1,2],[1,0,-3]],trem:8}),0,.08),t}},m:{...$(.45,.1),bus:`ui`}},identify:{r:{sr:24e3,dur:1.2,v:2,render(e){let t=f(e,1);return S(t,B(e,{dur:.35,color:`white`,bp:[[0,1200],[.35,6e3]],q:2,env:[[0,0],[.25,1,2],[.35,0,-3]]}),0,.3),q(e,t,e.r.pick([1318.5,1396.9]),.25,.7,.7,.85),S(t,G(e,{dur:1,count:7,fLo:4500,fHi:9500,t0:.2,t1:.6,amp:.25}),0,1),J(e,t,1,.2,.3)}},m:{...$(.48,.1),bus:`ui`}}},pn=(e,t=.18,n=3,r=7)=>({lvl:e,send:t,cap:n,prio:r,bus:`sfx`});function mn(e,t,n,r,i,a=4){let o=Math.round(t*e.sr),c=s(o);for(let t of n)j(e,o,t*(1+e.r.bi()*.003),`saw`,1/n.length,e.r.next(),c),j(e,o,t*1.004,`saw`,.5/n.length,e.r.next(),c);return F(e,c,`lp`,[[0,r],[t*.75,i,2],[t,i*.7]],a),y(e,c,[[0,0],[t*.6,1,2],[t,0,-3]]),c}function hn(e,t,n,r,i,a){let o=Math.min(n,r);for(let r=0;r<o;r++){let a=r/n;e[t+r]+=i*a*a}let s=i;for(let i=n;i<r;i++)e[t+i]+=s,s*=a}function gn(e,t){let n=4.6,r=Math.round(n*e.sr),i=t===0,a=[],o=e.r,l=s(r);if(i){let t=0;for(let n=0;n<6;n++)C(e,l,B(e,{dur:o.range(.04,.14),color:`white`,hp:250,lp:7500,att:5e-4,curve:-6}),t,.7**n*o.range(.7,1)),t+=o.range(.015,.06);let n=N(e,Math.round(.35*e.sr),[[0,3e3],[.35,300]],1.4);F(e,n,`bp`,2400,.7),S(l,n,0,1.2),S(l,z(e,{f0:70,f1:30,dur:1.4,sweep:.4,drive:1.5}),0,.9)}for(let t=0;t<2;t++){let t=c(l),u=Ce(e,r);F(e,u,`lp`,[[0,i?420:260],[n,90,-2]],.7);let d=s(r),f=o.int(4,6);for(let t=0;t<f;t++){let n=(i?.1:0)+o.range(0,2.6)*(t/f+.2),a=o.range(.4,1)*(1-t/(f+2)),s=o.range(.15,.5),c=o.range(.8,1.8),l=Math.floor(n*e.sr),u=Math.floor(s*e.sr),p=Math.floor(c*e.sr);hn(d,l,u,Math.min(r-l,u+p*3),a,Math.exp(-1/p))}_(u,d),h(u,R(e,r,7),.75,.25),S(t,u,0,i?2.2:2.8),i||I(e,t,900),a.push(t)}return a}let _n={levelUp:{r:{sr:24e3,dur:3.4,v:2,rms:.17,render(e,t){let n=f(e,2.8),r=Y(523.25,t?2:0);[0,7,12,16,19,24].forEach((t,i)=>q(e,n,Y(r,t),i*.07,.4+i*.07,1.3-i*.1,.9)),S(n,at(e,{dur:2.8,freqs:[Y(r,12),Y(r,16),Y(r,19),Y(r,24)],env:[[0,0],[.6,1,2],[2.7,0,-3]],trem:6}),0,.3),S(n,B(e,{dur:.8,color:`white`,bp:[[0,400],[.7,6500]],q:1.4,env:[[0,0],[.55,1,2.5],[.8,0,-3]]}),0,.32);let i=s(n.length);return j(e,i.length,Y(r,-24),`sine`,.5,0,i),j(e,i.length,Y(r,-17),`sine`,.35,0,i),j(e,i.length,Y(r,-12),`tri`,.18,0,i),y(e,i,[[0,0],[.25,1,2],[2.6,0,-3]]),S(n,i,0,.45),S(n,z(e,{f0:130,f1:60,dur:.3}),0,.5),S(n,G(e,{dur:2.8,count:16,fLo:4e3,fHi:1e4,t0:.3,t1:2,amp:.22}),0,1),bt(e,n,2.2,.35,.35)}},m:{lvl:.62,send:.1,cap:1,prio:10,bus:`ui`}},questComplete:{r:{sr:24e3,dur:2.8,v:2,rms:.17,render(e,t){let n=f(e,2.3),r=Y(783.99,t);for(let[t,i]of[[0,0],[5,.12],[7,.24],[12,.42]])q(e,n,Y(r,t),i,.65,1.2,.9);return q(e,n,Y(r,16),.42,.35,1.4,.9),q(e,n,Y(r,-12),.42,.5,2,.6),S(n,at(e,{dur:2.3,freqs:[Y(r,12),Y(r,16),Y(r,19)],env:[[0,0],[.42,0],[.8,1,2],[2.2,0,-3]],trem:6}),0,.2),S(n,G(e,{dur:2.3,count:10,fLo:5e3,fHi:1e4,t0:.4,t1:1.4,amp:.2}),0,1),bt(e,n,2,.3,.35)}},m:{lvl:.55,send:.1,cap:1,prio:10,bus:`ui`}},skillPointGained:{r:{sr:24e3,dur:1.4,v:2,render(e,t){let n=f(e,1.2),r=Y(1318.5,t?-2:0);return q(e,n,r,0,.6,.8,.85),q(e,n,Y(r,5),.11,.7,.9,.85),S(n,G(e,{dur:1.2,count:6,fLo:5e3,fHi:1e4,t0:.1,t1:.5,amp:.2}),0,1),S(n,B(e,{dur:.3,color:`white`,bp:[[0,1500],[.3,7e3]],q:2,env:[[0,0],[.2,1,2],[.3,0,-3]]}),0,.15),J(e,n,1.2,.22,.3)}},m:{lvl:.5,send:.1,cap:1,prio:9,bus:`ui`}},waypointActivate:{r:{sr:22050,dur:3,v:2,render(e,t){let n=f(e,2.6),r=Y(110,t?2:0);return S(n,Ze(e,{dur:2.6,lp:130,env:vn(.7,.3,1.6)}),0,1.2),S(n,mn(e,1.4,[r,Y(r,7),Y(r,12)],180,2600,5),0,.5),C(e,n,z(e,{f0:90,f1:42,dur:.6,drive:1.6,h2:.25}),1,.9),[0,7,12,16,19].forEach((t,i)=>q(e,n,Y(r*8,t),1+i*.06,.35,1.2,.8)),S(n,at(e,{dur:2.6,freqs:[Y(r*8,0),Y(r*8,7),Y(r*8,12)],env:[[0,0],[1,0],[1.4,1,2],[2.6,0,-3]],trem:5}),0,.18),S(n,G(e,{dur:2.6,count:12,fLo:3500,fHi:9e3,t0:1,t1:2,amp:.25}),0,1),n}},m:pn(.62,.3,2,8)},waypointTravel:{r:{sr:24e3,dur:2.4,v:2,render(e){let t=f(e,1.8),n=B(e,{dur:1.4,color:`white`,bp:[[0,300],[.7,3200],[1.4,500]],q:1.2,env:[[0,0],[.7,1,2.5],[1.4,0,-3]]});Ae(e,n,[[0,1],[.7,8],[1.4,1.5]],.78,.55),S(t,n,0,.9);let r=j(e,Math.round(1*e.sr),[[0,200],[1,1600,2]],`tri`,.25);return y(e,r,[[0,0],[.8,1,2],[1,0,-3]]),S(t,r,0,1),C(e,t,z(e,{f0:240,f1:50,dur:.6,sweep:.4,drive:1.5,h2:.3}),.85,.8),S(t,G(e,{dur:1.8,count:14,fLo:3500,fHi:9500,t0:.2,t1:1.3,amp:.25}),0,1),J(e,t,1.2,.28,.35)}},m:{lvl:.6,send:.15,cap:2,prio:9,bus:`sfx`}},portalOpen:{r:{sr:24e3,dur:2.6,v:2,render(e){let t=f(e,2.2),n=t.length,r=M(e,n),i=R(e,n,1.5);F(e,r,`bp`,[[0,200],[1.2,1300,2],[2.2,900]],6),h(r,i,.7,.3),Ae(e,r,[[0,6],[1,1],[2.2,5]],.7,.5),y(e,r,vn(.5,.9,.8)),S(t,r,0,1);let a=s(n);return j(e,n,55,`square`,.5,0,a),j(e,n,110.4,`saw`,.3,0,a),F(e,a,`lp`,420,1.2),Le(e,a,6,.8),y(e,a,vn(.4,1,.8)),S(t,a,0,.45),S(t,z(e,{f0:140,f1:50,dur:.4,drive:1.4}),0,.6),S(t,G(e,{dur:2.2,count:14,fLo:3e3,fHi:8e3,t0:.3,t1:1.8,amp:.25}),0,1),t}},m:pn(.6,.3,2,8)},portalEnter:{r:{sr:24e3,dur:2,v:2,render(e){let t=f(e,1.4);return S(t,B(e,{dur:.65,color:`pink`,lp:[[0,300],[.62,7e3,3]],env:[[0,0],[.62,1,4],[.66,.2]]}),0,1.1),C(e,t,z(e,{f0:320,f1:40,dur:.6,sweep:.35,drive:1.8,h2:.3}),.6,1),C(e,t,B(e,{dur:.5,color:`brown`,lp:[[0,2e3],[.5,200]],curve:-4}),.6,.9),S(t,at(e,{dur:1.4,freqs:[880,1318.5,1760],env:[[0,0],[.6,0],[.7,1],[1.4,0,-3]],trem:9}),0,.15),J(e,t,1.2,.28,.4)}},m:{lvl:.62,send:.15,cap:2,prio:9,bus:`sfx`}},chestOpen:{r:{sr:24e3,dur:1.1,v:2,render(e){let t=f(e,1.1);return vt(e,t,e.r.range(1150,1450),0,.3,.15,.01),S(t,V(e,2500,.004),0,.6),C(e,t,et(e,{dur:.6,rate:[[0,22],[.3,70],[.6,40]],res:[{f:320,d:.05,a:1},{f:740,d:.04,a:.7},{f:1500,d:.03,a:.4},{f:2600,d:.02,a:.2}],env:vn(.12,.3,.18),noise:.3}),.08,.8),C(e,t,z(e,{f0:120,f1:68,dur:.16,drive:1.3}),.7,.9),C(e,t,B(e,{dur:.12,color:`brown`,lp:800}),.7,.7),yt(e,t,e.r.range(180,230),.7,.5,.08),t}},m:pn(.6,.12,2,6)},barrelBreak:{r:{sr:24e3,dur:1,v:2,render(e){let t=f(e,1);S(t,B(e,{dur:.03,color:`white`,hp:900,att:3e-4,curve:-7}),0,1),S(t,z(e,{f0:135,f1:60,dur:.16,drive:1.5}),0,.9),[0,.018,.05,.09].forEach((n,r)=>yt(e,t,e.r.range(240,700),n,.8*.7**r,.07)),S(t,U(e,{dur:1,count:26,t0:.004,spread:.12,fLo:700,fHi:3600,decay:.022,amp:.7,fall:3}),0,1);let n=N(e,Math.round(.14*e.sr),[[0,1500],[.14,100]],1.2);return F(e,n,`hp`,2200),S(t,n,0,1.4),S(t,U(e,{dur:1,count:7,t0:.15,spread:.22,fLo:280,fHi:900,decay:.07,amp:.6,fall:1.5}),0,1),t}},m:pn(.68,.12,3,5)},doorOpen:{r:{sr:24e3,dur:1.5,v:2,render(e){let t=f(e,1.5);return vt(e,t,e.r.range(800,1e3),0,.25,.15,.01),yt(e,t,160,0,.6,.1),S(t,V(e,2200,.005),0,.5),C(e,t,et(e,{dur:1.1,rate:[[0,16],[.5,48],[1.1,24]],jitter:.3,res:[{f:180,d:.07,a:1},{f:430,d:.05,a:.8},{f:920,d:.035,a:.45},{f:1750,d:.025,a:.25}],env:vn(.2,.6,.3),noise:.35}),.1,.9),C(e,t,H(e,{dur:.9,peak:.5,f0:150,fp:400,f1:200,q:.7}),.2,.3),C(e,t,z(e,{f0:110,f1:60,dur:.15}),1.25,.5),t}},m:pn(.6,.15,2,6)},shrine:{r:{sr:24e3,dur:3,v:2,rms:.16,render(e,t){let n=f(e,2.5),r=Y(220,t?2:0);for(let t of[0,4,7,12])S(n,W(e,{dur:2.5,f0:Y(r,t),vowels:[[0,`a`],[1.5,`o`]],breath:.3,jitter:.004,shimmer:.04,vibrato:.008,vibRate:5+e.r.next(),env:vn(.6,.9,.9),scale:t>=7?1.12:1,tilt:3200}),0,.25);q(e,n,Y(r,12),0,.6,2.2,.7),S(n,G(e,{dur:2.5,count:10,fLo:3500,fHi:8e3,t0:.2,t1:1.6,amp:.2}),0,1);let i=j(e,n.length,Y(r,-12),`sine`,.3);return y(e,i,vn(.5,1,.9)),S(n,i,0,1),J(e,n,1.8,.36,.4)}},m:{lvl:.6,send:.15,cap:1,prio:8,bus:`sfx`}},stashOpen:{r:{sr:24e3,dur:.8,v:2,render(e){let t=f(e,.8);return vt(e,t,e.r.range(1e3,1300),0,.35,.18,.01),S(t,V(e,3e3,.003),0,.6),C(e,t,et(e,{dur:.32,rate:[[0,30],[.32,60]],res:[{f:350,d:.04,a:1},{f:800,d:.03,a:.6},{f:1700,d:.02,a:.3}],env:vn(.06,.18,.08)}),.06,.6),C(e,t,z(e,{f0:125,f1:70,dur:.14}),.42,.8),yt(e,t,200,.42,.5,.07),t}},m:{lvl:.55,send:.08,cap:1,prio:7,bus:`ui`}},footstepDirt:{r:{sr:22050,dur:.16,v:3,render(e){let t=f(e,.16);return S(t,z(e,{f0:e.r.range(80,100),f1:52,dur:.06}),0,.6),S(t,U(e,{dur:.16,count:6,t0:.002,spread:.02,fLo:600,fHi:2200,decay:.012,amp:.6}),0,1),S(t,B(e,{dur:.07,color:`pink`,lp:1200,att:.004}),0,.6),t}},m:{lvl:.15,send:0,cap:3,prio:1,bus:`sfx`}},footstepStone:{r:{sr:22050,dur:.14,v:3,render(e){let t=f(e,.14);return S(t,V(e,e.r.range(1800,2600),.004),0,.7),S(t,z(e,{f0:e.r.range(130,150),f1:90,dur:.045}),0,.5),S(t,U(e,{dur:.14,count:3,t0:.003,spread:.015,fLo:1500,fHi:4e3,decay:.008,amp:.3}),0,1),S(t,B(e,{dur:.03,bp:1e3,q:2}),0,.35),t}},m:{lvl:.13,send:0,cap:3,prio:1,bus:`sfx`}},footstepGrass:{r:{sr:22050,dur:.18,v:3,render(e){let t=f(e,.18);return S(t,nt(e,{dur:.15,rate:420,fLo:1800,fHi:7e3,env:x(.01,.14,-3),grain:[.002,.012]}),0,.8),S(t,z(e,{f0:80,f1:50,dur:.05}),0,.35),t}},m:{lvl:.12,send:0,cap:3,prio:1,bus:`sfx`}},thunder:{r:{sr:16e3,dur:4.6,v:2,rms:.2,render:(e,t)=>gn(e,t)},m:{lvl:.75,send:.25,cap:2,prio:6,bus:`sfx`}},crowCaw:{r:{sr:22050,dur:1.6,v:2,render(e){let t=f(e,1.6),n=e.r.int(2,3),r=.02;for(let i=0;i<n;i++){let n=e.r.range(.22,.3),a=e.r.range(480,600);C(e,t,W(e,{dur:n,f0:[[0,a*.9],[n*.3,a*1.08],[n,a*.82]],vowels:[[0,`ae`],[n*.6,`a`]],scale:1.55,rough:.55,breath:.55,jitter:.07,drive:2.5,tilt:4e3,env:[[0,0],[.02,1],[n*.7,.8],[n,0,-3]]}),r,.8**i),r+=n+e.r.range(.12,.22)}return t}},m:{lvl:.42,send:.35,cap:2,prio:2,bus:`sfx`}},distantHowl:{r:{sr:16e3,dur:4,v:2,render(e,t){let n=f(e,3.2),r=(t,r,i)=>{C(e,n,W(e,{dur:2.7,f0:[[0,t*.62],[.35,t,-2],[1.6,t*1.03],[2.25,t*.78,-1],[2.7,t*.56]],vowels:[[0,`u`],[.4,`o`],[2,`u`]],breath:.12,jitter:.004,shimmer:.03,vibrato:.012,vibRate:5.2,scale:1.15,tilt:2200,env:[[0,0],[.3,1,2],[2,.8],[2.7,0,-3]]}),r,i)};return r(e.r.range(500,560),0,1),t===1&&r(e.r.range(600,660),.7,.6),I(e,n,2600),J(e,n,2.4,.5,.6)}},m:{lvl:.45,send:.35,cap:2,prio:2,bus:`sfx`}}};function vn(e,t,n){return[[0,0],[e,1,2],[e+t,1],[e+t+n,0,-3]]}let yn={...fn,..._n,...nn,...ln};function bn(e){return yn[e]}let xn=null,Sn=null,Cn=()=>xn??=$t(),wn=()=>Sn??=Mt();function Tn(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e:e.slice()}function En(e,n){return t(e)+Math.imul(n+1,2654435761)>>>0}function Dn(e,t){let r=bn(e);return r?l(()=>{let i=n(r.r.sr,En(e,t)),a=r.r.render(i,t),o=Array.isArray(a)?a:[a],s=!!r.r.loop;return{name:e,root:0,variant:t,chans:w(i,o,{rms:r.r.rms??.2,trim:!s,tail:s?0:.012,keepDc:s}).map(Tn),sr:r.r.sr,loop:s}}):null}function On(e){let t=typeof performance<`u`?performance.now():Date.now(),n=[];if(e.k===`inst`){let t=Cn()[e.i];n=l(()=>t.run().map(e=>({name:t.inst,root:e.root,variant:0,chans:e.chans.map(Tn),sr:e.sr,loop:e.loop})))}else if(e.k===`amb`){let t=wn()[e.i];n=l(()=>t.run().map((e,n)=>({name:t.name,root:0,variant:n,chans:e.chans.map(Tn),sr:e.sr,loop:e.loop})))}else{let t=Dn(e.id,e.v);t&&(n=[t])}let r=(typeof performance<`u`?performance.now():Date.now())-t;return{desc:e,items:n,ms:r}}let kn=self;kn.onmessage=e=>{for(let t of e.data.jobs)try{let e=On(t),n=[];for(let t of e.items)for(let e of t.chans)n.push(e.buffer);kn.postMessage({type:`result`,res:e},{transfer:n})}catch(e){kn.postMessage({type:`error`,desc:t,message:String(e)})}u(),me(),kn.postMessage({type:`done`})}})();", PL = typeof self < `u` && self.Blob && new Blob([`(self.URL || self.webkitURL).revokeObjectURL(self.location.href);`, NL], { type: `text/javascript;charset=utf-8` });
}));
function IL() {
  if (typeof MessageChannel > `u`) return () => new Promise((e5) => setTimeout(e5, 0));
  let e4 = new MessageChannel(), t2 = [];
  return e4.port1.onmessage = () => t2.shift()?.(), () => new Promise((n2) => {
    t2.push(n2), e4.port2.postMessage(0);
  });
}
function LL(e4) {
  return e4.k === `sfx` ? `sfx:${e4.id}:${e4.v}` : `${e4.k}:${e4.i}`;
}
function RL() {
  return typeof performance < `u` ? performance.now() : Date.now();
}
var zL, BL, VL, HL, UL, WL = t((() => {
  CP(), IP(), jL(), FL(), zL = null, BL = class {
    buf = null;
    raw = null;
    sr;
    length;
    channels;
    loop;
    peak;
    finite;
    constructor(e4, t2, n2) {
      this.sr = t2, this.length = e4[0].length, this.channels = e4.length, this.loop = n2;
      let r2 = 0, i2 = true;
      for (let t3 of e4) for (let e5 = 0; e5 < t3.length; e5++) {
        let n3 = t3[e5];
        n3 !== n3 || n3 === 1 / 0 || n3 === -1 / 0 ? i2 = false : n3 > r2 ? r2 = n3 : -n3 > r2 && (r2 = -n3);
      }
      if (this.peak = r2, this.finite = i2, zL !== false) try {
        let n3 = new AudioBuffer({ length: this.length, numberOfChannels: this.channels, sampleRate: t2 });
        e4.forEach((e5, t3) => n3.getChannelData(t3).set(e5)), this.buf = n3, zL = true;
        return;
      } catch {
        zL = false;
      }
      this.raw = e4.map((e5) => e5.slice());
    }
    get(e4) {
      if (this.buf) return this.buf;
      if (!this.raw) return null;
      let t2 = e4.createBuffer(this.channels, this.length, this.sr);
      return this.raw.forEach((e5, n2) => t2.getChannelData(n2).set(e5)), this.buf = t2, this.raw = null, t2;
    }
    get buffer() {
      return this.buf;
    }
    get bytes() {
      return this.length * this.channels * 4;
    }
    get duration() {
      return this.length / this.sr;
    }
  }, VL = 12, HL = 15e3, UL = class {
    sfx = /* @__PURE__ */ new Map();
    inst = /* @__PURE__ */ new Map();
    amb = /* @__PURE__ */ new Map();
    rr = /* @__PURE__ */ new Map();
    sfxMs = /* @__PURE__ */ new Map();
    running = null;
    readyCbs = [];
    prepared = false;
    prepareMs = 0;
    phaseMs = { inst: 0, amb: 0, sfx: 0 };
    musicReady = false;
    prepare(e4) {
      return this.running ? e4 && this.running.then(() => {
        try {
          e4(1);
        } catch {
        }
      }) : this.running = this.run(e4).catch((t2) => {
        console.error(`[audio] prepare failed`, t2), this.prepared = true, this.markMusicReady();
        try {
          e4?.(1);
        } catch {
        }
      }), this.running;
    }
    onMusicReady(e4) {
      this.musicReady ? e4() : this.readyCbs.push(e4);
    }
    async run(e4) {
      let t2 = RL(), n2 = e4 ? (t3) => {
        try {
          e4(t3);
        } catch (e5) {
          console.error(`[audio] onProgress threw`, e5);
        }
      } : void 0, r2 = CL(), i2 = 0, a2 = 0;
      for (let e5 of r2) i2 += e5.w, e5.music && a2++;
      let o2 = 0, s2 = 0;
      n2?.(0);
      let c2 = (e5, t3) => {
        if (t3) {
          try {
            this.addResult(t3);
          } catch (e6) {
            console.error(`[audio] failed to store render result`, e6);
          }
          this.phaseMs[t3.desc.k] += t3.ms;
        }
        o2 += e5.w, e5.music && --a2 === 0 && this.markMusicReady();
        let r3 = RL();
        n2 && r3 - s2 > 30 && (s2 = r3, n2(Math.min(0.999, o2 / i2)));
      }, l2 = this.spawnWorkers();
      if (l2.length) {
        let e5 = l2.map(() => []), t3 = 0;
        for (let n3 of r2) e5[Math.min(l2.length - 1, Math.floor(t3 / i2 * l2.length))].push(n3), t3 += n3.w;
        await Promise.all(l2.map((t4, n3) => this.runWorker(t4, e5[n3], c2)));
      } else await this.runLocal(r2, c2);
      this.musicReady || this.markMusicReady(), YN(), EP(), this.prepared = true, this.prepareMs = RL() - t2, n2?.(1);
    }
    workers = 0;
    spawnWorkers() {
      if (typeof Worker > `u` || typeof window > `u`) return [];
      let e4 = typeof navigator < `u` && navigator.hardwareConcurrency || 2, t2 = Math.max(1, Math.min(3, e4 - 1)), n2 = [];
      try {
        for (let e5 = 0; e5 < t2; e5++) n2.push(new ML({ name: `audio-render-${e5}` }));
      } catch {
        for (let e5 of n2) try {
          e5.terminate();
        } catch {
        }
        return [];
      }
      return n2;
    }
    runWorker(e4, t2, n2) {
      return new Promise((r2) => {
        let i2 = /* @__PURE__ */ new Map(), a2 = /* @__PURE__ */ new Map();
        for (let e5 of t2) i2.set(e5.desc, e5), a2.set(LL(e5.desc), e5);
        let o2 = false, s2 = false, c2 = null, l2 = (t3) => {
          if (o2) return;
          o2 = true, c2 && clearTimeout(c2);
          try {
            e4.terminate();
          } catch {
          }
          let a3 = [...i2.values()];
          t3 && a3.length ? this.runLocal(a3, n2).then(r2, r2) : r2();
        }, u2 = () => {
          c2 && clearTimeout(c2), c2 = setTimeout(() => l2(true), HL);
        };
        e4.onmessage = (e5) => {
          u2();
          let t3 = e5.data;
          if (!(!t3 || typeof t3 != `object`)) if (t3.type === `result` && t3.res) {
            let e6 = a2.get(LL(t3.res.desc));
            if (!e6 || !i2.has(e6.desc)) return;
            i2.delete(e6.desc), s2 || (s2 = true, this.workers++), n2(e6, t3.res);
          } else if (t3.type === `error` && t3.desc) {
            let e6 = a2.get(LL(t3.desc));
            e6 && i2.has(e6.desc) && (console.error(`[audio] render job failed in worker`, t3.message), i2.delete(e6.desc), n2(e6, null));
          } else t3.type === `done` && l2(true);
        }, e4.onerror = (e5) => {
          e5.preventDefault?.(), l2(true);
        }, e4.onmessageerror = () => l2(true), u2();
        try {
          e4.postMessage({ jobs: t2.map((e5) => e5.desc) });
        } catch {
          l2(true);
        }
      });
    }
    async runLocal(e4, t2) {
      let n2 = IL(), r2 = RL();
      for (let i2 of e4) {
        let e5 = null;
        try {
          e5 = EL(i2.desc);
        } catch (e6) {
          console.error(`[audio] render job failed`, e6);
        }
        t2(i2, e5), RL() - r2 > VL && (await n2(), r2 = RL());
      }
    }
    markMusicReady() {
      if (this.musicReady) return;
      this.musicReady = true;
      let e4 = this.readyCbs;
      this.readyCbs = [];
      for (let t2 of e4) t2();
    }
    addResult(e4) {
      for (let t2 of e4.items) {
        let n2 = new BL(t2.chans, t2.sr, t2.loop);
        if (e4.desc.k === `inst`) {
          let e5 = t2.name, r2 = this.inst.get(e5) ?? [];
          r2.push({ root: t2.root, clip: n2 }), r2.sort((e6, t3) => e6.root - t3.root), this.inst.set(e5, r2);
        } else if (e4.desc.k === `amb`) {
          let e5 = t2.name, r2 = this.amb.get(e5) ?? [];
          r2.push(n2), this.amb.set(e5, r2);
        } else {
          let r2 = t2.name, i2 = this.sfx.get(r2) ?? [];
          i2[t2.variant] || (i2[t2.variant] = n2), this.sfx.set(r2, i2), this.sfxMs.set(r2, (this.sfxMs.get(r2) ?? 0) + e4.ms);
        }
      }
    }
    renderSfx(e4, t2) {
      let n2 = this.sfx.get(e4) ?? [];
      if (n2[t2]) return n2[t2];
      let r2 = RL(), i2 = TL(e4, t2);
      if (this.prepared && YN(), !i2) return null;
      let a2 = new BL(i2.chans, i2.sr, i2.loop);
      return n2[t2] = a2, this.sfx.set(e4, n2), this.sfxMs.set(e4, (this.sfxMs.get(e4) ?? 0) + RL() - r2), a2;
    }
    sfxClip(e4) {
      let t2 = this.sfx.get(e4), n2 = t2 ? t2.filter(Boolean) : [];
      if (!n2.length) try {
        return this.renderSfx(e4, 0);
      } catch {
        return null;
      }
      let r2 = (this.rr.get(e4) ?? Math.floor(Math.random() * n2.length)) + 1;
      return this.rr.set(e4, r2), n2[r2 % n2.length];
    }
    instSamples(e4) {
      return this.inst.get(e4) ?? [];
    }
    nearest(e4, t2) {
      let n2 = this.inst.get(e4);
      if (!n2 || !n2.length) return null;
      let r2 = n2[0];
      for (let e5 of n2) Math.abs(e5.root - t2) < Math.abs(r2.root - t2) && (r2 = e5);
      return r2;
    }
    ambClips(e4) {
      return this.amb.get(e4) ?? [];
    }
    stats() {
      let e4 = 0, t2 = 0, n2 = 0, r2 = 0, i2 = {};
      for (let [t3, n3] of this.sfx) {
        let a2 = n3.filter(Boolean), o2 = 0, s2 = 0, c2 = true, l2 = 0;
        for (let e5 of a2) o2 += e5.bytes, s2 = Math.max(s2, e5.peak), c2 &&= e5.finite, l2 = Math.max(l2, e5.duration);
        r2 += a2.length, e4 += o2, i2[t3] = { variants: a2.length, peak: s2, finite: c2, bytes: o2, dur: l2, ms: this.sfxMs.get(t3) ?? 0 };
      }
      for (let e5 of this.inst.values()) for (let n3 of e5) t2 += n3.clip.bytes, r2++;
      for (let e5 of this.amb.values()) for (let t3 of e5) n2 += t3.bytes, r2++;
      return { prepareMs: this.prepareMs, phaseMs: { ...this.phaseMs }, bytes: e4 + t2 + n2, buffers: r2, sfxBytes: e4, instBytes: t2, ambBytes: n2, sfx: i2 };
    }
  };
}));
function GL(e4, t2) {
  let n2 = e4.sampleRate, r2 = Math.max(1, Math.round(t2.dur * n2)), i2 = e4.createBuffer(2, r2, n2), a2 = new PN(t2.seed), o2 = Math.round(t2.pre * n2);
  for (let e5 = 0; e5 < 2; e5++) {
    let s2 = i2.getChannelData(e5), c2 = a2.u32() | 1, l2 = 0, u2 = 0, d2 = -6.9078 / (t2.t60 * n2);
    for (let e6 = o2; e6 < r2; e6++) {
      if (!(e6 - o2 & 63)) {
        let i4 = (e6 - o2) / (r2 - o2), a4 = t2.bright * (t2.dark / t2.bright) ** +i4;
        u2 = 1 - Math.exp(-2 * Math.PI * a4 / n2);
      }
      c2 ^= c2 << 13, c2 ^= c2 >>> 17, c2 ^= c2 << 5;
      let i3 = (c2 | 0) * 4656612873e-19;
      l2 += u2 * (i3 - l2);
      let a3 = Math.min(1, (e6 - o2) / (4e-3 * n2));
      s2[e6] = (l2 * 0.85 + i3 * 0.15 * Math.exp(-(e6 - o2) / n2 * 18)) * Math.exp(d2 * (e6 - o2)) * a3;
    }
    let f2 = Math.max(8, Math.round(4e-3 * n2)), p2 = 9e-4 * n2;
    for (let [i3, c3] of t2.early) {
      let t3 = o2 + Math.round((i3 + a2.range(-15e-4, 15e-4)) * n2), l3 = c3 * (e5 ? 0.85 : 1) * 1.6;
      for (let e6 = 0; e6 < f2 && t3 + e6 < r2; e6++) t3 + e6 >= 0 && (s2[t3 + e6] += l3 * a2.bi() * Math.exp(-e6 / p2));
    }
    let m2 = 0;
    for (let e6 = 0; e6 < r2; e6++) m2 += s2[e6] * s2[e6];
    let h2 = m2 > 0 ? 1 / Math.sqrt(m2) : 1;
    for (let e6 = 0; e6 < r2; e6++) s2[e6] *= h2;
    let g2 = Math.min(r2, Math.round(0.05 * n2));
    for (let e6 = 0; e6 < g2; e6++) s2[r2 - 1 - e6] *= e6 / g2;
  }
  return i2;
}
function KL(e4, t2) {
  let n2 = e4.createGain();
  n2.gain.value = t2.master * YL.master;
  let r2 = e4.createGain(), i2 = e4.createDynamicsCompressor();
  i2.threshold.value = -5, i2.knee.value = 3, i2.ratio.value = 14, i2.attack.value = 2e-3, i2.release.value = 0.14, n2.connect(r2).connect(i2).connect(e4.destination);
  let a2 = e4.createGain(), o2 = e4.createGain(), s2 = e4.createGain();
  s2.gain.value = 0;
  let c2 = e4.createGain();
  c2.gain.value = 0.9;
  let l2 = e4.createConvolver();
  l2.normalize = false, l2.buffer = GL(e4, { dur: 3, t60: 2.5, bright: 9e3, dark: 1400, pre: 0.018, early: [[0.011, 0.5], [0.019, 0.42], [0.027, 0.35], [0.041, 0.3], [0.057, 0.22], [0.073, 0.16]], seed: 1 });
  let u2 = e4.createConvolver();
  return u2.normalize = false, u2.buffer = GL(e4, { dur: 4.5, t60: 4, bright: 6500, dark: 700, pre: 0.03, early: [[0.021, 0.45], [0.047, 0.4], [0.093, 0.55], [0.141, 0.35], [0.233, 0.42], [0.371, 0.25]], seed: 2 }), a2.connect(o2).connect(l2).connect(c2), a2.connect(s2).connect(u2).connect(c2), c2.connect(n2), { ctx: e4, master: n2, fade: r2, limiter: i2, revIn: a2, hallSend: o2, caveSend: s2, revOut: c2, sfx: new JL(e4, n2, a2, t2.sfx * YL.sfx), ui: new JL(e4, n2, null, t2.ui * YL.ui), music: new JL(e4, n2, a2, t2.music * YL.music), amb: new JL(e4, n2, a2, t2.ambience * YL.ambience), sting: new JL(e4, n2, a2, t2.music * YL.sting), space: `hall` };
}
function qL(e4, t2, n2 = 2) {
  if (e4.space === t2) return;
  e4.space = t2;
  let r2 = e4.ctx.currentTime;
  e4.hallSend.gain.setTargetAtTime(+(t2 === `hall`), r2, n2 / 3), e4.caveSend.gain.setTargetAtTime(+(t2 === `cave`), r2, n2 / 3);
}
var JL, YL, XL = t((() => {
  FN(), JL = class {
    ctx;
    inp;
    wet;
    duckG;
    duckW;
    pauseG;
    pauseW;
    volG;
    volW;
    constructor(e4, t2, n2, r2) {
      this.ctx = e4;
      let i2 = (t3 = 1) => {
        let n3 = e4.createGain();
        return n3.gain.value = t3, n3;
      };
      this.inp = i2(), this.duckG = i2(), this.pauseG = i2(), this.volG = i2(r2), this.inp.connect(this.duckG).connect(this.pauseG).connect(this.volG).connect(t2), this.wet = i2(), this.duckW = i2(), this.pauseW = i2(), this.volW = i2(r2), this.wet.connect(this.duckW).connect(this.pauseW).connect(this.volW), n2 && this.volW.connect(n2);
    }
    setVolume(e4, t2 = 0.05) {
      let n2 = this.ctx.currentTime;
      for (let r2 of [this.volG.gain, this.volW.gain]) r2.setTargetAtTime(Math.max(0, e4), n2, t2);
    }
    setPaused(e4) {
      let t2 = this.ctx.currentTime;
      for (let n2 of [this.pauseG.gain, this.pauseW.gain]) n2.cancelScheduledValues(t2), n2.setTargetAtTime(+!e4, t2, e4 ? 0.08 : 0.12);
    }
    duck(e4, t2) {
      let n2 = this.ctx.currentTime, r2 = 1 - Math.min(1, Math.max(0, e4)), i2 = Math.max(0.08, t2 * 0.45), a2 = Math.max(i2 + 0.2, t2);
      for (let e5 of [this.duckG.gain, this.duckW.gain]) {
        let t3 = e5.value, o2 = Math.min(t3, r2);
        e5.cancelScheduledValues(n2), e5.setValueAtTime(t3, n2), e5.linearRampToValueAtTime(o2, n2 + 0.06), e5.setValueAtTime(o2, n2 + i2), e5.linearRampToValueAtTime(1, n2 + a2);
      }
    }
  }, YL = { master: 0.85, music: 0.5, sfx: 1, ui: 0.9, ambience: 0.8, sting: 0.7 };
}));
function ZL(e4, t2, n2) {
  return e4.weighted(t2[n2]);
}
function QL(e4, t2, n2, r2) {
  let i2 = [];
  for (let a2 = n2; a2 <= r2; a2++) {
    let n3 = ((a2 - e4) % 12 + 12) % 12;
    t2.includes(n3) && i2.push(a2);
  }
  return i2;
}
function $L(e4, t2, n2, r2) {
  let i2 = t2.tones.map((n3) => ((e4 + t2.root + n3) % 12 + 12) % 12), a2 = [];
  for (let e5 = n2; e5 <= r2; e5++) i2.includes((e5 % 12 + 12) % 12) && a2.push(e5);
  return a2;
}
function eR(e4, t2, n2) {
  let r2 = ((e4 + t2.root) % 12 + 12) % 12, i2 = n2;
  for (; (i2 % 12 + 12) % 12 !== r2; ) i2++;
  return i2;
}
function tR(e4, t2, n2, r2, i2, a2) {
  let o2 = $L(e4, t2, n2, r2);
  if (!o2.length) return [];
  let s2 = [], c2 = /* @__PURE__ */ new Set(), l2 = a2 && a2.length ? a2.slice(0, i2) : [];
  for (; l2.length < i2; ) l2.push(n2 + (r2 - n2) * (l2.length + 1) / (i2 + 1));
  for (let e5 of l2) {
    let t3 = o2[0], n3 = 1 / 0;
    for (let r3 of o2) {
      if (c2.has(r3)) continue;
      let i3 = Math.abs(r3 - e5);
      i3 < n3 && (n3 = i3, t3 = r3);
    }
    c2.add(t3), s2.push(t3);
  }
  let u2 = new Set(s2.map((e5) => (e5 % 12 + 12) % 12));
  for (let n3 of [t2.tones[0], t2.tones[1]]) {
    let r3 = ((e4 + t2.root + n3) % 12 + 12) % 12;
    if (!u2.has(r3)) {
      let e5 = o2.filter((e6) => (e6 % 12 + 12) % 12 === r3);
      if (e5.length) {
        let t3 = /* @__PURE__ */ new Map();
        for (let e6 of s2) t3.set((e6 % 12 + 12) % 12, (t3.get((e6 % 12 + 12) % 12) ?? 0) + 1);
        let n4 = s2.findIndex((e6) => (t3.get((e6 % 12 + 12) % 12) ?? 0) > 1);
        n4 < 0 && (n4 = s2.length - 1), s2[n4] = e5.reduce((e6, t4) => Math.abs(t4 - s2[n4]) < Math.abs(e6 - s2[n4]) ? t4 : e6), u2.add(r3);
      }
    }
  }
  return s2.sort((e5, t3) => e5 - t3);
}
function nR(e4, t2, n2, r2, i2, a2, o2, s2, c2) {
  let l2 = QL(t2, n2, a2, o2), u2 = [], d2 = rR(l2, s2), f2 = e4.chance(0.5) ? 1 : -1, p2 = [];
  for (let n3 = 0; n3 < r2.length; n3++) {
    let s3 = r2[n3], m2 = $L(t2, s3, a2, o2), h2 = n3 === r2.length - 1, g2, _2 = null;
    n3 >= 2 && n3 < r2.length - 1 && p2[n3 - 2] && e4.chance(0.6) ? (_2 = p2[n3 - 2], g2 = _2.rh) : g2 = h2 ? [i2] : e4.pick(c2);
    let v2 = 0, y2 = [];
    g2.forEach((r3, c3) => {
      let p3 = Math.abs(r3);
      if (r3 < 0) {
        v2 += p3;
        return;
      }
      let g3 = v2 === 0 || i2 === 4 && v2 === 2, b2;
      if (_2 && _2.steps[c3] !== void 0) b2 = iR(l2, d2, _2.steps[c3] + (e4.chance(0.25) ? e4.pick([-1, 1]) : 0));
      else if (h2) {
        let e5 = $L(t2, s3, a2, o2).filter((e6) => [0, s3.tones[1]].includes(((e6 - t2 - s3.root) % 12 + 12) % 12));
        b2 = rR(e5.length ? e5 : m2, d2);
      } else if (g3 && m2.length) {
        let t3 = m2.filter((e5) => Math.abs(e5 - d2) <= 5);
        b2 = t3.length ? e4.pick(t3) : rR(m2, d2);
      } else e4.chance(0.18) ? (b2 = iR(l2, d2, f2 * e4.pick([2, 3, 4])), f2 = -f2) : (e4.chance(0.25) && (f2 = -f2), b2 = iR(l2, d2, f2));
      b2 >= o2 - 1 && (f2 = -1), b2 <= a2 + 1 && (f2 = 1), y2.push(l2.indexOf(b2) - l2.indexOf(d2)), u2.push({ t: n3 * i2 + v2, d: p3, midi: b2 }), d2 = b2, v2 += p3;
    }), p2[n3] = { rh: g2, steps: y2 };
  }
  return u2;
}
function rR(e4, t2) {
  let n2 = e4[0];
  for (let r2 of e4) Math.abs(r2 - t2) < Math.abs(n2 - t2) && (n2 = r2);
  return n2;
}
function iR(e4, t2, n2) {
  let r2 = e4.indexOf(t2);
  return r2 < 0 && (r2 = e4.indexOf(rR(e4, t2))), e4[Math.max(0, Math.min(e4.length - 1, r2 + n2))];
}
var aR, oR, sR, cR, lR = t((() => {
  aR = { aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], ionian: [0, 2, 4, 5, 7, 9, 11] }, oR = (e4, t2) => ({ root: e4, tones: t2 ? [0, 3, 7] : [0, 4, 7] }), sR = [[2, 1], [3], [1, 1, 1], [1.5, 0.5, 1], [1, 2], [-1, 1, 1], [2, 0.5, 0.5]], cR = [[4], [2, 2], [3, 1], [2, 1, 1], [-2, 2], [1.5, 0.5, 2], [2, -1, 1]];
}));
function uR(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2) {
  let u2 = e4.v.bank.ambClips(`noiseP`)[0];
  if (!u2) return;
  let d2 = u2.get(e4.v.ctx);
  if (!d2) return;
  let f2 = e4.v.ctx, p2 = f2.createBufferSource();
  p2.buffer = d2, p2.loop = true, p2.playbackRate.value = 0.9 + e4.r.next() * 0.2;
  let m2 = f2.createBiquadFilter();
  m2.type = `bandpass`, m2.Q.value = o2, m2.frequency.setValueAtTime(r2, t2), m2.frequency.exponentialRampToValueAtTime(i2, t2 + n2 * 0.5), m2.frequency.exponentialRampToValueAtTime(a2, t2 + n2);
  let h2 = f2.createGain();
  h2.gain.value = 0, h2.gain.setValueAtTime(0, t2), h2.gain.linearRampToValueAtTime(s2, t2 + n2 * 0.45), h2.gain.linearRampToValueAtTime(0, t2 + n2), p2.connect(m2).connect(h2);
  let g2 = h2;
  if (typeof f2.createStereoPanner == `function`) {
    let e5 = f2.createStereoPanner();
    e5.pan.setValueAtTime(c2, t2), e5.pan.linearRampToValueAtTime(-c2 * 0.6, t2 + n2), h2.connect(e5), g2 = e5;
  }
  g2.connect(e4.out);
  let _2 = f2.createGain();
  _2.gain.value = l2, g2.connect(_2).connect(e4.wet), p2.start(t2, e4.r.next() * d2.duration * 0.9), p2.stop(t2 + n2 + 0.05), p2.onended = () => {
    try {
      p2.disconnect(), m2.disconnect(), h2.disconnect(), g2.disconnect(), _2.disconnect();
    } catch {
    }
  };
}
function dR(e4, t2, n2, r2) {
  switch (e4) {
    case `title`:
      return new hR(t2, n2, r2);
    case `town`:
      return new yR(t2, n2, r2);
    case `wilderness`:
      return new bR(t2, n2, r2);
    case `dungeon`:
      return new xR(t2, n2, r2);
    case `boss`:
      return new TR(t2, n2, r2);
    case `victory`:
      return new ER(t2, n2, r2);
    default:
      return null;
  }
}
var fR, pR, mR, hR, gR, _R, vR, yR, bR, xR, SR, CR, wR, TR, ER, DR = t((() => {
  RN(), lR(), fR = (e4, t2, n2) => e4 < t2 ? t2 : e4 > n2 ? n2 : e4, pR = { i: oR(0, true), VI: oR(8, false), III: oR(3, false), VII: oR(10, false), iv: oR(5, true), V: oR(7, false), bII: oR(1, false) }, mR = { i: [[`VI`, 3], [`iv`, 2], [`VII`, 2], [`III`, 1], [`bII`, 0.5]], VI: [[`III`, 2], [`iv`, 2], [`VII`, 2], [`V`, 1]], III: [[`VII`, 2], [`iv`, 1], [`VI`, 2]], VII: [[`i`, 3], [`III`, 2], [`VI`, 1]], iv: [[`V`, 2], [`i`, 2], [`VI`, 1], [`VII`, 1]], V: [[`i`, 4], [`VI`, 1]], bII: [[`V`, 2], [`i`, 2]] }, hR = class extends LN {
    key = 50;
    beat = 60 / 54;
    chord = `i`;
    voicing = [];
    sec = `intro`;
    plan = [];
    mel = [];
    melT = 0;
    intensity = 0.65;
    begin(e4) {
      this.planSection(`intro`, e4);
    }
    planSection(e4, t2) {
      this.sec = e4;
      let n2 = e4 === `intro` ? 2 : e4 === `A` ? 4 : e4 === `theme` ? 8 : e4 === `peak` ? this.r.pick([2, 4]) : 2;
      this.plan = [];
      let r2 = n2, i2 = e4 === `intro` || e4 === `theme` ? `i` : this.chord;
      for (; r2 > 0; ) {
        let t3 = r2 >= 2 && this.r.chance(e4 === `intro` || e4 === `rest` ? 0.7 : 0.3) ? 2 : 1;
        this.plan.push({ c: i2, bars: t3 }), r2 -= t3, i2 = ZL(this.r, mR, i2);
      }
      e4 === `theme` && this.plan.length > 1 && (this.plan[this.plan.length - 1].c = this.r.chance(0.6) ? `V` : `VII`);
      let a2 = this.beat * 4;
      if (this.v.note(`drone`, 26, t2, n2 * a2 + 1.5, { vel: 0.26, att: 3, rel: 4.5, send: 0.3 }), e4 === `theme`) {
        let e5 = [];
        for (let t3 of this.plan) for (let n4 = 0; n4 < t3.bars; n4++) e5.push(pR[t3.c]);
        let n3 = this.plan.some((e6) => e6.c === `V`);
        this.mel = nR(this.r, 62, n3 ? aR.harmonic : aR.aeolian, e5, 4, 62, 77, this.r.pick([67, 69, 74]), cR), this.melT = t2;
      } else this.mel = [];
      e4 === `peak` && this.v.hit(`boom`, t2, { vel: 0.42, send: 0.45 });
    }
    nextSec() {
      switch (this.sec) {
        case `intro`:
          return `A`;
        case `A`:
          return this.r.chance(0.75) ? `theme` : `peak`;
        case `theme`:
          return this.r.chance(0.6) ? `peak` : `rest`;
        case `peak`:
          return `rest`;
        default:
          return this.r.chance(0.5) ? `theme` : `A`;
      }
    }
    step(e4) {
      this.plan.length || this.planSection(this.nextSec(), e4);
      let t2 = this.plan.shift();
      this.chord = t2.c;
      let n2 = pR[t2.c], r2 = this.beat * 4, i2 = t2.bars * r2;
      this.intensity = fR(this.intensity + this.r.range(-0.12, 0.12), 0.45, 1);
      let a2 = this.intensity * (this.sec === `peak` ? 1.25 : this.sec === `rest` ? 0.6 : 1);
      this.voicing = tR(this.key, n2, 50, 69, 4, this.voicing);
      let o2 = [-0.38, -0.12, 0.12, 0.38];
      if ((this.sec !== `rest` || this.r.chance(0.5)) && this.voicing.forEach((t3, n3) => this.v.note(this.sec === `rest` ? `choirO` : `choir`, t3, e4 + n3 * 0.06, i2 + 0.5, { vel: 0.2 * a2, att: 2.2, rel: 3.2, pan: o2[n3], send: 0.6 })), this.sec === `peak`) {
        let t3 = this.voicing[this.voicing.length - 1] + 12;
        this.v.note(`choirO`, t3 > 79 ? t3 - 12 : t3, e4 + 0.3, i2, { vel: 0.14 * a2, att: 2.5, rel: 3, pan: 0, send: 0.7 });
      }
      if (this.sec !== `intro`) {
        let t3 = eR(this.key, n2, 38);
        this.v.note(`strings`, t3, e4, i2, { vel: 0.22 * a2, att: 1.4, swell: 1.5, rel: 2.6, send: 0.45, pan: -0.1 }), this.v.note(`strings`, t3 + 7, e4 + 0.2, i2, { vel: 0.12 * a2, att: 1.8, swell: 1.4, rel: 2.6, send: 0.45, pan: 0.15 }), this.v.note(`pad`, eR(this.key, n2, 50), e4, i2, { vel: 0.08, att: 2, rel: 3, send: 0.5 });
      }
      if ((this.sec === `A` || this.sec === `theme` || this.sec === `peak`) && this.r.chance(0.55)) {
        let t3 = eR(this.key, n2, this.r.chance(0.5) ? 38 : 50);
        this.v.note(`bell`, t3, e4 + 0.02, 6, { vel: 0.3, att: 2e-3, rel: 2, send: 0.6, pan: this.r.range(-0.3, 0.3) }), this.r.chance(0.3) && this.v.note(`bell`, t3 + 7, e4 + 2 * this.beat, 5, { vel: 0.2, att: 2e-3, rel: 2, send: 0.65, pan: this.r.range(-0.4, 0.4) });
      }
      this.sec === `rest` && this.r.chance(0.7) && this.v.note(`bell`, 38, e4 + this.beat, 6, { vel: 0.28, att: 2e-3, rel: 2, send: 0.7, pan: this.r.range(-0.3, 0.3) });
      let s2 = e4 + i2;
      for (let t3 of this.mel) {
        let n3 = this.melT + t3.t * this.beat;
        n3 >= e4 - 1e-3 && n3 < s2 - 1e-3 && this.v.note(`strings`, t3.midi, n3, t3.d * this.beat + 0.15, { vel: 0.24 * fR(a2, 0.6, 1.1), att: 0.45, rel: 1.4, vib: 9, vibRate: 5, send: 0.55, pan: 0.12 });
      }
      return s2;
    }
  }, gR = { i: oR(0, true), IV: oR(5, false), III: oR(3, false), VII: oR(10, false), v: oR(7, true), ii: oR(2, true), bVI: oR(8, false) }, _R = { i: [[`IV`, 3], [`VII`, 2], [`III`, 2], [`bVI`, 1], [`v`, 1]], IV: [[`i`, 3], [`VII`, 1], [`v`, 1], [`ii`, 1]], VII: [[`i`, 2], [`IV`, 2], [`III`, 1]], III: [[`VII`, 2], [`IV`, 1], [`bVI`, 1]], bVI: [[`VII`, 2], [`i`, 1], [`III`, 1]], v: [[`i`, 2], [`bVI`, 1], [`IV`, 1]], ii: [[`v`, 1], [`VII`, 1], [`i`, 1]] }, vR = [[`B`, 0, 1, 2, 1, 0], [`B`, 1, 0, 2, 0, 1], [`B`, 0, 2, 1, 2, 0], [`B`, 2, 1, 0, 1, 2], [`B`, 1, `F`, 2, 0, 1], [`B`, `-`, 1, `-`, 2, `-`]], yR = class extends LN {
    level = 1.45;
    key = 50;
    beat = 60 / 72;
    sec = `intro`;
    plan = [];
    upper = [];
    pat = vR[0];
    mel = [];
    melT = 0;
    barInSec = 0;
    prevChord = `i`;
    begin(e4) {
      this.planSection(`intro`, e4);
    }
    planChords(e4, t2) {
      let n2 = [];
      for (let r2 = 0; r2 < e4; r2 += 4) {
        let i2 = t2 ? this.r.pick([`bVI`, `III`, `VII`]) : `i`;
        for (let t3 = 0; t3 < 4 && n2.length < e4; t3++) n2.push(i2), i2 = ZL(this.r, _R, i2);
        let a2 = n2.length - 1, o2 = r2 + 4 >= e4;
        t2 || (n2[a2] = o2 ? this.r.pick([`i`, `i`, `VII`]) : this.r.pick([`v`, `IV`, `VII`]));
      }
      return n2;
    }
    planSection(e4, t2) {
      this.sec = e4, this.barInSec = 0;
      let n2 = e4 === `intro` ? 2 : e4 === `verse` || e4 === `melody` ? 8 : e4 === `bridge` ? 4 : this.r.int(1, 2);
      this.plan = e4 === `rest` ? Array(n2).fill(this.prevChord === `i` ? `VII` : `i`) : e4 === `intro` ? [`i`, `i`] : this.planChords(n2, e4 === `bridge`), this.pat = e4 === `intro` || e4 === `bridge` ? vR[5] : this.r.pick(vR.slice(0, 5)), this.beat = 60 / 72 * this.r.range(0.97, 1.04), e4 === `melody` ? (this.mel = nR(this.r, 62, aR.dorian, this.plan.map((e5) => gR[e5]), 3, 69, 86, this.r.pick([74, 76, 77]), sR), this.melT = t2) : this.mel = [];
    }
    nextSec() {
      let e4 = this.r;
      switch (this.sec) {
        case `intro`:
          return `verse`;
        case `verse`:
          return e4.weighted([[`melody`, 6], [`bridge`, 2], [`verse`, 2]]);
        case `melody`:
          return e4.weighted([[`verse`, 4], [`bridge`, 3], [`rest`, 3]]);
        case `bridge`:
          return e4.chance(0.5) ? `melody` : `verse`;
        default:
          return e4.chance(0.5) ? `verse` : `melody`;
      }
    }
    step(e4) {
      this.plan.length || this.planSection(this.nextSec(), e4);
      let t2 = this.plan.shift(), n2 = gR[t2], r2 = this.beat, i2 = this.plan.length === 0, a2 = r2 * 3 * (i2 && this.sec !== `intro` ? 1.05 : 1), o2 = a2 / 6, s2 = eR(this.key, n2, 38);
      this.upper = tR(this.key, n2, 52, 69, 3, this.upper);
      let c2 = t2 === `i` && this.r.chance(0.35) ? s2 + 26 : 0, l2 = this.sec === `rest`;
      if ((!l2 || this.r.chance(0.5)) && (this.pat.forEach((t3, n3) => {
        if (t3 === `-` || l2 && n3 > 0) return;
        let r3;
        r3 = t3 === `B` ? s2 : t3 === `F` ? s2 + 7 : this.upper[t3] ?? this.upper[0], n3 === 4 && c2 && this.r.chance(0.5) && (r3 = c2);
        let i3 = this.r.range(-8e-3, 0.012) + (n3 === 0 ? 0 : 4e-3 * n3), u3 = t3 === `B` ? 0.62 : (n3 === 2 || n3 === 4 ? 0.44 : 0.36) * this.r.range(0.85, 1.12);
        this.v.note(`guitar`, r3, e4 + n3 * o2 + i3, t3 === `B` ? a2 * 1.1 : o2 * 3.2, { vel: u3, att: 3e-3, rel: 0.7, pan: -0.18 + (r3 - 50) * 0.012, send: 0.28 });
      }), !l2 && this.r.chance(0.12))) {
        let t3 = this.upper[2] ?? this.upper[0];
        this.v.note(`guitar`, t3 + 2, e4 + 5 * o2, o2 * 0.5, { vel: 0.3, att: 3e-3, rel: 0.2, pan: 0.1, send: 0.3 }), this.v.note(`guitar`, t3, e4 + 5.5 * o2, o2 * 2, { vel: 0.28, att: 3e-3, rel: 0.5, pan: 0.1, send: 0.3 });
      }
      this.sec !== `intro` && tR(this.key, n2, 50, 66, 3).forEach((t3, n3) => this.v.note(`pad`, t3, e4, a2 + 0.3, { vel: l2 ? 0.13 : 0.09, att: 1.1, rel: 2.2, pan: (n3 - 1) * 0.3, send: 0.5 }));
      let u2 = e4 + a2;
      for (let t3 of this.mel) {
        let n3 = this.melT + t3.t * r2;
        n3 >= e4 - 1e-3 && n3 < u2 - 1e-3 && this.v.note(`flute`, t3.midi, n3 + this.r.range(0, 0.02), t3.d * r2 - 0.04, { vel: 0.27, att: 0.07, rel: 0.45, vib: 12, vibRate: 5.2, send: 0.7, pan: -0.12 });
      }
      return this.barInSec === 0 && this.sec === `verse` && this.r.chance(0.3) && this.v.note(`bell`, 38, e4, 6, { vel: 0.12, att: 2e-3, rel: 2, send: 0.8, pan: 0.4 }), this.barInSec++, this.prevChord = t2, u2;
    }
  }, bR = class extends LN {
    level = 0.95;
    key = 40;
    nextDrone = 0;
    nextBell = 0;
    nextPluck = 0;
    nextWind = 0;
    nextStr = 0;
    nextChoir = 0;
    droneNote = 28;
    begin(e4) {
      let t2 = this.r;
      this.nextDrone = e4, this.nextBell = e4 + t2.range(3, 8), this.nextPluck = e4 + t2.range(2, 6), this.nextWind = e4 + t2.range(0, 3), this.nextStr = e4 + t2.range(6, 12), this.nextChoir = e4 + t2.range(20, 35);
    }
    step(e4) {
      let t2 = this.r, n2 = e4 + 4, r2 = QL(this.key, aR.phrygian, 52, 71);
      for (; this.nextDrone < n2; ) this.droneNote = t2.chance(0.22) ? 29 : 28, this.v.note(`drone`, this.droneNote, this.nextDrone, 18, { vel: 0.3, att: 4, rel: 5, send: 0.3 }), this.v.note(`strings`, this.droneNote + 12, this.nextDrone + 1, 16, { vel: 0.09, att: 5, rel: 5, send: 0.4, pan: t2.range(-0.3, 0.3) }), this.nextDrone += t2.range(13, 17);
      for (; this.nextWind < n2; ) {
        let e5 = t2.range(5, 9), n3 = t2.range(260, 420);
        uR(this, this.nextWind, e5, n3, n3 * t2.range(1.8, 2.8), n3 * t2.range(1, 1.4), t2.range(1.4, 3), t2.range(0.07, 0.13), t2.range(-0.6, 0.6), 0.4), this.nextWind += t2.range(7, 15);
      }
      for (; this.nextBell < n2; ) {
        let e5 = t2.pick([52, 47, 55, 53, 59]), n3 = t2.chance(0.3) ? t2.int(2, 3) : 1, r3 = t2.range(-0.6, 0.6);
        for (let i2 = 0; i2 < n3; i2++) this.v.note(`bell`, e5, this.nextBell + i2 * t2.range(3, 4), 6, { vel: t2.range(0.18, 0.3) * (1 - i2 * 0.2), att: 2e-3, rel: 2, send: 0.85, pan: r3 });
        this.nextBell += t2.range(10, 22);
      }
      for (; this.nextPluck < n2; ) {
        let e5 = this.nextPluck, n3 = t2.int(2, 5), i2 = t2.pick(r2);
        for (let a2 = 0; a2 < n3; a2++) this.v.note(`guitar`, i2, e5, 2.5, { vel: t2.range(0.22, 0.38), att: 3e-3, rel: 0.9, pan: t2.range(-0.4, 0.4), send: 0.5 }), t2.chance(0.2) && this.v.note(`guitar`, i2 + 1, e5 + 0.02, 2.5, { vel: 0.16, att: 3e-3, rel: 0.9, pan: 0.2, send: 0.5 }), i2 = r2[fR(r2.indexOf(i2) + t2.pick([-2, -1, -1, 1, 2]), 0, r2.length - 1)], e5 += t2.range(0.32, 0.95);
        this.nextPluck += t2.range(6, 13);
      }
      for (; this.nextStr < n2; ) {
        let e5 = t2.pick([40, 41, 43]);
        [e5, e5 + 7, e5 + 13].forEach((e6, t3) => this.v.note(`strings`, e6, this.nextStr + t3 * 0.3, 6, { vel: 0.1, att: 3, swell: 1.4, rel: 4, send: 0.55, pan: (t3 - 1) * 0.4 })), this.nextStr += t2.range(16, 26);
      }
      for (; this.nextChoir < n2; ) [52, 59, 65].forEach((e5, t3) => this.v.note(`choirO`, e5, this.nextChoir + t3 * 0.4, 5, { vel: 0.09, att: 3, rel: 4, send: 0.7, pan: (t3 - 1) * 0.5 })), this.nextChoir += t2.range(30, 50);
      return n2;
    }
  }, xR = class extends LN {
    level = 0.62;
    nextDrone = 0;
    nextCluster = 0;
    nextScrape = 0;
    nextHeart = 0;
    nextDrip = 0;
    nextBoom = 0;
    nextWind = 0;
    begin(e4) {
      let t2 = this.r, n2 = this.ctx, r2 = n2.createOscillator();
      r2.frequency.value = 36.71;
      let i2 = n2.createGain();
      i2.gain.value = 0, i2.gain.setValueAtTime(0, e4), i2.gain.linearRampToValueAtTime(0.1, e4 + 6);
      let a2 = n2.createOscillator();
      a2.frequency.value = 0.07;
      let o2 = n2.createGain();
      o2.gain.value = 0.04, a2.connect(o2).connect(i2.gain), r2.connect(i2).connect(this.out), r2.start(e4), a2.start(e4), this.own(r2), this.own(a2), this.nextDrone = e4, this.nextCluster = e4 + t2.range(4, 9), this.nextScrape = e4 + t2.range(6, 12), this.nextHeart = e4 + t2.range(12, 25), this.nextDrip = e4 + t2.range(1, 3), this.nextBoom = e4 + t2.range(25, 45), this.nextWind = e4 + t2.range(3, 8);
    }
    step(e4) {
      let t2 = this.r, n2 = e4 + 5;
      for (; this.nextDrone < n2; ) this.v.note(`drone`, 26, this.nextDrone, 20, { vel: 0.26, att: 5, rel: 6, send: 0.35 }), this.nextDrone += t2.range(15, 18);
      for (; this.nextCluster < n2; ) {
        let e5 = t2.pick([50, 49, 51, 62, 56]), n3 = t2.pick([[0, 1, 6], [0, 1, 7], [0, 6, 11], [0, 1, 5, 6]]), r2 = t2.chance(0.6) ? `strings` : `pad`;
        n3.forEach((n4, i2) => this.v.note(r2, e5 + n4, this.nextCluster + i2 * t2.range(0.2, 0.8), t2.range(3, 5), { vel: 0.1, att: 3, rel: 4.5, send: 0.65, pan: t2.range(-0.6, 0.6), detune: t2.range(-12, 12) })), this.nextCluster += t2.range(10, 20);
      }
      for (; this.nextScrape < n2; ) this.v.hit(`scrape`, this.nextScrape, { vel: t2.range(0.22, 0.38), rate: t2.range(0.5, 1.1), pan: t2.range(-0.8, 0.8), send: 0.75 }), this.nextScrape += t2.range(8, 18);
      for (; this.nextHeart < n2; ) {
        let e5 = t2.int(4, 12), n3 = t2.range(0.95, 1.12);
        for (let t3 = 0; t3 < e5; t3++) this.v.hit(`heart`, this.nextHeart + t3 * n3, { vel: 0.42 * (1 - t3 / e5 * 0.5), send: 0.2, variant: t3 % 2 });
        this.nextHeart += e5 * n3 + t2.range(20, 45);
      }
      for (; this.nextDrip < n2; ) this.v.hit(`drip`, this.nextDrip, { vel: t2.range(0.12, 0.24), rate: t2.range(0.75, 1.3), pan: t2.range(-0.9, 0.9), send: 0.85 }), this.nextDrip += t2.range(2, 6);
      for (; this.nextWind < n2; ) {
        let e5 = t2.range(6, 10);
        uR(this, this.nextWind, e5, 120, t2.range(220, 380), 140, t2.range(2, 4), 0.08, t2.range(-0.5, 0.5), 0.5), this.nextWind += t2.range(12, 22);
      }
      for (; this.nextBoom < n2; ) this.v.hit(`boom`, this.nextBoom, { vel: 0.28, send: 0.5 }), t2.chance(0.5) && (this.v.note(`brass`, 26, this.nextBoom + 0.05, 1.2, { vel: 0.22, att: 0.05, rel: 1.5, send: 0.6 }), this.v.note(`brass`, 27, this.nextBoom + 0.05, 1.2, { vel: 0.15, att: 0.05, rel: 1.5, send: 0.6 })), this.nextBoom += t2.range(30, 60);
      return n2;
    }
  }, SR = { i: oR(0, true), bVI: oR(8, false), bVII: oR(10, false), bII: oR(1, false), V: oR(7, false), iv: oR(5, true) }, CR = [[`i`, `i`, `bVI`, `bVII`], [`i`, `bII`, `i`, `V`], [`iv`, `bVI`, `V`, `V`], [`i`, `bVII`, `bVI`, `V`], [`i`, `i`, `bII`, `bII`]], wR = [{ don: [0, 6, 8, 11, 14], ka: [4, 12], fr: [2, 3, 7, 10, 15] }, { don: [0, 3, 6, 8, 10, 12, 14], ka: [4, 12], fr: [1, 5, 9, 13] }, { don: [0, 4, 8, 10, 12], ka: [2, 6, 14], fr: [3, 7, 11, 15] }, { don: [0, 7, 8, 14, 15], ka: [4, 12], fr: [2, 6, 10, 11] }], TR = class extends LN {
    level = 0.6;
    key = 36;
    beat = 60 / 136;
    bar = 0;
    prog = CR[0];
    drums = wR[0];
    heat = 1;
    secBar = 0;
    voicing = [];
    breakdown = false;
    ost = [0, 7, 12, 7, 15, 7, 12, 7];
    begin(e4) {
      this.v.hit(`boom`, e4, { vel: 0.5, send: 0.4 });
    }
    step(e4) {
      let t2 = this.r, n2 = this.beat / 4, r2 = this.beat * 4;
      this.secBar === 0 && (this.breakdown ? (this.breakdown = false, this.heat = 2) : this.heat >= 4 && t2.chance(0.45) ? this.breakdown = true : this.heat = Math.min(4, this.heat + +!!t2.chance(0.75)), this.prog = t2.pick(CR), this.drums = t2.pick(wR), this.ost = t2.pick([[0, 7, 12, 7, 15, 7, 12, 7], [0, 12, 7, 12, 3, 12, 7, 12], [0, 3, 7, 12, 7, 3, 0, 3]]), this.bar > 0 && this.v.hit(`boom`, e4, { vel: this.breakdown ? 0.3 : 0.45, send: 0.45 }));
      let i2 = this.breakdown ? 4 : 8, a2 = SR[this.prog[Math.floor(this.secBar / 2) % this.prog.length]], o2 = this.heat, s2 = !this.breakdown && this.secBar === i2 - 1;
      if (this.breakdown) this.v.hit(`taiko`, e4, { vel: 0.85, send: 0.35, variant: 0 }), this.v.hit(`heart`, e4 + this.beat * 2, { vel: 0.5, send: 0.2 });
      else {
        let i3 = this.drums;
        for (let r3 of i3.don) s2 && r3 >= 8 || this.v.hit(`taiko`, e4 + r3 * n2 + t2.range(0, 6e-3), { vel: (r3 === 0 ? 0.95 : r3 % 4 == 0 ? 0.75 : 0.58) * t2.range(0.9, 1.05), send: 0.28, variant: r3 === 0 ? 0 : t2.int(1, 2) });
        if (o2 >= 2) for (let t3 of i3.ka) this.v.hit(`rim`, e4 + t3 * n2, { vel: 0.4, send: 0.15, pan: 0.25 });
        for (let r3 of i3.fr) this.v.hit(`frame`, e4 + r3 * n2 + t2.range(0, 8e-3), { vel: t2.range(0.18, 0.32) * (o2 >= 3 ? 1.3 : 1), send: 0.15, pan: -0.3 });
        if (o2 >= 3) for (let r3 = 1; r3 < 16; r3 += 2) t2.chance(0.35) && this.v.hit(`frame`, e4 + r3 * n2, { vel: 0.14, send: 0.1, pan: 0.35 });
        if (s2) {
          for (let t3 = 8; t3 < 16; t3++) this.v.hit(t3 % 2 ? `tom` : `taiko`, e4 + t3 * n2, { vel: 0.45 + (t3 - 8) * 0.06, send: 0.3, pan: (t3 - 12) * 0.08 });
          this.v.hit(`swell`, e4 + r2 - 2.6 + 0.02, { vel: 0.18 + o2 * 0.03, send: 0.3 });
        }
      }
      let c2 = eR(this.key, a2, 36), l2 = this.breakdown ? [0] : t2.pick([[0], [0, 6], [0, 10], [0, 6, 10]]);
      if (!this.breakdown || this.secBar % 2 == 0) for (let t3 of l2) {
        let r3 = (t3 === 0 ? 0.5 : 0.38) * (this.breakdown ? 0.6 : 1);
        this.v.note(`brass`, c2, e4 + t3 * n2, t3 === 0 ? 0.5 : 0.25, { vel: r3, att: 0.01, rel: 0.35, send: 0.3, pan: -0.1 }), this.v.note(`brass`, c2 + 12, e4 + t3 * n2, t3 === 0 ? 0.5 : 0.25, { vel: r3 * 0.7, att: 0.01, rel: 0.35, send: 0.3, pan: 0.1 }), o2 >= 3 && this.v.note(`brass`, c2 + 7, e4 + t3 * n2, 0.3, { vel: r3 * 0.45, att: 0.01, rel: 0.3, send: 0.3 });
      }
      if ((o2 >= 2 || this.breakdown) && this.secBar % 2 == 0) {
        let t3 = 55 + (o2 >= 4 ? 5 : 0);
        this.voicing = tR(this.key, a2, t3, t3 + 17, 4, this.voicing), this.voicing.forEach((t4, n3) => this.v.note(`choir`, t4, e4 + n3 * 0.03, r2 * 2 - 0.1, { vel: (0.13 + o2 * 0.03) * (this.breakdown ? 1.3 : 1), att: 0.5, rel: 1.4, pan: (n3 - 1.5) * 0.25, send: 0.5 })), o2 >= 4 && this.v.note(`choirO`, this.voicing[this.voicing.length - 1] + 12, e4, r2 * 2, { vel: 0.1, att: 1, rel: 1.5, send: 0.6 });
      }
      if (o2 >= 3 && !this.breakdown) {
        let t3 = eR(this.key, a2, 48);
        for (let n3 = 0; n3 < 8; n3++) this.v.note(`strings`, t3 + this.ost[n3], e4 + n3 * this.beat * 0.5, this.beat * 0.28, { vel: 0.2 * (n3 % 2 ? 0.8 : 1), att: 8e-3, rel: 0.09, send: 0.25, pan: 0.2 });
      }
      return this.secBar % 2 == 0 && this.v.note(`pad`, c2 + 12, e4, r2 * 2, { vel: 0.08 + o2 * 0.015, att: 0.4, rel: 1, send: 0.4 }), this.bar++, this.secBar = (this.secBar + 1) % i2, e4 + r2;
    }
  }, ER = class extends LN {
    step(e4) {
      let t2 = this.v;
      t2.hit(`boom`, e4, { vel: 0.3, send: 0.45 });
      let n2 = (e5, n3, r3, i2) => e5.forEach((e6, a2) => t2.note(`choir`, e6, n3 + a2 * 0.05, r3, { vel: i2, att: 1, rel: 2.5, pan: (a2 - 1) * 0.35, send: 0.6 }));
      n2([56, 60, 63, 68], e4, 2.3, 0.18), t2.note(`strings`, 44, e4, 2.3, { vel: 0.25, att: 0.8, swell: 1.4, rel: 1.5, send: 0.5 }), n2([58, 62, 65, 70], e4 + 2.2, 2.3, 0.21), t2.note(`strings`, 46, e4 + 2.2, 2.3, { vel: 0.28, att: 0.8, swell: 1.4, rel: 1.5, send: 0.5 });
      let r2 = e4 + 4.4;
      return n2([60, 64, 67, 72], r2, 3.4, 0.25), t2.note(`choirO`, 76, r2 + 0.3, 3, { vel: 0.12, att: 1.2, rel: 2.5, send: 0.7 }), t2.note(`strings`, 36, r2, 3.6, { vel: 0.3, att: 0.5, rel: 2.5, send: 0.5 }), t2.note(`strings`, 48, r2, 3.6, { vel: 0.2, att: 0.5, rel: 2.5, send: 0.5 }), t2.note(`pad`, 60, r2, 3.4, { vel: 0.12, att: 0.6, rel: 2.5, send: 0.5 }), t2.note(`bell`, 48, r2, 6, { vel: 0.35, att: 2e-3, rel: 2, send: 0.6 }), [72, 76, 79, 84, 88].forEach((e5, n3) => t2.note(`chime`, e5, r2 + 0.1 + n3 * 0.13, 2.4, { vel: 0.26, att: 2e-3, rel: 1.4, send: 0.55, pan: (n3 - 2) * 0.2 })), t2.note(`chime`, 84, r2 + 2.6, 2.4, { vel: 0.18, att: 2e-3, rel: 1.6, send: 0.7, pan: 0.3 }), this.ended = true, r2 + 6;
    }
  };
})), OR, kR = t((() => {
  DR(), OR = class {
    env;
    bus;
    cur = null;
    curId = `none`;
    fading = [];
    seed;
    constructor(e4, t2, n2) {
      this.env = e4, this.bus = t2, this.seed = (n2 ?? Math.floor(Math.random() * 2147483647)) >>> 0;
    }
    get id() {
      return this.curId;
    }
    set(e4, t2, n2) {
      if (e4 === this.curId) return;
      let r2 = n2 ?? this.env.ctx.currentTime + 0.05;
      this.cur &&= (this.cur.stop(t2), this.fading.push(this.cur), null), this.curId = e4, this.seed = Math.imul(this.seed ^ 1540483477, 668265261) + 374761393 >>> 0;
      let i2 = dR(e4, this.env, this.bus, this.seed);
      i2 && (i2.start(r2, Math.max(0.3, t2)), this.cur = i2);
    }
    tick(e4, t2) {
      this.cur?.tick(e4, t2), this.fading.length && (this.fading = this.fading.filter((e5) => !e5.gone));
    }
    dispose() {
      this.cur?.dispose();
      for (let e4 of this.fading) e4.dispose();
      this.cur = null, this.fading = [];
    }
  };
}));
function AR(e4, t2, n2) {
  switch (t2) {
    case `death`:
      return e4.hit(`boom`, n2, { vel: 0.7, send: 0.5 }), e4.note(`bell`, 38, n2 + 0.05, 6.5, { vel: 0.4, att: 2e-3, rel: 2.5, send: 0.6 }), [62, 60, 58, 57].forEach((t3, r2) => {
        let i2 = n2 + 0.3 + r2 * 0.85;
        e4.note(`choirO`, t3, i2, 1.3, { vel: 0.3, att: 0.35, rel: 1.6, send: 0.7, pan: -0.15 }), e4.note(`choirO`, t3 - 5, i2 + 0.05, 1.3, { vel: 0.2, att: 0.4, rel: 1.6, send: 0.7, pan: 0.2 });
      }), e4.note(`strings`, 38, n2 + 0.1, 3.6, { vel: 0.32, att: 0.6, swell: 1.3, rel: 2.2, send: 0.5 }), e4.note(`strings`, 37, n2 + 2.2, 1.8, { vel: 0.22, att: 0.8, rel: 2.2, send: 0.5 }), e4.note(`drone`, 26, n2, 4.5, { vel: 0.3, att: 0.5, rel: 2.5, send: 0.4 }), 6;
    case `bossIntro`:
      return e4.hit(`taiko`, n2, { vel: 1, send: 0.4, variant: 0 }), e4.hit(`taiko`, n2 + 0.012, { vel: 0.8, send: 0.4, variant: 1, rate: 0.85 }), e4.hit(`boom`, n2, { vel: 0.85, send: 0.5 }), e4.note(`brass`, 36, n2, 0.9, { vel: 0.7, att: 8e-3, rel: 0.9, send: 0.4, pan: -0.1 }), e4.note(`brass`, 48, n2, 0.9, { vel: 0.5, att: 8e-3, rel: 0.9, send: 0.4, pan: 0.1 }), e4.note(`brass`, 43, n2, 0.7, { vel: 0.35, att: 8e-3, rel: 0.8, send: 0.4 }), [60, 63, 67, 68].forEach((t3, r2) => e4.note(`choir`, t3, n2 + 0.15 + r2 * 0.08, 2.4, { vel: 0.2, att: 1.8, swell: 1.6, rel: 1.4, send: 0.6, pan: (r2 - 1.5) * 0.3 })), e4.note(`choirO`, 72, n2 + 0.4, 2.2, { vel: 0.15, att: 1.6, swell: 1.5, rel: 1.4, send: 0.7 }), e4.hit(`taiko`, n2 + 2.6, { vel: 0.7, send: 0.4, variant: 2 }), 4;
    case `questComplete`:
      for (let [t3, r2] of [[79, 0], [84, 0.11], [86, 0.22], [91, 0.36]]) e4.note(`chime`, t3, n2 + r2, 2.2, { vel: 0.6, att: 2e-3, rel: 1.4, send: 0.5, pan: (t3 - 85) * 0.03 });
      return e4.note(`chime`, 88, n2 + 0.36, 2.4, { vel: 0.36, att: 2e-3, rel: 1.6, send: 0.6, pan: 0.3 }), [67, 72, 76].forEach((t3, r2) => e4.note(`pad`, t3, n2, 1.8, { vel: 0.2, att: 0.4, rel: 1.6, send: 0.5, pan: (r2 - 1) * 0.4 })), e4.note(`bell`, 50, n2 + 0.36, 5, { vel: 0.3, att: 2e-3, rel: 2, send: 0.6 }), 2.8;
    case `areaEnter`:
      return e4.note(`pad`, 38, n2, 1.6, { vel: 0.16, att: 1.3, rel: 2.2, send: 0.5, pan: -0.2 }), e4.note(`pad`, 45, n2 + 0.1, 1.6, { vel: 0.12, att: 1.4, rel: 2.2, send: 0.5, pan: 0.2 }), e4.note(`strings`, 38, n2, 1.8, { vel: 0.16, att: 1.4, swell: 1.3, rel: 2, send: 0.5 }), e4.note(`drone`, 26, n2, 2, { vel: 0.18, att: 1.2, rel: 2.2, send: 0.4 }), e4.hit(`boom`, n2 + 0.05, { vel: 0.2, send: 0.4 }), 4;
  }
}
var jR = t((() => {
}));
function MR(e4) {
  if (e4 <= BR) return 1;
  if (e4 >= VR) return 0;
  let t2 = (e4 - BR) / (VR - BR);
  return (1 - t2 * t2 * (3 - 2 * t2)) ** 1.6;
}
function NR(e4, t2) {
  return WR((e4 - t2) / Math.SQRT2 / HR, -1, 1);
}
function PR(e4) {
  if (e4 <= UR) return 18e3;
  let t2 = WR((e4 - UR) / (VR - UR), 0, 1);
  return 1400 + 16600 * (1 - t2) * (1 - t2);
}
var FR, IR, LR, RR, zR, BR, VR, HR, UR, WR, GR, KR, qR = t((() => {
  WN(), WL(), FN(), XL(), kR(), RN(), jR(), xL(), FR = 0.15, IR = 25, LR = 40, RR = 12, zR = 8, BR = 6, VR = 40, HR = 18, UR = 14, WR = (e4, t2, n2) => e4 < t2 ? t2 : e4 > n2 ? n2 : e4, GR = class {
    eng;
    id;
    x;
    z;
    vol;
    pitch;
    stopped = false;
    src = null;
    gain = null;
    pan = null;
    lp = null;
    nodes = [];
    t0 = Date.now();
    constructor(e4, t2, n2) {
      this.eng = e4, this.id = t2, this.x = n2.x, this.z = n2.z, this.vol = n2.volume ?? 1, this.pitch = n2.pitch ?? 1;
    }
    get attached() {
      return !!this.src;
    }
    attach(e4, t2, n2) {
      if (this.src || this.stopped) return;
      let r2 = vL(this.id);
      if (!r2) return;
      let i2 = e4.createBufferSource();
      i2.buffer = n2, i2.loop = true, i2.playbackRate.value = this.pitch * (1 + (Math.random() * 2 - 1) * 0.02);
      let a2 = e4.createGain();
      a2.gain.value = 0;
      let o2 = e4.createBiquadFilter();
      o2.type = `lowpass`, o2.frequency.value = 18e3, o2.Q.value = 0.5, i2.connect(o2).connect(a2), this.nodes = [o2, a2];
      let s2 = a2;
      if (typeof e4.createStereoPanner == `function` && (this.pan = e4.createStereoPanner(), a2.connect(this.pan), this.nodes.push(this.pan), s2 = this.pan), s2.connect(t2.sfx.inp), r2.m.send > 0) {
        let n3 = e4.createGain();
        n3.gain.value = r2.m.send, s2.connect(n3).connect(t2.sfx.wet), this.nodes.push(n3);
      }
      i2.start(e4.currentTime, Math.random() * n2.duration), this.src = i2, this.gain = a2, this.lp = o2, this.update(0.06);
    }
    update(e4 = 0.05) {
      if (!this.gain) return;
      let t2 = this.gain.context, n2 = vL(this.id), r2 = this.eng.spatialOf(this.x, this.z), i2 = this.vol * (n2?.m.lvl ?? 0.5) * (r2 ? r2.g : 1), a2 = t2.currentTime;
      this.gain.gain.setTargetAtTime(i2, a2, e4), this.pan && this.pan.pan.setTargetAtTime(r2 ? r2.pan : 0, a2, e4), this.lp && this.lp.frequency.setTargetAtTime(r2 ? PR(r2.d) : 18e3, a2, e4);
    }
    setPosition(e4, t2) {
      this.x = e4, this.z = t2, this.update();
    }
    setVolume(e4) {
      this.vol = Math.max(0, e4), this.update();
    }
    stop(e4 = 0.25) {
      if (this.stopped) return;
      this.stopped = true, this.eng.forgetLoop(this);
      let t2 = this.src, n2 = this.gain;
      if (!t2 || !n2) return;
      let r2 = n2.context.currentTime, i2 = Math.max(0.02, e4);
      n2.gain.cancelScheduledValues(r2), n2.gain.setValueAtTime(n2.gain.value, r2), n2.gain.linearRampToValueAtTime(0, r2 + i2);
      try {
        t2.stop(r2 + i2 + 0.02);
      } catch {
      }
      t2.onended = () => {
        try {
          t2.disconnect();
          for (let e5 of this.nodes) e5.disconnect();
        } catch {
        }
      };
    }
  }, KR = class {
    bank = new UL();
    ctx = null;
    g = null;
    music = null;
    amb = null;
    sting = null;
    vols = { master: 1, music: 1, sfx: 1, ui: 1, ambience: 1 };
    wantMusic = { id: `none`, fade: 2.5 };
    wantAmb = { id: `none`, rain: 0 };
    lx = 0;
    lz = 0;
    voices = [];
    byId = /* @__PURE__ */ new Map();
    burst = /* @__PURE__ */ new Map();
    loops = /* @__PURE__ */ new Set();
    timer = null;
    paused = false;
    hidden = false;
    disposed = false;
    space = `hall`;
    suspendTimer = null;
    hasPanner = typeof window < `u` && typeof StereoPannerNode < `u`;
    onVis = () => this.visibility();
    get unlocked() {
      return !!this.ctx && this.ctx.state === `running`;
    }
    unlock() {
      if (this.disposed || typeof window > `u`) return Promise.resolve();
      try {
        if (!this.ctx) {
          let e5 = window.AudioContext ?? window.webkitAudioContext;
          if (!e5) return Promise.resolve();
          this.ctx = new e5({ latencyHint: `interactive` }), this.build();
        }
        let e4 = this.ctx, t2 = e4.createBuffer(1, 1, e4.sampleRate), n2 = e4.createBufferSource();
        if (n2.buffer = t2, n2.connect(e4.destination), n2.start(), e4.state !== `running`) return e4.resume().then(() => this.afterUnlock(), () => void 0);
        this.afterUnlock();
      } catch {
      }
      return Promise.resolve();
    }
    build() {
      let e4 = this.ctx, t2 = KL(e4, this.vols);
      if (this.g = t2, this.music = new OR({ ctx: e4, bank: this.bank, live: true }, t2.music), this.amb = new UN(e4, this.bank, t2.amb, true), this.amb.onSpace = (e5) => {
        this.space = e5, qL(t2, e5);
      }, this.sting = new IN(e4, this.bank, t2.sting.inp, t2.sting.wet, new PN(Math.random() * 2147483647 >>> 0)), this.timer = setInterval(() => this.tick(), IR), typeof document < `u` && document.addEventListener(`visibilitychange`, this.onVis), this.paused) for (let e5 of [t2.sfx, t2.music, t2.amb, t2.sting]) e5.setPaused(true);
    }
    afterUnlock() {
      if (!this.disposed) {
        this.bank.prepared || this.bank.prepare(), this.bank.onMusicReady(() => this.applyWanted());
        for (let e4 of this.loops) this.attachLoop(e4);
      }
    }
    ready() {
      return !!this.ctx && !!this.g && this.bank.musicReady && !this.disposed;
    }
    applyWanted() {
      this.ready() && (this.music.set(this.wantMusic.id, this.music.id === `none` ? Math.min(2, this.wantMusic.fade) : this.wantMusic.fade), this.amb.set(this.wantAmb.id, this.wantAmb.rain));
    }
    prepare(e4) {
      return this.disposed ? Promise.resolve() : this.bank.prepare(e4);
    }
    tick() {
      let e4 = this.ctx;
      if (!e4 || e4.state !== `running` || this.disposed) return;
      let t2 = e4.currentTime + FR;
      try {
        this.music?.tick(t2, this.paused), this.amb?.tick(t2, this.paused);
      } catch (e5) {
        console.error(`[audio] scheduler error`, e5);
      }
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true, this.timer && clearInterval(this.timer), this.timer = null, this.suspendTimer && clearTimeout(this.suspendTimer), typeof document < `u` && document.removeEventListener(`visibilitychange`, this.onVis);
      try {
        this.music?.dispose(), this.amb?.dispose();
        for (let e5 of this.voices) this.kill(e5, 5e-3);
        for (let e5 of [...this.loops]) e5.stop(0.01);
      } catch {
      }
      let e4 = this.ctx;
      this.ctx = null, this.g = null, e4 && e4.close().catch(() => void 0);
    }
    spatialOf(e4, t2) {
      if (e4 === void 0 || t2 === void 0 || !Number.isFinite(e4) || !Number.isFinite(t2)) return null;
      let n2 = e4 - this.lx, r2 = t2 - this.lz, i2 = Math.hypot(n2, r2);
      return { g: MR(i2), pan: NR(n2, r2), d: i2 };
    }
    setListener(e4, t2) {
      if (!(!Number.isFinite(e4) || !Number.isFinite(t2)) && !(Math.abs(e4 - this.lx) < 1e-3 && Math.abs(t2 - this.lz) < 1e-3)) {
        this.lx = e4, this.lz = t2;
        for (let e5 of this.loops) e5.update(0.08);
      }
    }
    play(e4, t2 = {}) {
      let n2 = this.ctx, r2 = this.g;
      if (!n2 || !r2 || this.disposed || n2.state !== `running`) return;
      let i2 = vL(e4);
      if (!i2) return;
      let a2 = i2.m, o2 = a2.bus === `ui`;
      if (this.paused && !o2) return;
      let s2 = this.spatialOf(t2.x, t2.z), c2 = (t2.volume ?? 1) * a2.lvl * (s2 ? s2.g : 1);
      if (!(c2 > 5e-4)) return;
      let l2 = n2.currentTime, u2 = this.burst.get(e4);
      if (u2 && l2 - u2.t < (a2.gap ?? 0.035)) {
        if (u2.n++, u2.n >= 4) return;
        c2 *= 1 / (1 + 0.55 * u2.n);
      } else this.burst.set(e4, { t: l2, n: 0 });
      if (!this.makeRoom(e4, a2.cap, a2.prio, o2)) return;
      let d2 = this.bank.sfxClip(e4), f2 = d2?.get(n2);
      if (!d2 || !f2) return;
      let p2 = n2.createBufferSource();
      p2.buffer = f2, p2.playbackRate.value = WR((t2.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * 0.04), 0.25, 4);
      let m2 = n2.createGain();
      m2.gain.value = c2;
      let h2 = [m2];
      p2.connect(m2);
      let g2 = m2;
      if (s2 && s2.d > UR) {
        let e5 = n2.createBiquadFilter();
        e5.type = `lowpass`, e5.frequency.value = PR(s2.d), e5.Q.value = 0.5, m2.connect(e5), h2.push(e5), g2 = e5;
      }
      if (s2 && this.hasPanner && Math.abs(s2.pan) > 0.01) {
        let e5 = n2.createStereoPanner();
        e5.pan.value = s2.pan, g2.connect(e5), h2.push(e5), g2 = e5;
      }
      let _2 = o2 ? r2.ui : r2.sfx;
      g2.connect(_2.inp);
      let v2 = o2 ? 0 : a2.send * (this.space === `cave` ? 1.8 : 1);
      if (v2 > 2e-3) {
        let e5 = n2.createGain();
        e5.gain.value = Math.min(1, v2), g2.connect(e5).connect(_2.wet), h2.push(e5);
      }
      if (a2.oneShot && d2.loop) {
        p2.loop = true;
        let e5 = l2 + a2.oneShot;
        m2.gain.setValueAtTime(c2, Math.max(l2, e5 - 0.45)), m2.gain.linearRampToValueAtTime(0, e5), p2.start(l2, Math.random() * f2.duration), p2.stop(e5 + 0.02);
      } else p2.start(l2);
      let y2 = { id: e4, src: p2, gain: m2, nodes: h2, t0: l2, prio: a2.prio, ui: o2, dead: false };
      this.voices.push(y2);
      let b2 = this.byId.get(e4);
      b2 ? b2.push(y2) : this.byId.set(e4, [y2]), p2.onended = () => this.release(y2);
    }
    makeRoom(e4, t2, n2, r2) {
      let i2 = this.byId.get(e4);
      if (i2) {
        let e5 = 0;
        for (let t3 of i2) t3.dead || e5++;
        for (; e5 >= t2; ) {
          let t3 = i2.find((e6) => !e6.dead);
          if (!t3) break;
          this.kill(t3), e5--;
        }
      }
      let a2 = 0, o2 = null;
      for (let e5 of this.voices) e5.dead || e5.ui !== r2 || (a2++, (!o2 || e5.prio < o2.prio || e5.prio === o2.prio && e5.t0 < o2.t0) && (o2 = e5));
      return a2 < (r2 ? RR : LR) ? true : o2 && o2.prio <= n2 ? (this.kill(o2), true) : false;
    }
    kill(e4, t2 = 0.012) {
      if (e4.dead) return;
      e4.dead = true;
      let n2 = e4.src.context.currentTime;
      try {
        e4.gain.gain.cancelScheduledValues(n2), e4.gain.gain.setTargetAtTime(0, n2, t2), e4.src.stop(n2 + t2 * 5);
      } catch {
      }
    }
    release(e4) {
      e4.dead = true;
      try {
        e4.src.disconnect();
        for (let t3 of e4.nodes) t3.disconnect();
      } catch {
      }
      let t2 = this.voices.indexOf(e4);
      t2 >= 0 && this.voices.splice(t2, 1);
      let n2 = this.byId.get(e4.id);
      if (n2) {
        let t3 = n2.indexOf(e4);
        t3 >= 0 && n2.splice(t3, 1);
      }
    }
    loop(e4, t2 = {}) {
      let n2 = new GR(this, e4, t2);
      if (this.disposed) return n2.stopped = true, n2;
      if (this.loops.size >= zR) {
        let e5 = null;
        for (let t3 of this.loops) (!e5 || t3.t0 < e5.t0) && (e5 = t3);
        e5?.stop(0.1);
      }
      return this.loops.add(n2), this.attachLoop(n2), n2;
    }
    attachLoop(e4) {
      let t2 = this.ctx, n2 = this.g;
      if (!t2 || !n2 || e4.stopped || e4.attached || t2.state !== `running`) return;
      let r2 = this.bank.sfxClip(e4.id)?.get(t2);
      r2 && e4.attach(t2, n2, r2);
    }
    forgetLoop(e4) {
      this.loops.delete(e4);
    }
    setMusic(e4, t2 = 2.5) {
      if (this.disposed) return;
      let n2 = Number.isFinite(t2) ? Math.max(0, t2) : 2.5;
      this.wantMusic = { id: e4, fade: n2 }, this.ready() && this.music.set(e4, n2);
    }
    setAmbience(e4, t2 = 0) {
      this.disposed || (this.wantAmb = { id: e4, rain: Number.isFinite(t2) ? WR(t2, 0, 1) : 0 }, this.ready() && this.amb.set(e4, this.wantAmb.rain));
    }
    stinger(e4) {
      if (!this.ready() || !this.sting || this.paused) return;
      let t2 = this.ctx;
      if (t2.state !== `running`) return;
      let n2 = AR(this.sting, e4, t2.currentTime + 0.03);
      this.g.music.duck(e4 === `areaEnter` ? 0.3 : 0.55, Math.min(4, n2 * 0.8));
    }
    setVolumes(e4) {
      for (let t3 of [`master`, `music`, `sfx`, `ui`, `ambience`]) {
        let n3 = e4[t3];
        typeof n3 == `number` && Number.isFinite(n3) && (this.vols[t3] = WR(n3, 0, 1));
      }
      let t2 = this.g;
      if (!t2) return;
      let n2 = t2.ctx.currentTime;
      t2.master.gain.setTargetAtTime(this.vols.master * YL.master, n2, 0.05), t2.music.setVolume(this.vols.music * YL.music), t2.sting.setVolume(this.vols.music * YL.sting), t2.sfx.setVolume(this.vols.sfx * YL.sfx), t2.ui.setVolume(this.vols.ui * YL.ui), t2.amb.setVolume(this.vols.ambience * YL.ambience);
    }
    duck(e4, t2) {
      let n2 = this.g;
      !n2 || !Number.isFinite(e4) || !Number.isFinite(t2) || (n2.music.duck(e4, t2), n2.amb.duck(e4 * 0.8, t2));
    }
    setPaused(e4) {
      if (this.paused === e4) return;
      this.paused = e4;
      let t2 = this.g;
      if (t2) for (let n2 of [t2.sfx, t2.music, t2.amb, t2.sting]) n2.setPaused(e4);
      if (!e4) for (let e5 of this.loops) e5.update(0.1);
      this.updateSuspend();
    }
    visibility() {
      this.hidden = typeof document < `u` && document.hidden, this.updateSuspend();
    }
    updateSuspend() {
      let e4 = this.ctx, t2 = this.g;
      if (!e4 || !t2) return;
      this.suspendTimer &&= (clearTimeout(this.suspendTimer), null);
      let n2 = e4.currentTime;
      this.hidden ? (t2.fade.gain.setTargetAtTime(0, n2, 0.05), this.suspendTimer = setTimeout(() => {
        this.hidden && this.ctx && this.ctx.state === `running` && this.ctx.suspend().catch(() => void 0);
      }, 250)) : (e4.state === `suspended` && e4.resume().catch(() => void 0), t2.fade.gain.setTargetAtTime(1, n2, 0.08));
    }
    debug() {
      return { state: this.ctx?.state ?? `none`, voices: this.voices.filter((e4) => !e4.dead).length, loops: this.loops.size, music: this.music?.id ?? this.wantMusic.id, ambience: this.amb?.id ?? this.wantAmb.id, space: this.space, prepared: this.bank.prepared };
    }
  };
}));
async function JR(e4, t2, n2, r2, i2 = {}) {
  await e4.prepare();
  let a2 = i2.sampleRate ?? 44100, o2 = new OfflineAudioContext(2, Math.max(1, Math.ceil(r2 * a2)), a2), s2 = KL(o2, { master: 1, music: 1, sfx: 1, ui: 1, ambience: 1 }), c2 = i2.seed ?? 12345;
  if (t2 === `music`) {
    let t3 = new OR({ ctx: o2, bank: e4, live: false }, s2.music, c2);
    t3.set(n2, 0.5, 0.02), t3.tick(r2, false);
  } else if (t2 === `ambience`) {
    let t3 = new UN(o2, e4, s2.amb, false, c2);
    t3.onSpace = (e5) => qL(s2, e5, 0.05), t3.set(n2, i2.rain ?? 0, 0.5), t3.tick(r2, false);
  } else if (t2 === `stinger`) AR(new IN(o2, e4, s2.sting.inp, s2.sting.wet, new PN(c2)), n2, 0.05);
  else {
    let t3 = vL(n2), i3 = e4.sfxClip(n2)?.get(o2);
    if (t3 && i3) {
      let e5 = o2.createBufferSource();
      e5.buffer = i3;
      let n3 = o2.createGain();
      n3.gain.value = t3.m.lvl, e5.connect(n3);
      let a3 = t3.m.bus === `ui` ? s2.ui : s2.sfx;
      if (n3.connect(a3.inp), t3.m.send > 0 && t3.m.bus !== `ui`) {
        let e6 = o2.createGain();
        e6.gain.value = t3.m.send, n3.connect(e6).connect(a3.wet);
      }
      i3.duration < r2 && t3.r.loop && (e5.loop = true), e5.start(0.01), e5.stop(Math.min(r2, 0.01 + (t3.r.loop ? r2 : i3.duration)));
    }
  }
  return o2.startRendering();
}
function YR(e4) {
  let t2 = e4.numberOfChannels, n2 = e4.length, r2 = new Uint8Array(44 + n2 * t2 * 2), i2 = new DataView(r2.buffer), a2 = (e5, t3) => {
    for (let n3 = 0; n3 < t3.length; n3++) r2[e5 + n3] = t3.charCodeAt(n3);
  };
  a2(0, `RIFF`), i2.setUint32(4, 36 + n2 * t2 * 2, true), a2(8, `WAVE`), a2(12, `fmt `), i2.setUint32(16, 16, true), i2.setUint16(20, 1, true), i2.setUint16(22, t2, true), i2.setUint32(24, e4.sampleRate, true), i2.setUint32(28, e4.sampleRate * t2 * 2, true), i2.setUint16(32, t2 * 2, true), i2.setUint16(34, 16, true), a2(36, `data`), i2.setUint32(40, n2 * t2 * 2, true);
  let o2 = Array.from({ length: t2 }, (t3, n3) => e4.getChannelData(n3)), s2 = 44;
  for (let e5 = 0; e5 < n2; e5++) for (let n3 = 0; n3 < t2; n3++) {
    let t3 = Math.max(-1, Math.min(1, o2[n3][e5]));
    i2.setInt16(s2, t3 < 0 ? t3 * 32768 : t3 * 32767, true), s2 += 2;
  }
  return r2;
}
function XR(e4) {
  let t2 = 0, n2 = 0, r2 = true, i2 = 0, a2 = 0;
  for (let o2 = 0; o2 < e4.numberOfChannels; o2++) {
    let s2 = e4.getChannelData(o2);
    for (let e5 = 0; e5 < s2.length; e5++) {
      let o3 = s2[e5];
      if (!Number.isFinite(o3)) {
        r2 = false;
        continue;
      }
      let c2 = o3 < 0 ? -o3 : o3;
      c2 > t2 && (t2 = c2), c2 >= 0.999 && i2++, n2 += o3 * o3, a2++;
    }
  }
  return { peak: t2, rms: Math.sqrt(n2 / Math.max(1, a2)), finite: r2, clipped: i2, seconds: e4.duration };
}
var ZR = t((() => {
  WN(), FN(), XL(), kR(), RN(), jR(), xL();
})), QR = n({ audioDebug: () => nz, createAudioEngine: () => $R, renderPreview: () => ez });
function $R() {
  let e4 = new KR();
  return tz = e4, e4;
}
function ez(e4, t2, n2, r2) {
  return JR((tz ??= new KR()).bank, e4, t2, n2, r2);
}

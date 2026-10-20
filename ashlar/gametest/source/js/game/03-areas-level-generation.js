// ===== game part 03-areas-level-generation (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var Ep = { town: { id: `town`, name: `Grayvigil Encampment`, act: 1, kind: `town`, theme: `town`, size: 72, level: { normal: 1, nightmare: 36, hell: 67 }, monsters: [], packs: [0, 0], packSize: [0, 0], champions: [0, 0], uniques: [0, 0], waypoint: true, music: `town`, ambience: `town`, rain: 0.35, lighting: `town`, tip: `Mother Isolde heals you for free. Speak with her before you leave the camp.` }, mournmoor: { id: `mournmoor`, name: `The Mournmoor`, act: 1, kind: `wild`, theme: `moor`, size: 128, level: { normal: 2, nightmare: 37, hell: 68 }, monsters: [{ kind: `gutterkin`, weight: 5 }, { kind: `rotwalker`, weight: 3 }, { kind: `spinehog`, weight: 2 }], packs: [16, 20], packSize: [3, 6], champions: [1, 2], uniques: [1, 1], waypoint: false, music: `wilderness`, ambience: `moor`, rain: 0.7, lighting: `moor`, tip: `Gutterkin Shamans raise their fallen kin. Kill the Shaman first.` }, den: { id: `den`, name: `Den of Rot`, act: 1, kind: `dungeon`, theme: `cave`, size: 72, level: { normal: 3, nightmare: 38, hell: 69 }, monsters: [{ kind: `gutterkin`, weight: 4 }, { kind: `rotwalker`, weight: 3 }, { kind: `spinehog`, weight: 3 }], packs: [12, 14], packSize: [3, 5], champions: [1, 1], uniques: [0, 0], waypoint: false, music: `dungeon`, ambience: `cave`, rain: 0, lighting: `cave`, tip: `Your light radius is all that stands between you and the dark.` }, hollowFields: { id: `hollowFields`, name: `The Hollow Fields`, act: 1, kind: `wild`, theme: `fields`, size: 128, level: { normal: 5, nightmare: 39, hell: 70 }, monsters: [{ kind: `bonewretch`, weight: 4 }, { kind: `hollowArcher`, weight: 3 }, { kind: `gutterkin`, weight: 3 }, { kind: `rotwalker`, weight: 2 }], packs: [15, 18], packSize: [3, 6], champions: [1, 2], uniques: [1, 1], waypoint: true, music: `wilderness`, ambience: `graveyard`, rain: 0.45, lighting: `fields`, tip: `Hollow Archers keep their distance. Close the gap or use cover.` } }, Dp = class {
  handlers = /* @__PURE__ */ new Map();
  on(e4, t2) {
    let n2 = this.handlers.get(e4);
    return n2 || (n2 = /* @__PURE__ */ new Set(), this.handlers.set(e4, n2)), n2.add(t2), () => n2?.delete(t2);
  }
  emit(e4, t2) {
    let n2 = this.handlers.get(e4);
    if (n2) for (let e5 of n2) e5(t2);
  }
  clear() {
    this.handlers.clear();
  }
};
Ld();
var Op = { deadTree: { block: 0.55, los: false }, gnarledTree: { block: 0.75, los: false }, bush: { block: 0, los: false }, rock: { block: 0.6, los: false }, boulder: { block: 1.3, los: true }, reeds: { block: 0, los: false }, stump: { block: 0.4, los: false }, mushroom: { block: 0, los: false }, stalagmite: { block: 0.6, los: true }, crystalFungus: { block: 0.35, los: false }, ruinWall: { block: 0, los: true }, ruinArch: { block: 0, los: false }, ruinPillar: { block: 0.6, los: true }, rubble: { block: 0, los: false }, standingStone: { block: 0.7, los: true }, gravestone: { block: 0.35, los: false }, celticCross: { block: 0.4, los: false }, mausoleum: { block: 0, los: true }, ironFence: { block: 0, los: false }, woodFence: { block: 0, los: false }, scarecrow: { block: 0.3, los: false }, well: { block: 1.2, los: false }, brokenCart: { block: 1.2, los: false }, statue: { block: 0.8, los: true }, palisade: { block: 0, los: true }, palisadeTower: { block: 1.6, los: true }, tent: { block: 1.6, los: true }, bigTent: { block: 2.6, los: true }, barrelProp: { block: 0.45, los: false }, crate: { block: 0.55, los: false }, sack: { block: 0, los: false }, weaponRack: { block: 0.6, los: false }, banner: { block: 0.25, los: false }, torchPost: { block: 0.25, los: false }, anvil: { block: 0.6, los: false }, forge: { block: 1.4, los: true }, cart: { block: 1.3, los: false }, stall: { block: 1.4, los: false }, bench: { block: 0.5, los: false }, hayBale: { block: 0.6, los: false }, bedroll: { block: 0, los: false }, logPile: { block: 0.9, los: false }, totem: { block: 0.4, los: false }, hideTent: { block: 1.3, los: true }, skullPike: { block: 0.2, los: false }, bonePile: { block: 0, los: false }, corpseProp: { block: 0, los: false }, cage: { block: 0.9, los: false }, webs: { block: 0, los: false }, wallTorch: { block: 0, los: false }, caveRock: { block: 0.9, los: true }, gateArch: { block: 0, los: false }, campfireRing: { block: 0, los: false } }, kp = class {
  w;
  h;
  nav;
  height;
  splat;
  ao;
  grass;
  props = [];
  objects = [];
  npcs = [];
  spawns = [];
  lights = [];
  water = [];
  entries = {};
  regions = {};
  reserved;
  constructor(e4, t2) {
    this.w = e4, this.h = t2, this.nav = new Bd(e4, t2), this.height = new Float32Array((e4 + 1) * (t2 + 1)), this.splat = new Uint8Array(e4 * t2 * 4), this.ao = new Float32Array((e4 + 1) * (t2 + 1)).fill(1), this.grass = new Uint8Array(e4 * t2), this.reserved = new Uint8Array(e4 * t2);
  }
  fillWalk(e4) {
    this.nav.walk.fill(e4);
  }
  setLayer(e4, t2, n2, r2) {
    if (e4 < 0 || t2 < 0 || e4 >= this.w || t2 >= this.h) return;
    let i2 = (t2 * this.w + e4) * 4, a2 = Math.max(0, Math.min(1, r2));
    for (let e5 = 0; e5 < 4; e5 += 1) {
      let t3 = this.splat[i2 + e5], r3 = e5 === n2 ? 255 : 0;
      this.splat[i2 + e5] = Math.round(t3 + (r3 - t3) * a2);
    }
  }
  paintDisc(e4, t2, n2, r2, i2 = 1, a2 = 0) {
    let o2 = Math.floor(e4 - n2 - 1), s2 = Math.ceil(e4 + n2 + 1), c2 = Math.floor(t2 - n2 - 1), l2 = Math.ceil(t2 + n2 + 1);
    for (let u2 = c2; u2 <= l2; u2 += 1) for (let c3 = o2; c3 <= s2; c3 += 1) {
      let o3 = Math.hypot(c3 + 0.5 - e4, u2 + 0.5 - t2), s3 = a2 ? (Pd(c3 * 0.35, u2 * 0.35, a2) - 0.5) * n2 * 0.6 : 0, l3 = 1 - (o3 - n2 * 0.55 + s3) / (n2 * 0.45);
      l3 <= 0 || this.setLayer(c3, u2, r2, Math.min(1, l3) * i2);
    }
  }
  setWalkDisc(e4, t2, n2, r2, i2 = -1) {
    let a2 = Math.floor(e4 - n2), o2 = Math.ceil(e4 + n2), s2 = Math.floor(t2 - n2), c2 = Math.ceil(t2 + n2);
    for (let l2 = s2; l2 <= c2; l2 += 1) for (let s3 = a2; s3 <= o2; s3 += 1) {
      if (!this.nav.inBounds(s3, l2) || Math.hypot(s3 + 0.5 - e4, l2 + 0.5 - t2) > n2 + 0.05) continue;
      let a3 = l2 * this.w + s3;
      this.nav.walk[a3] = r2, i2 >= 0 && (this.nav.los[a3] = i2);
    }
  }
  reserveDisc(e4, t2, n2) {
    let r2 = Math.floor(e4 - n2), i2 = Math.ceil(e4 + n2), a2 = Math.floor(t2 - n2), o2 = Math.ceil(t2 + n2);
    for (let s2 = a2; s2 <= o2; s2 += 1) for (let a3 = r2; a3 <= i2; a3 += 1) this.nav.inBounds(a3, s2) && Math.hypot(a3 + 0.5 - e4, s2 + 0.5 - t2) <= n2 && (this.reserved[s2 * this.w + a3] = 1);
  }
  isReservedNear(e4, t2, n2) {
    let r2 = Math.floor(e4 - n2), i2 = Math.ceil(e4 + n2), a2 = Math.floor(t2 - n2), o2 = Math.ceil(t2 + n2);
    for (let e5 = a2; e5 <= o2; e5 += 1) for (let t3 = r2; t3 <= i2; t3 += 1) if (!this.nav.inBounds(t3, e5) || this.reserved[e5 * this.w + t3]) return true;
    return false;
  }
  prop(e4, t2, n2, r2 = 0, i2 = 1, a2 = 0) {
    let o2 = { kind: e4, x: t2, z: n2, rot: r2, scale: i2, variant: a2 };
    this.props.push(o2);
    let s2 = Op[e4];
    if (s2.block > 0) {
      let e5 = s2.block * i2;
      if (e5 < 0.7) {
        let e6 = Math.floor(t2), r3 = Math.floor(n2);
        this.nav.inBounds(e6, r3) && (this.nav.walk[r3 * this.w + e6] = 0, s2.los && (this.nav.los[r3 * this.w + e6] = 1));
      } else this.setWalkDisc(t2, n2, e5, 0, s2.los ? 1 : -1);
      this.occlude(t2, n2, e5 + 0.8, 0.55);
    }
    return o2;
  }
  runs = []; // [ASHLAR] wall runs (kind, x0, z0, x1, z1), read by the kit wall layout (ashlarKitsBuild)
  wall(e4, t2, n2, r2, i2, a2, o2 = true, s2) {
    this.runs.push({ kind: e4, x0: t2, z0: n2, x1: r2, z1: i2 });
    let c2 = r2 - t2, l2 = i2 - n2, u2 = Math.hypot(c2, l2), d2 = Math.max(1, Math.round(u2 / a2)), f2 = Math.atan2(c2, l2);
    for (let r3 = 0; r3 < d2; r3 += 1) {
      let i3 = (r3 + 0.5) / d2, a3 = t2 + c2 * i3, o3 = n2 + l2 * i3;
      this.props.push({ kind: e4, x: a3, z: o3, rot: f2, scale: 1, variant: s2 ? s2(r3) : 0 });
    }
    let p2 = Math.ceil(u2 / 0.4);
    for (let e5 = 0; e5 <= p2; e5 += 1) {
      let r3 = e5 / p2, i3 = t2 + c2 * r3, a3 = n2 + l2 * r3, s3 = Math.floor(i3), u3 = Math.floor(a3);
      this.nav.inBounds(s3, u3) && (this.nav.walk[u3 * this.w + s3] = 0, o2 && (this.nav.los[u3 * this.w + s3] = 1));
    }
    for (let e5 = 0; e5 <= p2; e5 += 2) {
      let r3 = e5 / p2;
      this.occlude(t2 + c2 * r3, n2 + l2 * r3, 1.6, 0.6);
    }
  }
  occlude(e4, t2, n2, r2) {
    let i2 = this.w + 1, a2 = Math.max(0, Math.floor(e4 - n2)), o2 = Math.min(this.w, Math.ceil(e4 + n2)), s2 = Math.max(0, Math.floor(t2 - n2)), c2 = Math.min(this.h, Math.ceil(t2 + n2));
    for (let l2 = s2; l2 <= c2; l2 += 1) for (let s3 = a2; s3 <= o2; s3 += 1) {
      let a3 = Math.hypot(s3 - e4, l2 - t2);
      if (a3 >= n2) continue;
      let o3 = 1 - a3 / n2 * (a3 / n2), c3 = l2 * i2 + s3;
      this.ao[c3] = Math.min(this.ao[c3], 1 - r2 * o3);
    }
  }
  light(e4, t2, n2, r2, i2, a2, o2, s2 = 1) {
    this.lights.push({ x: e4, y: t2, z: n2, color: r2, intensity: i2, distance: a2, flicker: o2, priority: s2 });
  }
  free(e4, t2, n2) {
    let r2 = Math.floor(e4 - n2), i2 = Math.ceil(e4 + n2), a2 = Math.floor(t2 - n2), o2 = Math.ceil(t2 + n2);
    for (let e5 = a2; e5 <= o2; e5 += 1) for (let t3 = r2; t3 <= i2; t3 += 1) if (!this.nav.isWalkable(t3, e5)) return false;
    return true;
  }
  finish(e4, t2, n2) {
    return { areaId: e4, theme: t2, w: this.w, h: this.h, nav: this.nav, height: this.height, splat: this.splat, ao: this.ao, props: this.props, objects: this.objects, npcs: this.npcs, spawns: this.spawns, lights: this.lights, water: this.water, entries: this.entries, wallHeight: n2, grass: this.grass, regions: this.regions, runs: this.runs };
  }
};
function Ap(e4, t2, n2, r2, i2, a2, o2) {
  let s2 = [], c2 = r2 - t2, l2 = i2 - n2, u2 = Math.hypot(c2, l2), d2 = -l2 / u2, f2 = c2 / u2, p2 = e4.range(0, Math.PI * 2), m2 = e4.range(1.2, 2.2);
  for (let r3 = 0; r3 <= o2; r3 += 1) {
    let i3 = r3 / o2, u3 = Math.sin(i3 * Math.PI), h2 = (Math.sin(i3 * Math.PI * m2 + p2) * 0.7 + (e4.next() - 0.5) * 0.6) * a2 * u3;
    s2.push({ x: t2 + c2 * i3 + d2 * h2, z: n2 + l2 * i3 + f2 * h2 });
  }
  return s2;
}
function jp(e4, t2, n2, r2, i2, a2) {
  for (let o2 = 0; o2 < t2.length - 1; o2 += 1) {
    let s2 = t2[o2], c2 = t2[o2 + 1], l2 = Math.hypot(c2.x - s2.x, c2.z - s2.z), u2 = Math.ceil(l2 / 0.7);
    for (let t3 = 0; t3 <= u2; t3 += 1) {
      let o3 = t3 / u2, l3 = s2.x + (c2.x - s2.x) * o3, d2 = s2.z + (c2.z - s2.z) * o3, f2 = n2 * (0.85 + Pd(l3 * 0.2, d2 * 0.2, a2) * 0.4);
      e4.paintDisc(l3, d2, f2 + 1.6, i2, 0.5, a2 + 7), e4.paintDisc(l3, d2, f2, r2, 1, a2), e4.reserveDisc(l3, d2, f2 + 1.5), e4.setWalkDisc(l3, d2, f2 + 0.5, 1, 0);
    }
  }
}
function Mp(e4, t2, n2, r2, i2) {
  let a2 = e4.w + 1, o2 = Math.max(0, Math.floor(t2 - r2)), s2 = Math.min(e4.w, Math.ceil(t2 + r2)), c2 = Math.max(0, Math.floor(n2 - r2)), l2 = Math.min(e4.h, Math.ceil(n2 + r2)), u2 = i2 ?? e4.height[Math.round(n2) * a2 + Math.round(t2)];
  for (let i3 = c2; i3 <= l2; i3 += 1) for (let c3 = o2; c3 <= s2; c3 += 1) {
    let o3 = Math.hypot(c3 - t2, i3 - n2);
    if (o3 >= r2) continue;
    let s3 = 1 - (o3 / r2) ** 2, l3 = i3 * a2 + c3;
    e4.height[l3] += (u2 - e4.height[l3]) * s3;
  }
}
function Np(e4, t2, n2) {
  let r2 = e4.nav;
  for (let i2 = 0; i2 < 6; i2 += 1) {
    let i3 = new Uint8Array(r2.w * r2.h), a2 = [], o2 = r2.nearestWalkable(t2.x, t2.z, 6);
    if (!o2) return;
    let s2 = Math.floor(o2.z) * r2.w + Math.floor(o2.x);
    for (i3[s2] = 1, a2.push(s2); a2.length; ) {
      let e5 = a2.pop(), t3 = e5 % r2.w, n3 = e5 / r2.w | 0, o3 = [e5 - 1, e5 + 1, e5 - r2.w, e5 + r2.w], s3 = [t3 > 0, t3 < r2.w - 1, n3 > 0, n3 < r2.h - 1];
      for (let e6 = 0; e6 < 4; e6 += 1) {
        if (!s3[e6]) continue;
        let t4 = o3[e6];
        !i3[t4] && r2.walk[t4] && (i3[t4] = 1, a2.push(t4));
      }
    }
    let c2 = false;
    for (let a3 of n2) {
      let n3 = r2.nearestWalkable(a3.x, a3.z, 6);
      if (!n3 || i3[Math.floor(n3.z) * r2.w + Math.floor(n3.x)]) continue;
      let o3 = Math.ceil(Math.hypot(t2.x - a3.x, t2.z - a3.z) / 0.5);
      for (let n4 = 0; n4 <= o3; n4 += 1) {
        let r3 = n4 / o3;
        e4.setWalkDisc(a3.x + (t2.x - a3.x) * r3, a3.z + (t2.z - a3.z) * r3, 1.2, 1, 0);
      }
      c2 = true;
    }
    if (!c2) return;
  }
}
function Pp(e4, t2, n2, r2 = 1) {
  e4.light(t2, 1.4, n2, `#ff8a3a`, 34 * r2, 16, 2, 3);
}
function Fp(e4, t2) {
  let n2 = e4.size, r2 = new kp(n2, n2), i2 = new Id(t2 ^ 20903), a2 = n2 / 2, o2 = n2 / 2 + 2, s2 = a2 - 21, c2 = a2 + 21, l2 = o2 - 19, u2 = o2 + 19;
  r2.fillWalk(0);
  for (let e5 = Math.floor(l2) + 1; e5 < u2 - 1; e5 += 1) for (let t3 = Math.floor(s2) + 1; t3 < c2 - 1; t3 += 1) r2.nav.walk[e5 * n2 + t3] = 1;
  for (let e5 = 0; e5 < n2; e5 += 1) for (let i3 = 0; i3 < n2; i3 += 1) {
    let a3 = i3 > s2 && i3 < c2 && e5 > l2 && e5 < u2, o3 = Fd(i3 * 0.12, e5 * 0.12, 3, t2);
    a3 ? (r2.setLayer(i3, e5, o3 > 0.55 ? 1 : 2, 1), o3 < 0.33 && r2.setLayer(i3, e5, 0, 0.6)) : (r2.setLayer(i3, e5, 0, 1), o3 > 0.62 && r2.setLayer(i3, e5, 1, 0.5), r2.grass[e5 * n2 + i3] = Math.round(200 * Math.max(0, o3 * 1.4 - 0.2)));
  }
  for (let e5 = 0; e5 <= n2; e5 += 1) for (let i3 = 0; i3 <= n2; i3 += 1) {
    let a3 = i3 > s2 - 2 && i3 < c2 + 2 && e5 > l2 - 2 && e5 < u2 + 2, o3 = Fd(i3 * 0.05, e5 * 0.05, 4, t2 + 3);
    r2.height[e5 * (n2 + 1) + i3] = (o3 - 0.5) * (a3 ? 0.35 : 2.2);
  }
  let d2 = a2 + 3, f2 = 2.2, p2 = (e5) => (e5 * 7 + t2) % 3;
  r2.wall(`palisade`, s2, l2, d2 - f2, l2, 1.05, true, p2), r2.wall(`palisade`, d2 + f2, l2, c2, l2, 1.05, true, p2), r2.wall(`palisade`, c2, l2, c2, u2, 1.05, true, p2), r2.wall(`palisade`, c2, u2, s2, u2, 1.05, true, p2), r2.wall(`palisade`, s2, u2, s2, l2, 1.05, true, p2), r2.prop(`palisadeTower`, s2, l2, 0, 1), r2.prop(`palisadeTower`, c2, l2, 0, 1), r2.prop(`palisadeTower`, c2, u2, 0, 1), r2.prop(`palisadeTower`, s2, u2, 0, 1), r2.prop(`palisadeTower`, d2 - f2 - 1.2, l2, 0, 0.85, 1), r2.prop(`palisadeTower`, d2 + f2 + 1.2, l2, 0, 0.85, 1), r2.props.push({ kind: `gateArch`, x: d2, z: l2, rot: 0, scale: 1, variant: 0 });
  for (let e5 = 1; e5 <= Math.ceil(l2) + 1; e5 += 1) for (let t3 = Math.floor(d2 - f2 + 0.6); t3 <= Math.floor(d2 + f2 - 0.6); t3 += 1) r2.nav.walk[e5 * n2 + t3] = 1, r2.nav.los[e5 * n2 + t3] = 0;
  for (let e5 = 0; e5 <= l2 + 3; e5 += 1) r2.paintDisc(d2, e5, 2.6, 1, 1, t2 + 11);
  r2.objects.push({ kind: `exit`, x: d2, z: l2 - 5, rot: 0, to: `mournmoor`, entry: `fromTown`, label: `To The Mournmoor` }), r2.entries.fromMoor = { x: d2, z: l2 + 3 }, r2.entries.start = { x: a2 - 2, z: o2 + 6 };
  let m2 = { x: a2 - 1, z: o2 };
  r2.paintDisc(m2.x, m2.z, 6.5, 3, 1, t2 + 21), r2.objects.push({ kind: `campfire`, x: m2.x, z: m2.z, rot: 0, tier: 2 }), r2.setWalkDisc(m2.x, m2.z, 1.4, 0, -1), Pp(r2, m2.x, m2.z, 1.25);
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = e5 / 4 * Math.PI * 2 + 0.4;
    r2.prop(`bench`, m2.x + Math.cos(t3) * 3.6, m2.z + Math.sin(t3) * 3.6, -t3 + Math.PI / 2, 1, e5 % 2);
  }
  r2.prop(`logPile`, m2.x + 5.5, m2.z - 3.2, 0.6);
  let h2 = { x: a2 - 11, z: o2 - 6 };
  r2.paintDisc(h2.x, h2.z, 3.6, 3, 1, t2 + 22), r2.objects.push({ kind: `waypoint`, x: h2.x, z: h2.z, rot: 0 }), r2.entries.waypoint = { x: h2.x + 2.2, z: h2.z + 2.2 }, r2.light(h2.x, 1.2, h2.z, `#4aa3ff`, 10, 9, 3, 2);
  let g2 = { x: a2 + 3, z: o2 + 7 };
  r2.objects.push({ kind: `stash`, x: g2.x, z: g2.z, rot: -0.5 }), r2.setWalkDisc(g2.x, g2.z, 0.8, 0, -1);
  let _2 = { x: a2 - 14, z: o2 + 8 };
  r2.prop(`bigTent`, _2.x, _2.z, 0.3, 1, 0), r2.npcs.push({ kind: `healer`, x: _2.x + 3.4, z: _2.z - 1.5, rot: 2.2, wander: 1.5 }), r2.prop(`stall`, _2.x + 4.5, _2.z + 2.5, 1.2, 1, 1), r2.prop(`sack`, _2.x + 3.2, _2.z + 3.8, 0.3), r2.light(_2.x + 3.4, 1.7, _2.z - 0.4, `#ffb070`, 6, 8, 1, 1);
  let v2 = { x: a2 + 14, z: o2 - 3 };
  r2.paintDisc(v2.x, v2.z, 5, 3, 0.8, t2 + 23), r2.prop(`forge`, v2.x + 1.5, v2.z - 2.5, -0.8), r2.prop(`anvil`, v2.x - 1, v2.z, 0.5), r2.prop(`weaponRack`, v2.x + 3.5, v2.z + 2.2, -1.2, 1, 0), r2.prop(`weaponRack`, v2.x + 1.2, v2.z + 3.6, -1.6, 1, 1), r2.prop(`barrelProp`, v2.x - 2.6, v2.z - 2.3, 0, 1, 1), r2.prop(`crate`, v2.x - 3, v2.z + 1.8, 0.4), r2.npcs.push({ kind: `smith`, x: v2.x - 1.4, z: v2.z + 1.5, rot: -2.4, wander: 1.2 }), r2.light(v2.x + 1.5, 1.2, v2.z - 2.5, `#ff6a1a`, 22, 10, 2, 2), r2.npcs.push({ kind: `sage`, x: m2.x + 4.4, z: m2.z + 3.8, rot: -2.4, wander: 1.2 }), r2.npcs.push({ kind: `captain`, x: d2 - 4, z: l2 + 5, rot: 0.6, wander: 2 });
  let y2 = [[a2 - 15, o2 - 12, 0.9, 0], [a2 - 6, o2 - 13, 0.1, 1], [a2 + 9, o2 + 12, 2.6, 0], [a2 + 16, o2 + 9, 3.6, 1], [a2 - 4, o2 + 13, 3, 0], [a2 + 17, o2 - 12, -0.5, 1]];
  for (let [e5, t3, n3, i3] of y2) r2.prop(`tent`, e5, t3, n3, 1, i3), r2.prop(`bedroll`, e5 + Math.cos(n3) * 2.4, t3 - Math.sin(n3) * 2.4, n3 + 0.3);
  r2.prop(`cart`, a2 + 7, o2 - 12, 0.7), r2.prop(`cart`, a2 - 17, o2 - 2, 1.9, 1, 1), r2.prop(`hayBale`, a2 - 18.5, o2 + 1, 0.2), r2.prop(`hayBale`, a2 - 18, o2 + 3, 0.9);
  for (let e5 = 0; e5 < 18; e5 += 1) {
    let e6 = i2.range(0, Math.PI * 2), t3 = i2.range(8, 17), n3 = a2 + Math.cos(e6) * t3 * 1.05, s3 = o2 + Math.sin(e6) * t3 * 0.95;
    if (!r2.free(n3, s3, 1.2)) continue;
    let c3 = i2.pick([`barrelProp`, `crate`, `sack`, `crate`, `barrelProp`]);
    r2.prop(c3, n3, s3, i2.range(0, 6.28), i2.range(0.85, 1.1), i2.int(0, 2));
  }
  let b2 = [[d2 - 3.2, l2 + 1.6], [d2 + 3.2, l2 + 1.6], [a2 - 8, o2 - 2], [a2 + 8, o2 + 3], [a2 - 6, o2 + 9], [a2 + 10, o2 - 8], [a2 - 13, o2 - 8], [a2 + 3, o2 - 10]];
  for (let [e5, t3] of b2) r2.prop(`torchPost`, e5, t3, 0), r2.light(e5, 2.4, t3, `#ff9a4a`, 9, 9, 1, 1);
  r2.prop(`banner`, d2 - 4.6, l2 + 2.2, 0.2, 1, 0), r2.prop(`banner`, d2 + 4.6, l2 + 2.2, -0.2, 1, 1), r2.prop(`banner`, a2 - 2, o2 - 8, 0.8, 1, 0), r2.prop(`well`, a2 + 6, o2 + 2, 0.3);
  for (let e5 = 0; e5 < 160; e5 += 1) {
    let e6 = i2.range(1, n2 - 1), t3 = i2.range(1, n2 - 1);
    if (e6 > s2 - 2 && e6 < c2 + 2 && t3 > l2 - 2 && t3 < u2 + 2 || Math.abs(e6 - d2) < 5 && t3 < l2) continue;
    let a3 = i2.next();
    a3 < 0.35 ? r2.props.push({ kind: `deadTree`, x: e6, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.8, 1.3), variant: i2.int(0, 3) }) : a3 < 0.6 ? r2.props.push({ kind: `rock`, x: e6, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.7, 1.6), variant: i2.int(0, 3) }) : a3 < 0.8 ? r2.props.push({ kind: `bush`, x: e6, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.8, 1.4), variant: i2.int(0, 2) }) : r2.props.push({ kind: `boulder`, x: e6, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.7, 1.2), variant: i2.int(0, 2) });
  }
  for (let e5 = Math.floor(l2) + 1; e5 < u2; e5 += 1) for (let t3 = Math.floor(s2) + 1; t3 < c2; t3 += 1) {
    let i3 = Math.min(t3 - s2, c2 - t3, e5 - l2, u2 - e5);
    i3 < 4 && r2.nav.walk[e5 * n2 + t3] && (r2.grass[e5 * n2 + t3] = Math.round(140 * (1 - i3 / 4)));
  }
  return r2.regions.town = { x: a2, z: o2, r: 22 }, ashlarKitNav(r2), r2.finish(e4.id, `town`); // [ASHLAR] ashlarKitNav: bigger nav blocks for the kit pieces (no-op without kits)
}
function Ip(e4, t2) {
  let n2 = e4.size, r2 = new kp(n2, n2), i2 = new Id(t2 ^ 15389), a2 = e4.theme === `fields`;
  r2.fillWalk(1);
  for (let e5 = 0; e5 <= n2; e5 += 1) for (let i3 = 0; i3 <= n2; i3 += 1) {
    let a3 = Fd(i3 * 0.035, e5 * 0.035, 5, t2 + 1), o3 = Fd(i3 * 0.11, e5 * 0.11, 3, t2 + 2);
    r2.height[e5 * (n2 + 1) + i3] = (a3 - 0.5) * 3.2 + (o3 - 0.5) * 0.5;
  }
  for (let e5 = 0; e5 < n2; e5 += 1) for (let i3 = 0; i3 < n2; i3 += 1) {
    let a3 = Fd(i3 * 0.07, e5 * 0.07, 4, t2 + 5), o3 = Fd(i3 * 0.15 + 9, e5 * 0.15, 3, t2 + 6);
    r2.setLayer(i3, e5, 0, 1), a3 < 0.36 ? r2.setLayer(i3, e5, 2, Math.min(1, (0.36 - a3) * 6)) : o3 > 0.64 && r2.setLayer(i3, e5, 1, Math.min(1, (o3 - 0.64) * 5));
    let s3 = Math.max(0, Math.min(1, (a3 - 0.3) * 2.2)) * (0.6 + o3 * 0.6);
    r2.grass[e5 * n2 + i3] = Math.round(255 * Math.min(1, s3));
  }
  for (let e5 = 0; e5 < n2; e5 += 1) for (let i3 = 0; i3 < n2; i3 += 1) {
    let a3 = Math.min(i3, e5, n2 - 1 - i3, n2 - 1 - e5);
    a3 < 3 + Pd(i3 * 0.2, e5 * 0.2, t2 + 9) * 3 && (r2.nav.walk[e5 * n2 + i3] = 0, r2.nav.los[e5 * n2 + i3] = +(a3 < 2));
  }
  let o2 = { x: n2 - 10, z: n2 - 10 }, s2 = { x: 10, z: 10 }, c2 = i2.chance(0.5), l2 = c2 ? { x: 12, z: n2 - 26 } : { x: n2 - 26, z: 12 }, u2 = { x: n2 * 0.5 + i2.range(-10, 10), z: n2 * 0.5 + i2.range(-10, 10) }, d2 = Ap(i2, o2.x, o2.z, u2.x, u2.z, 10, 10), f2 = Ap(i2, u2.x, u2.z, s2.x + 4, s2.z + 4, 10, 10), p2 = Ap(i2, u2.x, u2.z, l2.x + (c2 ? 6 : 4), l2.z + (c2 ? -4 : 6), 7, 8);
  jp(r2, d2, 1.6, 1, 2, t2 + 31), jp(r2, f2, 1.6, 1, 2, t2 + 32), a2 || jp(r2, p2, 1.2, 1, 2, t2 + 33);
  let m2 = (e5, t3, n3) => {
    let i3 = Math.ceil(Math.hypot(t3.x - e5.x, t3.z - e5.z) / 0.5);
    for (let a3 = 0; a3 <= i3; a3 += 1) {
      let o3 = a3 / i3;
      r2.setWalkDisc(e5.x + (t3.x - e5.x) * o3, e5.z + (t3.z - e5.z) * o3, n3, 1, 0), r2.reserveDisc(e5.x + (t3.x - e5.x) * o3, e5.z + (t3.z - e5.z) * o3, n3 + 1);
    }
  };
  m2(o2, { x: n2 - 2, z: n2 - 2 }, 2.2), m2(s2, { x: 1.5, z: 1.5 }, 2.2), r2.reserveDisc(o2.x, o2.z, 9), r2.reserveDisc(s2.x, s2.z, 6), Mp(r2, o2.x, o2.z, 8);
  let h2 = e4.id === `mournmoor` ? `town` : `mournmoor`, g2 = e4.id === `mournmoor` ? `fromMoor` : `fromFields`;
  if (r2.objects.push({ kind: `exit`, x: n2 - 2.5, z: n2 - 2.5, rot: 0, to: h2, entry: g2, label: e4.id === `mournmoor` ? `To Grayvigil Encampment` : `To The Mournmoor` }), r2.entries[e4.id === `mournmoor` ? `fromTown` : `fromMoor`] = { x: o2.x - 1.5, z: o2.z - 1.5 }, e4.id === `mournmoor` && (r2.objects.push({ kind: `exit`, x: 2.5, z: 2.5, rot: 0, to: `hollowFields`, entry: `fromMoor`, label: `To The Hollow Fields` }), r2.entries.fromFields = { x: s2.x + 2, z: s2.z + 2 }), r2.props.push({ kind: `gateArch`, x: n2 - 4.5, z: n2 - 4.5, rot: Math.PI / 4, scale: 1, variant: 1 }), e4.id === `mournmoor` && r2.props.push({ kind: `gateArch`, x: 4.5, z: 4.5, rot: Math.PI / 4, scale: 1, variant: 1 }), !a2) {
    Mp(r2, l2.x, l2.z, 7, 1.2), r2.reserveDisc(l2.x, l2.z, 6);
    let e5 = c2 ? Math.PI * 0.75 : Math.PI * 0.25;
    r2.objects.push({ kind: `denEntrance`, x: l2.x, z: l2.z, rot: e5, to: `den`, entry: `fromMoor`, label: `Den of Rot` }), r2.setWalkDisc(l2.x, l2.z, 2.2, 0, 1);
    let t3 = l2.x + (c2 ? 4 : 3.2), n3 = l2.z + (c2 ? -3.2 : 4);
    r2.entries.fromDen = { x: t3, z: n3 }, r2.reserveDisc(t3, n3, 3);
    for (let t4 = 0; t4 < 9; t4 += 1) {
      let n4 = e5 + Math.PI + (t4 - 4) * 0.42, a3 = 3.6 + i2.range(0, 1.4), o3 = l2.x + Math.sin(n4) * a3, s3 = l2.z + Math.cos(n4) * a3;
      r2.prop(`boulder`, o3, s3, i2.range(0, 6.28), i2.range(0.9, 1.5), i2.int(0, 2));
    }
    r2.prop(`skullPike`, t3 + 1.2, n3 - 1.4, 0), r2.prop(`skullPike`, t3 - 1.6, n3 + 1, 1), r2.light(t3, 2.2, n3, `#ff8a3a`, 8, 8, 1, 1), r2.prop(`torchPost`, t3 + 1.6, n3 + 1.6, 0, 1, 1);
  }
  if (e4.waypoint) {
    let e5 = { x: o2.x - 12, z: o2.z - 6 };
    Mp(r2, e5.x, e5.z, 5), r2.paintDisc(e5.x, e5.z, 4, 3, 1, t2 + 41), r2.objects.push({ kind: `waypoint`, x: e5.x, z: e5.z, rot: 0 }), r2.entries.waypoint = { x: e5.x + 2.2, z: e5.z + 2.2 }, r2.reserveDisc(e5.x, e5.z, 5), r2.light(e5.x, 1.2, e5.z, `#4aa3ff`, 10, 9, 3, 2);
    for (let t3 = 0; t3 < 4; t3 += 1) {
      let n3 = t3 / 4 * Math.PI * 2 + Math.PI / 4;
      r2.prop(`ruinPillar`, e5.x + Math.cos(n3) * 3.8, e5.z + Math.sin(n3) * 3.8, n3, 0.8, t3 % 2);
    }
  }
  if (a2) {
    r2.regions.gravewatch = { x: 34, z: 34, r: 14 }, Mp(r2, 34, 34, 16, 0.2), r2.reserveDisc(34, 34, 15);
    for (let e6 = 24; e6 <= 44; e6 += 1) for (let t3 = 21; t3 <= 47; t3 += 1) r2.setLayer(t3, e6, 2, 0.55), r2.setLayer(t3, e6, 1, 0.3), r2.nav.inBounds(t3, e6) && (r2.grass[e6 * n2 + t3] = Math.min(r2.grass[e6 * n2 + t3], 60));
    let e5 = 2.5;
    r2.wall(`ironFence`, 21, 24, 47, 24, 2, false), r2.wall(`ironFence`, 21, 24, 21, 44, 2, false), r2.wall(`ironFence`, 47, 24, 47, 32 - e5, 2, false), r2.wall(`ironFence`, 47, 36 + e5, 47, 44, 2, false), r2.wall(`ironFence`, 21, 44, 47, 44, 2, false), r2.setWalkDisc(47, 36, e5, 1, 0), r2.prop(`mausoleum`, 25.5, 27.5, Math.PI / 4, 1), r2.setWalkDisc(25.5, 27.5, 3.2, 0, 1);
    for (let e6 = 0; e6 < 4; e6 += 1) for (let t3 = 0; t3 < 6; t3 += 1) {
      let n3 = 27 + t3 * 3.2 + i2.range(-0.4, 0.4), a3 = 28 + e6 * 4.2 + i2.range(-0.4, 0.4);
      if (Math.hypot(n3 - 34, a3 - 34) < 4.5 || Math.hypot(n3 - 25.5, a3 - 27.5) < 5) continue;
      let o3 = i2.chance(0.2) ? `celticCross` : `gravestone`;
      r2.prop(o3, n3, a3, -Math.PI / 4 + i2.range(-0.2, 0.2), i2.range(0.85, 1.15), i2.int(0, 3));
    }
    r2.prop(`deadTree`, 44, 26.5, 0.4, 1.4, 2), r2.prop(`deadTree`, 23.5, 41.5, 1.4, 1.2, 1), r2.prop(`statue`, 31, 25.6, Math.PI / 4, 1), r2.objects.push({ kind: `bossSpawn`, x: 32, z: 33, rot: Math.PI / 4 }), r2.spawns.push({ x: 32, z: 33, kinds: [`bloodwitch`], count: 1, tier: `boss`, uniqueName: `Veyra the Bloodwitch`, radius: 1 }), r2.spawns.push({ x: 28, z: 38, kinds: [`rotwalker`], count: 3, tier: `normal`, radius: 3, leash: 12 }), r2.spawns.push({ x: 37, z: 28, kinds: [`bonewretch`], count: 3, tier: `normal`, radius: 3, leash: 12 });
    for (let [e6, t3] of [[47, 31], [47, 41]]) r2.prop(`torchPost`, e6 + 0.8, t3, 0, 1, 1), r2.light(e6 + 0.8, 2.3, t3, `#ff7a3a`, 9, 9, 1, 1);
  }
  let _2 = [], v2 = (e5, t3, a3) => {
    for (let s3 = 0; s3 < 80; s3 += 1) {
      let s4 = i2.range(14, n2 - 14), c3 = i2.range(14, n2 - 14);
      if (!r2.isReservedNear(s4, c3, t3) && !(Math.hypot(s4 - o2.x, c3 - o2.z) < 26) && !_2.some((e6) => Math.hypot(e6.x - s4, e6.z - c3) < a3)) return _2.push({ x: s4, z: c3, kind: e5 }), { x: s4, z: c3 };
    }
    return null;
  }, y2 = a2 ? 3 : 2;
  for (let e5 = 0; e5 < y2; e5 += 1) {
    let e6 = v2(`ruin`, 9, 22);
    e6 && Lp(r2, i2, e6.x, e6.z, a2);
  }
  let b2 = a2 ? 1 : 3;
  for (let e5 = 0; e5 < b2; e5 += 1) {
    let e6 = v2(`camp`, 7, 20);
    e6 && Rp(r2, i2, e6.x, e6.z);
  }
  {
    let e5 = v2(`stones`, 7, 20);
    if (e5) {
      Mp(r2, e5.x, e5.z, 7), r2.paintDisc(e5.x, e5.z, 6, 1, 0.7, t2 + 51);
      for (let t3 = 0; t3 < 7; t3 += 1) {
        let n3 = t3 / 7 * Math.PI * 2;
        r2.prop(`standingStone`, e5.x + Math.cos(n3) * 5, e5.z + Math.sin(n3) * 5, n3 + Math.PI / 2, i2.range(0.9, 1.25), i2.int(0, 2));
      }
      r2.objects.push({ kind: `shrine`, x: e5.x, z: e5.z, rot: 0, label: i2.pick([`experience`, `armor`, `combat`, `mana`, `health`]) }), r2.setWalkDisc(e5.x, e5.z, 0.7, 0, -1), r2.light(e5.x, 1.6, e5.z, `#7fd4ff`, 9, 8, 3, 2), r2.reserveDisc(e5.x, e5.z, 6);
    }
  }
  {
    let e5 = v2(`graves`, 6, 18);
    if (e5) {
      for (let t3 = 0; t3 < 9; t3 += 1) {
        let t4 = e5.x + i2.range(-5, 5), n3 = e5.z + i2.range(-4, 4);
        r2.prop(i2.chance(0.25) ? `celticCross` : `gravestone`, t4, n3, -Math.PI / 4 + i2.range(-0.3, 0.3), i2.range(0.85, 1.1), i2.int(0, 3));
      }
      r2.prop(`deadTree`, e5.x + 3, e5.z - 3, i2.range(0, 6.28), 1.3, 1), r2.spawns.push({ x: e5.x, z: e5.z, kinds: [`rotwalker`], count: i2.int(3, 5), tier: `normal`, radius: 4 });
    }
  }
  {
    let e5 = v2(`battle`, 7, 18);
    if (e5) {
      for (let t3 = 0; t3 < 6; t3 += 1) r2.props.push({ kind: `corpseProp`, x: e5.x + i2.range(-5, 5), z: e5.z + i2.range(-5, 5), rot: i2.range(0, 6.28), scale: 1, variant: i2.int(0, 2) });
      r2.prop(`brokenCart`, e5.x + 1, e5.z - 1, i2.range(0, 6.28)), r2.prop(`banner`, e5.x - 2, e5.z + 2, 0.4, 1, 2), r2.prop(`skullPike`, e5.x + 3, e5.z + 2, 0), r2.objects.push({ kind: `chest`, x: e5.x - 1.2, z: e5.z + 0.8, rot: i2.range(0, 6.28), tier: 1 });
    }
  }
  if (a2) for (let e5 = 0; e5 < 4; e5 += 1) {
    let e6 = v2(`farm`, 6, 16);
    e6 && zp(r2, i2, e6.x, e6.z);
  }
  let x2 = (e5, t3, a3 = 3) => {
    let o3 = 0;
    for (let s3 = 0; s3 < e5 * 8 && o3 < e5; s3 += 1) {
      let e6 = i2.range(4, n2 - 4), s4 = i2.range(4, n2 - 4);
      r2.isReservedNear(e6, s4, a3) || _2.some((t4) => Math.hypot(t4.x - e6, t4.z - s4) < 9) || (t3(e6, s4), o3 += 1);
    }
  };
  x2(a2 ? 10 : 16, (e5, t3) => {
    let n3 = i2.int(2, 5);
    for (let a3 = 0; a3 < n3; a3 += 1) r2.prop(a3 === 0 ? `boulder` : `rock`, e5 + i2.range(-2.4, 2.4), t3 + i2.range(-2.4, 2.4), i2.range(0, 6.28), i2.range(0.8, 1.6), i2.int(0, 2));
  }, 4), x2(a2 ? 14 : 22, (e5, t3) => {
    let n3 = i2.int(1, 4);
    for (let a3 = 0; a3 < n3; a3 += 1) r2.prop(i2.chance(0.3) ? `gnarledTree` : `deadTree`, e5 + i2.range(-3, 3), t3 + i2.range(-3, 3), i2.range(0, 6.28), i2.range(0.85, 1.35), i2.int(0, 3));
    i2.chance(0.5) && r2.prop(`stump`, e5 + i2.range(-3, 3), t3 + i2.range(-3, 3), i2.range(0, 6.28));
  }, 3), a2 || x2(3, (e5, t3) => {
    let a3 = i2.range(3, 5.5), o3 = i2.range(2.5, 4.5);
    r2.water.push({ x: e5, z: t3, rx: a3, rz: o3 });
    for (let i3 = Math.floor(t3 - o3 - 1); i3 <= t3 + o3 + 1; i3 += 1) for (let s3 = Math.floor(e5 - a3 - 1); s3 <= e5 + a3 + 1; s3 += 1) {
      let c3 = ((s3 + 0.5 - e5) / a3) ** 2 + ((i3 + 0.5 - t3) / o3) ** 2;
      c3 < 1 && r2.nav.inBounds(s3, i3) && (r2.nav.walk[i3 * n2 + s3] = 0), c3 < 1.6 && r2.setLayer(s3, i3, 2, Math.min(1, (1.6 - c3) * 1.5)), c3 < 1.2 && r2.nav.inBounds(s3, i3) && (r2.grass[i3 * n2 + s3] = 0);
    }
    Mp(r2, e5, t3, Math.max(a3, o3) + 2, r2.height[Math.round(t3) * (n2 + 1) + Math.round(e5)] - 0.15);
    for (let n3 = 0; n3 < 10; n3 += 1) {
      let n4 = i2.range(0, Math.PI * 2);
      r2.props.push({ kind: `reeds`, x: e5 + Math.cos(n4) * a3 * i2.range(0.9, 1.15), z: t3 + Math.sin(n4) * o3 * i2.range(0.9, 1.15), rot: i2.range(0, 6.28), scale: i2.range(0.8, 1.3), variant: i2.int(0, 2) });
    }
  }, 6), x2(a2 ? 50 : 70, (e5, t3) => {
    r2.props.push({ kind: `bush`, x: e5, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.7, 1.4), variant: i2.int(0, 2) });
  }, 1.5), x2(40, (e5, t3) => {
    r2.props.push({ kind: `rock`, x: e5, z: t3, rot: i2.range(0, 6.28), scale: i2.range(0.3, 0.6), variant: i2.int(0, 2) });
  }, 1), a2 && (x2(8, (e5, t3) => r2.prop(`scarecrow`, e5, t3, i2.range(0, 6.28), 1, i2.int(0, 1)), 3), x2(10, (e5, t3) => {
    let n3 = i2.range(5, 10), a3 = i2.range(0, Math.PI);
    r2.wall(`woodFence`, e5, t3, e5 + Math.cos(a3) * n3, t3 + Math.sin(a3) * n3, 2.2, false, (e6) => e6 % 2);
  }, 6));
  for (let e5 = 0; e5 < n2 * 2.4; e5 += 1) {
    let e6 = i2.int(0, 3), t3 = i2.range(2, n2 - 2), a3 = i2.range(0.5, 3.2), o3 = e6 === 0 || e6 === 1 ? t3 : e6 === 2 ? a3 : n2 - a3, s3 = e6 === 0 ? a3 : e6 === 1 ? n2 - a3 : t3;
    if (Math.hypot(o3 - (n2 - 2), s3 - (n2 - 2)) < 7 || Math.hypot(o3 - 2, s3 - 2) < 7) continue;
    let c3 = i2.next(), l3 = c3 < 0.45 ? `boulder` : c3 < 0.8 ? `deadTree` : `gnarledTree`;
    r2.props.push({ kind: l3, x: o3, z: s3, rot: i2.range(0, 6.28), scale: i2.range(0.9, 1.6), variant: i2.int(0, 3) });
  }
  for (let e5 of _2) if (e5.kind === `ruin` || e5.kind === `camp`) for (let t3 = 0; t3 < 2; t3 += 1) {
    let t4 = e5.x + i2.range(-5, 5), n3 = e5.z + i2.range(-5, 5);
    r2.free(t4, n3, 0.8) && r2.objects.push({ kind: `barrel`, x: t4, z: n3, rot: i2.range(0, 6.28) });
  }
  return Bp(r2, i2, e4, o2, _2), Np(r2, o2, [s2, l2, ..._2, ...r2.entries.waypoint ? [r2.entries.waypoint] : []]), r2.regions.entry = { x: o2.x, z: o2.z, r: 10 }, r2.finish(e4.id, e4.theme);
}
function Lp(e4, t2, n2, r2, i2) {
  Mp(e4, n2, r2, 9);
  let a2 = t2.range(7, 10), o2 = t2.range(6, 8), s2 = t2.chance(0.5) ? 0 : Math.PI / 2, c2 = Math.cos(s2), l2 = Math.sin(s2), u2 = (e5, t3) => ({ x: n2 + e5 * c2 - t3 * l2, z: r2 + e5 * l2 + t3 * c2 });
  for (let t3 = -o2; t3 <= o2; t3 += 1) for (let n3 = -a2; n3 <= a2; n3 += 1) {
    let r3 = u2(n3, t3), i3 = Pd(r3.x * 0.3, r3.z * 0.3, 77);
    i3 > 0.3 && e4.setLayer(Math.floor(r3.x), Math.floor(r3.z), 3, Math.min(1, (i3 - 0.3) * 2.5));
  }
  let d2 = [[-a2, -o2, a2, -o2], [-a2, -o2, -a2, o2], [a2, -o2, a2, o2 * 0.2]], f2 = u2(0, -o2);
  for (let [n3, r3, a3, o3] of d2) {
    let s3 = Math.round(Math.hypot(a3 - n3, o3 - r3) / 2.2);
    for (let c3 = 0; c3 < s3; c3 += 1) {
      if (t2.chance(0.22)) continue;
      let l3 = c3 / s3, d3 = (c3 + 1) / s3, p3 = u2(n3 + (a3 - n3) * l3, r3 + (o3 - r3) * l3), m2 = u2(n3 + (a3 - n3) * d3, r3 + (o3 - r3) * d3);
      Math.hypot((p3.x + m2.x) / 2 - f2.x, (p3.z + m2.z) / 2 - f2.z) < 2.4 || e4.wall(`ruinWall`, p3.x, p3.z, m2.x, m2.z, 2.2, true, () => t2.int(0, 3) + (i2 ? 4 : 0));
    }
  }
  e4.props.push({ kind: `ruinArch`, x: f2.x, z: f2.z, rot: s2, scale: 1, variant: 0 });
  for (let n3 = 0; n3 < 4; n3 += 1) {
    let n4 = u2(t2.range(-a2 + 1, a2 - 1), t2.range(-o2 + 1, o2 - 1));
    t2.chance(0.5) ? e4.prop(`ruinPillar`, n4.x, n4.z, t2.range(0, 6.28), t2.range(0.8, 1.1), t2.int(0, 2)) : e4.props.push({ kind: `rubble`, x: n4.x, z: n4.z, rot: t2.range(0, 6.28), scale: t2.range(0.8, 1.4), variant: t2.int(0, 2) });
  }
  let p2 = u2(t2.range(-2, 2), t2.range(-2, 2));
  e4.objects.push({ kind: `chest`, x: p2.x, z: p2.z, rot: s2, tier: 1 }), e4.reserveDisc(n2, r2, Math.max(a2, o2) + 1);
}
function Rp(e4, t2, n2, r2) {
  Mp(e4, n2, r2, 7), e4.paintDisc(n2, r2, 5.5, 1, 0.9, 61), e4.paintDisc(n2, r2, 3, 2, 0.5, 62), e4.objects.push({ kind: `campfire`, x: n2, z: r2, rot: 0, tier: 1 }), e4.setWalkDisc(n2, r2, 0.9, 0, -1), Pp(e4, n2, r2, 0.75);
  let i2 = t2.int(2, 3);
  for (let a2 = 0; a2 < i2; a2 += 1) {
    let o2 = a2 / i2 * Math.PI * 2 + t2.range(-0.3, 0.3);
    e4.prop(`hideTent`, n2 + Math.cos(o2) * 5.5, r2 + Math.sin(o2) * 5.5, -o2 + Math.PI / 2, t2.range(0.9, 1.1), t2.int(0, 1));
  }
  e4.prop(`totem`, n2 + 2.4, r2 - 2.2, t2.range(0, 6.28));
  for (let i3 = 0; i3 < 3; i3 += 1) {
    let i4 = t2.range(0, Math.PI * 2);
    e4.prop(`skullPike`, n2 + Math.cos(i4) * 3.6, r2 + Math.sin(i4) * 3.6, t2.range(0, 6.28));
  }
  e4.props.push({ kind: `bonePile`, x: n2 - 2, z: r2 + 2.4, rot: t2.range(0, 6.28), scale: 1, variant: 0 }), e4.props.push({ kind: `campfireRing`, x: n2, z: r2, rot: 0, scale: 1, variant: 0 }), e4.spawns.push({ x: n2, z: r2, kinds: [`gutterkin`, `gutterkin`, `gutterkin`, `gutterkinShaman`], count: t2.int(5, 7), tier: `normal`, radius: 3.5, leash: 14 }), e4.reserveDisc(n2, r2, 7);
}
function zp(e4, t2, n2, r2) {
  Mp(e4, n2, r2, 6);
  for (let i2 = 0; i2 < 3; i2 += 1) {
    let i3 = t2.range(0, Math.PI * 2), a2 = t2.range(3, 5);
    e4.wall(`ruinWall`, n2 + Math.cos(i3) * 2, r2 + Math.sin(i3) * 2, n2 + Math.cos(i3) * 2 + Math.cos(i3 + 1.57) * a2, r2 + Math.sin(i3) * 2 + Math.sin(i3 + 1.57) * a2, 2.2, true, () => 4 + t2.int(0, 3));
  }
  e4.props.push({ kind: `rubble`, x: n2 + t2.range(-2, 2), z: r2 + t2.range(-2, 2), rot: t2.range(0, 6.28), scale: 1.3, variant: 1 }), e4.prop(`hayBale`, n2 + 3, r2 + 2, t2.range(0, 6.28)), e4.prop(`well`, n2 - 3, r2 - 3, t2.range(0, 6.28)), e4.objects.push({ kind: `barrel`, x: n2 + 1.5, z: r2 - 2.5, rot: 0 }), e4.reserveDisc(n2, r2, 6);
}
function Bp(e4, t2, n2, r2, i2) {
  let a2 = e4.w, o2 = t2.int(n2.packs[0], n2.packs[1]), s2 = t2.int(n2.champions[0], n2.champions[1]), c2 = t2.int(n2.uniques[0], n2.uniques[1]), l2 = [...e4.spawns.map((e5) => ({ x: e5.x, z: e5.z }))], u2 = () => t2.weighted(n2.monsters, (e5) => e5.weight).kind;
  for (let d2 = 0; d2 < o2 + s2 + c2; d2 += 1) for (let c3 = 0; c3 < 60; c3 += 1) {
    let c4 = t2.range(8, a2 - 8), f2 = t2.range(8, a2 - 8);
    if (!e4.nav.walkableAt(c4, f2)) continue;
    let p2 = d2 < o2 ? Math.min(28, a2 * 0.3) : d2 < o2 + s2 ? Math.min(46, a2 * 0.42) : Math.min(62, a2 * 0.5), m2 = Math.hypot(c4 - r2.x, f2 - r2.z);
    if (m2 < p2) continue;
    let h2 = m2 < 45 ? 16 : 11;
    if (l2.some((e5) => Math.hypot(e5.x - c4, e5.z - f2) < h2) || i2.some((e5) => Math.hypot(e5.x - c4, e5.z - f2) < 5)) continue;
    let g2 = u2(), _2 = d2 < o2 ? `normal` : d2 < o2 + s2 ? `champion` : `unique`, v2 = t2.int(n2.packSize[0], n2.packSize[1]), y2 = [g2];
    g2 === `gutterkin` && (y2 = t2.chance(0.55) ? [`gutterkin`, `gutterkin`, `gutterkin`, `gutterkinShaman`] : [`gutterkin`], v2 += 1), g2 === `rotwalker` && (v2 = Math.max(2, v2 - 1)), (g2 === `spinehog` || g2 === `hollowArcher`) && (v2 = Math.min(v2, m2 < 45 ? 3 : 4)), _2 === `champion` && (v2 = t2.int(2, 4)), _2 === `unique` && (v2 = t2.int(3, 5)), e4.spawns.push({ x: c4, z: f2, kinds: y2, count: v2, tier: _2, radius: 2.5 }), l2.push({ x: c4, z: f2 });
    break;
  }
  if (n2.id === `mournmoor`) {
    let t3 = r2.x - 15, n3 = r2.z - 13, i3 = e4.nav.nearestWalkable(t3, n3, 6);
    i3 && e4.spawns.push({ x: i3.x, z: i3.z, kinds: [`gutterkin`], count: 3, tier: `normal`, radius: 2.5 });
  }
}
function Vp(e4, t2) {
  let n2 = e4.size, r2 = new Id(t2 ^ 30673), i2 = null;
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let e6 = new Uint8Array(n2 * n2);
    for (let t4 = 0; t4 < n2; t4 += 1) for (let i3 = 0; i3 < n2; i3 += 1) {
      let a4 = i3 < 2 || t4 < 2 || i3 >= n2 - 2 || t4 >= n2 - 2;
      e6[t4 * n2 + i3] = a4 ? 1 : +!!r2.chance(0.46);
    }
    for (let t4 = 0; t4 < 5; t4 += 1) {
      let t5 = new Uint8Array(n2 * n2);
      for (let r3 = 0; r3 < n2; r3 += 1) for (let i3 = 0; i3 < n2; i3 += 1) {
        if (i3 < 2 || r3 < 2 || i3 >= n2 - 2 || r3 >= n2 - 2) {
          t5[r3 * n2 + i3] = 1;
          continue;
        }
        let a4 = 0;
        for (let t6 = -1; t6 <= 1; t6 += 1) for (let o3 = -1; o3 <= 1; o3 += 1) a4 += e6[(r3 + t6) * n2 + i3 + o3];
        t5[r3 * n2 + i3] = +(a4 >= 5);
      }
      e6 = t5;
    }
    let t3 = new Uint8Array(n2 * n2), a3 = [];
    for (let r3 = 0; r3 < n2 * n2; r3 += 1) {
      if (e6[r3] || t3[r3]) continue;
      let i3 = [], o3 = [r3];
      for (t3[r3] = 1; o3.length; ) {
        let r4 = o3.pop();
        i3.push(r4);
        let a4 = r4 % n2, s3 = r4 / n2 | 0;
        for (let [r5, i4] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let c3 = a4 + r5, l3 = s3 + i4, u3 = l3 * n2 + c3;
          c3 < 0 || l3 < 0 || c3 >= n2 || l3 >= n2 || t3[u3] || e6[u3] || (t3[u3] = 1, o3.push(u3));
        }
      }
      i3.length > a3.length && (a3 = i3);
    }
    if ((!i2 || a3.length > i2.region.length) && (i2 = { grid: e6, region: a3 }), a3.length > n2 * n2 * 0.36) break;
  }
  let a2 = i2?.region ?? [], o2 = new kp(n2, n2);
  o2.fillWalk(0), o2.nav.los.fill(1);
  for (let e5 of a2) o2.nav.walk[e5] = 1, o2.nav.los[e5] = 0;
  let s2 = a2[0], c2 = -1 / 0;
  for (let e5 of a2) {
    let t3 = e5 % n2 + (e5 / n2 | 0);
    t3 > c2 && (c2 = t3, s2 = e5);
  }
  let l2 = new Int32Array(n2 * n2).fill(-1), u2 = [s2];
  l2[s2] = 0;
  let d2 = s2;
  for (let e5 = 0; e5 < u2.length; e5 += 1) {
    let t3 = u2[e5];
    l2[t3] > l2[d2] && (d2 = t3);
    let r3 = t3 % n2, i3 = t3 / n2 | 0;
    for (let [e6, a3] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let s3 = (i3 + a3) * n2 + r3 + e6;
      l2[s3] !== -1 || !o2.nav.walk[s3] || (l2[s3] = l2[t3] + 1, u2.push(s3));
    }
  }
  let f2 = s2 % n2 + 0.5, p2 = (s2 / n2 | 0) + 0.5, m2 = d2 % n2 + 0.5, h2 = (d2 / n2 | 0) + 0.5;
  o2.setWalkDisc(f2, p2, 2.5, 1, 0), o2.entries.fromMoor = { x: f2 - 1, z: p2 - 1 }, o2.objects.push({ kind: `exit`, x: f2 + 0.6, z: p2 + 0.6, rot: 0, to: `mournmoor`, entry: `fromDen`, label: `To The Mournmoor` }), o2.reserveDisc(f2, p2, 6), o2.setWalkDisc(m2, h2, 4.5, 1, 0), o2.regions.grotto = { x: m2, z: h2, r: 7 };
  let g2 = new Float32Array(n2 * n2);
  for (let e5 = 0; e5 < n2; e5 += 1) for (let r3 = 0; r3 < n2; r3 += 1) {
    let i3 = e5 * n2 + r3;
    if (o2.nav.walk[i3]) continue;
    let a3 = false;
    for (let t3 = -1; t3 <= 1 && !a3; t3 += 1) for (let n3 = -1; n3 <= 1; n3 += 1) if (o2.nav.isWalkable(r3 + n3, e5 + t3)) {
      a3 = true;
      break;
    }
    a3 && (g2[i3] = 2.6 + Fd(r3 * 0.2, e5 * 0.2, 3, t2) * 2.2), o2.nav.los[i3] = 1;
  }
  for (let e5 = 0; e5 <= n2; e5 += 1) for (let r3 = 0; r3 <= n2; r3 += 1) o2.height[e5 * (n2 + 1) + r3] = (Fd(r3 * 0.09, e5 * 0.09, 3, t2 + 3) - 0.5) * 0.7;
  for (let e5 = 0; e5 < n2; e5 += 1) for (let r3 = 0; r3 < n2; r3 += 1) {
    let i3 = Fd(r3 * 0.1, e5 * 0.1, 4, t2 + 7);
    o2.setLayer(r3, e5, 0, 1);
    let a3 = 0;
    for (let t3 = -2; t3 <= 2; t3 += 1) for (let n3 = -2; n3 <= 2; n3 += 1) o2.nav.isWalkable(r3 + n3, e5 + t3) || (a3 += 1);
    a3 > 3 && o2.setLayer(r3, e5, 1, Math.min(1, a3 / 12)), i3 < 0.38 && o2.setLayer(r3, e5, 2, Math.min(1, (0.38 - i3) * 6)), i3 > 0.66 && o2.setLayer(r3, e5, 3, Math.min(1, (i3 - 0.66) * 4)), o2.nav.walk[e5 * n2 + r3] && i3 > 0.6 && (o2.grass[e5 * n2 + r3] = Math.round(Math.min(255, (i3 - 0.6) * 900)));
  }
  for (let e5 = 0; e5 < n2; e5 += 1) for (let t3 = 0; t3 < n2; t3 += 1) g2[e5 * n2 + t3] > 0 && o2.occlude(t3 + 0.5, e5 + 0.5, 2.2, 0.45);
  let _2 = a2.filter((e5) => o2.nav.walk[e5]), v2 = () => _2[Math.floor(r2.next() * _2.length)], y2 = (e5, t3) => {
    let n3 = 0;
    for (let r3 = -1; r3 <= 1; r3 += 1) for (let i3 = -1; i3 <= 1; i3 += 1) o2.nav.isWalkable(e5 + i3, t3 + r3) || (n3 += 1);
    return n3;
  };
  for (let e5 = 0; e5 < 16; e5 += 1) {
    let e6 = v2(), t3 = e6 % n2 + 0.5, i3 = (e6 / n2 | 0) + 0.5;
    if (y2(Math.floor(t3), Math.floor(i3)) < 2 || Math.hypot(t3 - f2, i3 - p2) < 5) continue;
    let a3 = r2.int(3, 6);
    for (let e7 = 0; e7 < a3; e7 += 1) o2.props.push({ kind: `crystalFungus`, x: t3 + r2.range(-1.2, 1.2), z: i3 + r2.range(-1.2, 1.2), rot: r2.range(0, 6.28), scale: r2.range(0.6, 1.3), variant: r2.int(0, 2) });
    o2.light(t3, 0.8, i3, r2.chance(0.5) ? `#3fe0b0` : `#6aff6a`, 6, 7, 3, 1);
  }
  for (let e5 = 0; e5 < 40; e5 += 1) {
    let e6 = v2(), t3 = e6 % n2 + r2.range(0.2, 0.8), i3 = (e6 / n2 | 0) + r2.range(0.2, 0.8);
    if (Math.hypot(t3 - f2, i3 - p2) < 4 || Math.hypot(t3 - m2, i3 - h2) < 4) continue;
    let a3 = y2(Math.floor(t3), Math.floor(i3));
    a3 >= 3 ? o2.prop(`stalagmite`, t3, i3, r2.range(0, 6.28), r2.range(0.7, 1.4), r2.int(0, 2)) : a3 >= 1 && r2.chance(0.5) ? o2.props.push({ kind: `bonePile`, x: t3, z: i3, rot: r2.range(0, 6.28), scale: r2.range(0.7, 1.2), variant: r2.int(0, 1) }) : r2.chance(0.4) ? o2.props.push({ kind: `rock`, x: t3, z: i3, rot: r2.range(0, 6.28), scale: r2.range(0.3, 0.7), variant: r2.int(0, 2) }) : o2.props.push({ kind: `corpseProp`, x: t3, z: i3, rot: r2.range(0, 6.28), scale: 1, variant: r2.int(0, 2) });
  }
  for (let e5 = 0; e5 < 12; e5 += 1) {
    let e6 = v2(), t3 = e6 % n2 + 0.5, i3 = (e6 / n2 | 0) + 0.5;
    y2(Math.floor(t3), Math.floor(i3)) >= 4 && o2.props.push({ kind: `webs`, x: t3, z: i3, rot: r2.range(0, 6.28), scale: r2.range(0.8, 1.3), variant: 0 });
  }
  let b2 = (e5, t3) => {
    o2.props.push({ kind: `wallTorch`, x: e5, z: t3, rot: 0, scale: 1, variant: 0 }), o2.light(e5, 2.2, t3, `#ff8a3a`, 12, 10, 1, 2);
  };
  b2(f2 - 1.5, p2 + 1.2), b2(m2 + 2.5, h2 - 2.2), b2(m2 - 2.8, h2 + 2);
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let e6 = v2(), t3 = e6 % n2 + 0.5, r3 = (e6 / n2 | 0) + 0.5;
    y2(Math.floor(t3), Math.floor(r3)) >= 3 && b2(t3, r3);
  }
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let e6 = v2(), t3 = e6 % n2 + 0.5, i3 = (e6 / n2 | 0) + 0.5;
    Math.hypot(t3 - f2, i3 - p2) < 8 || o2.objects.push({ kind: r2.chance(0.4) ? `chest` : `urn`, x: t3, z: i3, rot: r2.range(0, 6.28), tier: 1 });
  }
  let x2 = r2.int(e4.packs[0], e4.packs[1]), S2 = [];
  for (let t3 = 0; t3 < x2; t3 += 1) for (let i3 = 0; i3 < 80; i3 += 1) {
    let i4 = v2(), a3 = i4 % n2 + 0.5, s3 = (i4 / n2 | 0) + 0.5;
    if (l2[i4] < 12 || Math.hypot(a3 - m2, s3 - h2) < 9 || S2.some((e5) => Math.hypot(e5.x - a3, e5.z - s3) < 8)) continue;
    let c3 = r2.weighted(e4.monsters, (e5) => e5.weight).kind, u3 = c3 === `gutterkin` ? [`gutterkin`, `gutterkin`, `gutterkinShaman`] : [c3], d3 = t3 === 0 && e4.champions[1] > 0;
    o2.spawns.push({ x: a3, z: s3, kinds: u3, count: d3 ? 3 : r2.int(e4.packSize[0], e4.packSize[1]), tier: d3 ? `champion` : `normal`, radius: 2 }), S2.push({ x: a3, z: s3 });
    break;
  }
  return o2.spawns.push({ x: m2, z: h2, kinds: [`rotwalker`], count: 4, tier: `unique`, uniqueName: `Gorefather`, radius: 2.5 }), o2.objects.push({ kind: `chest`, x: m2 + 1.5, z: h2 - 2.8, rot: 0.6, tier: 2 }), o2.props.push({ kind: `bonePile`, x: m2 - 2, z: h2 + 1.5, rot: 0.3, scale: 1.6, variant: 1 }), o2.props.push({ kind: `cage`, x: m2 + 3, z: h2 + 2, rot: 0.8, scale: 1, variant: 0 }), Hp(o2, a2, f2, p2), o2.finish(e4.id, `cave`, g2);
}
function Hp(e4, t2, n2, r2) {
  let i2 = e4.w, a2 = new Uint8Array(i2 * i2);
  for (let e5 of t2) a2[e5] = 1;
  for (let o2 = 0; o2 < 6; o2 += 1) {
    let o3 = new Uint8Array(i2 * i2), s2 = e4.nav.nearestWalkable(n2, r2, 6);
    if (!s2) return;
    let c2 = [Math.floor(s2.z) * i2 + Math.floor(s2.x)];
    for (o3[c2[0]] = 1; c2.length; ) {
      let t3 = c2.pop(), n3 = t3 % i2, r3 = t3 / i2 | 0;
      for (let [t4, a3] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let s3 = n3 + t4, l3 = r3 + a3;
        if (s3 < 0 || l3 < 0 || s3 >= i2 || l3 >= i2) continue;
        let u3 = l3 * i2 + s3;
        o3[u3] || !e4.nav.walk[u3] || (o3[u3] = 1, c2.push(u3));
      }
    }
    let l2 = t2.filter((t3) => e4.nav.walk[t3] && !o3[t3]);
    if (!l2.length) return;
    let u2 = [];
    for (let t3 of e4.props) {
      if (t3.kind !== `stalagmite` || !l2.some((e5) => Math.hypot(e5 % i2 + 0.5 - t3.x, (e5 / i2 | 0) + 0.5 - t3.z) < 4)) {
        u2.push(t3);
        continue;
      }
      let n3 = Math.max(0.75, Op.stalagmite.block * t3.scale) + 0.1;
      for (let r3 = Math.floor(t3.z - n3); r3 <= Math.ceil(t3.z + n3); r3 += 1) for (let o4 = Math.floor(t3.x - n3); o4 <= Math.ceil(t3.x + n3); o4 += 1) {
        if (o4 < 0 || r3 < 0 || o4 >= i2 || r3 >= i2) continue;
        let s3 = r3 * i2 + o4;
        a2[s3] && Math.hypot(o4 + 0.5 - t3.x, r3 + 0.5 - t3.z) <= n3 + 0.3 && (e4.nav.walk[s3] = 1, e4.nav.los[s3] = 0);
      }
    }
    e4.props.length = 0, e4.props.push(...u2);
  }
}

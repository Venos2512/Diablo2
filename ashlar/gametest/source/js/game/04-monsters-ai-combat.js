// ===== game part 04-monsters-ai-combat (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var Up = 1;
function Wp() {
  Up = 1, Kp = 1, Yp = 1, Zp = 1;
}
var Gp = class {
  id = Up++;
  name = ``;
  kind;
  faction;
  x = 0;
  z = 0;
  y = 0;
  px = 0;
  pz = 0;
  py = 0;
  facing = 0;
  pfacing = 0;
  radius = 0.4;
  height = 1.8;
  level = 1;
  life = 1;
  lifeMax = 1;
  mana = 0;
  manaMax = 0;
  stamina = 0;
  staminaMax = 0;
  walk = 2.5;
  runSpd = 4;
  state = `idle`;
  stateT = 0;
  action = null;
  path = [];
  goal = null;
  running = false;
  speed = 0;
  ar = 10;
  def = 0;
  dmg = [1, 2];
  element = `physical`;
  res = { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, magic: 0 };
  block = 0;
  st = { chill: 0, freeze: 0, stun: 0, fear: 0, fearFrom: { x: 0, z: 0 }, poison: 0, poisonDps: 0, burn: 0, burnDps: 0, amp: 0, lifeTap: 0, slow: 0, roar: 0, roarPct: 0 };
  hitCooldown = 0;
  cooldowns = /* @__PURE__ */ new Map();
  anim = `idle`;
  animDur = 0;
  animSeq = 0;
  flashSeq = 0;
  flashColor = `#ffffff`;
  dead = false;
  deathT = 0;
  corpse = false;
  corpseUsed = false;
  removed = false;
  visible = true;
  mdef = null;
  mkind = null;
  tier = `normal`;
  mods = [];
  xp = 0;
  leaderId = 0;
  home = { x: 0, z: 0 };
  leash = 0;
  aggro = false;
  ai = {};
  minions = [];
  bossPhase = 0;
  raisedBy = 0;
  noLoot = false;
  lastHitBy = null;
  owner = null;
  allyKind = null;
  summonSkill = null;
  npcKind = null;
  ch = null;
  d = null;
  cmd = null;
  potions = [];
  regenAcc = 0;
  constructor(e4, t2) {
    this.kind = e4, this.faction = t2;
  }
  setPos(e4, t2) {
    this.x = e4, this.z = t2, this.px = e4, this.pz = t2;
  }
  play(e4, t2 = 0) {
    this.anim = e4, this.animDur = t2, this.animSeq += 1;
  }
  flash(e4 = `#ffffff`) {
    this.flashColor = e4, this.flashSeq += 1;
  }
  get alive() {
    return !this.dead;
  }
  get busy() {
    return this.action !== null || this.state === `hit` || this.state === `stun` || this.st.freeze > 0;
  }
  get slowMult() {
    let e4 = 1;
    return this.st.chill > 0 && (e4 *= 0.5), this.st.slow > 0 && (e4 *= 0.65), this.st.freeze > 0 && (e4 = 0), e4;
  }
}, Kp = 1;
function qp(e4, t2) {
  return { phys: 0, fire: 0, cold: 0, coldLen: 0, light: 0, poison: 0, poisonLen: 0, magic: 0, isAttack: false, ar: 0, canBlock: false, knockback: 0, crit: 0, lifeSteal: 0, manaSteal: 0, stun: 0, freeze: 0, source: e4, skill: t2, vfx: `physical` };
}
var Jp = class {
  owner;
  faction;
  visual;
  packet;
  id = Kp++;
  x = 0;
  z = 0;
  y = 1.1;
  px = 0;
  pz = 0;
  py = 1.1;
  vx = 0;
  vz = 0;
  vy = 0;
  life = 1;
  age = 0;
  radius = 0.3;
  pierce = false;
  hit = /* @__PURE__ */ new Set();
  explode = 0;
  dead = false;
  wander = 0;
  emit = 0;
  emitAcc = 0;
  constructor(e4, t2, n2, r2) {
    this.owner = e4, this.faction = t2, this.visual = n2, this.packet = r2;
  }
}, Yp = 1, Xp = class {
  item;
  x;
  z;
  id = Yp++;
  t = 0;
  x0;
  z0;
  constructor(e4, t2, n2, r2, i2) {
    this.item = e4, this.x = t2, this.z = n2, this.x0 = r2 ?? t2, this.z0 = i2 ?? n2;
  }
}, Zp = 1, Qp = class {
  kind;
  x;
  z;
  rot;
  id = Zp++;
  state = `idle`;
  stateT = 0;
  label = ``;
  to;
  entry;
  tier = 0;
  data = {};
  constructor(e4, t2, n2, r2) {
    this.kind = e4, this.x = t2, this.z = n2, this.rot = r2;
  }
  get pickRadius() {
    switch (this.kind) {
      case `waypoint`:
        return 2.2;
      case `denEntrance`:
        return 2.4;
      case `portal`:
        return 1.2;
      case `stash`:
        return 1;
      case `exit`:
        return 1.6;
      case `heroCorpse`:
        return 0.9;
      default:
        return 0.8;
    }
  }
  get interactRange() {
    switch (this.kind) {
      case `waypoint`:
        return 2.6;
      case `denEntrance`:
        return 3.2;
      case `exit`:
        return 2.2;
      default:
        return 1.6;
    }
  }
}, $p, em, tm = t((() => {
  $p = { attack1: 0.55, attack2: 0.55, cast: 0.55, castUp: 0.5, kick: 0.5, taunt: 0.45, special: 0.5, block: 0.3 }, em = { attack1: 0.6, attack2: 0.6, cast: 0.55, castUp: 0.7, kick: 0.55, hit: 0.28, block: 0.32, leap: 0.7, taunt: 1.2, special: 0.9, death: 1.1, resurrect: 1.2 };
}));
tm();
var nm = Math.PI * 2;
function rm(e4, t2) {
  return Math.hypot(e4.x - t2.x, e4.z - t2.z);
}
function im(e4, t2, n2) {
  return e4 < t2 ? t2 : e4 > n2 ? n2 : e4;
}
function am(e4, t2, n2) {
  return e4 + (t2 - e4) * n2;
}
function om(e4, t2) {
  let n2 = (t2 - e4) % nm;
  return n2 > Math.PI && (n2 -= nm), n2 <= -Math.PI && (n2 += nm), n2;
}
function sm(e4, t2, n2) {
  return e4 + om(e4, t2) * n2;
}
function cm(e4, t2) {
  return Math.atan2(e4, t2);
}
function lm(e4, t2, n2, r2) {
  return am(e4, t2, 1 - Math.exp(-n2 * r2));
}
function um(e4, t2, n2) {
  let r2 = e4.w, i2 = Math.max(0, Math.min(r2 - 1e-3, t2)), a2 = Math.max(0, Math.min(e4.h - 1e-3, n2)), o2 = Math.floor(i2), s2 = Math.floor(a2), c2 = i2 - o2, l2 = a2 - s2, u2 = r2 + 1, d2 = e4.height[s2 * u2 + o2], f2 = e4.height[s2 * u2 + o2 + 1], p2 = e4.height[(s2 + 1) * u2 + o2], m2 = e4.height[(s2 + 1) * u2 + o2 + 1];
  return d2 + (f2 - d2) * c2 + (p2 - d2) * l2 + (d2 - f2 - p2 + m2) * c2 * l2;
}
var dm = t((() => {
}));
dm();
var fm = { gutterkin: { kind: `gutterkin`, name: `Gutterkin`, ai: `fallen`, undead: false, life: [2, 4], lifePerLvl: 1.8, dmg: [1, 2], dmgPerLvl: 0.45, ar: 10, arPerLvl: 5, def: 4, defPerLvl: 2.5, xp: 14, xpPerLvl: 6, walk: 2.6, run: 4.6, range: 1.1, attackTime: 0.9, element: `physical`, res: {}, radius: 0.38, aggro: 11, sounds: { aggro: `gutterkinAggro`, death: `gutterkinDeath`, hit: `hitFlesh` }, bloodColor: `#6d0a0a`, dropChance: 0.4 }, gutterkinShaman: { kind: `gutterkinShaman`, name: `Gutterkin Shaman`, ai: `shaman`, undead: false, life: [6, 9], lifePerLvl: 3, dmg: [1, 3], dmgPerLvl: 0.8, ar: 15, arPerLvl: 8, def: 3, defPerLvl: 2, xp: 26, xpPerLvl: 9, walk: 2.4, run: 4.2, range: 9, attackTime: 0.8, element: `fire`, res: { fire: 25 }, radius: 0.4, aggro: 12, missile: { speed: 9, element: `fire`, kind: `firebolt` }, sounds: { aggro: `gutterkinAggro`, death: `gutterkinDeath`, attack: `shamanCast`, hit: `hitFlesh` }, bloodColor: `#6d0a0a`, dropChance: 0.5 }, rotwalker: { kind: `rotwalker`, name: `Rotwalker`, ai: `zombie`, undead: true, life: [14, 20], lifePerLvl: 6, dmg: [2, 5], dmgPerLvl: 1.4, ar: 20, arPerLvl: 8, def: 6, defPerLvl: 3, xp: 24, xpPerLvl: 8, walk: 1.5, run: 2.1, range: 1.4, attackTime: 1.25, element: `physical`, res: { poison: 50 }, radius: 0.5, aggro: 9, sounds: { aggro: `rotwalkerGroan`, death: `rotwalkerDeath`, hit: `hitFlesh` }, bloodColor: `#2e3a14`, dropChance: 0.45 }, spinehog: { kind: `spinehog`, name: `Spinehog`, ai: `ranged`, undead: false, life: [4, 7], lifePerLvl: 2.5, dmg: [1, 2], dmgPerLvl: 0.5, ar: 16, arPerLvl: 7, def: 5, defPerLvl: 2, xp: 16, xpPerLvl: 6, walk: 2.4, run: 4.4, range: 7, attackTime: 0.75, element: `physical`, res: {}, radius: 0.42, aggro: 11, missile: { speed: 12, element: `physical`, kind: `quill` }, sounds: { death: `spinehogDeath`, attack: `spinehogShoot`, hit: `hitFlesh` }, bloodColor: `#6d0a0a`, dropChance: 0.35 }, bonewretch: { kind: `bonewretch`, name: `Bonewretch`, ai: `melee`, undead: true, life: [14, 20], lifePerLvl: 5.5, dmg: [2, 5], dmgPerLvl: 1.3, ar: 28, arPerLvl: 10, def: 14, defPerLvl: 4, xp: 22, xpPerLvl: 8, walk: 2.3, run: 3.6, range: 1.3, attackTime: 0.75, element: `physical`, res: { poison: 75, cold: 25 }, radius: 0.42, aggro: 11, sounds: { aggro: `boneRattle`, death: `boneShatter`, hit: `hitBone` }, bloodColor: `#cfc6b0`, dropChance: 0.45 }, hollowArcher: { kind: `hollowArcher`, name: `Hollow Archer`, ai: `archer`, undead: false, life: [11, 15], lifePerLvl: 4.5, dmg: [2, 5], dmgPerLvl: 1.2, ar: 30, arPerLvl: 11, def: 6, defPerLvl: 3, xp: 24, xpPerLvl: 9, walk: 2.6, run: 4.4, range: 10, attackTime: 0.95, element: `physical`, res: {}, radius: 0.4, aggro: 13, missile: { speed: 16, element: `physical`, kind: `arrow` }, sounds: { death: `gutterkinDeath`, attack: `arrowShoot`, hit: `hitFlesh` }, bloodColor: `#5a0909`, dropChance: 0.5 }, bloodwitch: { kind: `bloodwitch`, name: `Veyra the Bloodwitch`, ai: `boss_bloodwitch`, undead: false, life: [420, 460], lifePerLvl: 30, dmg: [3, 6], dmgPerLvl: 0.8, ar: 50, arPerLvl: 10, def: 20, defPerLvl: 5, xp: 900, xpPerLvl: 80, walk: 3.4, run: 5.4, range: 12, attackTime: 0.9, element: `fire`, res: { fire: 30, poison: 30 }, radius: 0.55, aggro: 14, missile: { speed: 17, element: `fire`, kind: `arrow` }, sounds: { aggro: `bossRoar`, death: `bossDeath`, attack: `arrowShoot`, hit: `hitFlesh` }, bloodColor: `#6d0a0a`, dropChance: 1 }, weepingQueen: { kind: `weepingQueen`, name: `The Weeping Queen`, ai: `boss_queen`, undead: false, life: [900, 900], lifePerLvl: 60, dmg: [10, 20], dmgPerLvl: 2, ar: 90, arPerLvl: 15, def: 40, defPerLvl: 6, xp: 2400, xpPerLvl: 120, walk: 3, run: 4.4, range: 3, attackTime: 1.1, element: `poison`, res: { poison: 75, fire: 40 }, radius: 1.3, aggro: 16, sounds: { aggro: `bossRoar`, death: `bossDeath`, hit: `hitFlesh` }, bloodColor: `#3b0d3b`, dropChance: 1 } }, pm = { extraStrong: `Extra Strong`, extraFast: `Extra Fast`, fireEnchanted: `Fire Enchanted`, coldEnchanted: `Cold Enchanted`, lightningEnchanted: `Lightning Enchanted`, stoneSkin: `Stone Skin`, cursed: `Cursed`, teleport: `Teleportation`, mightAura: `Might Aura` }, mm = [`Champion`, `Berserker`, `Fanatic`, `Ghostly`], hm = [`Grizzle`, `Rot`, `Blight`, `Gore`, `Hag`, `Mire`, `Gnash`, `Ash`, `Wither`, `Black`, `Bile`, `Crook`], gm = [`fang`, `maw`, `skull`, `spine`, `claw`, `gut`, `hide`, `tooth`, `eye`, `heart`, `grin`, `thorn`], _m = [`the Defiler`, `the Hungry`, `the Wretched`, `the Gnawer`, `the Hollow`, `the Despised`, `the Butcher`, `the Unclean`];
function vm(e4) {
  return `${hm[Math.floor(e4() * hm.length)]}${gm[Math.floor(e4() * gm.length)]} ${_m[Math.floor(e4() * _m.length)]}`;
}
var ym = { x: 0, z: 0 };
function bm(e4, t2, n2) {
  let r2 = e4.hero, i2 = null, a2 = 1 / 0, o2 = !!r2 && (r2.ai.graceUntil ?? 0) > e4.time;
  for (let s2 of e4.unitsNear(t2.x, t2.z, n2)) {
    if (s2.dead || !e4.hostile(t2, s2) || s2.y > 1 || o2 && s2 === r2) continue;
    let n3 = rm(t2, s2);
    s2 === r2 && (n3 *= 0.75), n3 < a2 && (a2 = n3, i2 = s2);
  }
  return i2;
}
function xm(e4, t2, n2, r2, i2 = true) {
  if (t2.running = i2, rm(t2, n2) < 3 && e4.nav.walkLine(t2.x, t2.z, n2.x, n2.z, t2.radius * 0.6)) {
    t2.path = [{ x: n2.x, z: n2.z }];
    return;
  }
  if (n2 === e4.hero && e4.flow.direction(t2.x, t2.z, ym)) {
    t2.path = [{ x: t2.x + ym.x * 1.2, z: t2.z + ym.z * 1.2 }];
    return;
  }
  t2.ai.repath = (t2.ai.repath ?? 0) - r2, (t2.ai.repath <= 0 || t2.path.length === 0) && (t2.ai.repath = 0.6 + t2.id % 5 * 0.08, e4.pathTo(t2, n2.x, n2.z, 2500));
}
function Sm(e4, t2, n2, r2, i2, a2) {
  let o2 = rm(t2, n2);
  if (o2 < r2) {
    let r3 = t2.x - n2.x, i3 = t2.z - n2.z, a3 = Math.hypot(r3, i3) || 1, o3 = t2.x + r3 / a3 * 2.5, s2 = t2.z + i3 / a3 * 2.5;
    if (e4.nav.walkLine(t2.x, t2.z, o3, s2, t2.radius * 0.6)) return t2.path = [{ x: o3, z: s2 }], t2.running = true, true;
  } else if (o2 > i2 || !e4.los(t2, n2)) return xm(e4, t2, n2, a2), true;
  return false;
}
function Cm(e4, t2, n2) {
  if (t2.ai.wander = (t2.ai.wander ?? e4.rng.range(1, 6)) - n2, t2.ai.wander <= 0 && (t2.ai.wander = e4.rng.range(3, 8), e4.rng.chance(0.5))) {
    let n3 = e4.rng.range(0, Math.PI * 2), r2 = e4.rng.range(1, 3.5), i2 = e4.nav.nearestWalkable(t2.home.x + Math.cos(n3) * r2, t2.home.z + Math.sin(n3) * r2, 2);
    i2 && (t2.path = [i2], t2.running = false);
  }
}
function wm(e4, t2, n2, r2 = `m_melee`) {
  t2.facing = cm(n2.x - t2.x, n2.z - t2.z);
  let i2 = (t2.mdef?.attackTime ?? 0.8) * (t2.mods.includes(`extraFast`) ? 0.8 : 1) * (t2.st.chill > 0 ? 1.3 : 1);
  e4.startAction(t2, { kind: `attack`, skill: r2, duration: i2, fireAt: i2 * 0.55, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, e4.rng.chance(0.5) ? `attack1` : `attack2`), (t2.tier === `champion` || t2.tier === `unique`) && e4.events.emit(`fx`, { t: `telegraph`, x: n2.x, z: n2.z, radius: 0.9, duration: i2 * 0.55 });
}
function Tm(e4, t2, n2) {
  let r2 = t2.mdef;
  if (!r2 || t2.busy || t2.st.fear > 0) return;
  let i2 = e4.hero;
  if (!t2.aggro && i2 && !i2.dead && (i2.ai.graceUntil ?? 0) <= e4.time) {
    let n3 = rm(t2, i2), a3 = r2.aggro * (e4.def.kind === `dungeon` ? 0.85 : 1);
    n3 < a3 && (n3 < a3 * 0.45 || e4.los(t2, i2)) && (e4.alertPack(t2), r2.sounds.aggro && e4.rng.chance(0.6) && e4.events.emit(`sound`, { id: r2.sounds.aggro, x: t2.x, z: t2.z, volume: 0.7 }), t2.tier === `boss` && !e4.bossEngaged && (e4.bossEngaged = true, e4.events.emit(`bossEngaged`, t2)));
  }
  if (!t2.aggro) {
    Cm(e4, t2, n2);
    return;
  }
  if (t2.leash > 0 && Math.hypot(t2.x - t2.home.x, t2.z - t2.home.z) > t2.leash * 2.2 && i2 && rm(t2, i2) > 14) {
    t2.aggro = false, e4.pathTo(t2, t2.home.x, t2.home.z, 2e3);
    return;
  }
  let a2 = bm(e4, t2, 22);
  if (!a2) {
    Cm(e4, t2, n2);
    return;
  }
  switch (r2.ai) {
    case `boss_bloodwitch`:
      Dm(e4, t2, a2, n2);
      return;
    case `shaman`:
      if ((t2.cooldowns.get(`res`) ?? 0) <= 0) {
        let r3 = e4.corpsesNear(t2.x, t2.z, 11, (e5) => e5.mkind === `gutterkin` && e5.deathT > 1.2)[0];
        if (r3) {
          if (rm(t2, r3) > 4.5) {
            t2.ai.resPath = (t2.ai.resPath ?? 0) - n2, (t2.ai.resPath <= 0 || t2.path.length === 0) && (t2.ai.resPath = 0.5, t2.path = e4.nav.findPath(t2.x, t2.z, r3.x, r3.z, 1500) ?? []), t2.running = true;
            return;
          }
          t2.facing = cm(r3.x - t2.x, r3.z - t2.z), t2.cooldowns.set(`res`, 6), e4.startAction(t2, { kind: `channel`, skill: `m_resurrect`, duration: 1.25, fireAt: 1.15, target: null, tx: r3.x, tz: r3.z, level: t2.level, data: { corpse: r3.id } }, `channel`), t2.action.kind = `cast`, e4.events.emit(`fx`, { t: `telegraph`, x: r3.x, z: r3.z, radius: 0.9, duration: 1.15 });
          return;
        }
      }
      if (Sm(e4, t2, a2, 4, 8.5, n2)) return;
      (t2.cooldowns.get(`fire`) ?? 0) <= 0 && e4.los(t2, a2) ? (t2.cooldowns.set(`fire`, e4.rng.range(1.8, 2.8)), Em(e4, t2, a2)) : t2.path = [];
      return;
    case `ranged`:
    case `archer`: {
      let [i3, o2] = r2.ai === `archer` ? [5, 10] : [3.2, 7];
      if (Sm(e4, t2, a2, i3, o2, n2)) return;
      (t2.cooldowns.get(`shoot`) ?? 0) <= 0 && e4.los(t2, a2) ? (t2.cooldowns.set(`shoot`, e4.rng.range(r2.ai === `archer` ? 1.5 : 1.3, r2.ai === `archer` ? 2.4 : 2.1)), Em(e4, t2, a2)) : (t2.path = [], t2.facing = Zm(t2.facing, cm(a2.x - t2.x, a2.z - t2.z), 6 * n2));
      return;
    }
    default: {
      let i3 = r2.range + a2.radius + t2.radius * 0.5, o2 = rm(t2, a2);
      if (o2 <= i3) {
        t2.path = [], (t2.cooldowns.get(`atk`) ?? 0) <= 0 ? (t2.cooldowns.set(`atk`, r2.ai === `zombie` ? 0.8 : r2.ai === `fallen` ? 0.45 + e4.rng.next() * 0.5 : 0.3 + e4.rng.next() * 0.4), wm(e4, t2, a2)) : t2.facing = Zm(t2.facing, cm(a2.x - t2.x, a2.z - t2.z), 8 * n2);
        return;
      }
      xm(e4, t2, a2, n2, r2.ai !== `zombie` || o2 < 5);
    }
  }
}
function Em(e4, t2, n2) {
  t2.facing = cm(n2.x - t2.x, n2.z - t2.z);
  let r2 = (t2.mdef?.attackTime ?? 0.8) * (t2.mods.includes(`extraFast`) ? 0.8 : 1), i2 = t2.mkind === `gutterkinShaman` ? `cast` : `attack1`;
  e4.startAction(t2, { kind: `attack`, skill: `m_missile`, duration: r2, fireAt: r2 * 0.55, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, i2);
}
function Dm(e4, t2, n2, r2) {
  if (t2.bossPhase === 0 && t2.life < t2.lifeMax * 0.5) {
    t2.bossPhase = 1, t2.st.fear = 0, e4.events.emit(`bossPhase`, { unit: t2, phase: 1 }), e4.events.emit(`fx`, { t: `bloodMoon`, on: true }), e4.events.emit(`sound`, { id: `bossPhase`, x: t2.x, z: t2.z }), e4.events.emit(`shake`, 0.6), e4.startAction(t2, { kind: `cast`, skill: `b_raise`, duration: 1.6, fireAt: 1.1, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, `taunt`), t2.ai.invuln = e4.time + 1.2;
    return;
  }
  let i2 = rm(t2, n2), a2 = t2.bossPhase >= 1;
  if (t2.ai.next = (t2.ai.next ?? 0.8) - r2, i2 < 2.6 && (t2.cooldowns.get(`blink`) ?? 0) <= 0) {
    t2.cooldowns.set(`blink`, a2 ? 4 : 6), e4.startAction(t2, { kind: `cast`, skill: `b_blink`, duration: 0.5, fireAt: 0.3, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, `cast`);
    return;
  }
  if (Sm(e4, t2, n2, 5, 12, r2)) return;
  if (t2.ai.next > 0) {
    t2.path = [], t2.facing = Zm(t2.facing, cm(n2.x - t2.x, n2.z - t2.z), 6 * r2);
    return;
  }
  let o2 = [[`volley`, 4], [`fan`, 3], [`raise`, (t2.cooldowns.get(`raise`) ?? 0) > 0 || e4.raisedCount(t2) >= (a2 ? 5 : 3) ? 0 : 2], [`rain`, a2 && (t2.cooldowns.get(`rain`) ?? 0) <= 0 ? 3 : 0]], s2 = e4.rng.weighted(o2, (e5) => e5[1])[0];
  t2.facing = cm(n2.x - t2.x, n2.z - t2.z);
  let c2 = a2 ? 0.8 : 1;
  if (s2 === `volley`) e4.startAction(t2, { kind: `attack`, skill: `b_volley`, duration: 1.2 * c2, fireAt: 0.45 * c2, target: n2, tx: n2.x, tz: n2.z, level: t2.level, n: 0 }, `attack1`), t2.ai.next = (a2 ? 0.6 : 1) + e4.rng.next() * 0.5;
  else if (s2 === `fan`) {
    let r3 = 0.65 * c2, i3 = cm(n2.x - t2.x, n2.z - t2.z);
    e4.events.emit(`fx`, { t: `telegraph`, x: t2.x, z: t2.z, radius: 11, duration: r3, rot: i3, angle: 0.55 }), e4.events.emit(`sound`, { id: `bossTelegraph`, x: t2.x, z: t2.z }), e4.startAction(t2, { kind: `attack`, skill: `b_fan`, duration: r3 + 0.45, fireAt: r3, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, `special`), t2.ai.next = (a2 ? 0.9 : 1.4) + e4.rng.next() * 0.5;
  } else s2 === `raise` ? (t2.cooldowns.set(`raise`, a2 ? 9 : 13), e4.startAction(t2, { kind: `cast`, skill: `b_raise`, duration: 1.5, fireAt: 1, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, `channel`), t2.action.kind = `cast`, t2.ai.next = 1.2) : (t2.cooldowns.set(`rain`, 7), e4.startAction(t2, { kind: `cast`, skill: `b_rain`, duration: 1, fireAt: 0.5, target: n2, tx: n2.x, tz: n2.z, level: t2.level }, `castUp`), t2.ai.next = 1);
}
function Om(e4, t2, n2) {
  if (t2.busy) return;
  let r2 = t2.owner;
  if (!r2 || r2.dead) {
    t2.path = [];
    return;
  }
  let i2 = rm(t2, r2);
  if (i2 > 18) {
    let n3 = e4.nav.nearestWalkable(r2.x - Math.sin(r2.facing) * 1.5, r2.z - Math.cos(r2.facing) * 1.5, 3);
    n3 && t2.setPos(n3.x, n3.z);
    return;
  }
  let a2 = e4.nearestHostile(t2, 9) ?? (i2 < 10 ? e4.nearestHostile(r2, 8) : null);
  if (a2 && rm(a2, r2) < 14) {
    if (t2.allyKind === `skeletonMage` || t2.allyKind === `mercArcher`) {
      if (Sm(e4, t2, a2, 3.5, 10, n2)) return;
      if ((t2.cooldowns.get(`shoot`) ?? 0) <= 0 && e4.los(t2, a2)) {
        t2.cooldowns.set(`shoot`, t2.allyKind === `mercArcher` ? 0.9 : 1.1), t2.facing = cm(a2.x - t2.x, a2.z - t2.z);
        let n3 = t2.allyKind === `mercArcher` ? `a_arrow` : `a_bolt`, r4 = 0.6;
        e4.startAction(t2, { kind: `attack`, skill: n3, duration: r4, fireAt: r4 * 0.55, target: a2, tx: a2.x, tz: a2.z, level: t2.level }, t2.allyKind === `mercArcher` ? `attack1` : `cast`);
      } else t2.path = [];
      return;
    }
    let r3 = 1.4 + a2.radius + t2.radius * 0.5;
    if (rm(t2, a2) <= r3) {
      if (t2.path = [], (t2.cooldowns.get(`atk`) ?? 0) <= 0) {
        t2.cooldowns.set(`atk`, 0.3), t2.facing = cm(a2.x - t2.x, a2.z - t2.z);
        let n3 = t2.allyKind === `earthGolem` ? 0.95 : 0.65;
        e4.startAction(t2, { kind: `attack`, skill: `a_melee`, duration: n3, fireAt: n3 * 0.55, target: a2, tx: a2.x, tz: a2.z, level: t2.level }, e4.rng.chance(0.5) ? `attack1` : `attack2`);
      }
      return;
    }
    xm(e4, t2, a2, n2);
    return;
  }
  if (i2 > 3.2) {
    if (t2.running = i2 > 5, t2.ai.repath = (t2.ai.repath ?? 0) - n2, t2.ai.repath <= 0 || t2.path.length === 0) {
      t2.ai.repath = 0.4;
      let n3 = t2.id % 6 / 6, i3 = r2.facing + Math.PI + (n3 - 0.5) * 2.2;
      e4.pathTo(t2, r2.x + Math.sin(i3) * 2, r2.z + Math.cos(i3) * 2, 2e3);
    }
  } else t2.path.length && i2 < 2 && (t2.path = []);
}
function km(e4, t2, n2) {
  return t2 + e4.rng.next() * (n2 - t2);
}
function Am(e4, t2, n2, r2 = 0, i2 = 0) {
  let a2 = t2.d, o2 = qp(t2, n2);
  if (!a2) return o2;
  let s2 = a2.stats;
  return o2.phys = km(e4, a2.dmgMin, a2.dmgMax) * (1 + r2 / 100), s2.fireMax > 0 && (o2.fire = km(e4, s2.fireMin, s2.fireMax)), s2.coldMax > 0 && (o2.cold = km(e4, s2.coldMin, s2.coldMax), o2.coldLen = Math.max(1, s2.coldLen)), s2.lightMax > 0 && (o2.light = km(e4, s2.lightMin, s2.lightMax)), s2.magicMax > 0 && (o2.magic = km(e4, s2.magicMin, s2.magicMax)), s2.poisonDmg > 0 && (o2.poison = s2.poisonDmg, o2.poisonLen = Math.max(2, s2.poisonLen)), o2.isAttack = true, o2.ar = a2.ar * (1 + i2 / 100), o2.canBlock = true, o2.crit = s2.crit, o2.lifeSteal = s2.lifeSteal, o2.manaSteal = s2.manaSteal, o2.undeadDmg = s2.dmgUndead, o2.undeadAr = s2.arUndead, o2.vfx = o2.fire > o2.phys ? `fire` : o2.cold > o2.phys ? `cold` : o2.light > o2.phys ? `lightning` : `physical`, o2;
}
function jm(e4, t2, n2, r2) {
  let i2 = Cf[n2], a2 = qp(t2, n2);
  if (!i2.dmg || !t2.ch) return a2;
  let [o2, s2] = i2.dmg(r2), c2 = km(e4, o2, s2) * Cp(t2.ch, n2);
  switch (i2.element) {
    case `fire`:
      a2.fire = c2;
      break;
    case `cold`:
      a2.cold = c2, a2.coldLen = i2.duration ? i2.duration(r2) : 2;
      break;
    case `lightning`:
      a2.light = c2;
      break;
    case `poison`:
      a2.poison = c2, a2.poisonLen = 3;
      break;
    case `magic`:
      a2.magic = c2;
      break;
    default:
      a2.phys = c2;
  }
  return a2.vfx = i2.element, a2;
}
function Mm(e4, t2, n2 = 1) {
  let r2 = qp(t2, `m`), i2 = km(e4, t2.dmg[0], t2.dmg[1]) * n2, a2 = t2.element;
  return a2 === `physical` ? r2.phys = i2 : a2 === `fire` ? r2.fire = i2 : a2 === `cold` ? (r2.cold = i2, r2.coldLen = 2) : a2 === `lightning` ? r2.light = i2 : a2 === `poison` ? (r2.poison = i2 * 2.5, r2.poisonLen = 3) : r2.magic = i2, r2.isAttack = true, r2.ar = t2.ar, r2.canBlock = true, t2.mods.includes(`fireEnchanted`) && (r2.fire += i2 * 0.7), t2.mods.includes(`coldEnchanted`) && (r2.cold += i2 * 0.5, r2.coldLen = 2.5), r2.vfx = r2.fire > 0 && r2.phys === 0 ? `fire` : a2, r2;
}
function Nm(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2 = {}) {
  let d2 = Math.hypot(o2, s2) || 1, f2 = new Jp(t2, t2.faction, n2, r2);
  return f2.x = f2.px = i2 + o2 / d2 * 0.4, f2.z = f2.pz = a2 + s2 / d2 * 0.4, f2.y = f2.py = u2.y ?? t2.height * 0.55, f2.vx = o2 / d2 * c2, f2.vz = s2 / d2 * c2, f2.life = l2 / c2, f2.pierce = !!u2.pierce, f2.explode = u2.explode ?? 0, f2.radius = u2.radius ?? 0.35, f2.wander = u2.wander ?? 0, f2.emit = u2.emit ?? 0, e4.addMissile(f2), f2;
}
function Pm(e4, t2, n2, r2) {
  let i2 = t2.packet.vfx;
  e4.events.emit(`fx`, { t: `explode`, x: n2, z: r2, radius: t2.explode, element: i2 }), e4.events.emit(`sound`, { id: i2 === `fire` ? `fireballExplode` : i2 === `cold` ? `iceImpact` : `boneImpact`, x: n2, z: r2 });
  for (let i3 of e4.unitsNear(n2, r2, t2.explode)) i3.dead || !e4.hostile(t2.owner, i3) || e4.damage(i3, t2.packet);
  e4.events.emit(`shake`, 0.18);
}
function Fm(e4, t2, n2) {
  if (!t2.dead) {
    if (t2.px = t2.x, t2.pz = t2.z, t2.py = t2.y, t2.age += n2, t2.wander > 0) {
      let r2 = (e4.rng.next() - 0.5) * 2.6 * t2.wander * n2 * 6, i2 = Math.cos(r2), a2 = Math.sin(r2), o2 = t2.vx * i2 - t2.vz * a2, s2 = t2.vx * a2 + t2.vz * i2;
      t2.vx = o2, t2.vz = s2;
    }
    if (t2.x += t2.vx * n2, t2.z += t2.vz * n2, t2.y += t2.vy * n2, t2.emit > 0) for (t2.emitAcc += n2 * t2.emit; t2.emitAcc >= 1; ) {
      --t2.emitAcc;
      let n3 = t2.age * 9.1 + e4.rng.range(0, 0.5), r2 = { ...t2.packet, cold: t2.packet.cold * 0.5 };
      Nm(e4, t2.owner, `iceShard`, r2, t2.x, t2.z, Math.cos(n3), Math.sin(n3), 11, 5.5, { y: t2.y, radius: 0.25 });
    }
    if (e4.nav.blocksSight(Math.floor(t2.x), Math.floor(t2.z))) {
      t2.explode > 0 ? Pm(e4, t2, t2.px, t2.pz) : t2.visual !== `chargedBolt` && e4.events.emit(`fx`, { t: `hit`, x: t2.px, y: t2.y, z: t2.pz, element: t2.packet.vfx, strength: 0.5, blood: `#000000` }), t2.dead = true, t2.visual === `glacialOrb` && Im(e4, t2);
      return;
    }
    for (let n3 of e4.unitsNear(t2.x, t2.z, t2.radius + 0.3)) {
      if (n3.dead || t2.hit.has(n3.id) || !e4.hostile(t2.owner, n3) || n3.y > 1.2 || Math.hypot(n3.x - t2.x, n3.z - t2.z) > n3.radius + t2.radius) continue;
      if (t2.hit.add(n3.id), t2.explode > 0) {
        Pm(e4, t2, t2.x, t2.z), t2.dead = true;
        return;
      }
      e4.damage(n3, t2.packet), e4.events.emit(`fx`, { t: `hit`, x: n3.x, y: n3.height * 0.55, z: n3.z, element: t2.packet.vfx, strength: 0.7, blood: n3.mdef?.bloodColor ?? `#6d0a0a`, bone: !!n3.mdef?.undead });
      let r2 = t2.packet.vfx === `fire` ? `fireImpact` : t2.packet.vfx === `cold` ? `iceImpact` : t2.packet.vfx === `lightning` ? `zap` : t2.visual === `arrow` || t2.visual === `fireArrow` || t2.visual === `bloodArrow` ? `arrowImpact` : `boneImpact`;
      if (e4.events.emit(`sound`, { id: r2, x: n3.x, z: n3.z, volume: 0.7 }), !t2.pierce) {
        t2.dead = true, t2.visual === `glacialOrb` && Im(e4, t2);
        return;
      }
    }
    t2.age >= t2.life && (t2.dead = true, t2.visual === `glacialOrb` && Im(e4, t2), t2.visual === `fireball` && t2.explode > 0 && Pm(e4, t2, t2.x, t2.z));
  }
}
function Im(e4, t2) {
  for (let n2 = 0; n2 < 14; n2 += 1) {
    let r2 = n2 / 14 * Math.PI * 2;
    Nm(e4, t2.owner, `iceShard`, t2.packet, t2.x, t2.z, Math.cos(r2), Math.sin(r2), 12, 6, { y: t2.y, radius: 0.25 });
  }
  e4.events.emit(`fx`, { t: `nova`, x: t2.x, z: t2.z, radius: 2.5, element: `cold` }), e4.events.emit(`sound`, { id: `freezeShatter`, x: t2.x, z: t2.z, volume: 0.7 });
}
var Lm = 0.3;
function Rm(e4, t2, n2) {
  let r2 = t2.ch, i2 = t2.d;
  if (!r2 || !i2) return;
  let a2 = t2.manaMax / 70 * (1 + i2.stats.manaRegen / 100);
  t2.mana = Math.min(t2.manaMax, t2.mana + a2 * n2);
  let o2 = i2.stats.lifeRegen + i2.stats.repLife;
  o2 > 0 && (t2.life = Math.min(t2.lifeMax, t2.life + o2 * n2 * 0.5));
  for (let e5 of t2.potions) {
    let r3 = Math.min(n2, e5.t);
    e5.t -= n2, e5.kind === `hp` ? t2.life = Math.min(t2.lifeMax, t2.life + e5.perSec * r3) : t2.mana = Math.min(t2.manaMax, t2.mana + e5.perSec * r3);
  }
  t2.potions = t2.potions.filter((e5) => e5.t > 0);
  let s2 = t2.speed > 0.5, c2 = (t2.ai.exhausted ?? 0) > 0;
  s2 && t2.running && !e4.isTown ? (t2.stamina = Math.max(0, t2.stamina - 9 * n2), t2.stamina <= 0 && (t2.ai.exhausted = 1)) : t2.stamina = Math.min(t2.staminaMax, t2.stamina + (s2 ? 4 : 9) * n2 * (1 + (t2.ai.staminaBoost ?? 0))), c2 && t2.stamina > t2.staminaMax * 0.3 && (t2.ai.exhausted = 0), (t2.ai.staminaBoostT ?? 0) > 0 && (t2.ai.staminaBoostT -= n2, t2.ai.staminaBoostT <= 0 && (t2.ai.staminaBoost = 0)), t2.running = (t2.ai.runToggle ?? 1) > 0 && (e4.isTown || (t2.ai.exhausted ?? 0) === 0);
  let l2 = t2.cmd;
  if (!(!l2 || t2.busy)) switch (t2.ai.repath = (t2.ai.repath ?? 0) - n2, l2.type) {
    case `move`:
      (t2.ai.cmdFresh || l2.hold && t2.ai.repath <= 0) && (t2.ai.cmdFresh = 0, t2.ai.repath = 0.24, e4.pathTo(t2, l2.x, l2.z, 9e3)), !l2.hold && t2.path.length === 0 && (t2.cmd = null);
      break;
    case `attack`: {
      let n3 = l2.target;
      if (n3.dead || n3.removed) {
        t2.cmd = null, t2.path = [];
        break;
      }
      let r3 = l2.skill, a3 = (Cf[r3].kind === `leap` ? 10 : i2.reach) + n3.radius + t2.radius * 0.4;
      rm(t2, n3) <= a3 || l2.inPlace ? (t2.path = [], t2.facing = cm(n3.x - t2.x, n3.z - t2.z), zm(e4, t2, r3, n3, n3.x, n3.z) || r3 !== `attack` && zm(e4, t2, `attack`, n3, n3.x, n3.z), l2.hold || (t2.cmd = null)) : (t2.ai.repath <= 0 || t2.path.length === 0) && (t2.ai.repath = Lm, e4.pathTo(t2, n3.x, n3.z, 6e3));
      break;
    }
    case `cast`: {
      let n3 = Cf[l2.skill];
      if ((n3.kind === `melee` || n3.kind === `attack`) && l2.target) {
        t2.cmd = { type: `attack`, target: l2.target, hold: false, inPlace: false, skill: l2.skill }, Rm(e4, t2, 0);
        return;
      }
      t2.path = [], t2.facing = cm(l2.x - t2.x, l2.z - t2.z), zm(e4, t2, l2.skill, l2.target, l2.x, l2.z), t2.cmd = null;
      break;
    }
    case `pickup`: {
      let n3 = e4.items.find((e5) => e5.id === l2.itemId);
      if (!n3) {
        t2.cmd = null;
        break;
      }
      Math.hypot(n3.x - t2.x, n3.z - t2.z) <= 1.15 ? (t2.path = [], t2.ai.pickup = n3.id, t2.cmd = null) : (t2.ai.repath <= 0 || t2.path.length === 0) && (t2.ai.repath = Lm, e4.pathTo(t2, n3.x, n3.z));
      break;
    }
    case `interact`: {
      let n3 = e4.objects.find((e5) => e5.id === l2.objectId);
      if (!n3) {
        t2.cmd = null;
        break;
      }
      Math.hypot(n3.x - t2.x, n3.z - t2.z) <= n3.interactRange ? (t2.path = [], t2.ai.interact = n3.id, t2.cmd = null) : (t2.ai.repath <= 0 || t2.path.length === 0) && (t2.ai.repath = Lm, e4.pathTo(t2, n3.x, n3.z));
      break;
    }
    case `talk`: {
      let n3 = l2.npc;
      rm(t2, n3) <= 2.4 ? (t2.path = [], t2.facing = cm(n3.x - t2.x, n3.z - t2.z), n3.facing = cm(t2.x - n3.x, t2.z - n3.z), n3.play(`taunt`, 1.2), e4.events.emit(`talk`, n3), t2.cmd = null) : (t2.ai.repath <= 0 || t2.path.length === 0) && (t2.ai.repath = Lm, e4.pathTo(t2, n3.x, n3.z));
      break;
    }
  }
}
function zm(e4, t2, n2, r2, i2, a2) {
  let o2 = t2.ch, s2 = t2.d;
  if (!o2 || !s2) return false;
  let c2 = Cf[n2];
  if (c2.kind === `passive`) return false;
  let l2 = Sp(o2, s2, n2);
  if (l2 <= 0) return false;
  if (e4.isTown && n2 !== `attack` && c2.kind !== `teleport`) return e4.events.emit(`message`, { text: `You cannot use skills in town.`, color: `grey` }), e4.events.emit(`sound`, { id: `uiError` }), false;
  if (e4.isTown && n2 === `attack` || (t2.cooldowns.get(n2) ?? 0) > 0) return false;
  let u2 = c2.mana(l2);
  if (t2.mana < u2) return (t2.ai.noManaT ?? 0) < e4.time && (t2.ai.noManaT = e4.time + 1.2, e4.events.emit(`message`, { text: `Not enough mana`, color: `blue` }), e4.events.emit(`sound`, { id: `uiError`, volume: 0.5 })), false;
  if (c2.needsCorpse && !e4.corpsesNear(i2, a2, 4).length) return (t2.ai.noCorpseT ?? 0) < e4.time && (t2.ai.noCorpseT = e4.time + 1, e4.events.emit(`message`, { text: `No corpse nearby`, color: `grey` })), false;
  if (c2.kind === `teleport`) {
    let n3 = e4.nav.nearestWalkable(i2, a2, 3);
    if (!n3 || Math.hypot(n3.x - t2.x, n3.z - t2.z) > (c2.range ?? 18) + 1) return false;
  }
  t2.mana -= u2, t2.ai.graceUntil = 0;
  let d2 = c2.cooldown(l2);
  d2 > 0 && t2.cooldowns.set(n2, d2);
  let f2 = c2.kind === `attack` || c2.kind === `melee`, p2 = f2 ? n2 === `bash` ? `attack2` : e4.rng.chance(0.5) ? `attack1` : `attack2` : c2.anim, m2 = f2 ? s2.attackTime : s2.castTime;
  if (c2.kind === `leap` && (m2 = 0.75), (c2.kind === `shout` || c2.kind === `buff`) && (m2 = Math.max(m2, 0.62)), c2.kind === `whirlwind`) {
    let o3 = e4.nav.nearestWalkable(i2, a2, 3) ?? { x: i2, z: a2 };
    return e4.startAction(t2, { kind: `spin`, skill: n2, duration: 4, fireAt: 0, target: r2, tx: o3.x, tz: o3.z, level: l2, data: { hitT: 0 } }, `spin`), t2.running = true, t2.path = e4.nav.findPath(t2.x, t2.z, o3.x, o3.z, 3e3, true, 0.3)?.slice(0, 6) ?? [], t2.action.fired = true, e4.events.emit(`sound`, { id: `whirlwindLoop`, x: t2.x, z: t2.z }), e4.events.emit(`fx`, { t: `whirl`, unit: t2 }), true;
  }
  if (c2.kind === `leap`) {
    let o3 = c2.range ?? 10, s3 = i2, u3 = a2, d3 = Math.hypot(s3 - t2.x, u3 - t2.z);
    d3 > o3 && (s3 = t2.x + (s3 - t2.x) / d3 * o3, u3 = t2.z + (u3 - t2.z) / d3 * o3);
    let f3 = e4.nav.nearestWalkable(s3, u3, 3) ?? { x: t2.x, z: t2.z };
    return e4.startAction(t2, { kind: `leap`, skill: n2, duration: m2, fireAt: m2 * 0.92, target: r2, tx: f3.x, tz: f3.z, level: l2, data: { sx: t2.x, sz: t2.z } }, `leap`), e4.events.emit(`sound`, { id: `leap`, x: t2.x, z: t2.z }), true;
  }
  return e4.startAction(t2, { kind: f2 ? `attack` : `cast`, skill: n2, duration: m2, fireAt: m2 * e4.actionFraction(p2), target: r2, tx: i2, tz: a2, level: l2 }, p2), f2 ? e4.events.emit(`sound`, { id: s2.twoHanded ? `swingHeavy` : `swingLight`, x: t2.x, z: t2.z, volume: 0.7 }) : e4.events.emit(`fx`, { t: `cast`, unit: t2, element: c2.element }), true;
}
function Bm(e4, t2, n2, r2) {
  let i2 = n2.data ??= { hitT: 0 };
  if (i2.hitT -= r2, t2.facing += r2 * 16, i2.hitT <= 0) {
    i2.hitT = 0.24;
    let r3 = Cf[n2.skill], a2 = r3.radius?.(n2.level) ?? 2.4, o2 = false;
    for (let i3 of e4.unitsNear(t2.x, t2.z, a2)) {
      if (i3.dead || !e4.hostile(t2, i3)) continue;
      let a3 = Am(e4, t2, n2.skill, r3.weaponPct?.(n2.level) ?? 0);
      e4.damage(i3, a3) > 0 && (o2 = true, e4.events.emit(`fx`, { t: `hit`, x: i3.x, y: i3.height * 0.55, z: i3.z, element: a3.vfx, strength: 0.8, blood: i3.mdef?.bloodColor ?? `#6d0a0a`, bone: !!i3.mdef?.undead }));
    }
    o2 && e4.events.emit(`sound`, { id: `hitFlesh`, x: t2.x, z: t2.z, volume: 0.6 });
  }
  (t2.path.length === 0 || n2.t > 3.5) && (t2.action = null, t2.state = `idle`, t2.play(`idle`));
}
function Vm(e4, t2, n2) {
  let r2 = Math.min(1, n2.t / (n2.duration * 0.92)), i2 = n2.data?.sx ?? t2.x, a2 = n2.data?.sz ?? t2.z, o2 = r2 < 0.15 ? 0 : (r2 - 0.15) / 0.85;
  t2.x = i2 + (n2.tx - i2) * o2, t2.z = a2 + (n2.tz - a2) * o2, t2.y = Math.sin(o2 * Math.PI) * 2.2, t2.facing = cm(n2.tx - i2, n2.tz - a2), t2.speed = 0;
}
function Hm(e4, t2, n2) {
  t2.kind === `hero` ? Wm(e4, t2, n2) : qm(e4, t2, n2);
}
function Um(e4, t2, n2, r2, i2 = 0.9) {
  let a2 = (t2.d?.reach ?? t2.mdef?.range ?? 1.5) + i2, o2 = n2.target;
  if (!o2 || o2.dead || rm(t2, o2) > a2 + o2.radius) {
    let n3 = t2.x + Math.sin(t2.facing) * 1.1, r3 = t2.z + Math.cos(t2.facing) * 1.1;
    o2 = null;
    let i3 = 9;
    for (let a3 of e4.unitsNear(n3, r3, 1.2)) {
      if (a3.dead || !e4.hostile(t2, a3)) continue;
      let n4 = rm(t2, a3);
      n4 < i3 && (i3 = n4, o2 = a3);
    }
  }
  return o2 ? (e4.damage(o2, r2) > 0 && (e4.events.emit(`fx`, { t: `hit`, x: o2.x, y: o2.height * 0.55, z: o2.z, element: r2.vfx, strength: 1, blood: o2.mdef?.bloodColor ?? `#6d0a0a`, bone: !!o2.mdef?.undead }), e4.events.emit(`sound`, { id: o2.mdef?.undead ? `hitBone` : `hitFlesh`, x: o2.x, z: o2.z }), t2.kind === `hero` && e4.events.emit(`shake`, 0.12)), true) : false;
}
function Wm(e4, t2, n2) {
  let r2 = n2.skill, i2 = Cf[r2], a2 = t2.ch, o2 = n2.level, s2 = t2.x, c2 = t2.z, l2 = n2.tx - s2, u2 = n2.tz - c2;
  switch (i2.kind) {
    case `attack`:
      Um(e4, t2, n2, Am(e4, t2, `attack`));
      break;
    case `melee`: {
      let a3 = Am(e4, t2, r2, i2.weaponPct?.(o2) ?? 0, i2.arPct?.(o2) ?? 0);
      r2 === `bash` && (a3.knockback = 1.4, a3.phys += o2), Um(e4, t2, n2, a3) && (e4.events.emit(`sound`, { id: `bashImpact`, x: n2.target?.x ?? s2, z: n2.target?.z ?? c2 }), e4.events.emit(`hitstop`, 0.05));
      break;
    }
    case `missile`: {
      let n3 = jm(e4, t2, r2, o2);
      Nm(e4, t2, r2 === `fireBolt` ? `fireBolt` : r2 === `fireball` ? `fireball` : r2 === `iceBolt` ? `iceBolt` : `boneSpear`, n3, s2, c2, l2, u2, i2.speed ?? 14, i2.range ?? 18, { pierce: i2.pierce, explode: i2.radius ? i2.radius(o2) : 0, radius: r2 === `boneSpear` ? 0.45 : 0.35 }), e4.events.emit(`sound`, { id: i2.element === `fire` ? `fireCast` : i2.element === `cold` ? `coldCast` : `boneCast`, x: s2, z: c2 });
      break;
    }
    case `multiMissile`: {
      let n3 = i2.count?.(o2) ?? 3, a3 = Math.atan2(u2, l2);
      for (let l3 = 0; l3 < n3; l3 += 1) {
        let u3 = jm(e4, t2, r2, o2);
        if (r2 === `chargedBolt`) {
          let n4 = a3 + e4.rng.range(-0.9, 0.9);
          Nm(e4, t2, `chargedBolt`, u3, s2, c2, Math.cos(n4), Math.sin(n4), i2.speed ?? 9, i2.range ?? 9, { wander: 1, radius: 0.3, y: 0.7 });
        } else {
          let r3 = a3 + (l3 - (n3 - 1) / 2) * 0.11;
          Nm(e4, t2, `tooth`, u3, s2, c2, Math.cos(r3), Math.sin(r3), i2.speed ?? 14, i2.range ?? 14, { radius: 0.28 });
        }
      }
      e4.events.emit(`sound`, { id: r2 === `chargedBolt` ? `lightningCast` : `teethCast`, x: s2, z: c2 });
      break;
    }
    case `meteor`: {
      let a3 = i2.radius?.(o2) ?? 3, s3 = jm(e4, t2, r2, o2), c3 = 1.05;
      e4.events.emit(`fx`, { t: `meteorWarn`, x: n2.tx, z: n2.tz, radius: a3, delay: c3 }), e4.events.emit(`sound`, { id: `meteorIncoming`, x: n2.tx, z: n2.tz }), e4.schedule(c3, () => {
        e4.events.emit(`fx`, { t: `meteor`, x: n2.tx, z: n2.tz, radius: a3 }), e4.events.emit(`sound`, { id: `meteorImpact`, x: n2.tx, z: n2.tz }), e4.events.emit(`shake`, 0.55), e4.events.emit(`hitstop`, 0.06);
        for (let r4 of e4.unitsNear(n2.tx, n2.tz, a3)) !r4.dead && e4.hostile(t2, r4) && e4.damage(r4, s3);
        let r3 = i2.duration?.(o2) ?? 3, c4 = s3.fire * 0.18;
        e4.events.emit(`fx`, { t: `burnGround`, x: n2.tx, z: n2.tz, radius: a3 * 0.8, duration: r3 });
        for (let i3 = 1; i3 <= Math.floor(r3 / 0.5); i3 += 1) e4.schedule(i3 * 0.5, () => {
          for (let r4 of e4.unitsNear(n2.tx, n2.tz, a3 * 0.8)) r4.dead || !e4.hostile(t2, r4) || (r4.st.burnDps = r4.st.burn > 0 ? Math.max(r4.st.burnDps, c4) : c4, r4.st.burn = Math.max(r4.st.burn, 0.6), r4.lastHitBy = t2);
        });
      });
      break;
    }
    case `nova`: {
      let n3 = i2.radius?.(o2) ?? 6;
      e4.events.emit(`fx`, { t: `nova`, x: s2, z: c2, radius: n3, element: i2.element }), e4.events.emit(`sound`, { id: `frostNova`, x: s2, z: c2 });
      for (let i3 of e4.unitsNear(s2, c2, n3)) {
        if (i3.dead || !e4.hostile(t2, i3)) continue;
        let a3 = rm(t2, i3) / n3 * 0.25, s3 = jm(e4, t2, r2, o2);
        e4.schedule(a3, () => {
          i3.dead || e4.damage(i3, s3);
        });
      }
      break;
    }
    case `orb`:
      Nm(e4, t2, `glacialOrb`, jm(e4, t2, r2, o2), s2, c2, l2, u2, i2.speed ?? 6.5, i2.range ?? 13, { pierce: true, emit: 26, radius: 0.5 }), e4.events.emit(`sound`, { id: `orbLaunch`, x: s2, z: c2 });
      break;
    case `chain`: {
      let a3 = i2.count?.(o2) ?? 3, d2 = { x: s2, y: 1.3, z: c2 }, f2 = n2.target && !n2.target.dead ? n2.target : null;
      if (!f2) {
        let r3 = 3.5;
        for (let i3 of e4.unitsNear(n2.tx, n2.tz, 3.5)) {
          if (i3.dead || !e4.hostile(t2, i3)) continue;
          let a4 = Math.hypot(i3.x - n2.tx, i3.z - n2.tz);
          a4 < r3 && (r3 = a4, f2 = i3);
        }
      }
      let p2 = [d2], m2 = /* @__PURE__ */ new Set();
      if (!f2) {
        let e5 = Math.hypot(l2, u2) || 1, t3 = Math.min(i2.range ?? 15, e5);
        p2.push({ x: s2 + l2 / e5 * t3, y: 1, z: c2 + u2 / e5 * t3 });
      }
      for (let n3 = 0; n3 < a3 + 1 && f2; n3 += 1) {
        m2.add(f2.id);
        let n4 = f2;
        p2.push({ x: n4.x, y: n4.height * 0.6, z: n4.z });
        let i3 = jm(e4, t2, r2, o2);
        e4.damage(n4, i3), e4.events.emit(`fx`, { t: `hit`, x: n4.x, y: n4.height * 0.6, z: n4.z, element: `lightning`, strength: 0.8, blood: `#000` }), d2 = { x: n4.x, y: n4.height * 0.6, z: n4.z };
        let a4 = null, s3 = 7;
        for (let r3 of e4.unitsNear(n4.x, n4.z, 7)) {
          if (r3.dead || m2.has(r3.id) || !e4.hostile(t2, r3)) continue;
          let i4 = rm(r3, n4);
          i4 < s3 && e4.los(n4, r3) && (s3 = i4, a4 = r3);
        }
        f2 = a4;
      }
      e4.events.emit(`fx`, { t: `lightning`, pts: p2, color: `#bcd0ff` }), e4.events.emit(`sound`, { id: `chainLightning`, x: s2, z: c2 });
      break;
    }
    case `teleport`: {
      let r3 = e4.nav.nearestWalkable(n2.tx, n2.tz, 3);
      if (!r3) break;
      e4.events.emit(`fx`, { t: `teleport`, x0: t2.x, z0: t2.z, x1: r3.x, z1: r3.z, color: `#7fb4ff` }), e4.events.emit(`sound`, { id: `teleport`, x: r3.x, z: r3.z }), t2.setPos(r3.x, r3.z), t2.path = [];
      break;
    }
    case `shout`: {
      let n3 = i2.radius?.(o2) ?? 6;
      e4.events.emit(`fx`, { t: `shout`, x: s2, z: c2, radius: n3, color: r2 === `howl` ? `#c9b48a` : `#ffb15a` }), e4.events.emit(`sound`, { id: r2 === `howl` ? `howl` : `warCry`, x: s2, z: c2 }), e4.events.emit(`shake`, 0.3);
      for (let a3 of e4.unitsNear(s2, c2, n3)) if (!(a3.dead || !e4.hostile(t2, a3))) if (r2 === `howl`) {
        if (a3.tier === `boss`) continue;
        a3.st.fear = i2.duration?.(o2) ?? 3, a3.st.fearFrom = { x: s2, z: c2 }, a3.action = null;
      } else {
        let n4 = jm(e4, t2, r2, o2);
        n4.phys = n4.phys || (i2.dmg ? km(e4, i2.dmg(o2)[0], i2.dmg(o2)[1]) : 10), n4.stun = a3.tier === `boss` ? 0 : i2.duration?.(o2) ?? 1, e4.damage(a3, n4);
      }
      break;
    }
    case `buff`: {
      let n3 = i2.weaponPct?.(o2) ?? 35, r3 = i2.duration?.(o2) ?? 30;
      for (let i3 of [t2, ...e4.units.filter((e5) => e5.owner === t2 && !e5.dead)]) i3.st.roar = r3, i3.st.roarPct = n3, e4.events.emit(`fx`, { t: `buff`, unit: i3, color: `#ffd27a` });
      e4.events.emit(`sound`, { id: `roarBuff`, x: s2, z: c2 }), t2.ai.refreshDerived = 1;
      break;
    }
    case `summon`:
      Gm(e4, t2, r2, o2, n2.tx, n2.tz);
      break;
    case `corpseExplosion`: {
      let s3 = e4.corpsesNear(n2.tx, n2.tz, 4)[0];
      if (!s3) break;
      s3.corpseUsed = true;
      let c3 = i2.radius?.(o2) ?? 3, l3 = s3.lifeMax * km(e4, 0.6, 1) * Cp(a2, r2);
      e4.events.emit(`fx`, { t: `corpseExplode`, x: s3.x, z: s3.z, radius: c3 }), e4.events.emit(`sound`, { id: `corpseExplode`, x: s3.x, z: s3.z }), e4.events.emit(`shake`, 0.35);
      for (let n3 of e4.unitsNear(s3.x, s3.z, c3)) {
        if (n3.dead || !e4.hostile(t2, n3)) continue;
        let i3 = qp(t2, r2);
        i3.fire = l3 * 0.5, i3.phys = l3 * 0.5, i3.vfx = `fire`, e4.damage(n3, i3);
      }
      break;
    }
    case `curse`: {
      let a3 = i2.radius?.(o2) ?? 3, s3 = i2.duration?.(o2) ?? 8, c3 = r2 === `amplifyDamage` ? `#ff3b3b` : r2 === `terror` ? `#b48cff` : `#ff4f8a`;
      e4.events.emit(`fx`, { t: `curse`, x: n2.tx, z: n2.tz, radius: a3, color: c3 }), e4.events.emit(`sound`, { id: r2 === `terror` ? `terror` : `curse`, x: n2.tx, z: n2.tz });
      for (let i3 of e4.unitsNear(n2.tx, n2.tz, a3)) i3.dead || !e4.hostile(t2, i3) || (r2 === `amplifyDamage` ? i3.st.amp = s3 : r2 === `lifeTap` ? i3.st.lifeTap = s3 : i3.tier !== `boss` && (i3.st.fear = s3, i3.st.fearFrom = { x: t2.x, z: t2.z }, i3.action = null), i3.aggro || e4.alertPack(i3));
      break;
    }
    case `leap`: {
      t2.y = 0;
      let n3 = i2.radius?.(o2) ?? 2, a3 = Am(e4, t2, r2, i2.weaponPct?.(o2) ?? 100);
      a3.isAttack = false, a3.knockback = 0.8, e4.events.emit(`fx`, { t: `leapLand`, x: t2.x, z: t2.z, radius: n3 }), e4.events.emit(`sound`, { id: `leapLand`, x: t2.x, z: t2.z }), e4.events.emit(`shake`, 0.4), e4.events.emit(`hitstop`, 0.05);
      for (let r3 of e4.unitsNear(t2.x, t2.z, n3)) r3.dead || !e4.hostile(t2, r3) || e4.damage(r3, { ...a3, phys: km(e4, t2.d.dmgMin, t2.d.dmgMax) * (1 + (i2.weaponPct?.(o2) ?? 100) / 100) });
      break;
    }
    default:
      break;
  }
}
function Gm(e4, t2, n2, r2, i2, a2) {
  let o2 = Cf[n2], s2 = i2, c2 = a2;
  if (o2.needsCorpse) {
    let t3 = e4.corpsesNear(i2, a2, 4)[0];
    if (!t3) return;
    t3.corpseUsed = true, s2 = t3.x, c2 = t3.z;
  } else {
    let n3 = e4.nav.nearestWalkable(i2, a2, 4);
    n3 && Math.hypot(n3.x - t2.x, n3.z - t2.z) < 12 ? (s2 = n3.x, c2 = n3.z) : (s2 = t2.x + Math.sin(t2.facing) * 1.5, c2 = t2.z + Math.cos(t2.facing) * 1.5);
  }
  let l2 = n2 === `raiseSkeleton` ? `skeletonWarrior` : n2 === `skeletalMage` ? `skeletonMage` : `earthGolem`, u2 = o2.count?.(r2) ?? 1, d2 = e4.units.filter((e5) => e5.owner === t2 && e5.summonSkill === n2 && !e5.dead);
  for (; d2.length >= u2; ) {
    let t3 = d2.shift();
    e4.kill(t3, null, `magic`);
  }
  let f2 = Km(e4, t2, l2, r2, s2, c2);
  f2.summonSkill = n2, e4.addUnit(f2), f2.play(`resurrect`, 1), f2.state = `hit`, f2.stateT = 0.9, e4.events.emit(`fx`, { t: `summon`, x: s2, z: c2, color: l2 === `earthGolem` ? `#c9a46a` : `#9fffd8` }), e4.events.emit(`sound`, { id: l2 === `earthGolem` ? `golemSummon` : `summonRise`, x: s2, z: c2 });
}
function Km(e4, t2, n2, r2, i2, a2) {
  let o2 = new Gp(`ally`, `player`);
  o2.allyKind = n2, o2.owner = t2, o2.setPos(i2, a2), o2.facing = t2.facing, o2.level = t2.level;
  let s2 = r2;
  return n2 === `skeletonWarrior` ? (o2.name = `Skeleton`, o2.lifeMax = 21 + 7 * s2 + t2.level * 2, o2.dmg = [2 + s2, 4 + Math.round(s2 * 1.6)], o2.ar = 40 + 20 * s2, o2.def = 15 + 10 * s2, o2.walk = 3.4, o2.runSpd = 6.2, o2.radius = 0.4) : n2 === `skeletonMage` ? (o2.name = `Skeletal Mage`, o2.lifeMax = 16 + 5 * s2 + t2.level * 2, o2.dmg = [3 + s2, 6 + Math.round(s2 * 2)], o2.ar = 60, o2.def = 8, o2.walk = 3.2, o2.runSpd = 5.8, o2.radius = 0.4, o2.element = [`fire`, `cold`, `lightning`, `poison`][Math.floor(e4.rng.next() * 4)]) : n2 === `earthGolem` ? (o2.name = `Earthen Golem`, o2.lifeMax = 80 + 45 * s2 + t2.level * 4, o2.dmg = [3 + 2 * s2, 8 + 3 * s2], o2.ar = 50 + 25 * s2, o2.def = 30 + 15 * s2, o2.walk = 2.8, o2.runSpd = 4.6, o2.radius = 0.7, o2.height = 2.4) : (o2.name = `Sister Ilsa`, o2.lifeMax = 60 + 12 * t2.level, o2.dmg = [3 + t2.level, 6 + Math.round(t2.level * 1.8)], o2.ar = 50 + 14 * t2.level, o2.def = 20 + 6 * t2.level, o2.walk = 3.6, o2.runSpd = 6.6, o2.radius = 0.42), o2.life = o2.lifeMax, o2;
}
function qm(e4, t2, n2) {
  let r2 = n2.target;
  switch (n2.skill) {
    case `m_melee`: {
      let i2 = Mm(e4, t2);
      t2.mods.includes(`cursed`) && r2 && r2.kind === `hero` && (r2.st.amp = 3), Um(e4, t2, n2, i2, 0.7);
      break;
    }
    case `m_missile`: {
      let i2 = t2.mdef;
      if (!i2?.missile) break;
      let a2 = Mm(e4, t2);
      a2.isAttack = i2.missile.kind !== `firebolt`, a2.canBlock = i2.missile.kind !== `firebolt`, i2.missile.kind === `firebolt` && (a2.phys = 0, a2.fire = km(e4, t2.dmg[0], t2.dmg[1]) * 1.1, a2.vfx = `fire`);
      let o2 = i2.missile.kind === `quill` ? `quill` : i2.missile.kind === `firebolt` ? `shamanFire` : `arrow`, s2 = r2 ? r2.x + (r2.x - r2.px) * 3 : n2.tx, c2 = r2 ? r2.z + (r2.z - r2.pz) * 3 : n2.tz, l2 = i2.missile.kind === `quill` ? 2 : 1;
      for (let n3 = 0; n3 < l2; n3 += 1) {
        let r3 = Math.atan2(c2 - t2.z, s2 - t2.x) + (l2 > 1 ? (n3 - 0.5) * 0.12 : 0);
        Nm(e4, t2, o2, a2, t2.x, t2.z, Math.cos(r3), Math.sin(r3), i2.missile.speed, i2.range + 3, { y: t2.height * 0.6, radius: 0.28 });
      }
      i2.sounds.attack && e4.events.emit(`sound`, { id: i2.sounds.attack, x: t2.x, z: t2.z, volume: 0.7 });
      break;
    }
    case `m_resurrect`: {
      let t3 = e4.units.find((e5) => e5.id === (n2.data?.corpse ?? -1));
      if (!t3 || !t3.dead || t3.corpseUsed || t3.removed) break;
      t3.dead = false, t3.corpse = false, t3.life = t3.lifeMax, t3.state = `hit`, t3.stateT = 1.1, t3.st.fear = 0, t3.aggro = true, t3.play(`resurrect`, 1.1), e4.events.emit(`fx`, { t: `resurrect`, unit: t3 }), e4.events.emit(`sound`, { id: `shamanResurrect`, x: t3.x, z: t3.z }), e4.countEnemies();
      break;
    }
    case `a_melee`: {
      let i2 = Mm(e4, t2);
      i2.ar = t2.ar, t2.allyKind === `earthGolem` && r2 && (r2.st.slow = Math.max(r2.st.slow, 2.5)), Um(e4, t2, n2, i2, 0.8);
      break;
    }
    case `a_bolt`: {
      let r3 = qp(t2, `mage`), i2 = km(e4, t2.dmg[0], t2.dmg[1]), a2 = t2.element;
      a2 === `fire` ? r3.fire = i2 : a2 === `cold` ? (r3.cold = i2, r3.coldLen = 2) : a2 === `lightning` ? r3.light = i2 * 1.2 : (r3.poison = i2 * 3, r3.poisonLen = 3), r3.vfx = a2, Nm(e4, t2, `mageBolt`, r3, t2.x, t2.z, n2.tx - t2.x, n2.tz - t2.z, 12, 12, { y: 1.3 });
      break;
    }
    case `a_arrow`:
      Nm(e4, t2, `arrow`, Mm(e4, t2), t2.x, t2.z, n2.tx - t2.x, n2.tz - t2.z, 18, 14, { y: 1.3 }), e4.events.emit(`sound`, { id: `arrowShoot`, x: t2.x, z: t2.z, volume: 0.6 });
      break;
    case `b_volley`: {
      let i2 = (n2.n ?? 0) + 1;
      n2.n = i2;
      let a2 = Mm(e4, t2, 0.9);
      a2.phys = 0, a2.fire = km(e4, t2.dmg[0], t2.dmg[1]) * 0.85, a2.vfx = `fire`, a2.isAttack = false;
      let o2 = r2 ? r2.x + (r2.x - r2.px) * 2 : n2.tx, s2 = r2 ? r2.z + (r2.z - r2.pz) * 2 : n2.tz;
      Nm(e4, t2, `bloodArrow`, a2, t2.x, t2.z, o2 - t2.x, s2 - t2.z, 19, 16, { y: 1.5, radius: 0.32 }), e4.events.emit(`sound`, { id: `arrowShoot`, x: t2.x, z: t2.z }), i2 < 3 && (n2.fired = false, n2.fireAt += 0.22);
      break;
    }
    case `b_fan`: {
      let r3 = Mm(e4, t2, 0.85);
      r3.phys = 0, r3.fire = km(e4, t2.dmg[0], t2.dmg[1]), r3.vfx = `fire`, r3.isAttack = false;
      let i2 = Math.atan2(n2.tz - t2.z, n2.tx - t2.x), a2 = t2.bossPhase >= 1 ? 9 : 7;
      for (let n3 = 0; n3 < a2; n3 += 1) {
        let o2 = i2 + (n3 - (a2 - 1) / 2) * 0.13;
        Nm(e4, t2, `bloodArrow`, r3, t2.x, t2.z, Math.cos(o2), Math.sin(o2), 17, 15, { y: 1.5, radius: 0.32 });
      }
      e4.events.emit(`sound`, { id: `arrowShoot`, x: t2.x, z: t2.z, pitch: 0.8 });
      break;
    }
    case `b_raise`: {
      let n3 = t2.bossPhase >= 1 ? 6 : 4, r3 = Math.min(t2.bossPhase >= 1 ? 4 : 3, n3 - e4.raisedCount(t2));
      for (let n4 = 0; n4 < r3; n4 += 1) {
        let i2 = n4 / r3 * Math.PI * 2 + e4.rng.range(0, 1), a2 = e4.nav.nearestWalkable(t2.x + Math.cos(i2) * 4, t2.z + Math.sin(i2) * 4, 3);
        a2 && (e4.events.emit(`fx`, { t: `summon`, x: a2.x, z: a2.z, color: `#8aff6a` }), e4.schedule(0.5 + n4 * 0.15, () => {
          if (t2.dead) return;
          let n5 = e4.spawnMonster(e4.rng.chance(0.5) ? `rotwalker` : `bonewretch`, a2.x, a2.z, `normal`);
          n5.raisedBy = t2.id, n5.noLoot = true, n5.home = { ...t2.home }, n5.leash = 12, n5.aggro = true, n5.play(`resurrect`, 1.1), n5.state = `hit`, n5.stateT = 1.1, e4.countEnemies();
        }));
      }
      e4.events.emit(`sound`, { id: `summonRise`, x: t2.x, z: t2.z });
      break;
    }
    case `b_rain`: {
      let n3 = e4.hero;
      if (!n3) break;
      for (let r3 = 0; r3 < 6; r3 += 1) {
        let i2 = e4.rng.range(0, Math.PI * 2), a2 = r3 === 0 ? 0 : e4.rng.range(1.5, 4.5), o2 = n3.x + Math.cos(i2) * a2, s2 = n3.z + Math.sin(i2) * a2, c2 = 1.6, l2 = 1.1 + r3 * 0.12;
        e4.events.emit(`fx`, { t: `telegraph`, x: o2, z: s2, radius: c2, duration: l2 }), e4.schedule(l2, () => {
          e4.events.emit(`fx`, { t: `explode`, x: o2, z: s2, radius: c2, element: `fire` }), e4.events.emit(`sound`, { id: `fireImpact`, x: o2, z: s2, volume: 0.8 });
          for (let n4 of e4.unitsNear(o2, s2, c2)) {
            if (n4.dead || !e4.hostile(t2, n4)) continue;
            let r4 = qp(t2, `rain`);
            r4.fire = km(e4, t2.dmg[0], t2.dmg[1]) * 1.1, r4.vfx = `fire`, e4.damage(n4, r4);
          }
        });
      }
      break;
    }
    case `b_blink`: {
      let n3 = e4.hero;
      if (!n3) break;
      for (let r3 = 0; r3 < 12; r3 += 1) {
        let r4 = e4.rng.range(0, Math.PI * 2), i2 = e4.rng.range(7, 10), a2 = e4.nav.nearestWalkable(n3.x + Math.cos(r4) * i2, n3.z + Math.sin(r4) * i2, 2);
        if (!a2) continue;
        let o2 = e4.layout.regions.gravewatch;
        if (!(o2 && Math.hypot(a2.x - o2.x, a2.z - o2.z) > o2.r)) {
          e4.events.emit(`fx`, { t: `teleport`, x0: t2.x, z0: t2.z, x1: a2.x, z1: a2.z, color: `#ff3030` }), e4.events.emit(`sound`, { id: `teleport`, x: a2.x, z: a2.z, pitch: 0.7 }), t2.setPos(a2.x, a2.z);
          break;
        }
      }
      break;
    }
    default:
      break;
  }
}
Ld();

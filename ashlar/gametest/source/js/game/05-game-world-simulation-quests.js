// ===== game part 05-game-world-simulation-quests (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var Jm = { normal: { life: 1, dmg: 1, xp: 1 }, nightmare: { life: 2.4, dmg: 1.9, xp: 2.2 }, hell: { life: 4.5, dmg: 3.2, xp: 4 } }, Ym = class {
  def;
  layout;
  diff;
  events = new Dp();
  nav;
  flow;
  rng;
  units = [];
  missiles = [];
  items = [];
  objects = [];
  time = 0;
  hero = null;
  mlvl;
  sched = [];
  flowTimer = 0;
  bucket = /* @__PURE__ */ new Map();
  enemiesAlive = 0;
  boss = null;
  bossEngaged = false;
  isTown;
  constructor(e4, t2, n2, r2) {
    this.def = e4, this.layout = t2, this.diff = n2, this.nav = t2.nav, this.flow = new Vd(t2.nav), this.rng = new Id(r2 ^ 30634), this.mlvl = e4.level[n2], this.isTown = e4.kind === `town`;
    for (let e5 of t2.objects) {
      let t3 = new Qp(e5.kind, e5.x, e5.z, e5.rot);
      t3.to = e5.to, t3.entry = e5.entry, t3.label = e5.label ?? ``, t3.tier = e5.tier ?? 0, this.objects.push(t3);
    }
    for (let e5 of t2.npcs) {
      let t3 = new Gp(`npc`, `neutral`);
      t3.npcKind = e5.kind, t3.setPos(e5.x, e5.z), t3.facing = e5.rot, t3.pfacing = e5.rot, t3.home = { x: e5.x, z: e5.z }, t3.leash = e5.wander, t3.radius = 0.45, t3.life = t3.lifeMax = 100, t3.walk = 1.4, t3.name = { healer: `Mother Isolde`, smith: `Torvan`, sage: `Old Aldric`, captain: `Captain Maera` }[e5.kind], t3.play(`townIdle`), this.units.push(t3);
    }
    for (let e5 of t2.spawns) this.spawnGroup(e5);
    this.countEnemies();
  }
  heightAt(e4, t2) {
    return um(this.layout, e4, t2);
  }
  spawnGroup(e4) {
    let t2 = this.rng;
    if (e4.tier === `boss`) {
      let t3 = this.spawnMonster(e4.kinds[0], e4.x, e4.z, `boss`);
      e4.uniqueName && (t3.name = e4.uniqueName), this.boss = t3;
      return;
    }
    let n2 = null, r2 = [], i2 = ``;
    if (e4.tier === `unique`) {
      let n3 = [`extraStrong`, `extraFast`, `fireEnchanted`, `coldEnchanted`, `lightningEnchanted`, `stoneSkin`, `cursed`, `mightAura`], a3 = 1 + (this.diff === `nightmare` ? 1 : this.diff === `hell` ? 2 : 0) + +!!t2.chance(0.35);
      r2 = t2.shuffle([...n3]).slice(0, a3), i2 = e4.uniqueName ?? vm(() => t2.next()), i2 === `Gorefather` && (r2 = [`fireEnchanted`, `extraStrong`]);
    }
    let a2 = e4.tier === `champion` ? t2.pick(mm) : ``;
    for (let o2 = 0; o2 < e4.count; o2 += 1) {
      let s2 = e4.kinds[o2 % e4.kinds.length], c2 = o2 / e4.count * Math.PI * 2 + t2.range(0, 0.6), l2 = o2 === 0 ? 0 : e4.radius * t2.range(0.4, 1), u2 = e4.x + Math.cos(c2) * l2, d2 = e4.z + Math.sin(c2) * l2, f2 = this.nav.nearestWalkable(u2, d2, 4);
      if (!f2) continue;
      u2 = f2.x, d2 = f2.z;
      let p2 = `normal`;
      e4.tier === `champion` && (p2 = `champion`), e4.tier === `unique` && (p2 = o2 === 0 ? `unique` : `minion`);
      let m2 = this.spawnMonster(s2, u2, d2, p2);
      e4.leash && (m2.leash = e4.leash), p2 === `unique` ? (m2.name = i2, m2.mods = r2, n2 = m2, this.applyMods(m2)) : p2 === `minion` && n2 ? (m2.leaderId = n2.id, n2.minions.push(m2.id)) : p2 === `champion` && (m2.name = `${a2} ${m2.name}`);
    }
  }
  spawnMonster(e4, t2, n2, r2) {
    let i2 = fm[e4], a2 = new Gp(`monster`, `enemy`);
    a2.mdef = i2, a2.mkind = e4, a2.tier = r2, a2.name = i2.name, a2.setPos(t2, n2), a2.home = { x: t2, z: n2 }, a2.facing = this.rng.range(0, Math.PI * 2), a2.pfacing = a2.facing;
    let o2 = this.mlvl + (r2 === `unique` || r2 === `champion` ? 2 : r2 === `boss` ? 3 : 0);
    a2.level = o2;
    let s2 = Jm[this.diff], c2 = this.rng.range(i2.life[0], i2.life[1]) + i2.lifePerLvl * (o2 - 1);
    r2 === `champion` && (c2 *= 3), r2 === `unique` && (c2 *= 4), r2 === `minion` && (c2 *= 1.6), c2 *= s2.life, a2.lifeMax = Math.round(c2), a2.life = a2.lifeMax;
    let l2 = (r2 === `champion` ? 1.9 : r2 === `unique` || r2 === `minion` ? 1.6 : 1) * s2.dmg;
    a2.dmg = [Math.max(1, Math.round((i2.dmg[0] + i2.dmgPerLvl * (o2 - 1)) * l2)), Math.max(2, Math.round((i2.dmg[1] + i2.dmgPerLvl * (o2 - 1)) * l2))], a2.ar = Math.round((i2.ar + i2.arPerLvl * (o2 - 1)) * (r2 === `normal` ? 1 : 1.3)), a2.def = Math.round(i2.def + i2.defPerLvl * (o2 - 1)), a2.walk = i2.walk, a2.runSpd = i2.run, r2 === `champion` && (a2.walk *= 1.25, a2.runSpd *= 1.25), a2.radius = i2.radius, a2.element = i2.element;
    for (let [e5, t3] of Object.entries(i2.res)) a2.res[e5] = t3;
    if (this.diff === `hell`) for (let e5 of [`fire`, `cold`, `lightning`, `poison`]) a2.res[e5] += 20;
    return a2.xp = Math.round((i2.xp + i2.xpPerLvl * (o2 - 1)) * s2.xp * (r2 === `champion` ? 3 : r2 === `unique` ? 5 : r2 === `minion` ? 1.6 : 1)), a2.height = e4 === `spinehog` ? 0.9 : e4 === `gutterkin` ? 1.05 : e4 === `gutterkinShaman` ? 1.2 : e4 === `weepingQueen` ? 4.5 : e4 === `bloodwitch` ? 2.3 : 1.9, a2.play(`idle`), this.units.push(a2), this.events.emit(`unitAdded`, a2), a2;
  }
  applyMods(e4) {
    for (let t2 of e4.mods) t2 === `extraStrong` && (e4.dmg = [Math.round(e4.dmg[0] * 1.6), Math.round(e4.dmg[1] * 1.6)]), t2 === `extraFast` && (e4.walk *= 1.45, e4.runSpd *= 1.45), t2 === `stoneSkin` && (e4.def *= 2.5, e4.res.physical = 50), t2 === `fireEnchanted` && (e4.res.fire = Math.max(e4.res.fire, 75)), t2 === `coldEnchanted` && (e4.res.cold = Math.max(e4.res.cold, 75)), t2 === `lightningEnchanted` && (e4.res.lightning = Math.max(e4.res.lightning, 75));
  }
  modsText(e4) {
    return e4.tier === `unique` || e4.tier === `boss` ? e4.mods.map((e5) => pm[e5]).join(`, `) : ``;
  }
  calmMonsters(e4 = false) {
    for (let t2 of this.units) if (!(t2.kind !== `monster` || t2.dead)) {
      if (t2.raisedBy) {
        this.crumble(t2);
        continue;
      }
      e4 && t2.tier === `boss` && (t2.life = Math.min(t2.lifeMax, t2.life + t2.lifeMax * 0.2)), t2.aggro && (t2.aggro = false, t2.st.fear = 0, t2.action = null, t2.tier === `boss` && (this.bossEngaged = false, t2.bossPhase > 0 && (t2.bossPhase = 0, this.events.emit(`fx`, { t: `bloodMoon`, on: false }))), this.pathTo(t2, t2.home.x, t2.home.z, 2500));
    }
  }
  crumble(e4) {
    e4.dead || (e4.ai.crumble = 1, e4.noLoot = true, this.kill(e4, null, `physical`));
  }
  raisedCount(e4) {
    let t2 = 0;
    for (let n2 of this.units) n2.raisedBy === e4.id && !n2.dead && (t2 += 1);
    return t2;
  }
  addUnit(e4) {
    this.units.push(e4), this.events.emit(`unitAdded`, e4);
  }
  countEnemies() {
    let e4 = 0;
    for (let t2 of this.units) t2.faction === `enemy` && !t2.dead && (e4 += 1);
    return this.enemiesAlive = e4, e4;
  }
  schedule(e4, t2) {
    this.sched.push({ at: this.time + e4, fn: t2 });
  }
  rebuildBuckets() {
    this.bucket.clear();
    for (let e4 of this.units) {
      if (e4.dead || e4.removed) continue;
      let t2 = Math.floor(e4.x / 4) & 65535 | (Math.floor(e4.z / 4) & 65535) << 16, n2 = this.bucket.get(t2);
      n2 || (n2 = [], this.bucket.set(t2, n2)), n2.push(e4);
    }
  }
  unitsNear(e4, t2, n2, r2 = []) {
    r2.length = 0;
    let i2 = Math.floor((e4 - n2) / 4), a2 = Math.floor((e4 + n2) / 4), o2 = Math.floor((t2 - n2) / 4), s2 = Math.floor((t2 + n2) / 4);
    for (let c2 = o2; c2 <= s2; c2 += 1) for (let o3 = i2; o3 <= a2; o3 += 1) {
      let i3 = this.bucket.get(o3 & 65535 | (c2 & 65535) << 16);
      if (i3) for (let a3 of i3) {
        let i4 = a3.x - e4, o4 = a3.z - t2;
        i4 * i4 + o4 * o4 <= (n2 + a3.radius) * (n2 + a3.radius) && r2.push(a3);
      }
    }
    return r2;
  }
  hostile(e4, t2) {
    return e4.faction === `neutral` || t2.faction === `neutral` ? false : e4.faction !== t2.faction;
  }
  nearestHostile(e4, t2) {
    let n2 = null, r2 = t2 * t2;
    for (let i2 of this.unitsNear(e4.x, e4.z, t2, Qm)) {
      if (i2 === e4 || i2.dead || !this.hostile(e4, i2)) continue;
      let t3 = (i2.x - e4.x) ** 2 + (i2.z - e4.z) ** 2;
      t3 < r2 && (r2 = t3, n2 = i2);
    }
    return n2;
  }
  corpsesNear(e4, t2, n2, r2) {
    let i2 = [];
    for (let a2 of this.units) !a2.dead || !a2.corpse || a2.corpseUsed || a2.removed || a2.kind === `monster` && (r2 && !r2(a2) || (a2.x - e4) ** 2 + (a2.z - t2) ** 2 <= n2 * n2 && i2.push(a2));
    return i2.sort((n3, r3) => (n3.x - e4) ** 2 + (n3.z - t2) ** 2 - ((r3.x - e4) ** 2 + (r3.z - t2) ** 2)), i2;
  }
  los(e4, t2) {
    return this.nav.lineOfSight(e4.x, e4.z, t2.x, t2.z);
  }
  tick(e4) {
    this.time += e4, this.rebuildBuckets();
    let t2 = this.hero;
    if (t2 && !t2.dead) {
      this.flowTimer -= e4;
      let n2 = Math.floor(t2.z) * this.nav.w + Math.floor(t2.x);
      this.flowTimer <= 0 && n2 !== this.flow.targetCell && (this.flow.build(t2.x, t2.z, 36), this.flowTimer = 0.25);
    }
    for (let t3 of this.units) t3.px = t3.x, t3.pz = t3.z, t3.py = t3.y, t3.pfacing = t3.facing, !t3.removed && this.updateStatuses(t3, e4);
    for (let t3 of this.units) t3.removed || t3.dead || (t3.kind === `hero` ? Rm(this, t3, e4) : t3.kind === `monster` ? Tm(this, t3, e4) : t3.kind === `ally` ? Om(this, t3, e4) : t3.kind === `npc` && this.npcThink(t3, e4));
    for (let t3 of this.units) t3.removed || t3.dead || (this.advanceAction(t3, e4), this.move(t3, e4));
    this.separate();
    for (let t3 of this.missiles) Fm(this, t3, e4);
    if (this.missiles.some((e5) => e5.dead)) {
      for (let e5 of this.missiles) e5.dead && this.events.emit(`missileRemoved`, { m: e5, x: e5.x, z: e5.z, impact: e5.age < e5.life });
      this.missiles = this.missiles.filter((e5) => !e5.dead);
    }
    for (let t3 of this.items) t3.t += e4;
    for (let t3 of this.objects) t3.stateT += e4;
    if (this.sched.length) {
      let e5 = this.sched.filter((e6) => e6.at <= this.time);
      if (e5.length) {
        this.sched = this.sched.filter((e6) => e6.at > this.time);
        for (let t3 of e5) t3.fn();
      }
    }
    this.cleanupCorpses();
  }
  npcThink(e4, t2) {
    if (e4.stateT += t2, e4.path.length === 0 && e4.stateT > 5 + e4.id % 5 && (e4.stateT = 0, this.rng.chance(0.45))) {
      let t3 = this.rng.range(0, Math.PI * 2), n2 = this.rng.range(0, e4.leash), r2 = this.nav.nearestWalkable(e4.home.x + Math.cos(t3) * n2, e4.home.z + Math.sin(t3) * n2, 2);
      r2 && (e4.path = this.nav.findPath(e4.x, e4.z, r2.x, r2.z, 400) ?? []), e4.running = false;
    }
    this.hero && e4.path.length === 0 && rm(e4, this.hero) < 5 && (e4.facing = Zm(e4.facing, cm(this.hero.x - e4.x, this.hero.z - e4.z), 3 * t2));
  }
  updateStatuses(e4, t2) {
    let n2 = e4.st;
    if (e4.dead) {
      e4.deathT += t2;
      return;
    }
    e4.hitCooldown > 0 && (e4.hitCooldown -= t2);
    for (let [n3, r2] of e4.cooldowns) r2 - t2 <= 0 ? e4.cooldowns.delete(n3) : e4.cooldowns.set(n3, r2 - t2);
    n2.chill = Math.max(0, n2.chill - t2), n2.freeze = Math.max(0, n2.freeze - t2), n2.stun = Math.max(0, n2.stun - t2), n2.fear = Math.max(0, n2.fear - t2), n2.amp = Math.max(0, n2.amp - t2), n2.lifeTap = Math.max(0, n2.lifeTap - t2), n2.slow = Math.max(0, n2.slow - t2), n2.roar > 0 && (n2.roar -= t2, n2.roar <= 0 && (n2.roarPct = 0)), n2.poison > 0 && (n2.poison -= t2, this.dot(e4, n2.poisonDps * t2, `poison`), n2.poison <= 0 && (n2.poisonDps = 0)), n2.burn > 0 && (n2.burn -= t2, this.dot(e4, n2.burnDps * t2, `fire`), n2.burn <= 0 && (n2.burnDps = 0)), (e4.state === `hit` || e4.state === `stun`) && (e4.stateT -= t2, e4.stateT <= 0 && n2.stun <= 0 && (e4.state = `idle`, e4.play(e4.kind === `hero` && this.isTown ? `townIdle` : `idle`))), n2.stun > 0 && e4.state !== `stun` && e4.action?.kind !== `leap` && (e4.state = `stun`, e4.stateT = n2.stun, e4.action = null), !e4.action && e4.y > 0 && (e4.y = Math.max(0, e4.y - t2 * 14));
  }
  dot(e4, t2, n2) {
    e4.dead || t2 <= 0 || (e4.life -= t2, e4.life <= 0 && this.kill(e4, e4.lastHitBy, n2));
  }
  advanceAction(e4, t2) {
    let n2 = e4.action;
    if (!n2 || e4.st.freeze > 0) return;
    let r2 = e4.st.chill > 0 ? 0.6 : 1;
    if (n2.t += t2 * r2, n2.kind === `leap` && Vm(this, e4, n2), n2.kind === `spin`) {
      Bm(this, e4, n2, t2);
      return;
    }
    !n2.fired && n2.t >= n2.fireAt && (n2.fired = true, Hm(this, e4, n2)), n2.t >= n2.duration && n2.kind !== `channel` && (e4.action = null, e4.state = `idle`, e4.kind === `hero` && this.isTown && e4.play(`townIdle`));
  }
  move(e4, t2) {
    if (e4.busy && e4.action?.kind !== `spin` && e4.action?.kind !== `leap`) {
      e4.speed = 0;
      return;
    }
    if (e4.action?.kind === `leap`) return;
    if (e4.st.fear > 0 && e4.kind === `monster`) {
      let t3 = e4.x - e4.st.fearFrom.x, n3 = e4.z - e4.st.fearFrom.z, r3 = Math.hypot(t3, n3) || 1;
      e4.goal = { x: e4.x + t3 / r3 * 2, z: e4.z + n3 / r3 * 2 }, e4.path = [e4.goal], e4.running = true;
    }
    if (e4.path.length === 0) {
      e4.speed = 0, e4.state === `move` && (e4.state = `idle`);
      return;
    }
    let n2 = e4.path[0], r2 = n2.x - e4.x, i2 = n2.z - e4.z, a2 = Math.hypot(r2, i2), o2 = (e4.running ? e4.runSpd : e4.walk) * e4.slowMult;
    e4.action?.kind === `spin` && (o2 = e4.runSpd * 0.9);
    let s2 = o2 * t2;
    a2 <= s2 + 1e-3 ? (e4.x = n2.x, e4.z = n2.z, e4.path.shift()) : (e4.x += r2 / a2 * s2, e4.z += i2 / a2 * s2), a2 > 0.05 && e4.action?.kind !== `spin` && (e4.facing = Zm(e4.facing, cm(r2, i2), 14 * t2)), e4.state !== `action` && (e4.state = `move`), this.collideWalls(e4), e4.speed = Math.hypot(e4.x - e4.px, e4.z - e4.pz) / t2;
  }
  collideWalls(e4) {
    let t2 = e4.radius * 0.85, n2 = Math.floor(e4.x), r2 = Math.floor(e4.z);
    for (let i2 = -1; i2 <= 1; i2 += 1) for (let a2 = -1; a2 <= 1; a2 += 1) {
      let o2 = n2 + a2, s2 = r2 + i2;
      if (this.nav.isWalkable(o2, s2)) continue;
      let c2 = im(e4.x, o2, o2 + 1), l2 = im(e4.z, s2, s2 + 1), u2 = e4.x - c2, d2 = e4.z - l2, f2 = u2 * u2 + d2 * d2;
      if (f2 < t2 * t2) {
        let n3 = Math.sqrt(f2);
        if (n3 < 1e-5) {
          let t3 = this.nav.nearestWalkable(e4.x, e4.z, 3);
          t3 && (e4.x = t3.x, e4.z = t3.z);
          return;
        }
        e4.x += u2 / n3 * (t2 - n3), e4.z += d2 / n3 * (t2 - n3);
      }
    }
  }
  separate() {
    for (let e4 of this.units) if (!(e4.dead || e4.removed || e4.y > 0.3)) for (let t2 of this.unitsNear(e4.x, e4.z, e4.radius + 0.7, $m)) {
      if (t2 === e4 || t2.dead || t2.id < e4.id || t2.y > 0.3) continue;
      let n2 = t2.x - e4.x, r2 = t2.z - e4.z, i2 = (e4.radius + t2.radius) * 0.9, a2 = n2 * n2 + r2 * r2;
      if (a2 >= i2 * i2 || a2 < 1e-8) continue;
      let o2 = Math.sqrt(a2), s2 = (i2 - o2) * 0.5, c2 = e4.kind === `hero` ? 0.2 : t2.kind === `hero` ? 0.8 : 0.5, l2 = 1 - c2;
      e4.x -= n2 / o2 * s2 * c2 * 2, e4.z -= r2 / o2 * s2 * c2 * 2, t2.x += n2 / o2 * s2 * l2 * 2, t2.z += r2 / o2 * s2 * l2 * 2, this.collideWalls(e4), this.collideWalls(t2);
    }
  }
  pathTo(e4, t2, n2, r2 = 6e3) {
    let i2 = this.nav.findPath(e4.x, e4.z, t2, n2, r2, true, e4.radius * 0.7);
    return e4.path = i2 ?? [], !!i2 && i2.length > 0;
  }
  startAction(e4, t2, n2) {
    e4.action = { ...t2, t: 0, fired: false }, e4.state = `action`, e4.path = [], e4.play(n2, t2.duration);
  }
  actionFraction(e4) {
    return $p[e4] ?? 0.5;
  }
  damage(e4, t2) {
    if (e4.dead || e4.faction === `neutral` || (e4.ai.invuln ?? 0) > this.time) return 0;
    let n2 = t2.source;
    if (e4.kind === `monster` && n2 && (e4.lastHitBy = n2, e4.aggro || this.alertPack(e4)), e4.mdef?.undead && (t2.undeadAr && (t2 = { ...t2, ar: t2.ar * (1 + t2.undeadAr / 100) }), t2.undeadDmg && t2.phys > 0 && (t2 = { ...t2, phys: t2.phys * (1 + t2.undeadDmg / 100) })), t2.isAttack) {
      let r3 = n2?.level ?? 1, i3 = im(2 * t2.ar / (t2.ar + Math.max(1, e4.def)) * (r3 / (r3 + e4.level)), 0.05, 0.95);
      if (this.rng.next() > i3) return this.events.emit(`damage`, { target: e4, amount: 0, crit: false, element: `physical`, source: n2, blocked: false, miss: true }), 0;
      if (t2.canBlock && e4.block > 0 && e4.state !== `action` && this.rng.next() * 100 < e4.block) return this.events.emit(`damage`, { target: e4, amount: 0, crit: false, element: `physical`, source: n2, blocked: true, miss: false }), this.events.emit(`fx`, { t: `block`, unit: e4 }), this.events.emit(`sound`, { id: `hitBlocked`, x: e4.x, z: e4.z }), e4.kind === `hero` && e4.play(`block`, 0.3), 0;
    }
    let r2 = t2.crit > 0 && this.rng.next() * 100 < t2.crit, i2 = t2.phys * (r2 ? 2 : 1);
    e4.st.amp > 0 && (i2 *= 2);
    let a2 = e4.res, o2 = (e5, t3) => t3 >= 100 ? 0 : e5 * (1 - t3 / 100);
    i2 = o2(i2, a2.physical);
    let s2 = o2(t2.fire, a2.fire), c2 = o2(t2.cold, a2.cold), l2 = o2(t2.light, a2.lightning), u2 = o2(t2.magic, a2.magic), d2 = i2 + s2 + c2 + l2 + u2;
    if (e4.kind === `hero` && e4.d) {
      let t3 = e4.d.stats.dr, n3 = Math.min(50, e4.d.stats.drPct);
      i2 = Math.max(0, i2 * (1 - n3 / 100) - t3), d2 = i2 + s2 + c2 + l2 + u2;
    }
    if (t2.poison > 0 && a2.poison < 100) {
      let n3 = t2.poison * (1 - a2.poison / 100) / Math.max(0.5, t2.poisonLen);
      e4.st.poisonDps = e4.st.poison > 0 ? Math.max(e4.st.poisonDps, n3) : n3, e4.st.poison = Math.max(e4.st.poison, t2.poisonLen);
    }
    if (c2 > 0 && t2.coldLen > 0 && !(e4.kind === `hero` && e4.d?.stats.cbf)) {
      let n3 = e4.kind === `hero` ? t2.coldLen * 0.5 : t2.coldLen;
      e4.st.chill = Math.max(e4.st.chill, n3);
    }
    if (t2.freeze > 0 && a2.cold < 100 && !(e4.kind === `hero` && e4.d?.stats.cbf) && (e4.st.freeze = Math.max(e4.st.freeze, t2.freeze)), t2.stun > 0 && (e4.st.stun = Math.max(e4.st.stun, t2.stun)), d2 = Math.max(0, d2), d2 <= 0) return 0;
    if (e4.life -= d2, n2 && !n2.dead && (t2.lifeSteal > 0 || t2.manaSteal > 0)) {
      let e5 = this.diff === `normal` ? 1 : this.diff === `nightmare` ? 0.5 : 0.33;
      n2.life = Math.min(n2.lifeMax, n2.life + i2 * (t2.lifeSteal / 100) * e5), n2.mana = Math.min(n2.manaMax, n2.mana + i2 * (t2.manaSteal / 100) * e5);
    }
    n2 && e4.st.lifeTap > 0 && n2.faction === `player` && (n2.life = Math.min(n2.lifeMax, n2.life + d2 * 0.5)), n2 && t2.isAttack && e4.kind === `hero` && e4.d && e4.d.stats.thorns > 0 && rm(n2, e4) < 3 && this.damage(n2, { ...qp(e4, `thorns`), phys: e4.d.stats.thorns });
    let f2 = s2 >= i2 && s2 >= c2 && s2 >= l2 && s2 > 0 ? `fire` : c2 > i2 && c2 >= l2 ? `cold` : l2 > i2 ? `lightning` : u2 > i2 ? `magic` : t2.poison > 0 && i2 === 0 ? `poison` : `physical`;
    if (this.events.emit(`damage`, { target: e4, amount: d2, crit: r2, element: f2, source: n2, blocked: false, miss: false }), e4.flash(f2 === `fire` ? `#ff8040` : f2 === `cold` ? `#a0e0ff` : f2 === `lightning` ? `#e0e8ff` : `#ffffff`), e4.mods.includes(`lightningEnchanted`) && n2 && this.rng.chance(0.55) && this.lightningRetaliate(e4), e4.life <= 0) return this.kill(e4, n2, f2, t2.freeze > 0 || e4.st.freeze > 0), d2;
    let p2 = e4.kind === `hero` ? e4.lifeMax / 12 : e4.tier === `boss` ? e4.lifeMax / 8 : e4.lifeMax / 16;
    if (d2 >= p2 && e4.hitCooldown <= 0 && e4.st.freeze <= 0 && e4.action?.kind !== `spin` && e4.action?.kind !== `leap` && e4.tier !== `boss`) {
      let t3 = e4.kind === `hero` && e4.d ? e4.d.stats.fhr : 0;
      e4.state = `hit`, e4.stateT = 0.32 * (100 / (100 + t3)), e4.hitCooldown = e4.stateT + 0.25, e4.action = null, e4.path = [], e4.play(`hit`, e4.stateT);
    }
    if (t2.knockback > 0 && e4.tier !== `boss` && n2) {
      let r3 = e4.x - n2.x, i3 = e4.z - n2.z, a3 = Math.hypot(r3, i3) || 1, o3 = e4.x + r3 / a3 * t2.knockback, s3 = e4.z + i3 / a3 * t2.knockback;
      this.nav.walkLine(e4.x, e4.z, o3, s3, e4.radius * 0.5) && (e4.x = o3, e4.z = s3);
    }
    return e4.kind === `hero` && this.events.emit(`shake`, Math.min(0.35, d2 / e4.lifeMax * 1.5)), d2;
  }
  lightningRetaliate(e4) {
    for (let t2 = 0; t2 < 4; t2 += 1) {
      let t3 = this.rng.range(0, Math.PI * 2), n2 = new Jp(e4, `enemy`, `chargedBolt`, { ...qp(e4, `le`), light: this.rng.range(e4.dmg[0], e4.dmg[1] * 1.3), vfx: `lightning` });
      n2.x = n2.px = e4.x, n2.z = n2.pz = e4.z, n2.vx = Math.cos(t3) * 7, n2.vz = Math.sin(t3) * 7, n2.life = 1.1, n2.wander = 1, this.addMissile(n2);
    }
    this.events.emit(`sound`, { id: `zap`, x: e4.x, z: e4.z, volume: 0.6 });
  }
  addMissile(e4) {
    this.missiles.push(e4), this.events.emit(`missileAdded`, e4);
  }
  alertPack(e4) {
    e4.aggro = true;
    for (let t2 of this.unitsNear(e4.x, e4.z, 12)) t2.kind === `monster` && !t2.dead && !t2.aggro && (t2.aggro = true, t2.ai.alertT = this.time);
  }
  kill(e4, t2, n2, r2 = false) {
    if (e4.dead) return;
    if (e4.dead = true, e4.life = 0, e4.deathT = 0, e4.action = null, e4.path = [], e4.state = `dead`, e4.corpse = !r2, e4.st.poison = 0, e4.st.burn = 0, e4.play(`death`), e4.kind === `hero`) {
      this.events.emit(`heroDied`, { killer: t2, element: n2 }), this.events.emit(`death`, { unit: e4, killer: t2 }), this.schedule(1.5, () => this.calmMonsters(true));
      return;
    }
    let i2 = r2 ? `shatter` : e4.ai.crumble ? `burn` : e4.tier === `boss` ? `boss` : n2 === `fire` && this.rng.chance(0.5) ? `burn` : e4.mdef?.undead && e4.mkind === `bonewretch` ? `bone` : `blood`;
    if (this.events.emit(`fx`, { t: `death`, unit: e4, style: i2 }), this.events.emit(`death`, { unit: e4, killer: t2 }), e4.mdef && this.events.emit(`sound`, { id: e4.mdef.sounds.death, x: e4.x, z: e4.z }), e4.kind === `monster`) {
      this.countEnemies();
      let t3 = this.hero;
      if (t3 && t3.ch && !t3.dead && !e4.ai.crumble) {
        let n3 = Math.round(e4.xp * of(t3.level, e4.level));
        n3 > 0 && this.events.emit(`xp`, { amount: n3 }), t3.d?.stats.lifePerKill && (t3.life = Math.min(t3.lifeMax, t3.life + t3.d.stats.lifePerKill)), t3.d?.stats.manaPerKill && (t3.mana = Math.min(t3.manaMax, t3.mana + t3.d.stats.manaPerKill)), t3.ch.kills += 1;
      }
      if (e4.mods.includes(`fireEnchanted`)) {
        this.events.emit(`fx`, { t: `explode`, x: e4.x, z: e4.z, radius: 2.6, element: `fire` }), this.events.emit(`sound`, { id: `fireballExplode`, x: e4.x, z: e4.z });
        for (let t4 of this.unitsNear(e4.x, e4.z, 2.6)) t4.faction === `player` && !t4.dead && this.damage(t4, { ...qp(e4, `fe`), fire: e4.dmg[1] * 2.2, vfx: `fire` });
      }
      if (e4.mods.includes(`coldEnchanted`)) {
        this.events.emit(`fx`, { t: `nova`, x: e4.x, z: e4.z, radius: 4, element: `cold` });
        for (let t4 of this.unitsNear(e4.x, e4.z, 4)) t4.faction === `player` && !t4.dead && this.damage(t4, { ...qp(e4, `ce`), cold: e4.dmg[1] * 1.4, coldLen: 3, vfx: `cold` });
      }
      if (e4.mkind === `gutterkin` || e4.mkind === `gutterkinShaman`) for (let n3 of this.unitsNear(e4.x, e4.z, 8)) n3.mkind === `gutterkin` && !n3.dead && this.rng.chance(0.75) && t3 && (n3.st.fear = this.rng.range(1.6, 2.6), n3.st.fearFrom = { x: t3.x, z: t3.z }, this.rng.chance(0.3) && this.events.emit(`sound`, { id: `gutterkinFlee`, x: n3.x, z: n3.z, volume: 0.6 }));
      if (e4.tier === `boss`) {
        this.events.emit(`bossDefeated`, e4), this.events.emit(`shake`, 0.8);
        for (let t4 of this.units) {
          if (t4.raisedBy !== e4.id || t4.dead) continue;
          let n3 = Math.hypot(t4.x - e4.x, t4.z - e4.z);
          this.schedule(0.35 + n3 * 0.06, () => this.crumble(t4));
        }
      }
      e4.noLoot || this.dropLoot(e4);
    }
  }
  dropLoot(e4) {
    let t2 = this.hero;
    if (!e4.mdef || !t2) return;
    let n2 = e4.tier === `boss` ? 3 : e4.tier === `unique` ? 2 : +(e4.tier === `champion`), r2 = t2.d?.stats.mf ?? 0, i2 = t2.d?.stats.gf ?? 0, a2 = ip(this.rng, { ilvl: e4.level, mf: r2, tier: n2 }, e4.mdef.dropChance, i2, t2.ch?.classId);
    this.spill(e4.x, e4.z, a2.items, a2.gold);
  }
  spill(e4, t2, n2, r2) {
    let i2 = [...n2];
    if (r2 > 0) {
      let e5 = { uid: -1, base: `gold`, quality: `misc`, ilvl: 1, identified: true, name: `Gold`, mods: [], affixes: [], sockets: 0, socketed: [], qty: r2 };
      i2.push(e5);
    }
    i2.forEach((n3, r3) => {
      let a2 = r3 / Math.max(1, i2.length) * Math.PI * 2 + this.rng.range(-0.4, 0.4), o2 = 0.6 + this.rng.range(0, 0.9) + (i2.length > 4 ? 0.5 : 0), s2 = e4 + Math.cos(a2) * o2, c2 = t2 + Math.sin(a2) * o2, l2 = this.nav.nearestWalkable(s2, c2, 3);
      l2 && (s2 = l2.x, c2 = l2.z);
      let u2 = new Xp(n3, s2, c2, e4, t2);
      u2.t = -r3 * 0.08, this.items.push(u2), this.events.emit(`itemDropped`, u2), this.schedule(0.5 + r3 * 0.08, () => {
        let e5 = Xm(n3);
        this.events.emit(`sound`, { id: e5.impact, x: s2, z: c2, volume: 0.75 }), e5.jackpot && this.events.emit(`sound`, { id: e5.jackpot, x: s2, z: c2 });
      });
    });
  }
  removeItem(e4) {
    this.items = this.items.filter((t2) => t2 !== e4), this.events.emit(`itemRemoved`, e4);
  }
  openChest(e4) {
    if (e4.state !== `idle`) return;
    e4.state = e4.kind === `barrel` || e4.kind === `urn` ? `broken` : `open`, e4.stateT = 0, this.events.emit(`objectState`, e4), this.events.emit(`sound`, { id: e4.kind === `barrel` || e4.kind === `urn` ? `barrelBreak` : `chestOpen`, x: e4.x, z: e4.z });
    let t2 = this.hero, n2 = t2?.d?.stats.mf ?? 0;
    if (e4.kind === `barrel` || e4.kind === `urn`) {
      if (this.rng.chance(0.55)) {
        let r3 = ip(this.rng, { ilvl: this.mlvl, mf: n2, tier: 0 }, 0.9, t2?.d?.stats.gf ?? 0);
        this.schedule(0.15, () => this.spill(e4.x, e4.z, r3.items.slice(0, 1), r3.gold));
      }
      this.rng.chance(0.06) && !this.isTown && this.schedule(0.2, () => {
        let t3 = this.spawnMonster(`gutterkin`, e4.x, e4.z, `normal`);
        t3.aggro = true;
      });
      return;
    }
    let r2 = ap(this.rng, { ilvl: this.mlvl, mf: n2, tier: 0 }, Math.max(1, e4.tier));
    this.schedule(0.35, () => this.spill(e4.x, e4.z, r2.items, r2.gold));
  }
  cleanupCorpses() {
    let e4 = 0;
    for (let t2 = this.units.length - 1; t2 >= 0; --t2) {
      let n2 = this.units[t2];
      !n2.dead || n2.kind === `hero` || (n2.kind === `ally` && n2.deathT > 2.5 && (n2.removed = true), !n2.corpse && n2.deathT > 1.5 && (n2.removed = true), n2.corpse && (e4 += 1), n2.corpseUsed && n2.deathT > 0.4 && (n2.removed = true), e4 > 90 && n2.deathT > 30 && (n2.removed = true), n2.removed && (this.units.splice(t2, 1), this.events.emit(`unitRemoved`, n2)));
    }
  }
};
function Xm(e4) {
  let t2 = Pf(e4), n2 = `dropGeneric`;
  t2.cat === `gold` ? n2 = `dropGeneric` : t2.cat === `ring` ? n2 = `dropRing` : t2.cat === `amulet` ? n2 = `dropAmulet` : t2.cat === `gem` || t2.cat === `jewel` ? n2 = `dropGem` : t2.cat === `rune` ? n2 = `dropRune` : t2.cat === `potion` ? n2 = `dropPotion` : (t2.cat === `scroll` || t2.cat === `tome`) && (n2 = `dropScroll`);
  let r2 = e4.quality === `unique` ? `dropUnique` : e4.quality === `set` ? `dropSet` : e4.quality === `rare` || t2.cat === `rune` ? `dropRare` : e4.quality === `magic` ? `dropMagic` : null;
  return { impact: n2, jackpot: r2 };
}
function Zm(e4, t2, n2) {
  let r2 = (t2 - e4) % (Math.PI * 2);
  return r2 > Math.PI && (r2 -= Math.PI * 2), r2 < -Math.PI && (r2 += Math.PI * 2), Math.abs(r2) <= n2 ? t2 : e4 + Math.sign(r2) * n2;
}
var Qm = [], $m = [];
Ld();
var eh = class {
  events = new Dp();
  ch;
  hero;
  seed;
  diff;
  inv;
  stash;
  cube;
  worlds = /* @__PURE__ */ new Map();
  layouts = /* @__PURE__ */ new Map();
  world;
  cursor = null;
  identifyMode = null;
  vendor = null;
  portal = null;
  merc = null;
  rng;
  buffs = [];
  constructor(e4, t2) {
    this.ch = e4, this.seed = t2, this.diff = e4.difficulty, this.rng = new Id(t2 ^ 24149), Wp(), Nf(e4.uidHigh + 1), this.inv = op.from(10, 4, e4.inventory), this.stash = op.from(10, 10, e4.stash), this.cube = op.from(3, 4, e4.cube);
    let n2 = (e5) => {
      Nf(e5.uid);
      for (let t3 of e5.socketed) n2(t3);
    };
    for (let t3 of [...e4.inventory, ...e4.stash, ...e4.cube]) n2(t3.item);
    for (let t3 of Object.values(e4.equipment)) t3 && n2(t3);
    for (let t3 of e4.belt) t3 && n2(t3);
    for (let t3 of e4.corpse?.items ?? []) n2(t3.item);
    e4.cursorItem &&= (n2(e4.cursorItem), this.inv.autoPlace(e4.cursorItem) || (this.cursor = e4.cursorItem), null);
    let r2 = new Gp(`hero`, `player`);
    r2.ch = e4, r2.name = e4.name, r2.radius = 0.38, r2.height = 1.85, r2.ai.runToggle = 1, this.hero = r2, this.refreshHero(true), e4.quests[this.diff].den || (e4.quests[this.diff].den = `active`), e4.quests[this.diff].bloodwitch || (e4.quests[this.diff].bloodwitch = `locked`);
  }
  refreshHero(e4 = false) {
    let t2 = this.hero, n2 = this.ch;
    this.buffs = [], t2.st.roar > 0 && this.buffs.push({ stat: `lifePct`, value: t2.st.roarPct }, { stat: `manaPct`, value: t2.st.roarPct });
    let r2 = xp(n2, this.buffs), i2 = t2.lifeMax > 0 ? t2.life / t2.lifeMax : 1, a2 = t2.manaMax > 0 ? t2.mana / t2.manaMax : 1;
    t2.d = r2, t2.level = n2.level, t2.lifeMax = r2.lifeMax, t2.manaMax = r2.manaMax, t2.staminaMax = r2.staminaMax, e4 ? (t2.life = t2.lifeMax, t2.mana = t2.manaMax, t2.stamina = t2.staminaMax) : (t2.life = Math.min(t2.lifeMax, Math.max(1, Math.round(i2 * t2.lifeMax))), t2.mana = Math.min(t2.manaMax, a2 * t2.manaMax), t2.stamina = Math.min(t2.stamina, t2.staminaMax)), t2.ar = r2.ar, t2.def = r2.def, t2.block = r2.block, t2.walk = r2.walk, t2.runSpd = r2.run, t2.res.fire = r2.res.fire, t2.res.cold = r2.res.cold, t2.res.lightning = r2.res.lightning, t2.res.poison = r2.res.poison, t2.res.physical = 0, t2.res.magic = 0;
  }
  layoutFor(e4) {
    let t2 = this.layouts.get(e4);
    if (!t2) {
      let n2 = Ep[e4], r2 = (this.seed ^ e4.length * 7919 + e4.charCodeAt(0) * 104729) >>> 0;
      t2 = n2.kind === `town` ? Fp(n2, r2) : n2.kind === `dungeon` ? Vp(n2, r2) : Ip(n2, r2), this.layouts.set(e4, t2);
    }
    return t2;
  }
  worldFor(e4) {
    let t2 = this.worlds.get(e4);
    if (!t2) {
      let n2 = this.layoutFor(e4);
      t2 = new Ym(Ep[e4], n2, this.diff, (this.seed ^ e4.charCodeAt(1) * 977) >>> 0), this.wireWorld(t2), this.worlds.set(e4, t2);
    }
    return t2;
  }
  wireWorld(e4) {
    let t2 = e4.events;
    t2.on(`xp`, ({ amount: e5 }) => this.gainXp(e5)), t2.on(`heroDied`, ({ killer: e5, element: t3 }) => this.onHeroDied(e5, t3)), t2.on(`talk`, (e5) => this.talk(e5)), t2.on(`message`, (e5) => this.events.emit(`message`, e5)), t2.on(`bossEngaged`, (e5) => this.events.emit(`bossIntro`, e5)), t2.on(`bossDefeated`, (e5) => {
      if (e5.mkind === `bloodwitch`) {
        let e6 = this.ch.quests[this.diff];
        if (e6.bloodwitch !== `complete`) {
          e6.bloodwitch = `rewardPending`, this.events.emit(`questComplete`, { name: `Veyra the Bloodwitch` }), this.message(`Veyra the Bloodwitch is slain! Return to Captain Maera.`, `gold`);
          let t3 = this.diff === `normal` ? `nightmare` : this.diff === `nightmare` ? `hell` : null;
          t3 && !this.ch.unlocked.includes(t3) && (this.ch.unlocked.push(t3), this.message(`${t3[0].toUpperCase()}${t3.slice(1)} difficulty unlocked.`, `orange`)), this.changed(`quests`, `tracker`);
        }
      }
      this.events.emit(`bossDefeated`, e5);
    }), t2.on(`death`, ({ unit: t3 }) => {
      t3.kind === `monster` && e4.def.id === `den` && this.checkDen(e4), t3 === this.merc && this.ch.merc && (this.ch.merc.dead = true, this.message(`Your mercenary has died.`, `red`), this.changed(`merc`));
    });
  }
  checkDen(e4) {
    let t2 = this.ch.quests[this.diff];
    if (t2.den !== `active`) return;
    let n2 = e4.countEnemies();
    this.changed(`tracker`), n2 === 0 && (t2.den = `rewardPending`, this.message(`The Den of Rot has been purged! Return to Mother Isolde.`, `gold`), this.events.emit(`questComplete`, { name: `The Den of Rot` }), this.changed(`quests`));
  }
  enter(e4, t2) {
    let n2 = this.world, r2 = this.worldFor(e4), i2 = n2 ? n2.units.filter((e5) => e5.owner === this.hero && !e5.dead) : [];
    if (n2) {
      n2.units = n2.units.filter((e5) => e5 !== this.hero && !i2.includes(e5)), n2.hero = null;
      for (let e5 of i2) n2.events.emit(`unitRemoved`, e5);
      n2.events.emit(`unitRemoved`, this.hero);
    }
    let a2 = r2.layout.entries[t2] ?? r2.layout.entries.start ?? r2.layout.entries.fromTown ?? { x: r2.layout.w / 2, z: r2.layout.h / 2 }, o2 = false;
    if (t2 === `portal` && this.portal) if (e4 === `town`) {
      let e5 = r2.objects.find((e6) => e6.kind === `portal`);
      e5 && (a2 = { x: e5.x + 1.2, z: e5.z + 1.2 });
    } else e4 === this.portal.area && (a2 = { x: this.portal.x, z: this.portal.z }, o2 = true);
    let s2 = r2.nav.nearestWalkable(a2.x, a2.z, 6) ?? a2, c2 = this.hero;
    if (c2.setPos(s2.x, s2.z), c2.path = [], c2.cmd = null, c2.action = null, c2.state = `idle`, c2.y = c2.py = 0, r2.units.push(c2), r2.hero = c2, i2.forEach((e5, t3) => {
      let n3 = r2.nav.nearestWalkable(s2.x - 1 - t3 % 3, s2.z - 1 - Math.floor(t3 / 3), 4) ?? s2;
      e5.setPos(n3.x, n3.z), e5.path = [], e5.action = null, r2.units.push(e5);
    }), this.world = r2, !this.ch.waypoints[this.diff].includes(e4) && e4 === `town` && this.ch.waypoints[this.diff].push(e4), e4 === `hollowFields`) {
      let e5 = this.ch.quests[this.diff];
      e5.bloodwitch === `locked` && (e5.bloodwitch = `active`, this.changed(`quests`, `tracker`));
    }
    if (e4 === `town` && !n2 && this.ch.corpse && !r2.objects.some((e5) => e5.kind === `heroCorpse`)) {
      let e5 = new Qp(`heroCorpse`, s2.x + 2, s2.z + 1, 0.4);
      r2.objects.push(e5);
    }
    o2 && this.closePortals();
    let l2 = !r2.isTown && r2.objects.some((e5) => e5.kind === `heroCorpse`);
    return c2.ai.graceUntil = r2.time + (l2 ? 15 : this.ch.corpse ? 6 : 2.5), l2 && this.message(`Your corpse lies here. Reclaim it before the dead take notice.`, `white`), c2.play(r2.isTown ? `townIdle` : `idle`), this.events.emit(`areaChanged`, { world: r2, entry: t2 }), this.changed(`area`, `tracker`, `waypoints`), r2;
  }
  tickHooks() {
    let e4 = this.hero, t2 = this.world;
    if (e4.ai.pickup) {
      let n2 = t2.items.find((t3) => t3.id === e4.ai.pickup);
      e4.ai.pickup = 0, n2 && this.pickup(n2);
    }
    if (e4.ai.interact) {
      let n2 = t2.objects.find((t3) => t3.id === e4.ai.interact);
      e4.ai.interact = 0, n2 && this.interact(n2);
    }
    e4.ai.refreshDerived && (e4.ai.refreshDerived = 0, this.refreshHero(), this.changed(`hero`)), e4.st.roar <= 0 && this.buffs.length && (this.refreshHero(), this.changed(`hero`));
    for (let n2 of t2.items) if (n2.item.base === `gold` && n2.t > 0.6 && Math.hypot(n2.x - e4.x, n2.z - e4.z) < 1) {
      this.pickup(n2);
      break;
    }
  }
  message(e4, t2 = `white`) {
    this.events.emit(`message`, { text: e4, color: t2 });
  }
  changed(...e4) {
    this.events.emit(`changed`, { sections: e4 });
  }
  sound(e4, t2) {
    this.events.emit(`sound`, { id: e4, volume: t2 });
  }
  gainXp(e4) {
    let t2 = this.ch;
    if (t2.level >= 99) return;
    t2.xp += e4;
    let n2 = false;
    for (; t2.level < 99 && t2.xp >= af[t2.level + 1]; ) t2.level += 1, t2.statPoints += 5, t2.skillPoints += 1, n2 = true;
    n2 ? (this.refreshHero(), this.events.emit(`levelUp`, { level: t2.level }), this.world.events.emit(`fx`, { t: `levelUp`, unit: this.hero }), this.sound(`levelUp`), this.message(`You have reached level ${t2.level}!`, `gold`), this.changed(`hero`, `skills`, `grids`, `equipment`, `belt`), this.events.emit(`saveNeeded`, void 0)) : this.changed(`hero`);
  }
  addStat(e4) {
    if (this.ch.statPoints <= 0) return;
    --this.ch.statPoints, this.ch.base[e4] += 1;
    let t2 = { life: this.hero.lifeMax, mana: this.hero.manaMax };
    this.refreshHero(), this.hero.life += Math.max(0, this.hero.lifeMax - t2.life), this.hero.mana += Math.max(0, this.hero.manaMax - t2.mana), this.sound(`uiStat`), this.changed(`hero`, `grids`, `equipment`, `belt`);
  }
  canLearn(e4) {
    let t2 = Cf[e4];
    if (t2.classId !== this.ch.classId) return `Wrong class`;
    if (this.ch.level < t2.reqLevel) return `Requires level ${t2.reqLevel}`;
    for (let e5 of t2.prereqs) if ((this.ch.skills[e5] ?? 0) <= 0) return `Requires ${Cf[e5].name}`;
    return (this.ch.skills[e4] ?? 0) >= t2.maxLevel ? `Maximum level` : this.ch.skillPoints <= 0 ? `No skill points` : null;
  }
  learn(e4) {
    if (this.canLearn(e4)) {
      this.sound(`uiError`);
      return;
    }
    let t2 = this.ch.skills[e4] ?? 0;
    this.ch.skills[e4] = t2 + 1, --this.ch.skillPoints;
    let n2 = Cf[e4];
    if (t2 === 0 && n2.kind !== `passive`) {
      this.ch.bar.right === `attack` && (this.ch.bar.right = e4);
      let t3 = this.ch.bar.hotkeys.indexOf(null);
      t3 >= 0 && !this.ch.bar.hotkeys.includes(e4) && (this.ch.bar.hotkeys[t3] = e4);
    }
    this.refreshHero(), this.sound(`uiLearn`), this.changed(`skills`, `hero`);
  }
  setSkill(e4, t2) {
    let n2 = Cf[t2];
    e4 === `left` && !n2.allowLeft || t2 !== `attack` && (this.ch.skills[t2] ?? 0) <= 0 || (this.ch.bar[e4] = t2, this.changed(`skills`));
  }
  setHotkey(e4, t2) {
    let n2 = this.ch.bar.hotkeys;
    if (t2) for (let e5 = 0; e5 < n2.length; e5 += 1) n2[e5] === t2 && (n2[e5] = null);
    n2[e4] = t2, this.changed(`skills`);
  }
  pickup(e4) {
    let t2 = e4.item, n2 = Pf(t2), r2 = this.world;
    if (n2.cat === `gold`) {
      let n3 = this.ch.level * 1e4, i2 = Math.min(t2.qty ?? 0, n3 - this.ch.gold);
      if (i2 <= 0) {
        this.message(`You cannot carry any more gold.`, `grey`);
        return;
      }
      this.ch.gold += i2, t2.qty = (t2.qty ?? 0) - i2, (t2.qty ?? 0) <= 0 && r2.removeItem(e4), this.sound(`goldPickup`), this.changed(`hero`);
      return;
    }
    if (this.cursor === null && n2.cat === `potion` && this.toBelt(t2)) {
      r2.removeItem(e4), this.sound(`itemPickup`), this.changed(`belt`);
      return;
    }
    if (n2.cat === `scroll`) {
      let t3 = n2.id === `tpScroll` ? `tpTome` : `idTome`, i2 = this.inv.find((e5) => e5.base === t3 && (e5.qty ?? 0) < 20);
      if (i2) {
        i2.qty = (i2.qty ?? 0) + 1, r2.removeItem(e4), this.sound(`itemPickup`), this.changed(`grids`);
        return;
      }
    }
    this.inv.autoPlace(t2) ? (r2.removeItem(e4), this.sound(`itemPickup`), this.changed(`grids`)) : (this.message(`No room in your inventory.`, `grey`), this.sound(`uiError`));
  }
  toBelt(e4) {
    let t2 = Tp(this.ch), n2 = this.ch.belt;
    for (let r2 = 0; r2 < 4; r2 += 1) {
      let i2 = n2[r2];
      if (!(i2 && i2.base !== e4.base)) for (let i3 = 0; i3 < t2; i3 += 1) {
        let t3 = i3 * 4 + r2;
        if (!n2[t3]) return n2[t3] = e4, true;
      }
    }
    return false;
  }
  dropCursor() {
    if (!this.cursor) return;
    let e4 = this.cursor;
    this.cursor = null;
    let t2 = this.hero, n2 = t2.x + Math.sin(t2.facing) * 0.9, r2 = t2.z + Math.cos(t2.facing) * 0.9, i2 = this.world.nav.nearestWalkable(n2, r2, 2) ?? { x: t2.x, z: t2.z }, a2 = new Xp(e4, i2.x, i2.z, t2.x, t2.z);
    this.world.items.push(a2), this.world.events.emit(`itemDropped`, a2), this.sound(`itemPlace`), this.changed(`cursor`);
  }
  gridOf(e4) {
    return e4 === `inventory` ? this.inv : e4 === `stash` ? this.stash : e4 === `cube` ? this.cube : null;
  }
  clickGrid(e4, t2, n2) {
    if (e4 === `vendor`) {
      this.cursor && this.sellCursor();
      return;
    }
    let r2 = this.gridOf(e4);
    if (!r2) return;
    if (this.identifyMode && !this.cursor) {
      let e5 = r2.at(t2, n2);
      if (e5 && !e5.identified) {
        this.useIdentifyCharge(this.identifyMode.uid), e5.identified = true, this.identifyMode = null, this.sound(`identify`), this.message(`${e5.name}`, `white`), this.refreshHero(), this.changed(`grids`, `cursor`);
        return;
      }
      this.identifyMode = null, this.changed(`cursor`);
      return;
    }
    if (!this.cursor) {
      let i3 = r2.at(t2, n2);
      if (!i3) return;
      r2.remove(i3.uid), this.cursor = i3, this.sound(`itemPickup`, 0.6), this.changed(`grids`, `cursor`), e4 === `inventory` && Pf(i3).cat === `charm` && (this.refreshHero(), this.changed(`hero`));
      return;
    }
    let i2 = this.cursor, a2 = Pf(i2);
    if (e4 === `cube` && a2.cat === `coffer`) {
      this.message(`The coffer cannot hold itself.`, `grey`), this.sound(`uiError`, 0.5);
      return;
    }
    let o2 = r2.at(t2, n2);
    if (o2 && (a2.cat === `gem` || a2.cat === `rune` || a2.cat === `jewel`) && o2.sockets > o2.socketed.length && Pf(o2).cat !== `gem`) {
      o2.socketed.push(i2), this.cursor = null;
      let e5 = Gf(o2);
      this.sound(e5 ? `questComplete` : `itemPlace`), e5 && this.message(`Runeword forged: ${o2.name}!`, `gold`), this.changed(`grids`, `cursor`, `hero`);
      return;
    }
    if (o2 && a2.cat === `scroll` && (a2.id === `tpScroll` && o2.base === `tpTome` || a2.id === `idScroll` && o2.base === `idTome`) && (o2.qty ?? 0) < 20) {
      o2.qty = (o2.qty ?? 0) + 1, this.cursor = null, this.sound(`itemPlace`), this.changed(`grids`, `cursor`);
      return;
    }
    let s2 = Math.max(0, Math.min(r2.cols - a2.w, t2)), c2 = Math.max(0, Math.min(r2.rows - a2.h, n2)), l2 = r2.test(i2, s2, c2);
    if (!l2.ok) {
      this.sound(`uiError`, 0.5);
      return;
    }
    let u2 = null;
    l2.swap && (u2 = r2.remove(l2.swap)), r2.place(i2, s2, c2), this.cursor = u2, this.sound(`itemPlace`), e4 === `inventory` && (a2.cat === `charm` || u2 && Pf(u2).cat === `charm`) && (this.refreshHero(), this.changed(`hero`)), (e4 === `cube` || e4 === `stash`) && this.events.emit(`saveNeeded`, void 0), this.changed(`grids`, `cursor`);
  }
  clickEquip(e4) {
    let t2 = this.ch, n2 = t2.equipment[e4] ?? null;
    if (!this.cursor) {
      if (!n2) return;
      delete t2.equipment[e4], this.cursor = n2, this.sound(Pf(n2).cat === `weapon` || Pf(n2).cat === `helm` ? `itemEquipMetal` : `itemEquipCloth`), this.afterEquip();
      return;
    }
    let r2 = this.cursor, i2 = Pf(r2);
    if (!(i2.slot === e4 || i2.slot === `ringLeft` && (e4 === `ringLeft` || e4 === `ringRight`))) {
      this.sound(`uiError`, 0.5);
      return;
    }
    if (!wp(t2, this.hero.d, r2)) {
      this.message(r2.identified ? `You do not meet the requirements.` : `This item must be identified first.`, `red`), this.sound(`uiError`);
      return;
    }
    if (e4 === `mainHand` && i2.twoHanded && t2.equipment.offHand) {
      let e5 = t2.equipment.offHand;
      if (!this.inv.autoPlace(e5)) {
        this.message(`You need room for your shield first.`, `red`), this.sound(`uiError`);
        return;
      }
      delete t2.equipment.offHand;
    }
    if (e4 === `offHand` && t2.equipment.mainHand && Pf(t2.equipment.mainHand).twoHanded) {
      this.message(`You cannot use an off-hand item with a two-handed weapon.`, `red`), this.sound(`uiError`);
      return;
    }
    t2.equipment[e4] = r2, this.cursor = n2, this.sound(i2.cat === `weapon` || i2.cat === `helm` || i2.cat === `shield` ? `itemEquipMetal` : `itemEquipCloth`), this.afterEquip();
  }
  afterEquip() {
    this.refreshHero();
    let e4 = Tp(this.ch);
    for (let t2 = e4 * 4; t2 < 16; t2 += 1) {
      let e5 = this.ch.belt[t2];
      if (e5 && (this.ch.belt[t2] = null, !this.inv.autoPlace(e5))) {
        let t3 = new Xp(e5, this.hero.x, this.hero.z);
        this.world.items.push(t3), this.world.events.emit(`itemDropped`, t3);
      }
    }
    this.changed(`equipment`, `cursor`, `hero`, `grids`, `belt`, `skills`), this.events.emit(`saveNeeded`, void 0);
  }
  clickBelt(e4) {
    let t2 = this.ch.belt;
    if (e4 >= Tp(this.ch) * 4) return;
    if (!this.cursor) {
      let n3 = t2[e4];
      if (!n3) return;
      t2[e4] = null, this.cursor = n3, this.compactBelt(), this.changed(`belt`, `cursor`);
      return;
    }
    let n2 = Pf(this.cursor);
    if (n2.cat !== `potion` && n2.cat !== `scroll`) {
      this.sound(`uiError`, 0.5);
      return;
    }
    let r2 = t2[e4];
    t2[e4] = this.cursor, this.cursor = r2, this.compactBelt(), this.sound(`itemPlace`), this.changed(`belt`, `cursor`);
  }
  compactBelt() {
    let e4 = Tp(this.ch), t2 = this.ch.belt;
    for (let n2 = 0; n2 < 4; n2 += 1) {
      let r2 = [];
      for (let i2 = 0; i2 < e4; i2 += 1) {
        let e5 = t2[i2 * 4 + n2];
        e5 && r2.push(e5), t2[i2 * 4 + n2] = null;
      }
      r2.forEach((e5, r3) => {
        t2[r3 * 4 + n2] = e5;
      });
    }
  }
  useBelt(e4) {
    let t2 = this.ch.belt[e4];
    if (!t2) return;
    let n2 = Pf(t2);
    if (n2.id === `tpScroll`) {
      this.openTownPortal(t2) && (this.ch.belt[e4] = null, this.compactBelt(), this.changed(`belt`));
      return;
    }
    if (n2.id === `idScroll`) {
      this.identifyMode = { uid: t2.uid, grid: `belt` }, this.message(`Click an unidentified item to identify it.`, `grey`), this.changed(`cursor`);
      return;
    }
    this.useConsumable(t2) && (this.ch.belt[e4] = null, this.compactBelt(), this.changed(`belt`));
  }
  rightClick(e4, t2) {
    if (e4 === `vendor`) {
      this.buy(t2);
      return;
    }
    let n2 = this.gridOf(e4);
    if (!n2) return;
    let r2 = n2.items.get(t2);
    if (!r2) return;
    let i2 = r2.item, a2 = Pf(i2);
    if (e4 === `inventory`) {
      if (a2.cat === `coffer`) {
        this.events.emit(`openPanel`, { panel: `cube` });
        return;
      }
      if (this.vendor) {
        n2.remove(t2), this.sellItem(i2);
        return;
      }
      if (a2.cat === `potion`) {
        this.useConsumable(i2) && (n2.remove(t2), this.changed(`grids`));
        return;
      }
      if (a2.id === `tpScroll` || a2.id === `tpTome`) {
        this.openTownPortal(i2) && (a2.cat === `scroll` && n2.remove(t2), this.changed(`grids`));
        return;
      }
      if (a2.id === `idScroll` || a2.id === `idTome`) {
        if (a2.cat === `tome` && (i2.qty ?? 0) <= 0) {
          this.message(`The tome is empty.`, `grey`);
          return;
        }
        this.identifyMode = { uid: t2, grid: `inventory` }, this.message(`Click an unidentified item to identify it.`, `grey`), this.changed(`cursor`);
        return;
      }
      if (this.uiOpen.stash && this.stash.autoPlace(i2)) {
        n2.remove(t2), this.stash.items.get(t2), this.fixMovedPlacement(this.stash, i2), this.changed(`grids`);
        return;
      }
      if (this.uiOpen.cube && this.cube.autoPlace(i2)) {
        n2.remove(t2), this.fixMovedPlacement(this.cube, i2), this.changed(`grids`);
        return;
      }
      if (a2.slot) {
        let e5 = a2.slot === `ringLeft` && this.ch.equipment.ringLeft ? `ringRight` : a2.slot;
        if (wp(this.ch, this.hero.d, i2)) {
          if (n2.remove(t2), this.cursor = i2, this.clickEquip(e5), this.cursor && this.cursor !== i2) {
            let e6 = this.cursor;
            this.inv.autoPlace(e6) && (this.cursor = null);
          }
          this.changed(`grids`, `cursor`, `equipment`);
        } else this.message(i2.identified ? `You do not meet the requirements.` : `This item must be identified first.`, `red`), this.sound(`uiError`);
      }
      return;
    }
    this.inv.autoPlace(i2) ? (n2.remove(t2), this.fixMovedPlacement(this.inv, i2), this.changed(`grids`)) : this.message(`No room in your inventory.`, `grey`);
  }
  fixMovedPlacement(e4, t2) {
  }
  uiOpen = { stash: false, cube: false };
  useIdentifyCharge(e4) {
    let t2 = this.ch.belt.findIndex((t3) => t3?.uid === e4);
    if (t2 >= 0) {
      this.ch.belt[t2] = null, this.compactBelt(), this.changed(`belt`);
      return;
    }
    let n2 = this.inv.items.get(e4);
    n2 && (n2.item.base === `idScroll` ? this.inv.remove(e4) : n2.item.qty = Math.max(0, (n2.item.qty ?? 0) - 1));
  }
  useConsumable(e4) {
    let t2 = Pf(e4), n2 = this.hero;
    if (!t2.potion || n2.dead) return false;
    let r2 = t2.potion;
    return r2.kind === `hp` ? n2.potions.push({ kind: `hp`, perSec: r2.amount / r2.duration, t: r2.duration }) : r2.kind === `mp` ? n2.potions.push({ kind: `mp`, perSec: r2.amount / r2.duration, t: r2.duration }) : r2.kind === `rejuv` ? (n2.life = Math.min(n2.lifeMax, n2.life + n2.lifeMax * r2.amount / 100), n2.mana = Math.min(n2.manaMax, n2.mana + n2.manaMax * r2.amount / 100)) : (n2.ai.staminaBoost = 4, n2.ai.staminaBoostT = r2.duration, n2.stamina = n2.staminaMax), r2.kind === `hp` && n2.st.poison > 0 && (n2.st.poison = Math.min(n2.st.poison, 1)), this.world.events.emit(`fx`, { t: `potion`, unit: n2, kind: r2.kind === `mp` ? `mp` : r2.kind === `hp` ? `hp` : `rejuv` }), this.sound(`potionDrink`), true;
  }
  openTownPortal(e4) {
    let t2 = this.world;
    if (t2.isTown) return this.message(`You cannot open a portal in town.`, `grey`), this.sound(`uiError`), false;
    if (e4.base === `tpTome`) {
      if ((e4.qty ?? 0) <= 0) return this.message(`The tome is empty.`, `grey`), false;
      e4.qty = (e4.qty ?? 0) - 1;
    }
    this.closePortals();
    let n2 = this.hero, r2 = n2.x + Math.sin(n2.facing) * 1.6, i2 = n2.z + Math.cos(n2.facing) * 1.6, a2 = t2.nav.nearestWalkable(r2, i2, 3) ?? { x: n2.x, z: n2.z }, o2 = new Qp(`portal`, a2.x, a2.z, n2.facing);
    o2.to = `town`, o2.entry = `portal`, t2.objects.push(o2), t2.events.emit(`objectAdded`, o2);
    let s2 = this.worldFor(`town`), c2 = s2.layout.entries.start, l2 = new Qp(`portal`, c2.x + 2, c2.z - 1.5, 0);
    return l2.to = t2.def.id, l2.entry = `portal`, s2.objects.push(l2), s2.events.emit(`objectAdded`, l2), this.portal = { area: t2.def.id, x: a2.x, z: a2.z }, t2.events.emit(`sound`, { id: `portalOpen`, x: a2.x, z: a2.z }), n2.play(`cast`, 0.5), true;
  }
  closePortals() {
    for (let e4 of this.worlds.values()) {
      let t2 = e4.objects.filter((e5) => e5.kind === `portal`);
      for (let n2 of t2) e4.objects = e4.objects.filter((e5) => e5 !== n2), e4.events.emit(`objectRemoved`, n2);
    }
    this.portal = null;
  }
  interact(e4) {
    let t2 = this.world;
    switch (e4.kind) {
      case `chest`:
      case `barrel`:
      case `urn`:
      case `coffin`:
        t2.openChest(e4);
        break;
      case `stash`:
        this.events.emit(`openPanel`, { panel: `stash` }), this.sound(`stashOpen`);
        break;
      case `waypoint`: {
        let n2 = this.ch.waypoints[this.diff];
        n2.includes(t2.def.id) || (n2.push(t2.def.id), e4.state = `active`, t2.events.emit(`objectState`, e4), this.sound(`waypointActivate`), this.message(`Waypoint activated`, `blue`), this.changed(`waypoints`)), this.events.emit(`openPanel`, { panel: `waypoint` });
        break;
      }
      case `shrine`:
        if (e4.state !== `idle`) {
          this.message(`The shrine has been used.`, `grey`);
          break;
        }
        e4.state = `used`, t2.events.emit(`objectState`, e4), this.applyShrine(String(e4.label)), t2.events.emit(`fx`, { t: `shrine`, x: e4.x, z: e4.z, color: `#7fd4ff` }), this.sound(`shrine`);
        break;
      case `exit`:
      case `denEntrance`:
        e4.to && this.travel(e4.to, e4.entry ?? `start`);
        break;
      case `portal`:
        e4.to && this.travel(t2.isTown ? e4.to : `town`, `portal`);
        break;
      case `heroCorpse`:
        this.recoverCorpse(e4);
        break;
      default:
        break;
    }
  }
  applyShrine(e4) {
    let t2 = this.hero;
    switch (e4) {
      case `health`:
        t2.life = t2.lifeMax, this.message(`Health Shrine: you feel refreshed.`, `blue`);
        break;
      case `mana`:
        t2.mana = t2.manaMax, this.message(`Mana Shrine: your mana is restored.`, `blue`);
        break;
      case `experience`:
        this.gainXp(Math.round(af[Math.min(99, this.ch.level + 1)] * 0.06 + 50)), this.message(`Experience Shrine: you feel wiser.`, `blue`);
        break;
      default:
        t2.life = t2.lifeMax, t2.mana = t2.manaMax, this.message(`Refilling Shrine`, `blue`);
    }
  }
  travel(e4, t2) {
    this.events.emit(`travel`, { to: e4, entry: t2 });
  }
  onHeroDied(e4, t2) {
    let n2 = this.ch;
    n2.deaths += 1;
    let r2 = n2.hardcore ? 0 : Math.round(Math.min(n2.gold, n2.gold * 0.1 + n2.level * 30)), i2 = 0;
    if (n2.hardcore) n2.dead = true;
    else {
      if (n2.gold -= r2, this.diff !== `normal`) {
        let e6 = af[n2.level + 1] - af[n2.level], t4 = Math.round(e6 * (this.diff === `nightmare` ? 0.05 : 0.1)), r3 = n2.xp;
        n2.xp = Math.max(af[n2.level], n2.xp - t4), i2 = r3 - n2.xp;
      }
      let e5 = n2.corpse ? [...n2.corpse.items] : [];
      for (let t4 of hp) {
        let r3 = n2.equipment[t4];
        r3 && e5.push({ slot: t4, item: r3 }), delete n2.equipment[t4];
      }
      n2.corpse = { items: e5, gold: 0, xpLost: (n2.corpse?.xpLost ?? 0) + i2 };
      for (let e6 of this.worlds.values()) {
        let t4 = e6.objects.filter((e7) => e7.kind === `heroCorpse`);
        if (t4.length) {
          e6.objects = e6.objects.filter((e7) => e7.kind !== `heroCorpse`);
          for (let n3 of t4) e6.events.emit(`objectRemoved`, n3);
        }
      }
      let t3 = new Qp(`heroCorpse`, this.hero.x, this.hero.z, this.hero.facing);
      this.world.objects.push(t3), this.world.events.emit(`objectAdded`, t3);
    }
    this.merc && !this.merc.dead && this.world.kill(this.merc, null, `physical`), this.events.emit(`heroDied`, { killedBy: e4?.name ?? `the darkness`, damageType: t2, goldLost: r2 }), this.events.emit(`saveNeeded`, void 0);
  }
  respawn() {
    this.world.calmMonsters();
    let e4 = this.hero;
    e4.dead = false, e4.corpse = false, e4.state = `idle`, e4.st.poison = 0, e4.st.poisonDps = 0, e4.st.burn = 0, e4.st.burnDps = 0, e4.st.chill = 0, e4.st.freeze = 0, e4.st.amp = 0, this.refreshHero(true), this.travel(`town`, `start`), this.changed(`hero`, `equipment`);
  }
  recoverCorpse(e4) {
    let t2 = this.ch.corpse, n2 = this.world;
    if (n2.objects = n2.objects.filter((t3) => t3 !== e4), n2.events.emit(`objectRemoved`, e4), !t2) return;
    for (let { slot: e5, item: r3 } of t2.items) {
      let t3 = this.ch.equipment[e5];
      if (t3 && !this.inv.autoPlace(t3)) {
        let e6 = new Xp(t3, this.hero.x, this.hero.z);
        n2.items.push(e6), n2.events.emit(`itemDropped`, e6);
      }
      this.ch.equipment[e5] = r3;
    }
    let r2 = Math.round((t2.xpLost ?? 0) * 0.75);
    r2 > 0 && (this.ch.xp += r2), this.ch.corpse = null, this.hero.ai.graceUntil = Math.max(this.hero.ai.graceUntil ?? 0, n2.time + 2), this.sound(`itemEquipMetal`), this.message(r2 > 0 ? `You recovered your corpse and ${r2} experience.` : `You recovered your corpse.`, `white`), this.afterEquip();
  }
  talk(e4) {
    if (e4.npcKind === `healer`) {
      let e5 = this.hero;
      e5.life = e5.lifeMax, e5.mana = e5.manaMax, e5.st.poison = 0, this.merc && !this.merc.dead && (this.merc.life = this.merc.lifeMax);
    }
    this.events.emit(`dialog`, { npc: e4 });
  }
  openVendor(e4) {
    let t2 = new Id((this.seed ^ e4.id * 7919 ^ Math.floor(this.world.time)) >>> 0), n2 = [], r2 = Math.max(1, this.ch.level + 1), i2 = { ilvl: r2 + 2, mf: 0, tier: 0 };
    if (e4.npcKind === `healer`) {
      let e5 = new op(10, 10);
      for (let t3 of [`hp1`, `hp2`, `hp3`, `mp1`, `mp2`, `mp3`, `stamina`, `rejuv`, `tpScroll`, `idScroll`, `tpTome`, `idTome`]) {
        let n3 = hf[t3];
        n3.qlvl > r2 + 4 || e5.autoPlace($f(t3, r2, n3.stack ? 20 : void 0));
      }
      n2.push({ name: `Misc`, grid: e5 });
      let a2 = new op(10, 10), o2 = [`wand`, `boneWand`, `shortStaff`, `longStaff`, `sorceryOrb`, `shrunkenHead`, `circlet`, `charmSmall`, `ring`, `amulet`];
      for (let e6 = 0; e6 < 14; e6 += 1) {
        let e7 = t2.pick(o2);
        if (hf[e7].qlvl > i2.ilvl + 4) continue;
        let n3 = ep(t2, i2, { baseId: e7, quality: t2.chance(0.65) ? `magic` : `normal` });
        n3.identified = true, a2.autoPlace(n3);
      }
      n2.push({ name: `Arcana`, grid: a2 });
    } else if (e4.npcKind === `smith`) {
      let e5 = new op(10, 10), r3 = new op(10, 10);
      for (let n3 = 0; n3 < 18; n3 += 1) {
        let n4 = ep(t2, i2, { cats: [`weapon`], quality: t2.chance(0.4) ? `magic` : `normal`, classId: this.ch.classId });
        n4.identified = true, e5.autoPlace(n4);
      }
      for (let e6 = 0; e6 < 20; e6 += 1) {
        let e7 = ep(t2, i2, { cats: [`helm`, `armor`, `shield`, `gloves`, `boots`, `belt`], quality: t2.chance(0.4) ? `magic` : `normal`, classId: this.ch.classId });
        e7.identified = true, r3.autoPlace(e7);
      }
      n2.push({ name: `Weapons`, grid: e5 }, { name: `Armor`, grid: r3 });
    } else return;
    this.vendor = { npc: e4, tabs: n2 }, this.events.emit(`openPanel`, { panel: `vendor` }), this.changed(`vendor`);
  }
  closeVendor() {
    this.vendor = null, this.changed(`vendor`);
  }
  buy(e4) {
    let t2 = this.vendor;
    if (t2) for (let n2 of t2.tabs) {
      let t3 = n2.grid.items.get(e4);
      if (!t3) continue;
      let r2 = t3.item, i2 = Bf(r2);
      if (this.ch.gold < i2) {
        this.message(`You do not have enough gold.`, `red`), this.sound(`uiError`);
        return;
      }
      let a2 = Pf(r2), o2 = a2.cat === `potion` || a2.cat === `scroll` || a2.cat === `tome`, s2 = o2 ? { ...Kf(r2), uid: Mf() } : r2;
      if (!(a2.cat === `potion` && this.toBelt(s2) || this.inv.autoPlace(s2))) {
        this.message(`No room in your inventory.`, `grey`), this.sound(`uiError`);
        return;
      }
      o2 || n2.grid.remove(e4), this.ch.gold -= i2, this.sound(`uiBuy`), this.changed(`grids`, `vendor`, `hero`, `belt`);
      return;
    }
  }
  sellCursor() {
    if (!this.cursor || !this.vendor) return;
    if (Pf(this.cursor).cat === `coffer`) {
      this.message(`The Alchemist’s Coffer cannot be sold.`, `grey`), this.sound(`uiError`, 0.6);
      return;
    }
    let e4 = this.cursor;
    this.cursor = null, this.sellItem(e4);
  }
  sellItem(e4) {
    let t2 = Vf(e4);
    this.ch.gold = Math.min(this.ch.level * 1e4, this.ch.gold + t2);
    let n2 = this.vendor?.tabs[this.vendor.tabs.length - 1];
    n2 && !Pf(e4).potion && (e4.identified = true, n2.grid.autoPlace(e4)), this.sound(`uiSell`), this.changed(`grids`, `vendor`, `hero`, `cursor`);
  }
  identifyAll() {
    let e4 = 0;
    for (let t2 of this.inv.list()) t2.item.identified || (t2.item.identified = true, e4 += 1);
    return e4 && (this.sound(`identify`), this.refreshHero(), this.changed(`grids`, `hero`)), e4;
  }
  claimQuest(e4) {
    let t2 = this.ch.quests[this.diff];
    return t2[e4] === `rewardPending` ? (t2[e4] = `complete`, e4 === `den` ? (this.ch.skillPoints += 1, this.message(`You received a skill point!`, `gold`), this.sound(`skillPointGained`)) : (this.ch.questData[`freeMerc_${this.diff}`] = 1, this.message(`Captain Maera offers you a sister of the Vigil, free of charge.`, `gold`), this.sound(`questComplete`)), this.changed(`quests`, `skills`, `hero`, `tracker`), this.events.emit(`saveNeeded`, void 0), true) : false;
  }
  hireMerc() {
    let e4 = this.ch.questData[`freeMerc_${this.diff}`] === 1, t2 = e4 ? 0 : 150 + this.ch.level * 60;
    if (this.merc && !this.merc.dead) {
      this.message(`You already have a mercenary.`, `grey`);
      return;
    }
    if (this.ch.gold < t2) {
      this.message(`You need ${t2} gold.`, `red`), this.sound(`uiError`);
      return;
    }
    this.ch.gold -= t2, e4 && (this.ch.questData[`freeMerc_${this.diff}`] = 2), this.ch.merc = { hired: true, level: this.ch.level, dead: false }, this.spawnMerc(), this.sound(`uiBuy`), this.message(`Sister Ilsa joins you.`, `gold`), this.changed(`merc`, `hero`);
  }
  spawnMerc() {
    if (!this.ch.merc || this.ch.merc.dead) return;
    let e4 = this.hero, t2 = Km(this.world, e4, `mercArcher`, 1, e4.x - 1, e4.z - 1), n2 = this.world.nav.nearestWalkable(e4.x - 1.2, e4.z - 1.2, 4);
    n2 && t2.setPos(n2.x, n2.z), this.merc = t2, this.world.addUnit(t2);
  }
  transmute() {
    let e4 = this.cube.list().map((e5) => e5.item);
    if (!e4.length) return;
    let t2 = e4.map((e5) => e5.base).sort(), n2 = [`chipped`, `flawed`, `normal`, `flawless`, `perfect`], r2 = null;
    if (e4.length === 3 && t2.every((e5) => e5 === t2[0])) {
      let i2 = hf[t2[0]];
      if (i2.gem) {
        let t3 = n2.indexOf(i2.gem.grade);
        t3 < 4 && (r2 = $f(`gem_${i2.gem.type}_${n2[t3 + 1]}`, e4[0].ilvl));
      } else i2.rune && i2.rune < 8 && (r2 = $f(`rune${i2.rune + 1}`, e4[0].ilvl));
    }
    if (!r2 && e4.length === 7) {
      let t3 = e4.filter((e5) => e5.base.startsWith(`hp`)).length, n3 = e4.filter((e5) => e5.base.startsWith(`mp`)).length, i2 = e4.filter((e5) => e5.base.endsWith(`_chipped`)).length;
      t3 === 3 && n3 === 3 && i2 === 1 && (r2 = $f(`rejuv`, 1));
    }
    if (!r2) {
      this.message(`Nothing happens.`, `grey`), this.sound(`uiError`);
      return;
    }
    this.cube.clear(), this.cube.autoPlace(r2), this.sound(`uiTransmute`), this.message(`Transmuted: ${r2.name}`, `orange`), this.changed(`grids`), this.events.emit(`saveNeeded`, void 0);
  }
  transferGold(e4) {
    if (e4 > 0) {
      let t2 = Math.min(e4, this.ch.gold);
      this.ch.gold -= t2, this.ch.stashGold += t2;
    } else {
      let t2 = Math.min(-e4, this.ch.stashGold, this.ch.level * 1e4 - this.ch.gold);
      this.ch.stashGold -= t2, this.ch.gold += t2;
    }
    this.sound(`goldPickup`), this.changed(`hero`, `grids`);
  }
  persist() {
    let e4 = this.ch;
    e4.inventory = this.inv.list(), e4.stash = this.stash.list(), e4.cube = this.cube.list(), e4.cursorItem = this.cursor ? JSON.parse(JSON.stringify(this.cursor)) : null;
    let t2 = 0, n2 = (e5) => {
      t2 = Math.max(t2, e5.uid);
      for (let t3 of e5.socketed) n2(t3);
    };
    for (let t3 of [...e4.inventory, ...e4.stash, ...e4.cube]) n2(t3.item);
    for (let t3 of Object.values(e4.equipment)) t3 && n2(t3);
    for (let t3 of e4.belt) t3 && n2(t3);
    for (let t3 of e4.corpse?.items ?? []) n2(t3.item);
    return this.cursor && n2(this.cursor), e4.uidHigh = t2, e4.lastPlayed = Date.now(), this.merc && e4.merc && (e4.merc.dead = this.merc.dead), e4;
  }
  get className() {
    return rf[this.ch.classId].name;
  }
}, th = [`screen`, `loading`, `characters`, `hero`, `grids`, `equipment`, `belt`, `cursor`, `skills`, `quests`, `waypoints`, `vendor`, `dialog`, `target`, `merc`, `area`, `panels`, `death`, `options`, `toasts`, `boss`, `tracker`];
function nh() {
  return { masterVolume: 0.8, musicVolume: 0.55, sfxVolume: 0.8, ambienceVolume: 0.6, screenShake: true, damageNumbers: true, alwaysShowItemLabels: true, uiScale: 1, quality: `high` };
}
function rh(e4) {
  let t2 = {};
  for (let e5 of th) t2[e5] = 1;
  return { rev: t2, screen: `boot`, loading: null, characters: [], hero: null, inventory: null, stash: null, cube: null, equipment: { head: null, amulet: null, body: null, mainHand: null, offHand: null, ringLeft: null, ringRight: null, belt: null, gloves: null, boots: null }, belt: { rows: 1, slots: Array(16).fill(null) }, cursorItem: null, skills: null, quests: [], tracker: null, waypoints: [], vendor: null, dialog: null, target: null, boss: null, merc: null, area: null, openPanels: [], death: null, options: e4, toasts: [] };
}
var ih = { den: { name: `The Den of Rot`, desc: `Mother Isolde senses a festering evil in a cave on the Mournmoor. Purge every creature within.`, steps: { active: `Clear the Den of Rot`, rewardPending: `Return to Mother Isolde`, complete: `Completed`, locked: `` }, reward: `+1 Skill Point` }, bloodwitch: { name: `Veyra the Bloodwitch`, desc: `A fallen sister of the Vigil haunts the Gravewatch in the Hollow Fields, raising the dead. Put her to rest.`, steps: { active: `Slay Veyra in the Gravewatch`, rewardPending: `Return to Captain Maera`, complete: `Completed`, locked: `Reach the Hollow Fields` }, reward: `A free mercenary and the next difficulty` } }, ah = class {
  models;
  model;
  iconCache = /* @__PURE__ */ new Map();
  session = null;
  toastId = 1;
  constructor(e4, t2) {
    this.models = e4, this.model = rh(t2);
  }
  bump(...e4) {
    for (let t2 of e4) this.model.rev[t2] += 1;
  }
  icon(e4) {
    let t2 = Pf(e4), n2 = `${t2.visual}:${t2.w}x${t2.h}`, r2 = this.iconCache.get(n2);
    return r2 || (r2 = this.models.getItemIcon(t2.visual, t2.w, t2.h, 96), this.iconCache.set(n2, r2)), r2;
  }
  view(e4, t2 = null) {
    let n2 = this.session, r2 = n2.hero.d, i2 = bp(n2.ch);
    return pp(e4, { classId: n2.ch.classId, level: n2.ch.level, str: r2.attrs.str, dex: r2.attrs.dex, setCount: (e5) => i2.get(e5) ?? 0, icon: (e5) => this.icon(e5), vendor: t2 });
  }
  gridView(e4, t2, n2 = null) {
    return { id: e4, cols: t2.cols, rows: t2.rows, items: t2.list().map((e5) => ({ item: this.view(e5.item, n2), x: e5.x, y: e5.y })) };
  }
  toastRepeat = /* @__PURE__ */ new Map();
  toast(e4, t2 = `white`, n2 = 3.2) {
    let r2 = this.model.toasts, i2 = r2.find((n3) => (this.toastRepeat.get(n3.id)?.base ?? n3.text) === e4 && n3.color === t2);
    if (i2) {
      let t3 = this.toastRepeat.get(i2.id) ?? { base: e4, n: 1 };
      t3.n += 1, this.toastRepeat.set(i2.id, t3), i2.text = `${e4} ×${t3.n}`, i2.ttl = Math.max(i2.ttl, n2), this.bump(`toasts`);
      return;
    }
    if (r2.push({ id: this.toastId++, text: e4, color: t2, ttl: n2 }), r2.length > 5) {
      let e5 = r2.shift();
      e5 && this.toastRepeat.delete(e5.id);
    }
    this.bump(`toasts`);
  }
  tickToasts(e4) {
    let t2 = this.model.toasts;
    if (!t2.length) return;
    for (let n3 of t2) n3.ttl -= e4;
    let n2 = t2.length;
    for (let e5 of t2) e5.ttl <= 0 && this.toastRepeat.delete(e5.id);
    this.model.toasts = t2.filter((e5) => e5.ttl > 0), this.model.toasts.length !== n2 && this.bump(`toasts`);
  }
  syncHero() {
    let e4 = this.session;
    if (!e4) {
      this.model.hero = null;
      return;
    }
    let t2 = e4.hero, n2 = e4.ch, r2 = t2.d, i2 = { name: n2.name, classId: n2.classId, className: rf[n2.classId].name, level: n2.level, hardcore: n2.hardcore, xp: n2.xp, xpLevelStart: af[n2.level], xpLevelEnd: af[Math.min(99, n2.level + 1)], life: Math.max(0, Math.ceil(t2.life)), lifeMax: t2.lifeMax, mana: Math.floor(t2.mana), manaMax: t2.manaMax, stamina: Math.floor(t2.stamina), staminaMax: t2.staminaMax, running: (t2.ai.runToggle ?? 1) > 0, poisoned: t2.st.poison > 0, gold: n2.gold, goldMax: n2.level * 1e4, stashGold: n2.stashGold, statPoints: n2.statPoints, skillPoints: n2.skillPoints, attributes: { str: { base: n2.base.str, total: r2.attrs.str }, dex: { base: n2.base.dex, total: r2.attrs.dex }, vit: { base: n2.base.vit, total: r2.attrs.vit }, ene: { base: n2.base.ene, total: r2.attrs.ene } }, damageMin: r2.dmgMin, damageMax: r2.dmgMax, attackRating: r2.ar, defense: r2.def, blockChance: r2.block, resist: r2.res, resistCap: r2.resCap, fasterCastRate: r2.stats.fcr, attackSpeed: r2.stats.ias, fasterRunWalk: r2.stats.frw, magicFind: r2.stats.mf, goldFind: r2.stats.gf, lifeSteal: r2.stats.lifeSteal, manaSteal: r2.stats.manaSteal };
    this.model.hero ? Object.assign(this.model.hero, i2) : this.model.hero = i2;
  }
  syncVitals() {
    let e4 = this.session, t2 = this.model.hero;
    if (!e4 || !t2) return;
    let n2 = e4.hero;
    t2.life = Math.max(0, Math.ceil(n2.life)), t2.lifeMax = n2.lifeMax, t2.mana = Math.floor(n2.mana), t2.manaMax = n2.manaMax, t2.stamina = Math.floor(n2.stamina), t2.staminaMax = n2.staminaMax, t2.poisoned = n2.st.poison > 0, t2.xp = e4.ch.xp, t2.running = (n2.ai.runToggle ?? 1) > 0;
    let r2 = this.model.skills?.bar;
    if (r2) {
      for (let e5 of Object.keys(r2.cooldowns)) delete r2.cooldowns[e5];
      for (let [t3, i3] of n2.cooldowns) {
        let a2 = Cf[t3];
        if (!a2) continue;
        let o2 = a2.cooldown(Sp(e4.ch, n2.d, t3)) || 1;
        r2.cooldowns[t3] = Math.min(1, i3 / o2);
      }
    }
    let i2 = this.model.merc;
    i2 && e4.merc && (i2.life = Math.max(0, Math.ceil(e4.merc.life)), i2.lifeMax = e4.merc.lifeMax, i2.dead = e4.merc.dead);
  }
  syncGrids() {
    let e4 = this.session;
    e4 && (this.model.inventory = this.gridView(`inventory`, e4.inv, e4.vendor ? `sell` : null), this.model.stash = this.gridView(`stash`, e4.stash), this.model.cube = this.gridView(`cube`, e4.cube));
  }
  syncEquipment() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = this.model.equipment;
    for (let n2 of hp) {
      let r2 = e4.ch.equipment[n2];
      t2[n2] = r2 ? this.view(r2) : null;
    }
  }
  syncBelt() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.ch.equipment.belt, n2 = { rows: t2 ? Pf(t2).beltRows ?? 1 : 1, slots: e4.ch.belt.map((e5) => e5 ? this.view(e5) : null) };
    this.model.belt = n2;
  }
  syncCursor() {
    let e4 = this.session;
    this.model.cursorItem = e4?.cursor ? this.view(e4.cursor, e4.vendor ? `sell` : null) : null;
  }
  syncSkills() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.ch, n2 = e4.hero.d, r2 = rf[t2.classId].trees.map((e5, n3) => ({ name: e5, nodes: wf(t2.classId).filter((e6) => e6.tree === n3).map((e6) => this.skillNode(e6)) })), i2 = [Cf.attack, ...wf(t2.classId)].filter((e5) => e5.kind !== `passive` && (e5.id === `attack` || (t2.skills[e5.id] ?? 0) > 0)).map((e5) => ({ id: e5.id, manaCost: Math.round(e5.mana(Math.max(1, Sp(t2, n2, e5.id))) * 10) / 10, allowLeft: e5.allowLeft })), a2 = this.model.skills?.bar.cooldowns ?? {};
    this.model.skills = { trees: r2, bar: { left: t2.bar.left, right: t2.bar.right, hotkeys: [...t2.bar.hotkeys], available: i2, cooldowns: a2 } };
  }
  skillNode(e4) {
    let t2 = this.session, n2 = t2.ch, r2 = t2.hero.d, i2 = n2.skills[e4.id] ?? 0, a2 = i2 > 0 ? r2.skillBonus : 0, o2 = t2.canLearn(e4.id);
    return { id: e4.id, name: e4.name, tree: e4.tree, row: e4.row, col: e4.col, level: i2, bonus: a2, maxLevel: e4.maxLevel, reqLevel: e4.reqLevel, prereqs: [...e4.prereqs], passive: e4.kind === `passive`, allowLeft: e4.allowLeft, learnable: o2 === null, lockedReason: o2 ?? void 0, lines: this.skillLines(e4, i2, a2), manaCost: e4.kind === `passive` ? void 0 : Math.round(e4.mana(Math.max(1, i2 + a2)) * 10) / 10 };
  }
  skillLines(e4, t2, n2) {
    let r2 = this.session, i2 = [{ text: e4.name, color: `white`, size: `title` }];
    i2.push({ text: e4.desc, color: `tan` }), i2.push({ text: `Required Level: ${e4.reqLevel}`, color: r2.ch.level >= e4.reqLevel ? `tan` : `red`, size: `small` }), e4.prereqs.length && i2.push({ text: `Prerequisites: ${e4.prereqs.map((e5) => Cf[e5].name).join(`, `)}`, color: `tan`, size: `small` });
    let a2 = t2 + n2;
    if (a2 > 0) {
      i2.push({ text: `Current Skill Level: ${t2}${n2 ? ` (+${n2})` : ``}`, color: `white` });
      for (let t3 of this.effectText(e4, a2)) i2.push({ text: t3, color: `blue` });
    }
    if (t2 < e4.maxLevel) {
      i2.push({ text: t2 === 0 ? `First Level` : `Next Level`, color: `white` });
      for (let t3 of this.effectText(e4, a2 + 1)) i2.push({ text: t3, color: `tan` });
    }
    if (e4.synergies?.length) {
      i2.push({ text: `${e4.name} Receives Bonuses From:`, color: `green`, size: `small` });
      for (let t3 of e4.synergies) i2.push({ text: `${Cf[t3.skill].name}: +${t3.pct}% per level`, color: `green`, size: `small` });
    }
    return i2;
  }
  effectText(e4, t2) {
    let n2 = this.session, r2 = [], i2 = Cp(n2.ch, e4.id), a2 = e4.element === `physical` ? `` : `${e4.element[0].toUpperCase()}${e4.element.slice(1)} `;
    if (e4.dmg && e4.kind !== `summon`) {
      let [n3, o2] = e4.dmg(t2);
      r2.push(`${a2}Damage: ${Math.round(n3 * i2)}-${Math.round(o2 * i2)}`);
    }
    if (e4.kind === `summon` && e4.dmg) {
      let [n3, i3] = e4.dmg(t2);
      r2.push(`Damage: ${n3}-${i3}`);
    }
    if (e4.weaponPct) {
      let n3 = Math.round(e4.weaponPct(t2));
      e4.id === `ironHide` ? r2.push(`+${n3}% Defense`) : e4.id === `swiftness` ? r2.push(`+${n3}% Faster Run/Walk`) : e4.id === `rallyingRoar` ? r2.push(`+${n3}% Maximum Life and Mana`) : r2.push(`+${n3}% Damage`);
    }
    return e4.arPct && r2.push(`+${Math.round(e4.arPct(t2))}% Attack Rating`), e4.count && e4.kind !== `summon` && r2.push(`${e4.id === `chainLightning` ? `Hits` : `Missiles`}: ${e4.count(t2)}`), e4.kind === `summon` && e4.count && r2.push(`Maximum: ${e4.count(t2)}`), e4.radius && r2.push(`Radius: ${e4.radius(t2).toFixed(1)} yards`), e4.duration && r2.push(`${e4.element === `cold` ? `Chill ` : ``}Duration: ${e4.duration(t2).toFixed(1)} seconds`), e4.cooldown(t2) > 0.4 && r2.push(`Casting Delay: ${e4.cooldown(t2).toFixed(1)} seconds`), e4.kind !== `passive` && r2.push(`Mana Cost: ${Math.round(e4.mana(t2) * 10) / 10}`), r2;
  }
  syncQuests() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.ch.quests[e4.diff], n2 = [];
    for (let e5 of [`den`, `bloodwitch`]) {
      let r2 = ih[e5], i2 = t2[e5] ?? `locked`;
      n2.push({ id: e5, name: r2.name, status: i2, description: r2.desc, stepText: r2.steps[i2] ?? ``, rewardText: r2.reward });
    }
    this.model.quests = n2;
  }
  syncTracker() {
    let e4 = this.session;
    if (!e4) {
      this.model.tracker = null;
      return;
    }
    let t2 = e4.ch.quests[e4.diff], n2 = e4.world;
    t2.den === `active` && n2?.def.id === `den` ? this.model.tracker = { title: `The Den of Rot`, text: `${n2.enemiesAlive} creatures remain` } : t2.den === `rewardPending` ? this.model.tracker = { title: `The Den of Rot`, text: `Return to Mother Isolde` } : t2.bloodwitch === `active` && n2?.bossEngaged && n2.boss && !n2.boss.dead ? this.model.tracker = { title: `Veyra the Bloodwitch`, text: `Slay her among the graves` } : t2.bloodwitch === `active` ? this.model.tracker = { title: `Veyra the Bloodwitch`, text: `Find the Gravewatch in the Hollow Fields` } : t2.bloodwitch === `rewardPending` ? this.model.tracker = { title: `Veyra the Bloodwitch`, text: `Return to Captain Maera` } : t2.den === `active` ? this.model.tracker = { title: `The Den of Rot`, text: `Find the cave on the Mournmoor` } : this.model.tracker = null;
  }
  syncWaypoints() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.ch.waypoints[e4.diff], n2 = [`town`, `hollowFields`].map((n3) => ({ areaId: n3, name: Ep[n3].name, act: 1, active: t2.includes(n3), current: e4.world?.def.id === n3 }));
    this.model.waypoints = n2;
  }
  syncVendor() {
    let e4 = this.session?.vendor;
    this.model.vendor = e4 ? { npcName: e4.npc.name, tabs: e4.tabs.map((e5) => ({ name: e5.name, grid: this.gridView(`vendor`, e5.grid, `buy`) })) } : null;
  }
  syncMerc() {
    let e4 = this.session, t2 = e4?.merc;
    this.model.merc = t2 ? { name: t2.name, level: e4.ch.level, life: Math.ceil(t2.life), lifeMax: t2.lifeMax, dead: t2.dead } : null;
  }
  syncArea() {
    let e4 = this.session;
    this.model.area = e4?.world ? { name: e4.world.def.name, difficulty: e4.diff, inTown: e4.world.isTown } : null;
  }
  syncAll() {
    this.syncHero(), this.syncGrids(), this.syncEquipment(), this.syncBelt(), this.syncCursor(), this.syncSkills(), this.syncQuests(), this.syncTracker(), this.syncWaypoints(), this.syncVendor(), this.syncMerc(), this.syncArea(), this.bump(`hero`, `grids`, `equipment`, `belt`, `cursor`, `skills`, `quests`, `tracker`, `waypoints`, `vendor`, `merc`, `area`);
  }
  apply(e4) {
    let t2 = new Set(e4);
    t2.has(`hero`) && this.syncHero(), t2.has(`grids`) && this.syncGrids(), t2.has(`equipment`) && this.syncEquipment(), t2.has(`belt`) && this.syncBelt(), t2.has(`cursor`) && this.syncCursor(), t2.has(`skills`) && this.syncSkills(), t2.has(`quests`) && this.syncQuests(), t2.has(`tracker`) && this.syncTracker(), t2.has(`waypoints`) && this.syncWaypoints(), t2.has(`vendor`) && this.syncVendor(), t2.has(`merc`) && this.syncMerc(), t2.has(`area`) && this.syncArea(), t2.has(`hero`) && !t2.has(`grids`) && this.usabilityKey() !== this.lastUsability && (this.syncGrids(), t2.add(`grids`)), t2.has(`grids`) && (this.lastUsability = this.usabilityKey()), this.bump(...t2);
  }
  lastUsability = ``;
  usabilityKey() {
    let e4 = this.session;
    if (!e4) return ``;
    let t2 = e4.hero.d;
    return `${e4.ch.level}|${t2?.attrs.str ?? 0}|${t2?.attrs.dex ?? 0}|${e4.vendor ? e4.ch.gold : 0}`;
  }
  setCharacters(e4) {
    this.model.characters = e4, this.bump(`characters`);
  }
};
function oh() {
  return [`sorceress`, `barbarian`, `necromancer`];
}

// Monsters: definitions, level scaling, elites (champions / uniques with D2-style modifiers),
// AI (melee, ranged, caster, shaman revive, brute slam, bats, boss), and player minions (allies).
import * as THREE from 'three';
import { G, hash, enemiesNear, corpsesNear, Events, after } from './state.js';
import { Actor, addActor } from './actor.js';
import { clamp, RNG } from './util.js';
import { createMonster } from './models.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { Engine } from './engine.js';
import { resolveAttack, dealDamage, rnd, areaDamage, heal, floatAt } from './combat.js';
import { spawnProjectile } from './projectiles.js';

// hp, dmg, def, ar, xp are multipliers on the level curves
export const MDEF = {
  zombie: { name: 'Hollowed', fam: 'undead', hp: 1.65, dmg: 1.15, def: 0.7, ar: 0.95, xp: 1.0, speed: 1.35, range: 1.45, cd: 1.6, aggro: 11, snd: 'zombie', blood: 0x2f2410, attacks: ['attack1', 'attack2'], hitDiv: 8 },
  skeleton: { name: 'Bone Warrior', fam: 'undead', hp: 1.0, dmg: 1.0, def: 1.35, ar: 1.1, xp: 1.1, speed: 2.9, range: 1.55, cd: 1.15, block: 22, res: { poison: 15 }, snd: 'skel', blood: null, attacks: ['attack1', 'attack2'] },
  skeleton_archer: { name: 'Bone Archer', fam: 'undead', hp: 0.75, dmg: 0.85, def: 1.0, ar: 1.2, xp: 1.15, speed: 2.7, range: 11, keep: 6.5, cd: 1.7, beh: 'ranged', proj: 'arrow', pspeed: 15, snd: 'skel', blood: null, shootClip: 'shoot' },
  skeleton_mage: { name: 'Bone Mage', fam: 'undead', hp: 0.7, dmg: 0.95, def: 0.9, ar: 1, xp: 1.3, speed: 2.6, range: 11.5, keep: 7, cd: 2.1, beh: 'caster', snd: 'skel', blood: null, shootClip: 'cast' },
  imp: { name: 'Groveling', fam: 'demon', hp: 0.55, dmg: 0.68, def: 0.9, ar: 1.0, xp: 0.7, speed: 3.7, range: 1.25, cd: 1.45, flees: true, snd: 'imp', blood: 0x5a0808, attacks: ['attack1', 'attack2', 'attack3'] },
  imp_shaman: { name: 'Groveling Shaman', fam: 'demon', hp: 0.8, dmg: 1.0, def: 0.8, ar: 1, xp: 1.5, speed: 3.2, range: 9.5, keep: 6, cd: 2.3, beh: 'shaman', proj: 'shaman_fire', pspeed: 9.5, res: { fire: 50 }, snd: 'imp', blood: 0x5a0808, shootClip: 'cast' },
  spider: { name: 'Gloom Spider', fam: 'beast', hp: 0.85, dmg: 0.85, def: 1.0, ar: 1.15, xp: 1.0, speed: 4.3, range: 1.45, cd: 1.0, poison: 0.7, res: { poison: 50 }, snd: 'spider', blood: 0x2d4a12, attacks: ['attack1'] },
  wraith: { name: 'Wraith', fam: 'undead', hp: 1.1, dmg: 0.95, def: 1.2, ar: 1.1, xp: 1.4, speed: 2.8, range: 1.5, cd: 1.25, manaBurn: 1, physRes: 25, res: { cold: 30, poison: 30 }, snd: 'wraith', blood: null, attacks: ['attack1', 'cast'] },
  brute: { name: 'Pit Fiend', fam: 'demon', hp: 3.2, dmg: 2.0, def: 1.5, ar: 1.2, xp: 2.6, speed: 2.5, range: 2.15, cd: 2.1, slam: true, heavy: true, res: { fire: 25 }, physRes: 10, snd: 'brute', blood: 0x4a0505, attacks: ['attack1', 'attack2'], hitDiv: 6 },
  bat: { name: 'Carrion Bat', fam: 'beast', hp: 0.45, dmg: 0.6, def: 0.8, ar: 1.1, xp: 0.6, speed: 5.4, range: 1.35, cd: 0.85, erratic: true, snd: 'bat', blood: 0x3a0505, attacks: ['attack1'] },
  hollow_king: { name: 'The Hollow King', fam: 'undead', hp: 38, dmg: 2.6, def: 2.4, ar: 2.2, xp: 40, speed: 3.0, range: 3.4, cd: 1.5, boss: true, heavy: true, res: { fire: 50, cold: 30, light: 30, poison: 35 }, snd: 'boss', blood: null, attacks: ['attack1', 'attack2'] },
  bone_golem: { name: 'Bone Golem', fam: 'undead', hp: 4, dmg: 1.6, def: 2, ar: 1.4, xp: 0, speed: 3.2, range: 2.0, cd: 1.4, heavy: true, snd: 'skel', blood: null, attacks: ['attack1', 'attack2'] },
  ancestor: { name: 'Ancestral Spirit', fam: 'spirit', hp: 3, dmg: 1.4, def: 1.5, ar: 1.6, xp: 0, speed: 4.4, range: 1.8, cd: 1.0, snd: 'skel', blood: null, attacks: ['attack1', 'attack2', 'attack3'] },
};

export const curves = {
  hp: m => 4 + 3.2 * m + 0.18 * m * m,
  dmg: m => 0.4 + 0.8 * m + 0.026 * m * m,   // gentler first levels (monsters now attack every cooldown), converges by mlvl ~40
  def: m => 4 + 6 * m,
  ar: m => 10 + 9 * m,
  xp: m => 9 + 5 * m + 0.35 * m * m,
};

const MOD_NAMES = {
  extra_strong: 'Extra Strong', extra_fast: 'Extra Fast', cursed: 'Cursed', fire_enchanted: 'Fire Enchanted', cold_enchanted: 'Cold Enchanted',
  lightning_enchanted: 'Lightning Enchanted', stone_skin: 'Stone Skin', mana_burn: 'Mana Burn', teleportation: 'Teleportation',
  magic_resistant: 'Magic Resistant', multishot: 'Multiple Shots', spectral_hit: 'Spectral Hit', might: 'Might Aura',
};
const MOD_POOL = ['extra_strong', 'extra_fast', 'cursed', 'fire_enchanted', 'cold_enchanted', 'lightning_enchanted', 'stone_skin', 'mana_burn', 'teleportation', 'spectral_hit', 'might', 'magic_resistant'];
const RANGED_KINDS = new Set(['skeleton_archer', 'skeleton_mage', 'imp_shaman']);
const UN_A = ['Grim', 'Bone', 'Rot', 'Gore', 'Ash', 'Blight', 'Dread', 'Gloom', 'Murk', 'Rust', 'Skull', 'Vile', 'Wither', 'Black', 'Pale', 'Foul', 'Sour', 'Cinder', 'Bile', 'Hate'];
const UN_B = ['maw', 'fang', 'gut', 'claw', 'hide', 'jaw', 'rend', 'bile', 'shank', 'grin', 'howl', 'spine', 'tooth', 'skin', 'eye', 'hand', 'heart', 'brow'];
const UN_C = ['the Wretched', 'the Gnawer', 'the Unclean', 'the Flayer', 'the Hungry', 'the Defiler', 'the Cursed', 'the Bloated', 'the Hollow', 'the Grim', 'the Mad', 'the Rotten', 'the Butcher', 'the Pale'];
export function uniqueName(rng) { return rng.pick(UN_A) + rng.pick(UN_B) + ' ' + rng.pick(UN_C); }

const SND_FIX = { spider_hit: 'hit_flesh', wraith_hit: 'wraith_alert', bat_alert: 'bat_flap', bat_hit: 'hit_flesh', boss_alert: 'boss_roar', boss_hit: 'hit_bone' };
const sname = n => SND_FIX[n] || n;
const _list = [], _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _fd = { x: 0, z: 0 };

// ------------------------------------------------------------------ Monster class
export class Monster extends Actor {
  constructor(type, mlvl, o = {}) {
    const def = MDEF[type] || MDEF.zombie;
    const model = createMonster(type, { ally: !!o.ally, element: o.element, champion: o.elite === 'champion', unique: o.elite === 'unique' || o.elite === 'superunique', tint: o.tint, scale: o.scale, seed: o.seed });
    super({ kind: o.ally ? 'minion' : 'monster', type, team: o.ally ? 0 : 1, model, level: mlvl, name: o.name || def.name, isBoss: !!def.boss });
    this.mdef = def; this.elite = o.elite || null; this.mods = o.mods || []; // mdef = MDEF entry; this.def stays numeric defense (Actor contract)
    this.element = o.element || (type === 'skeleton_mage' ? ['fire', 'cold', 'light'][Math.floor(Math.random() * 3)] : null);
    this.home = new THREE.Vector3(o.x ?? 0, 0, o.z ?? 0);
    this.state = 'idle'; this.target = null; this.thinkT = Math.random() * 0.4; this.cd = Math.random() * 0.8; this.wanderT = 1 + Math.random() * 3;
    this.alertPlayed = false; this.special = {}; this.pack = o.pack || null; this.owner = o.owner || null;
    this.heavy = !!def.heavy; this.bloodColor = def.blood ?? null; this.drain = def.fam === 'undead' ? 0.25 : 1;
    this.hitRecoverDiv = def.hitDiv || 10;
    this.packKind = o.packKind || (this.elite || 'normal');
    this.applyStats(mlvl, o);
    this.pos.set(o.x ?? 0, 0, o.z ?? 0);
    this.facing = Math.random() * Math.PI * 2; this.root.rotation.y = this.facing;
    if (this.mods.includes('might')) this.special.auraFx = FX.aura(this.model, 0xff4020, 3);
    if (this.elite === 'unique' || this.elite === 'superunique') this.special.eliteFx = null;
  }
  applyStats(mlvl, o = {}) {
    const d = this.mdef, dif = G.difficulty;
    let hp = curves.hp(mlvl) * d.hp, dmg = curves.dmg(mlvl) * d.dmg, def = curves.def(mlvl) * d.def, ar = curves.ar(mlvl) * d.ar, xp = curves.xp(mlvl) * d.xp;
    let speed = d.speed;
    if (this.elite === 'champion') { hp *= [3, 2.5, 2][dif]; dmg *= 1.9; ar *= 1.67; speed *= 1.2; xp *= 3; }
    if (this.elite === 'unique' || this.elite === 'superunique') { hp *= [4, 3, 2.5][dif]; dmg *= 1.6; ar *= 1.5; xp *= 5; }
    if (this.elite === 'minion') { hp *= 1.5; xp *= 1.5; }
    if (o.hpMul) hp *= o.hpMul;
    if (o.dmgMul) dmg *= o.dmgMul;
    this.maxLife = this.life = Math.max(1, Math.round(hp));
    this.dmgMin = dmg * 0.75; this.dmgMax = dmg * 1.25;
    this.def = def; this.ar = ar; this.xp = Math.round(xp);
    this.moveSpeed = speed * (0.92 + Math.random() * 0.16);
    this.atkSpeed = 1;
    this.blockChance = d.block || 0;
    this.res = { fire: 0, cold: 0, light: 0, poison: 0, ...(d.res || {}) };
    this.physRes = d.physRes || 0;
    if (dif > 0 && !this.owner) { for (const k in this.res) this.res[k] += dif * 20; }
    if (dif === 2 && !d.boss && !this.owner && Math.random() < 0.3) {
      const pick = { undead: ['cold', 'poison'], demon: ['fire', 'light'], beast: ['poison', 'light'] }[d.fam] || ['fire'];
      this.res[pick[Math.floor(Math.random() * pick.length)]] = 110;
    }
    this.elem = null;
    for (const m of this.mods) this.applyMod(m);
    if (d.poison) this.elem = { ...(this.elem || {}), poison: dmg * d.poison * 2 };
  }
  applyMod(m) {
    const avg = (this.dmgMin + this.dmgMax) / 2;
    const e = this.elem || (this.elem = {});
    switch (m) {
      case 'extra_strong': this.dmgMin *= 2.2; this.dmgMax *= 2.2; this.ar *= 1.8; break;
      case 'extra_fast': this.moveSpeed *= 1.6; this.atkSpeed *= 1.3; break;
      case 'stone_skin': this.physRes += 50; this.def *= 2; break;
      case 'magic_resistant': this.res.fire += 40; this.res.cold += 40; this.res.light += 40; break;
      case 'fire_enchanted': e.fireMin = avg * 0.66; e.fireMax = avg * 1.0; this.res.fire += 75; break;
      case 'cold_enchanted': e.coldMin = avg * 0.66; e.coldMax = avg * 1.0; this.res.cold += 75; break;
      case 'lightning_enchanted': e.lightMin = avg * 0.2; e.lightMax = avg * 1.6; this.res.light += 75; break;
      case 'spectral_hit': this.res.fire += 20; this.res.cold += 20; this.res.light += 20; break;
      case 'mana_burn': this.manaBurn = true; break;
    }
  }
  get displayKind() { return this.isBoss ? 'boss' : this.elite === 'champion' ? 'champion' : (this.elite === 'unique' || this.elite === 'superunique') ? 'unique' : this.elite === 'minion' ? 'minion' : this.team === 0 ? 'minion' : 'normal'; }
  get modNames() { return this.mods.map(m => MOD_NAMES[m]).filter(Boolean); }

  // ---------------------------------------------------------------- AI
  update(dt) {
    if (this.dead) { this.deadUpdate(dt); return; }
    this.tickStatus(dt);
    if (this.dead) return;
    if (this.life <= 0) return;
    this.tickAction(dt);
    if (this.special.tempT !== undefined) { this.special.tempT -= dt; if (this.special.tempT <= 0) { this.expire(); return; } }
    let speed = 0;
    if (!this.stunned && this.st.knockT <= 0) speed = this.think(dt);
    this.separate(dt, this.heavy ? 0.3 : 1);
    this.collide();
    this.speedNow = speed;
    this.updateModel(dt, speed);
  }
  deadUpdate(dt) {
    this.deadT += dt;
    this.model.update(dt, { speed: 0 });
    if (!this.corpse && this.deadT > 0.1 && !this.removed && this.root.visible === false) { this.removeFromWorld(); return; }
    if (this.deadT > 75 && !this.isBoss) {
      const k = (this.deadT - 75) / 3;
      this.model.setOpacity(Math.max(0, 1 - k)); this.root.position.y = -k * 0.4;
      if (k >= 1) { this.corpse = false; this.removeFromWorld(); }
    }
  }
  expire() { // temporary minions
    FX.summon(this.pos, this.type === 'ancestor' ? 0x9fd0ff : 0x60ff60);
    this.dead = true; this.corpse = false; this.removeFromWorld();
  }
  pickTarget() {
    const r = this.team === 0 ? 11 : (this.state === 'idle' ? (this.mdef.aggro || (G.level?.outdoor ? 12 : 10)) : 24);
    let best = null, bd = 1e9;
    const cx = this.team === 0 && this.owner ? this.owner.pos.x : this.pos.x, cz = this.team === 0 && this.owner ? this.owner.pos.z : this.pos.z;
    enemiesNear(cx, cz, r, this.team, _list);
    for (const a of _list) {
      if (a.kind === 'npc') continue;
      const d = Math.hypot(a.pos.x - this.pos.x, a.pos.z - this.pos.z) + (a.taunt ? -6 : 0);
      if (d < bd && (this.state !== 'idle' || G.nav.los(this.pos.x, this.pos.z, a.pos.x, a.pos.z))) { bd = d; best = a; }
    }
    return best;
  }
  aggroPack() {
    if (this.pack) for (const m of this.pack.members) if (m !== this && !m.dead && m.state === 'idle') { m.state = 'chase'; m.target = this.target; }
  }
  think(dt) {
    const d = this.mdef, P = G.player;
    // fear
    if (this.st.fear > 0) {
      const dx = this.pos.x - this.st.fearX, dz = this.pos.z - this.st.fearZ, l = Math.hypot(dx, dz) || 1;
      const sp = this.moveSpeed * 1.1 * this.slowMul();
      const nx = this.pos.x + dx / l * 2, nz = this.pos.z + dz / l * 2;
      if (G.nav.walkableAt(nx, nz)) { this.steer(nx, nz, sp, dt); return sp; }
      return 0;
    }
    if (this.action && this.action.lock) return 0;
    if (G.cine || this.dormant) return 0; // cinematics freeze AI; a dormant boss waits on its throne
    this.cd -= dt * this.slowMul();
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = 0.35 + Math.random() * 0.2;
      if (!this.target || this.target.dead || this.target.removed || Math.hypot(this.target.pos.x - this.pos.x, this.target.pos.z - this.pos.z) > 26) {
        const t = this.pickTarget();
        if (t) {
          if (this.state === 'idle' && this.team === 1 && !this.alertPlayed) { this.alertPlayed = true; Audio.play(sname((d.snd || 'zombie') + '_alert'), { pos: this.pos, vol: 0.8 }); }
          this.target = t; this.state = 'chase'; this.aggroPack();
        } else if (this.team === 1) { this.target = null; if (this.state !== 'idle') this.state = 'return'; }
        else { this.target = null; this.state = 'follow'; }
      }
      if (this.team === 1 && this.lastHitBy && !this.lastHitBy.dead && this.state === 'idle') { this.target = this.lastHitBy; this.state = 'chase'; this.aggroPack(); }
      if (this.mods.includes('teleportation') && this.target && !this.special.tpCd) this.maybeTeleport();
    }
    if (this.special.tpCd) { this.special.tpCd -= dt; if (this.special.tpCd <= 0) this.special.tpCd = 0; }
    // allies: follow owner
    if (this.team === 0 && this.owner) {
      const o = this.owner, od = Math.hypot(o.pos.x - this.pos.x, o.pos.z - this.pos.z);
      if (od > 26) { this.warpTo(o.pos.x, o.pos.z); return 0; }
      if (!this.target || this.state === 'follow') {
        if (od > 4.5) return this.moveTo(o.pos.x, o.pos.z, dt, this.moveSpeed * (od > 9 ? 1.4 : 1), 3.5);
        this.wander(dt, o.pos, 3); return this.speedNow * 0.4;
      }
      if (od > 16) { this.target = null; this.state = 'follow'; return this.moveTo(o.pos.x, o.pos.z, dt, this.moveSpeed * 1.4, 3.5); }
    }
    if (this.state === 'idle') { return this.wander(dt, this.home, 3.5); }
    if (this.state === 'return') {
      const hd = Math.hypot(this.home.x - this.pos.x, this.home.z - this.pos.z);
      if (hd < 2) { this.state = 'idle'; return 0; }
      return this.moveTo(this.home.x, this.home.z, dt, this.moveSpeed * 0.7, 1);
    }
    const t = this.target; if (!t) return 0;
    const dist = Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z) - t.radius;
    if (this.isBoss) return this.bossThink(dt, t, dist);
    const beh = this.team === 0 && this.type === 'skeleton_mage' ? 'caster' : (d.beh || 'melee');
    // brute slam
    if (d.slam && this.cd <= 0 && dist < 2.8 && (this.special.slamCd || 0) <= 0 && Math.random() < 0.4) { this.special.slamCd = 6; return this.doSlam(t); }
    if (this.special.slamCd > 0) this.special.slamCd -= dt;
    if (beh === 'shaman' && this.tryRevive(dt)) return this.speedNow;
    if (beh === 'ranged' || beh === 'caster' || beh === 'shaman') {
      const los = G.nav.los(this.pos.x, this.pos.z, t.pos.x, t.pos.z);
      if (los && dist <= (d.range || 10)) {
        if (dist < (d.keep || 5) && this.team === 1) {
          const dx = this.pos.x - t.pos.x, dz = this.pos.z - t.pos.z, l = Math.hypot(dx, dz) || 1;
          const nx = this.pos.x + dx / l * 2.5, nz = this.pos.z + dz / l * 2.5;
          if (G.nav.walkableAt(nx, nz) && this.cd > 0.3) { this.steer(nx, nz, this.moveSpeed * 0.8 * this.slowMul(), dt); return this.moveSpeed * 0.8; }
        }
        if (this.cd <= 0) { this.shoot(t); return 0; }
        this.face(t.pos.x, t.pos.z); return 0;
      }
      return this.moveTo(t.pos.x, t.pos.z, dt, this.moveSpeed * this.slowMul(), 1);
    }
    // melee
    if (dist <= (d.range || 1.4) + this.radius * 0.3) {
      this.face(t.pos.x, t.pos.z);
      if (this.cd <= 0) this.meleeAttack(t);
      return 0;
    }
    if (d.erratic) {
      const s = this.special; s.zig = (s.zig || 0) + dt * 6;
      const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, l = Math.hypot(dx, dz) || 1;
      const ox = -dz / l * Math.sin(s.zig) * 2.5, oz = dx / l * Math.sin(s.zig) * 2.5;
      return this.moveTo(t.pos.x + ox, t.pos.z + oz, dt, this.moveSpeed * this.slowMul(), 0.2);
    }
    return this.moveTo(t.pos.x, t.pos.z, dt, this.moveSpeed * this.slowMul(), (d.range || 1.4) * 0.8);
  }
  wander(dt, center, r) {
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = 2 + Math.random() * 4;
      const a = Math.random() * Math.PI * 2, rr = Math.random() * r;
      const x = center.x + Math.cos(a) * rr, z = center.z + Math.sin(a) * rr;
      this.wanderTo = G.nav.walkableAt(x, z) ? { x, z } : null;
      if (Math.random() < 0.4) this.wanderTo = null;
    }
    if (this.wanderTo) {
      const sp = this.moveSpeed * 0.32;
      const rem = this.steer(this.wanderTo.x, this.wanderTo.z, sp, dt, 0.2);
      if (rem <= 0.2) this.wanderTo = null;
      return sp;
    }
    return 0;
  }
  moveTo(x, z, dt, speed, stopDist = 0.5) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d <= stopDist) return 0;
    // direct if LOS
    const nav = G.nav;
    if (d < 16 && nav.los(this.pos.x, this.pos.z, x, z) && nav._clearWide(this.pos.x, this.pos.z, x, z)) { this.path = null; this.steer(x, z, speed, dt, stopDist); return speed; }
    // follow player flow field
    if (this.target === G.player && nav.flowDist(this.pos.x, this.pos.z) < 1e8) {
      if (nav.flowDir(this.pos.x, this.pos.z, _fd)) { this.steer(this.pos.x + _fd.x, this.pos.z + _fd.z, speed, dt, 0); return speed; }
    }
    // A* (throttled)
    this.special.pathT = (this.special.pathT || 0) - dt;
    if (!this.path || this.special.pathT <= 0) { this.path = nav.path(this.pos.x, this.pos.z, x, z, 2500); this.pathI = 0; this.special.pathT = 0.8 + Math.random() * 0.4; }
    if (this.path && this.followPath(dt, speed)) return speed;
    this.steer(x, z, speed, dt, stopDist); return speed;
  }
  warpTo(x, z) {
    const a = Math.random() * Math.PI * 2; const p = G.nav.nearestWalkable(x + Math.cos(a) * 1.5, z + Math.sin(a) * 1.5, 4);
    FX.teleport(this.pos.clone(), new THREE.Vector3(p.x, 0, p.z)); this.pos.set(p.x, 0, p.z); this.path = null;
  }
  maybeTeleport() {
    const t = this.target; if (!t) return;
    const low = this.life < this.maxLife * 0.3, far = Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z) > 9;
    if (!(low && Math.random() < 0.5) && !(far && Math.random() < 0.25)) return;
    const a = Math.random() * Math.PI * 2, r = low ? 9 : 2.5;
    const p = G.nav.nearestWalkable(t.pos.x + Math.cos(a) * r, t.pos.z + Math.sin(a) * r, 4);
    FX.teleport(this.pos.clone(), new THREE.Vector3(p.x, 0, p.z)); Audio.play('teleport', { pos: this.pos, vol: 0.7 });
    this.pos.set(p.x, 0, p.z); this.special.tpCd = 3.5; if (low) heal(this, this.maxLife * 0.08);
  }
  packetFor(t) {
    const p = { phys: rnd(this.dmgMin, this.dmgMax), ar: this.ar, isAttack: true, melee: true };
    const e = this.elem;
    if (e) {
      if (e.fireMax) p.fire = rnd(e.fireMin, e.fireMax);
      if (e.coldMax) { p.cold = rnd(e.coldMin, e.coldMax); p.coldDur = 2.5; }
      if (e.lightMax) p.light = rnd(e.lightMin, e.lightMax);
      if (e.poison) { p.poison = e.poison; p.poisonDur = 3; }
    }
    if (this.mods.includes('spectral_hit')) { const k = ['fire', 'cold', 'light'][Math.floor(Math.random() * 3)]; p[k] = (p[k] || 0) + (this.dmgMin + this.dmgMax) * 0.4; if (k === 'cold') p.coldDur = 1.6; }
    if (this.manaBurn || this.mdef.manaBurn) p.mana = p.phys * 1.2;
    if (this.mightNear) { p.phys *= 1.5; }
    return p;
  }
  meleeAttack(t) {
    const d = this.mdef, clip = d.attacks ? d.attacks[Math.floor(Math.random() * d.attacks.length)] : 'attack1';
    this.cd = d.cd * (0.85 + Math.random() * 0.3) / this.atkSpeed;
    const sp = this.atkSpeed * this.slowMul() * (this.type === 'zombie' ? 0.85 : 1);
    this.face(t.pos.x, t.pos.z, false);
    Audio.play(this.type === 'brute' || this.isBoss ? 'swing_heavy' : 'swing_light', { pos: this.pos, vol: 0.5 });
    this.startAction('attack', clip, {
      speed: sp, onImpact: () => {
        if (t.dead) return;
        const dd = Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z) - t.radius;
        if (dd > (d.range || 1.4) + 1.0) return;
        const res = resolveAttack(this, t, this.packetFor(t));
        if (res === 'hit' || res === 'killed') {
          Audio.play(t.kind === 'player' ? 'hit_flesh' : (/skel|golem/.test(t.type) ? 'hit_bone' : 'hit_flesh'), { pos: t.pos, vol: 0.7 });
          if (this.mods.includes('cursed') && t.kind === 'player' && Math.random() < 0.75) t.applyCurse('amplify_damage', 4, {});
        }
      },
    });
  }
  shoot(t) {
    const d = this.mdef;
    this.cd = d.cd * (0.85 + Math.random() * 0.3) / this.atkSpeed;
    this.face(t.pos.x, t.pos.z, true);
    const clip = d.shootClip || 'cast';
    this.startAction('shoot', this.model.clipInfo[clip] ? clip : 'attack1', {
      speed: this.atkSpeed * this.slowMul(), onImpact: () => {
        if (t.dead) return;
        const from = _v.set(this.pos.x, this.pos.y + this.height * 0.62, this.pos.z);
        const tx = t.pos.x + (t.vel?.x || 0) * 0.25, tz = t.pos.z + (t.vel?.z || 0) * 0.25;
        const dir = _v2.set(tx - from.x, 0, tz - from.z).normalize();
        const n = this.mods.includes('multishot') ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const a = (i - (n - 1) / 2) * 0.22, c = Math.cos(a), s = Math.sin(a);
          const dd = new THREE.Vector3(dir.x * c - dir.z * s, 0, dir.x * s + dir.z * c);
          let kind = d.proj || 'arrow', p;
          const base = rnd(this.dmgMin, this.dmgMax);
          if (this.type === 'skeleton_mage') {
            const el = this.element || 'fire';
            kind = el === 'fire' ? 'mage_fire' : el === 'cold' ? 'mage_cold' : 'mage_light';
            p = el === 'fire' ? { fire: base * 1.1 } : el === 'cold' ? { cold: base * 0.9, coldDur: 2.5 } : { light: base * rnd(0.3, 1.8) };
            Audio.play('monster_cast', { pos: this.pos, vol: 0.6 });
          } else if (this.type === 'imp_shaman') { p = { fire: base * 1.2 }; Audio.play('shaman_cast', { pos: this.pos, vol: 0.7 }); }
          else { p = { phys: base, isAttack: true, melee: false, ar: this.ar }; Audio.play('arrow_shoot', { pos: this.pos, vol: 0.6 }); }
          if (this.mightNear) for (const k in p) if (typeof p[k] === 'number' && k !== 'ar' && k !== 'coldDur') p[k] *= 1.5;
          spawnProjectile({ kind, pos: from.clone(), dir: dd, speed: d.pspeed || 11, range: (d.range || 10) + 4, team: this.team, owner: this, packet: p, radius: 0.35, autoAttack: kind === 'arrow' });
        }
      },
    });
  }
  doSlam(t) {
    this.cd = 2.2;
    this.face(t.pos.x, t.pos.z, true);
    Audio.play('brute_alert', { pos: this.pos, vol: 0.6 });
    this.startAction('slam', this.model.clipInfo.slam ? 'slam' : 'attack2', {
      speed: this.atkSpeed * this.slowMul(), onImpact: () => {
        const fx = this.pos.x + Math.sin(this.facing) * 1.6, fz = this.pos.z + Math.cos(this.facing) * 1.6;
        FX.shockwave(new THREE.Vector3(fx, 0, fz), 3.4); Audio.play('brute_slam', { pos: this.pos });
        if (G.player && Math.hypot(G.player.pos.x - fx, G.player.pos.z - fz) < 9) Engine.rig.shake(0.35);
        areaDamage(fx, fz, 3.2, this.team, () => ({ phys: rnd(this.dmgMin, this.dmgMax) * 1.3, knock: 2.2, kx: fx, kz: fz, stun: 0.6, ar: this.ar, melee: false }), this);
      },
    });
    return 0;
  }
  tryRevive(dt) {
    if ((this.special.revCd || 0) > 0) { this.special.revCd -= dt; return false; }
    const cs = corpsesNear(this.pos.x, this.pos.z, 13, c => c.type === 'imp' && c.team === this.team && c.corpse && !c.consumed && !c.root.visible === false);
    const c = cs[0]; if (!c) { this.special.revCd = 1.5; return false; }
    const d = Math.hypot(c.pos.x - this.pos.x, c.pos.z - this.pos.z);
    if (d > 7) { this.moveTo(c.pos.x, c.pos.z, dt, this.moveSpeed, 5); this.speedNow = this.moveSpeed; return true; }
    this.special.revCd = 5;
    this.face(c.pos.x, c.pos.z, true);
    this.startAction('revive', this.model.clipInfo.revive ? 'revive' : 'cast', {
      onImpact: () => { if (c.corpse && !c.consumed && c.dead) { reviveMonster(c); Audio.play('shaman_revive', { pos: c.pos }); } },
    });
    this.speedNow = 0; return true;
  }
  onHitRecover(src, dmg) {
    if (this.action && (this.action.type === 'slam' || this.action.type === 'revive') ) return;
    this.hitImmuneT = 0.6;
    this.startAction('hit', 'hit', { speed: 1.3, lock: true });
    Audio.play(sname((this.mdef.snd || 'zombie') + '_hit'), { pos: this.pos, vol: 0.55 });
  }
  onHurt(total, src, p) {
    if (this.state === 'idle' && src) { this.target = src.kind === 'projectile' ? src.owner : src; this.state = 'chase'; this.aggroPack(); }
    if (this.mods.includes('lightning_enchanted') && total > 0 && Math.random() < 0.45 && (this.special.leT || 0) < G.time) {
      this.special.leT = G.time + 0.5;
      const n = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        spawnProjectile({ kind: 'charged_bolt', pos: new THREE.Vector3(this.pos.x, this.pos.y + 1, this.pos.z), dir: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), speed: 7, range: 9, team: this.team, owner: this, packet: { light: rnd(this.dmgMin, this.dmgMax) * 0.7 }, radius: 0.35, erratic: true });
      }
      Audio.play('charged_bolt', { pos: this.pos, vol: 0.6 });
    }
  }
  onDeath(src, p, deathType) {
    Audio.play(sname((this.mdef.snd || 'zombie') + '_death'), { pos: this.pos, vol: 0.9 });
    this.special.auraFx?.stop?.();
    if (this.mods.includes('fire_enchanted')) {
      const pos = this.pos.clone();
      FX.explosion(pos, { radius: 3, element: 'fire' }); Audio.play('fireball_explode', { pos });
      areaDamage(pos.x, pos.z, 3, this.team, () => ({ fire: (this.dmgMin + this.dmgMax) * 1.1, noHitRec: false }), this);
    }
    if (this.mods.includes('cold_enchanted')) {
      const pos = this.pos.clone();
      FX.nova(pos, { radius: 5, element: 'cold' }); Audio.play('frost_nova', { pos });
      areaDamage(pos.x, pos.z, 5, this.team, () => ({ cold: (this.dmgMin + this.dmgMax) * 0.8, coldDur: 3 }), this);
    }
    // imps flee when packmates die (unless a shaman is around them... they still flee briefly)
    if (this.type === 'imp' && this.team === 1) {
      enemiesNear(this.pos.x, this.pos.z, 9, 0, _list); // returns team != 0 => monsters
      for (const m of _list) if (m.type === 'imp' && !m.dead && m.st.fear <= 0 && Math.random() < 0.85) {
        m.st.fear = 1.8 + Math.random() * 1.4; m.st.fearX = this.pos.x; m.st.fearZ = this.pos.z; m.cancelAction();
        if (Math.random() < 0.4) Audio.play('imp_flee', { pos: m.pos, vol: 0.7 });
      }
    }
    if (this.owner && this.owner.minions) { const i = this.owner.minions.indexOf(this); if (i >= 0) this.owner.minions.splice(i, 1); }
    if (this.isBoss) Events.emit('bossKilled', this);
  }
  // ---------------------------------------------------------------- boss
  bossThink(dt, t, dist) {
    const s = this.special;
    s.novaCd = (s.novaCd ?? 6) - dt; s.slamCd = (s.slamCd ?? 4) - dt; s.sumCd = (s.sumCd ?? 12) - dt; s.chargeCd = (s.chargeCd ?? 9) - dt;
    const enraged = this.life < this.maxLife * 0.5;
    if (enraged && !s.enraged) {
      s.enraged = true; this.moveSpeed *= 1.25; this.atkSpeed *= 1.2; Events.emit('bossEnrage', this);
      this.startAction('roar', 'roar', { lock: true }); Audio.play('boss_roar', { vol: 1 }); Engine.rig.shake(0.5);
      FX.warcry(this.pos, 8, 0xff5020); return 0;
    }
    if (s.charging) {
      const sp = this.moveSpeed * 3.2;
      const rem = this.steer(s.cx, s.cz, sp, dt, 0.5);
      s.chargeT -= dt;
      if (!s.hit && dist < 2.2) { s.hit = true; resolveAttack(this, t, { ...this.packetFor(t), autoHit: true, knock: 3.5, stun: 0.4 }); Audio.play('hit_crit', { pos: t.pos }); Engine.rig.shake(0.5); }
      if (rem < 0.6 || s.chargeT <= 0) { s.charging = false; this.model.play('idle', { fade: 0.2 }); }
      return sp;
    }
    if (s.sumCd <= 0) {
      s.sumCd = enraged ? 16 : 22;
      this.startAction('summon', 'summon', { lock: true, onImpact: () => {
        Audio.play('raise_skeleton', { pos: this.pos }); Audio.play('boss_roar', { vol: 0.6 });
        const n = enraged ? 5 : 4;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, p = G.nav.nearestWalkable(this.pos.x + Math.cos(a) * 5, this.pos.z + Math.sin(a) * 5, 4);
          const type = enraged && i % 2 ? 'skeleton_mage' : 'skeleton';
          const m = spawnMonster(type, this.level - 2, { x: p.x, z: p.z, rise: true });
          m.state = 'chase'; m.target = t; m.noLoot = Math.random() < 0.7;
        }
      } });
      return 0;
    }
    if (s.novaCd <= 0 && dist < 10) {
      s.novaCd = enraged ? 7 : 10;
      this.startAction('nova', 'cast', { lock: true, onImpact: () => {
        Audio.play('boss_fire', { pos: this.pos }); Engine.rig.shake(0.4);
        bossFireNova(this, enraged ? 2 : 1);
      } });
      return 0;
    }
    if (s.chargeCd <= 0 && dist > 6 && dist < 18) {
      s.chargeCd = enraged ? 7 : 10;
      this.face(t.pos.x, t.pos.z, true);
      s.charging = true; s.hit = false; s.chargeT = 1.4;
      const dx = t.pos.x - this.pos.x, dz = t.pos.z - this.pos.z, l = Math.hypot(dx, dz) || 1;
      const end = G.nav.castWalk(this.pos.x, this.pos.z, this.pos.x + dx / l * (l + 3), this.pos.z + dz / l * (l + 3), 0.8);
      s.cx = end.x; s.cz = end.z;
      this.model.play('charge', { fade: 0.1 }); Audio.play('boss_roar', { vol: 0.7 });
      return 0;
    }
    if (dist <= this.mdef.range) {
      this.face(t.pos.x, t.pos.z);
      if (s.slamCd <= 0) {
        s.slamCd = enraged ? 5 : 7;
        this.startAction('slam', 'slam', { lock: true, onImpact: () => {
          const fx = this.pos.x + Math.sin(this.facing) * 2.4, fz = this.pos.z + Math.cos(this.facing) * 2.4;
          FX.shockwave(new THREE.Vector3(fx, 0, fz), 5); FX.explosion(new THREE.Vector3(fx, 0, fz), { radius: 2.5, element: 'demonfire' });
          Audio.play('boss_slam', { pos: this.pos }); Engine.rig.shake(0.7);
          areaDamage(fx, fz, 4.8, this.team, () => ({ phys: rnd(this.dmgMin, this.dmgMax) * 1.4, fire: rnd(this.dmgMin, this.dmgMax) * 0.5, knock: 3, kx: fx, kz: fz, stun: 0.5, ar: this.ar }), this);
        } });
        return 0;
      }
      if (this.cd <= 0) this.meleeAttack(t);
      return 0;
    }
    return this.moveTo(t.pos.x, t.pos.z, dt, this.moveSpeed * this.slowMul(), this.mdef.range * 0.8);
  }
}

function bossFireNova(boss, rings) {
  for (let r = 0; r < rings; r++) {
    after(r * 0.65, () => {
      if (boss.dead && r > 0) return;
      const pos = boss.pos.clone();
      FX.nova(pos, { radius: 11, element: 'fire', duration: 0.9 });
      FX.flashLight(new THREE.Vector3(pos.x, pos.y + 2, pos.z), 0xff6020, 60, 14, 0.4);
      const n = 24;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + r * 0.13;
        spawnProjectile({ kind: 'shaman_fire', pos: new THREE.Vector3(pos.x, pos.y + 1.0, pos.z), dir: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), speed: 9, range: 13, team: boss.team, owner: boss, packet: { fire: rnd(boss.dmgMin, boss.dmgMax) * 0.55, burn: boss.dmgMax * 0.2, burnDur: 2 }, radius: 0.5, pierce: true });
      }
    });
  }
}

// ------------------------------------------------------------------ spawning
export function spawnMonster(type, mlvl, o = {}) {
  const m = new Monster(type, mlvl, o);
  addActor(m);
  if (o.rise && m.model.clipInfo.spawn) { m.startAction('spawn', 'spawn', { lock: true }); FX.burst('dust', m.pos, { count: 14 }); }
  return m;
}
export function reviveMonster(c) {
  c.dead = false; c.corpse = false; c.consumed = false; c.deadT = 0; c.life = c.maxLife; c.removed = false;
  c.model.setTint(null); c.model.setOpacity(1); c.root.position.y = 0; c.root.visible = true;
  c.st.freeze = 0; c.st.chill = 0; c.st.poison = 0; c.st.burn = 0; c.st.fear = 0;
  c.state = 'chase'; c.alertPlayed = true; c.action = null;
  c.model.play(c.model.clipInfo.spawn ? 'spawn' : 'idle', { restart: true, fade: 0.35 });
  FX.summon(c.pos, 0xff4a1a);
}

// Spawn a pack from a levelgen spawn record
export function spawnPack(sp, idx, rng) {
  const dif = G.difficulty;
  const mlvl = (sp.mlvl ?? G.level.mlvl) + dif * 20;
  const pack = { members: [], spawnIdx: idx, kind: sp.pack };
  const members = [];
  const place = (r) => { const a = rng.next() * Math.PI * 2, rr = rng.next() * r; return G.nav.nearestWalkable(sp.x + Math.cos(a) * rr, sp.z + Math.sin(a) * rr, 5); };
  const isElite = sp.pack === 'unique' || sp.pack === 'superunique';
  if (sp.pack === 'boss') {
    const p = place(0.5);
    members.push(spawnMonster(sp.monster || 'hollow_king', mlvl, { x: p.x, z: p.z, name: sp.name, pack, packKind: 'boss' }));
  } else if (isElite) {
    let mods = sp.mods ? sp.mods.slice() : [];
    if (!sp.mods) { const n = 1 + dif; const pool = rng.shuffle(MOD_POOL.concat(RANGED_KINDS.has(sp.monster) ? ['multishot'] : [])); mods = pool.slice(0, n); }
    const name = sp.name || uniqueName(rng);
    const p = place(0.5);
    const boss = spawnMonster(sp.monster, mlvl + 3, { x: p.x, z: p.z, elite: sp.pack === 'superunique' ? 'superunique' : 'unique', mods, name, pack, packKind: 'unique', quest: sp.quest });
    boss.quest = sp.quest || null;
    members.push(boss);
    const nMin = sp.minions ?? rng.int(3, 5);
    const minionMods = mods.filter(m => ['extra_fast', 'cold_enchanted', 'fire_enchanted', 'lightning_enchanted', 'spectral_hit'].includes(m)).slice(0, 1);
    for (let i = 0; i < nMin; i++) { const q = place(sp.radius || 3); members.push(spawnMonster(sp.monster, mlvl + 2, { x: q.x, z: q.z, elite: 'minion', mods: minionMods, pack, packKind: 'champion' })); }
    for (const ex of sp.extra || []) for (let i = 0; i < ex.count; i++) { const q = place(sp.radius || 3.5); members.push(spawnMonster(ex.monster, mlvl + 1, { x: q.x, z: q.z, pack })); }
  } else if (sp.pack === 'champion') {
    const n = Math.max(2, Math.min(4, sp.count || rng.int(2, 4)));
    for (let i = 0; i < n; i++) { const q = place(sp.radius || 2.5); members.push(spawnMonster(sp.monster, mlvl + 2, { x: q.x, z: q.z, elite: 'champion', pack, packKind: 'champion' })); }
  } else {
    const n = sp.count || 3;
    for (let i = 0; i < n; i++) { const q = place(sp.radius || 3); members.push(spawnMonster(sp.monster, mlvl, { x: q.x, z: q.z, pack })); }
    // grovelings come with a shaman sometimes
    if (sp.monster === 'imp' && rng.chance(0.55)) { const q = place(3); members.push(spawnMonster('imp_shaman', mlvl + 1, { x: q.x, z: q.z, pack })); }
  }
  pack.members = members;
  return pack;
}

// might aura check (cheap, every few frames)
export function updateAuras() {
  for (const a of G.actors) if (a.mightNear) a.mightNear = false;
  for (const a of G.actors) {
    if (a.dead || !Array.isArray(a.mods) || !a.mods.includes('might')) continue;
    hash.query(a.pos.x, a.pos.z, 6, _list);
    for (const b of _list) if (b.team === a.team) b.mightNear = true;
  }
}

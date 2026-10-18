// Base class for every living thing (player, monsters, minions, NPCs).
import * as THREE from 'three';
import { G, hash } from './state.js';
import { dampAngle, clamp } from './util.js';
import { Engine } from './engine.js';
import { FX } from './fx.js';
import { kill } from './combat.js';

let NEXT_ID = 1;
const _sep = [];

export class Actor {
  constructor(o) {
    this.id = NEXT_ID++;
    this.kind = o.kind || 'monster';      // player | monster | minion | npc
    this.type = o.type || this.kind;      // model kind (zombie, skeleton...)
    this.team = o.team ?? 1;
    this.name = o.name || '';
    this.model = o.model;
    this.root = o.model.root;
    this.pos = this.root.position;
    this.facing = o.facing ?? 0;
    this.radius = o.radius ?? Math.max(0.3, (this.model.radius || 0.4) * 0.9);
    this.height = this.model.height || 1.8;
    this.level = o.level || 1;
    this.maxLife = o.life || 10; this.life = this.maxLife;
    this.maxMana = o.mana || 0; this.mana = this.maxMana;
    this.moveSpeed = o.speed || 3;
    this.vel = new THREE.Vector3();
    this.dead = false; this.corpse = false; this.consumed = false; this.removed = false; this.deadT = 0;
    this.st = { chill: 0, chillAmt: 0.5, freeze: 0, stun: 0, fear: 0, fearX: 0, fearZ: 0, poison: 0, poisonDps: 0, burn: 0, burnDps: 0, bleed: 0, bleedDps: 0, knockT: 0, kx: 0, kz: 0 };
    this.curse = null;                     // { id, t, dur, data, fx }
    this.buffs = new Map();                // id -> { t, dur, data, fx }
    this.action = null;
    this.res = { fire: 0, cold: 0, light: 0, poison: 0 };
    this.physRes = 0;
    this.def = 0; this.ar = 50; this.blockChance = 0;
    this.dmgMin = 1; this.dmgMax = 2;
    this.atkSpeed = 1; this.castSpeed = 1;
    this.path = null; this.pathI = 0; this.moveTarget = null;
    this.hitRecoverDiv = 12; this.hitImmuneT = 0;
    this.burnFx = null; this.statusTint = '';
    this.highlight = false;
    this.speedNow = 0;
    this.targetable = o.targetable ?? true;
    this.isBoss = !!o.isBoss;
    this.activeDist = 0;
    this.model.onEvent = (ev) => this.onModelEvent(ev);
    this.root.rotation.y = this.facing;
  }

  // ---------------------------------------------------------------- status helpers
  get frozen() { return this.st.freeze > 0; }
  get stunned() { return this.st.stun > 0 || this.st.freeze > 0; }
  slowMul() {
    let m = 1;
    if (this.st.chill > 0) m *= this.st.chillAmt;
    if (this.curse && this.curse.id === 'decrepify') m *= 0.5;
    return m;
  }
  effRes(el) {
    let r = this.res[el] || 0;
    if (this.curse && this.curse.id === 'lower_resist') r -= this.curse.data.pct;
    if (this.team === 0 && this.kind === 'player') r = Math.min(r, this.maxRes ? this.maxRes[el] ?? 75 : 75);
    return r;
  }
  effPhysRes() {
    let r = this.physRes;
    if (this.curse) { if (this.curse.id === 'amplify_damage') r -= 100; else if (this.curse.id === 'decrepify') r -= 50; }
    return r;
  }

  face(x, z, instant = false) {
    const dx = x - this.pos.x, dz = z - this.pos.z;
    if (dx * dx + dz * dz < 1e-6) return;
    this.facing = Math.atan2(dx, dz);
    if (instant) this.root.rotation.y = this.facing;
  }

  // ---------------------------------------------------------------- actions
  // start a timed action that plays a clip; impact fires at clip impact time
  startAction(type, clip, { speed = 1, onImpact = null, onEnd = null, lock = true, dur = null, data = null } = {}) {
    const info = this.model.clipInfo?.[clip] || this.model.clipInfo?.attack1 || { duration: 0.7, impact: 0.35 };
    const d = (dur ?? info.duration) / Math.max(0.05, speed);
    const imp = info.impact != null ? info.impact / Math.max(0.05, speed) : d * 0.5;
    this.model.play(clip, { speed, restart: true, fade: 0.08 });
    this.action = { type, clip, t: 0, dur: d, impact: Math.min(imp, d * 0.95), impacted: false, onImpact, onEnd, lock, data, speed };
    return this.action;
  }
  cancelAction() { this.action = null; }
  onModelEvent(ev) { if (ev === 'footstep') this.onFootstep?.(); }

  tickAction(dt) {
    const a = this.action; if (!a) return;
    a.t += dt;
    if (!a.impacted && a.t >= a.impact) { a.impacted = true; try { a.onImpact?.(a); } catch (e) { console.error(e); } }
    if (this.action === a && a.t >= a.dur) { this.action = null; try { a.onEnd?.(a); } catch (e) { console.error(e); } }
  }

  // ---------------------------------------------------------------- movement
  // steer toward (x,z) at speed; returns remaining distance
  steer(x, z, speed, dt, arriveDist = 0.1) {
    const dx = x - this.pos.x, dz = z - this.pos.z, d = Math.hypot(dx, dz);
    if (d <= arriveDist) { this.vel.set(0, 0, 0); return d; }
    const step = Math.min(d, speed * dt);
    this.vel.set(dx / d * speed, 0, dz / d * speed);
    this.pos.x += dx / d * step; this.pos.z += dz / d * step;
    this.facing = Math.atan2(dx, dz);
    return d - step;
  }
  separate(dt, strength = 1) {
    hash.query(this.pos.x, this.pos.z, this.radius + 0.9, _sep);
    for (const o of _sep) {
      if (o === this || o.dead || o.kind === 'npc' && this.kind !== 'npc') continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z; const d2 = dx * dx + dz * dz; const rr = this.radius + o.radius;
      if (d2 < rr * rr && d2 > 1e-6) {
        const d = Math.sqrt(d2), push = (rr - d) * 0.5 * Math.min(1, dt * 12) * strength;
        const w = o.isBoss || o.kind === 'player' ? 1 : 0.5;
        this.pos.x += dx / d * push * (1 + w); this.pos.z += dz / d * push * (1 + w);
      }
    }
  }
  collide() { if (G.nav) G.nav.collide(this.pos, Math.min(0.42, this.radius)); }

  followPath(dt, speed) {
    if (!this.path || this.pathI >= this.path.length) return false;
    const p = this.path[this.pathI];
    const rem = this.steer(p.x, p.z, speed, dt, 0.15);
    if (rem <= 0.2) this.pathI++;
    return this.pathI < this.path.length;
  }

  // ---------------------------------------------------------------- per-frame
  tickStatus(dt) {
    const s = this.st;
    if (s.chill > 0) s.chill -= dt;
    if (s.freeze > 0) { s.freeze -= dt; if (s.freeze <= 0) this.model.setFrozen(false); }
    if (s.stun > 0) s.stun -= dt;
    if (s.fear > 0) s.fear -= dt;
    if (this.hitImmuneT > 0) this.hitImmuneT -= dt;
    let dot = 0;
    if (s.poison > 0) { s.poison -= dt; dot += s.poisonDps * dt; }
    if (s.burn > 0) { s.burn -= dt; dot += s.burnDps * dt; }
    if (s.bleed > 0) { s.bleed -= dt; dot += s.bleedDps * dt; }
    if (dot > 0 && !this.dead) {
      this.life -= dot;
      this._dotAcc = (this._dotAcc || 0) + dot;
      if (this.life <= 0) { this.life = 0; this.onDotDeath?.(); }
    }
    if (s.knockT > 0) {
      const k = Math.min(dt, s.knockT); s.knockT -= dt;
      this.pos.x += s.kx * k; this.pos.z += s.kz * k;
    }
    // curse & buffs
    if (this.curse) { this.curse.t -= dt; if (this.curse.t <= 0) this.removeCurse(); }
    for (const [id, b] of this.buffs) { if (b.dur > 0) { b.t -= dt; if (b.t <= 0) this.removeBuff(id); } }
    // tints
    let tint = '';
    if (s.freeze > 0) tint = 'freeze'; else if (s.chill > 0) tint = 'chill'; else if (s.poison > 0) tint = 'poison'; else if (s.burn > 0) tint = 'burn';
    if (tint !== this.statusTint) {
      this.statusTint = tint;
      if (tint === 'chill') this.model.setTint(0x7ec4ff, 0.45);
      else if (tint === 'freeze') this.model.setTint(0xbfe8ff, 0.7);
      else if (tint === 'poison') this.model.setTint(0x5dff3a, 0.35);
      else if (tint === 'burn') this.model.setTint(0xff7a2a, 0.25);
      else this.model.setTint(null);
    }
    if (s.burn > 0 && !this.dead) { if (!this.burnFx) this.burnFx = FX.emitter('burning', { pos: this.pos, scale: this.height / 1.8 }); }
    else if (this.burnFx) { this.burnFx.stop(); this.burnFx = null; }
  }
  applyCurse(id, dur, data = {}) {
    if (this.dead) return;
    if (this.curse && this.curse.id !== id) this.removeCurse();
    if (this.curse) { this.curse.t = Math.max(this.curse.t, dur); this.curse.data = data; return; }
    this.curse = { id, t: dur, dur, data, fx: FX.curse(this.model, id) };
  }
  removeCurse() { if (this.curse) { this.curse.fx?.stop?.(); this.curse = null; } }
  addBuff(id, dur, data = {}, fxFn = null) {
    const b = this.buffs.get(id);
    if (b) { b.t = dur; b.dur = dur; b.data = data; this.onBuffsChanged?.(); return b; }
    const nb = { id, t: dur, dur, data, fx: fxFn ? fxFn() : null };
    this.buffs.set(id, nb); this.onBuffsChanged?.(); return nb;
  }
  removeBuff(id) { const b = this.buffs.get(id); if (!b) return; b.fx?.stop?.(); this.buffs.delete(id); this.onBuffsChanged?.(); }
  hasBuff(id) { return this.buffs.has(id); }

  updateModel(dt, speed) {
    const slow = this.st.freeze > 0 ? 0 : this.slowMul();
    if (slow <= 0) return;
    this.root.rotation.y = dampAngle(this.root.rotation.y, this.facing, 14, dt);
    this.model.update(dt * slow, { speed: speed / Math.max(0.2, slow) * slow });
  }
  onDotDeath() { if (!this.dead) kill(this, this.lastHitBy || null, {}, { total: 1 }); }
  setHighlight(on) { if (on !== this.highlight) { this.highlight = on; this.model.setHighlight(on); } }

  headPos(out) { return out.set(this.pos.x, this.pos.y + this.height * 1.0, this.pos.z); }
  chestPos(out) { return out.set(this.pos.x, this.pos.y + this.height * 0.62, this.pos.z); }

  removeFromWorld() {
    if (this.removed) return;
    this.removed = true;
    this.burnFx?.stop?.(); this.removeCurse();
    for (const id of [...this.buffs.keys()]) this.removeBuff(id);
    this.root.removeFromParent();
    this.model.dispose?.();
  }
}

export function addActor(a) {
  G.actors.push(a);
  Engine.scene.add(a.root);
  return a;
}
export function clamp01(v) { return clamp(v, 0, 1); }

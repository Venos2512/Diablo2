// Damage model (D2-flavoured): hit chance, block, resistances, crits, crushing blow, leech,
// statuses (chill/freeze/poison/burn/bleed/stun/knockback), hit recovery, deaths & their effects.
import * as THREE from 'three';
import { G, Events, Settings, enemiesNear } from './state.js';
import { clamp } from './util.js';
import { Engine } from './engine.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { Floaters } from './floaters.js';
import { dropLoot } from './loot.js';

const _v = new THREE.Vector3(), _p = { x: 0, y: 0, z: 0, visible: false };
export const rnd = (a, b) => a + Math.random() * (b - a);
export const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

// D2's 2·AR/(AR+DR)·aLvl/(aLvl+dLvl), with the level term softened at low levels (+4/+8) so a level-1 hero
// swinging at level-3 monsters doesn't whiff half the time; converges to D2 values from the mid levels on.
export function hitChance(ar, def, alvl, dlvl) {
  const c = 2 * (ar / Math.max(1, ar + def)) * ((alvl + 4) / Math.max(1, alvl + dlvl + 8));
  return clamp(c, 0.05, 0.95);
}

export function floatAt(actor, text, kind = 'dmg', yOff = 1.05) {
  if (!Settings.dmgNumbers && kind !== 'player' && kind !== 'xp' && kind !== 'miss' && kind !== 'immune') return;
  _v.set(actor.pos.x, actor.pos.y + actor.height * yOff, actor.pos.z);
  Floaters.spawnWorld(_v, text, kind);
}

// Build a weapon-attack packet from attacker stats. opts: { ed (% extra), flat, mult, elemMult, ar (bonus %), crit (bonus %), ... }
export function attackPacket(att, o = {}) {
  let phys = rnd(att.dmgMin, att.dmgMax + 0.999);
  phys = Math.floor(phys);
  phys *= 1 + (o.ed || 0) / 100;
  phys += o.flat || 0;
  phys *= o.mult ?? 1;
  const p = { phys, melee: o.melee !== false, isAttack: true, ar: att.ar * (1 + (o.arPct || 0) / 100), skill: o.skill || 'attack' };
  const e = att.elem;
  if (e) {
    const em = o.elemMult ?? 1;
    if (e.fireMax) p.fire = rnd(e.fireMin, e.fireMax) * em;
    if (e.coldMax) { p.cold = rnd(e.coldMin, e.coldMax) * em; p.coldDur = 2; }
    if (e.lightMax) p.light = rnd(e.lightMin, e.lightMax) * em;
    if (e.poison) { p.poison = e.poison * em; p.poisonDur = 2.5; }
    if (e.magicMax) p.magic = rnd(e.magicMin, e.magicMax) * em;
  }
  const crit = (att.crit || 0) + (o.crit || 0);
  if (crit > 0 && Math.random() * 100 < Math.min(95, crit)) { p.phys *= 2; p.crit = true; }
  if (att.cb) p.cb = att.cb;
  if (att.ow) p.ow = att.ow;
  if (att.lifeSteal) p.lifeSteal = att.lifeSteal;
  if (att.manaSteal) p.manaSteal = att.manaSteal;
  if (o.knock) p.knock = o.knock;
  if (o.stun) p.stun = o.stun;
  return p;
}

// Attack roll: hit/miss/block then damage
export function resolveAttack(att, target, p) {
  if (target.dead) return 'dead';
  const ch = hitChance(p.ar ?? att.ar, target.def, att.level, target.level);
  if (!p.autoHit && Math.random() > ch) {
    if (att.kind === 'player') floatAt(target, 'Miss', 'miss');
    Audio.play('miss', { pos: target.pos, vol: 0.5 });
    return 'miss';
  }
  let block = target.blockChance || 0;
  if (target.kind === 'player' && target.isRunning) block = Math.min(25, block / 3);
  if (block > 0 && !target.stunned && !target.action?.lock && Math.random() * 100 < block) {
    target.onBlock?.(att);
    Audio.play('block', { pos: target.pos });
    FX.burst('sparks', _v.set(target.pos.x, target.pos.y + target.height * 0.6, target.pos.z), { count: 10 });
    if (target.kind === 'player') floatAt(target, 'Block', 'miss');
    return 'block';
  }
  return dealDamage(target, p, att);
}

// Core damage application. Returns 'hit' | 'killed' | 'immune'
export function dealDamage(target, p, src) {
  if (target.dead || target.invuln) return 'dead';
  const isPlayer = target.kind === 'player';
  // physical
  let phys = p.phys || 0;
  if (phys > 0) {
    const pr = target.effPhysRes();
    phys *= 1 - clamp(pr, -100, 100) / 100;
    if (isPlayer) { phys -= target.stats.drFlat || 0; phys *= 1 - Math.min(50, target.stats.dr || 0) / 100; }
    if (p.cb && Math.random() * 100 < p.cb) phys += target.life * (isPlayer ? 0.1 : target.isBoss || target.elite === 'unique' ? 0.125 : 0.25) * (p.melee === false ? 0.5 : 1);
    phys = Math.max(0, phys);
  }
  const el = (k) => {
    const v = p[k === 'light' ? 'light' : k] || 0; if (v <= 0) return 0;
    const r = target.effRes(k);
    if (r >= 100 && !isPlayer) return -1;
    return v * (1 - clamp(r, -100, 95) / 100);
  };
  let fire = el('fire'), cold = el('cold'), light = el('light');
  let immune = false;
  if (fire < 0) { fire = 0; immune = true; } if (cold < 0) { cold = 0; immune = true; } if (light < 0) { light = 0; immune = true; }
  let magic = p.magic || 0;
  if (magic > 0 && isPlayer) magic = Math.max(0, magic - (target.stats.mdrFlat || 0));
  if (p.mana && isPlayer) target.mana = Math.max(0, target.mana - p.mana);
  if (isPlayer && (fire + cold + light) > 0) { const m = target.stats.mdrFlat || 0; if (m) { const tot = fire + cold + light, k = Math.max(0, tot - m) / tot; fire *= k; cold *= k; light *= k; } }
  // poison (DoT)
  if (p.poison > 0) {
    const r = target.effRes('poison');
    if (r < 100 || isPlayer) {
      const dur = (p.poisonDur || 2) * (isPlayer ? Math.max(0.25, 1 - (target.stats.poisonLen || 0) / 100) : 1);
      const dps = p.poison * (1 - clamp(r, -100, 95) / 100) / dur;
      if (dps >= target.st.poisonDps || target.st.poison <= 0) { target.st.poisonDps = dps; target.st.poison = dur; }
    } else immune = true;
  }
  if (p.burn > 0) { const r = target.effRes('fire'); if (r < 100) { target.st.burnDps = Math.max(target.st.burn > 0 ? target.st.burnDps : 0, p.burn * (1 - clamp(r, -100, 95) / 100)); target.st.burn = Math.max(target.st.burn, p.burnDur || 2); } }
  if (p.ow && Math.random() * 100 < p.ow && !isPlayer) { target.st.bleed = 6; target.st.bleedDps = Math.max(target.st.bleedDps, (src?.level || 1) * 1.6 * (target.isBoss ? 0.5 : 1)); }
  let total = phys + fire + cold + light + magic;
  if (p.pctLife) { // static field style
    const floor = [0, 0.33, 0.5][G.difficulty] || 0;
    const lr = target.effRes('light'); if (lr < 100) { const amt = Math.max(0, Math.min(target.life * p.pctLife, target.life - target.maxLife * floor)); total += amt; light += amt; }
  }
  if (immune && total <= 0 && !(p.poison > 0)) { if (src && src.team === 0) floatAt(target, 'Immune', 'immune'); return 'immune'; }
  // damage multipliers on source (e.g. battle orders don't; amplify handled in res)
  if (target.dmgTakenMul) total *= target.dmgTakenMul;
  target.life -= total;
  target.lastHitBy = src; target.lastHitT = G.time;
  if (total > 0) {
    target.model.flash(p.crit ? 1.4 : 0.9, p.crit ? 0xffe0a0 : 0xffffff);
    if (Settings.dmgNumbers || isPlayer) {
      const kind = isPlayer ? 'player' : p.crit ? 'crit' : (fire > phys && fire >= cold && fire >= light) ? 'fire' : (cold > phys && cold >= light) ? 'cold' : (light > phys) ? 'light' : (magic > phys) ? 'dmg' : 'dmg';
      if (total >= 1 || isPlayer) floatAt(target, String(Math.max(1, Math.round(total))), kind);
    }
  }
  // statuses
  if (cold > 0 || p.coldDur) {
    const dur = (p.coldDur || 2) * (target.isBoss ? 0.35 : target.elite ? 0.7 : 1);
    if (!(isPlayer && target.stats.cannotBeFrozen)) { target.st.chill = Math.max(target.st.chill, isPlayer ? dur * 0.5 : dur); target.st.chillAmt = isPlayer ? 0.6 : 0.5; }
  }
  if (p.freeze && !isPlayer && !target.isBoss && target.effRes('cold') < 100) { target.st.freeze = Math.max(target.st.freeze, p.freeze); target.model.setFrozen(true); if (target.action && target.action.type !== 'death') target.cancelAction(); }
  if (p.stun && !target.isBoss) { target.st.stun = Math.max(target.st.stun, p.stun * (target.elite ? 0.6 : 1)); if (target.action && target.action.lock) target.cancelAction(); }
  if (p.knock && !target.isBoss && !target.frozen && src) {
    const dx = target.pos.x - (p.kx ?? src.pos.x), dz = target.pos.z - (p.kz ?? src.pos.z), d = Math.hypot(dx, dz) || 1;
    const k = p.knock * (target.elite ? 0.5 : 1) * (target.heavy ? 0.4 : 1);
    target.st.knockT = 0.18; target.st.kx = dx / d * k / 0.18; target.st.kz = dz / d * k / 0.18;
  }
  // element hit visuals
  if (fire > 0) FX.burst('fire', target.chestPos(_v), { count: 6, scale: 0.7 });
  if (cold > 0) FX.burst('ice', target.chestPos(_v), { count: 6, scale: 0.7 });
  if (light > 0) FX.burst('lightning', target.chestPos(_v), { count: 5, scale: 0.7 });
  // leech
  if (src && !src.dead && phys > 0 && p.melee !== false) {
    const dmul = [1, 0.5, 0.33][G.difficulty] || 1, drain = target.drain ?? 1;
    if (p.lifeSteal) src.life = Math.min(src.maxLife, src.life + phys * p.lifeSteal / 100 * dmul * drain);
    if (p.manaSteal) src.mana = Math.min(src.maxMana, src.mana + phys * p.manaSteal / 100 * dmul * drain);
    if (target.curse && target.curse.id === 'life_tap' && src.team === 0) src.life = Math.min(src.maxLife, src.life + phys * 0.5);
  }
  if (src && p.melee !== false && p.isAttack && target.thorns && src.team !== target.team && !src.dead) {
    dealDamage(src, { phys: target.thorns, noHitRec: true, isAttack: false, melee: false }, null);
  }
  target.onHurt?.(total, src, p, { phys, fire, cold, light, magic });
  if (target.life <= 0) {
    target.life = 0;
    kill(target, src, p, { phys, fire, cold, light, magic, total });
    return 'killed';
  }
  // hit recovery
  if (!p.noHitRec && total > 0 && !target.isBoss && total >= target.maxLife / (target.hitRecoverDiv || 12) && target.hitImmuneT <= 0) target.onHitRecover?.(src, total);
  return 'hit';
}

export function heal(a, amt, show = false) {
  if (a.dead) return;
  const before = a.life; a.life = Math.min(a.maxLife, a.life + amt);
  if (show && a.life - before >= 1) floatAt(a, '+' + Math.round(a.life - before), 'heal');
}

// ------------------------------------------------------------------ death
export function kill(target, src, p = {}, info = {}) {
  if (target.dead) return;
  target.dead = true; target.deadT = 0; target.life = 0;
  target.action = null; target.vel.set(0, 0, 0);
  target.burnFx?.stop?.(); target.burnFx = null;
  target.removeCurse();
  const pos = target.pos.clone();
  const tot = Math.max(1, info.total || 1);
  const frozen = target.st.freeze > 0;
  const coldKill = frozen || ((info.cold || 0) / tot > 0.4);
  const isSkel = /skeleton|bone_golem/.test(target.type);
  let deathType = 'normal';
  if (target.kind === 'player') deathType = 'player';
  else if (p.explode) deathType = 'gibs';
  else if (coldKill && !target.isBoss) deathType = 'shatter';
  else if (!target.isBoss && p.crit && (info.phys || 0) > target.maxLife * 1.6 && target.type !== 'wraith') deathType = 'gibs';
  target.deathType = deathType;
  target.st.chill = 0; target.st.poison = 0; target.st.burn = 0; target.st.bleed = 0;
  target.model.setTint(null); target.model.setFrozen(false); target.statusTint = '';
  target.setHighlight(false);
  if (deathType === 'shatter') {
    target.corpse = false;
    FX.shatter(pos, target.height / 1.8);
    Audio.play('shatter', { pos });
    target.root.visible = false;
  } else if (deathType === 'gibs') {
    target.corpse = false;
    FX.gibs(_v.set(pos.x, pos.y + target.height * 0.5, pos.z), target.bloodColor ?? 0x6a0606, target.height / 1.8);
    FX.decal('blood', pos, { size: 2.2 + Math.random() });
    Audio.play('gore', { pos });
    target.root.visible = false;
  } else {
    target.corpse = target.kind !== 'player' && !target.noCorpse;
    target.model.play('death', { restart: true, fade: 0.06 });
    if (isSkel) FX.boneCollapse(pos, target.height / 1.8);
    else if (target.bloodColor !== null) {
      FX.burst('blood', _v.set(pos.x, pos.y + target.height * 0.55, pos.z), { count: 18, color: target.bloodColor });
      if (Math.random() < 0.7) FX.decal('blood', pos, { size: 1.2 + Math.random() * 1.2, rot: Math.random() * 6.28 });
    }
    if ((info.fire || 0) / tot > 0.5) { target.model.setTint(0x1a0d06, 0.75); FX.burst('smoke', _v.set(pos.x, pos.y + 1, pos.z), { count: 8 }); target.charred = true; }
  }
  target.onDeath?.(src, p, deathType);
  Events.emit('kill', target, src, deathType);
  if (target.team === 1 && G.player && !G.player.dead) {
    const d = Math.hypot(pos.x - G.player.pos.x, pos.z - G.player.pos.z);
    if (d < 60 && target.xp) G.player.gainXP(target.xp, target.level, target);
    if (src === G.player || (src && src.owner === G.player) || d < 40) {
      if (src === G.player && G.player.stats.lifeOnKill) heal(G.player, G.player.stats.lifeOnKill);
      if (src === G.player && G.player.stats.manaOnKill) G.player.mana = Math.min(G.player.maxMana, G.player.mana + G.player.stats.manaOnKill);
    }
    if (!target.noLoot) dropLoot(target);
  }
}

// helper: damage all enemies of `team` in radius (returns hit list)
const _hits = [];
export function areaDamage(x, z, r, team, makePacket, src, filter = null) {
  enemiesNear(x, z, r, team, _hits);
  const out = _hits.slice();
  for (const t of out) { if (filter && !filter(t)) continue; const p = makePacket(t); if (p) dealDamage(t, p, src); }
  return out;
}

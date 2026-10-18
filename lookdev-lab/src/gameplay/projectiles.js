// Projectiles & timed area effects (fire wall, blizzard, poison clouds, etc.)
import * as THREE from 'three';
import { G, hash } from './state.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { resolveAttack, dealDamage } from './combat.js';

const _q = [], _v = new THREE.Vector3();

export function spawnProjectile(o) {
  const p = {
    kind: o.kind, pos: o.pos.clone(), dir: o.dir.clone().setY(0).normalize(), speed: o.speed ?? 12, range: o.range ?? 14,
    traveled: 0, team: o.team ?? 0, owner: o.owner || null, packet: o.packet || {}, radius: o.radius ?? 0.35,
    pierce: !!o.pierce, homing: o.homing || 0, erratic: !!o.erratic, hit: new Set(), alive: true, age: 0,
    onHit: o.onHit || null, onExpire: o.onExpire || null, onTick: o.onTick || null, autoAttack: !!o.autoAttack,
    hitSound: o.hitSound, life: o.life ?? 99, wallStop: o.wallStop !== false, data: o.data || {}, maxHits: o.maxHits ?? 99,
    skill: o.skill, kindTag: 'projectile',
  };
  p.fx = o.noFx ? null : FX.projectile(o.visual || o.kind, { pos: p.pos, dir: p.dir });
  if (p.erratic) { p.wob = Math.random() * 6.28; p.turn = (Math.random() - 0.5) * 3; }
  G.projectiles.push(p);
  return p;
}

function finish(p, impactPos, didHit) {
  if (!p.alive) return;
  p.alive = false;
  if (p.fx) { if (impactPos) p.fx.impact(impactPos); else p.fx.destroy(); }
  if (!didHit && p.onExpire) p.onExpire(p, impactPos || p.pos);
}

export function updateProjectiles(dt) {
  const list = G.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (!p.alive) { list.splice(i, 1); continue; }
    p.age += dt;
    if (p.homing) {
      hash.query(p.pos.x, p.pos.z, 14, _q);
      let best = null, bd = 1e9;
      for (const a of _q) { if (a.dead || a.team === p.team || a.team === 2 || p.hit.has(a)) continue; const d = (a.pos.x - p.pos.x) ** 2 + (a.pos.z - p.pos.z) ** 2; if (d < bd) { bd = d; best = a; } }
      if (best) {
        const dx = best.pos.x - p.pos.x, dz = best.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
        const k = Math.min(1, p.homing * dt);
        p.dir.x += (dx / l - p.dir.x) * k; p.dir.z += (dz / l - p.dir.z) * k; p.dir.normalize();
      }
    }
    if (p.erratic) {
      p.wob += dt * 9; p.turn += (Math.random() - 0.5) * dt * 18; p.turn *= Math.exp(-dt * 2);
      const a = p.turn * dt + Math.sin(p.wob) * dt * 2.5, c = Math.cos(a), s = Math.sin(a);
      const x = p.dir.x * c - p.dir.z * s, z = p.dir.x * s + p.dir.z * c; p.dir.set(x, 0, z);
    }
    const step = p.speed * dt;
    p.pos.x += p.dir.x * step; p.pos.z += p.dir.z * step; p.traveled += step;
    if (p.onTick) p.onTick(p, dt);
    if (p.fx) p.fx.update(p.pos, p.dir, dt);
    if (p.wallStop && G.nav && !G.nav.walkableAt(p.pos.x, p.pos.z) && !(G.nav.losCell(Math.floor(p.pos.x), Math.floor(p.pos.z)))) {
      if (p.onHit && p.data.explodeOnWall) p.onHit(p, null, p.pos);
      finish(p, p.pos, !!p.data.explodeOnWall); continue;
    }
    if (p.traveled >= p.range || p.age >= p.life) { finish(p, p.data.impactOnExpire ? p.pos : null, false); continue; }
    // collisions
    hash.query(p.pos.x, p.pos.z, p.radius + 0.6, _q);
    for (const a of _q) {
      if (a.dead || a.team === p.team || a.team === 2 || a.targetable === false || p.hit.has(a)) continue;
      const dx = a.pos.x - p.pos.x, dz = a.pos.z - p.pos.z, rr = p.radius + a.radius;
      if (dx * dx + dz * dz > rr * rr) continue;
      if (a.flying === false) continue;
      p.hit.add(a);
      const pk = { ...p.packet, kx: p.pos.x - p.dir.x, kz: p.pos.z - p.dir.z };
      let res;
      if (p.autoAttack) res = resolveAttack(p.owner || { ar: pk.ar || 50, level: 1, kind: 'trap' }, a, pk);
      else res = dealDamage(a, pk, p.owner);
      if (p.hitSound) Audio.play(p.hitSound, { pos: a.pos, vol: 0.7 });
      if (p.onHit) p.onHit(p, a, p.pos, res);
      if (!p.pierce || p.hit.size >= p.maxHits) { finish(p, p.pos, true); break; }
      if (p.fx && p.fx.impact && p.data.pierceSpark) FX.burst('sparks', a.chestPos(_v), { count: 6 });
    }
  }
}

// ------------------------------------------------------------------ timed area effects
export function spawnEffect(e) { e.t = 0; e.alive = true; G.effects.push(e); return e; }
export function updateEffects(dt) {
  for (let i = G.effects.length - 1; i >= 0; i--) {
    const e = G.effects[i];
    if (!e.alive) { G.effects.splice(i, 1); continue; }
    e.t += dt;
    let keep = true;
    try { keep = e.update(dt, e) !== false; } catch (err) { console.error(err); keep = false; }
    if (!keep || (e.dur && e.t >= e.dur)) { e.alive = false; e.end?.(e); G.effects.splice(i, 1); }
  }
}
export function clearProjectiles() {
  for (const p of G.projectiles) { p.alive = false; p.fx?.destroy?.(); }
  G.projectiles.length = 0;
  for (const e of G.effects) { e.alive = false; e.end?.(e); }
  G.effects.length = 0;
}

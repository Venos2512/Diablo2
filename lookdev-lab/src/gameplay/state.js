// Global game state, event bus, settings, spatial hash.
import * as THREE from 'three';
import { RNG } from './util.js';

export const G = {
  mode: 'boot',            // boot | menu | game
  time: 0, realTime: 0, timeScale: 1, hitstop: 0, paused: false,
  rng: new RNG(),
  seed: (Math.random() * 1e9) | 0,
  char: null,              // persistent character (save data)
  player: null,            // Player actor
  level: null, view: null, nav: null, levelId: null,
  actors: [],              // everything alive or corpse with a model
  projectiles: [], ground: [], effects: [], portals: [], emitters: [],
  levelState: {},          // per-session cache: { [levelId]: { data, cleared:Set(spawnIdx), objects:{idx:state}, ground:[], explored } }
  hover: null,             // { type:'actor'|'item'|'object', ref }
  difficulty: 0,
  inTown: false,
  frame: 0,
};

// ------------------------------------------------------------------ events
const listeners = new Map();
export const Events = {
  on(ev, fn) { if (!listeners.has(ev)) listeners.set(ev, []); listeners.get(ev).push(fn); return () => Events.off(ev, fn); },
  off(ev, fn) { const l = listeners.get(ev); if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
  emit(ev, ...a) { const l = listeners.get(ev); if (l) for (const fn of [...l]) { try { fn(...a); } catch (e) { console.error('event', ev, e); } } },
};

// ------------------------------------------------------------------ settings (per-viewer convenience)
const SKEY = 'ashencrown.settings.v1';
export const Settings = {
  quality: 'high', gamma: 1, shake: 1, master: 0.8, music: 0.55, sfx: 0.85, dmgNumbers: true, itemLabels: true, minimap: true,
  qualityAuto: true, qualityProbed: false, // preset chosen by the game (GPU probe / auto step-down) until the player picks one
  load() { try { const s = JSON.parse(localStorage.getItem(SKEY) || '{}'); Object.assign(this, s); } catch (e) { /* storage unavailable */ } return this; },
  save() { try { const o = {}; for (const k of ['quality', 'gamma', 'shake', 'master', 'music', 'sfx', 'dmgNumbers', 'itemLabels', 'minimap', 'qualityAuto', 'qualityProbed']) o[k] = this[k]; localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) { /* ignore */ } },
};

// ------------------------------------------------------------------ spatial hash (rebuilt every frame)
export class SpatialHash {
  constructor(cell = 4) { this.cell = cell; this.map = new Map(); }
  key(i, j) { return (i + 4096) * 8192 + (j + 4096); }
  rebuild(list) {
    this.map.clear();
    for (const a of list) {
      if (a.removed) continue;
      const k = this.key(Math.floor(a.pos.x / this.cell), Math.floor(a.pos.z / this.cell));
      let b = this.map.get(k); if (!b) { b = []; this.map.set(k, b); } b.push(a);
    }
  }
  query(x, z, r, out = [], pred = null) {
    out.length = 0;
    const c = this.cell, i0 = Math.floor((x - r) / c), i1 = Math.floor((x + r) / c), j0 = Math.floor((z - r) / c), j1 = Math.floor((z + r) / c);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const b = this.map.get(this.key(i, j)); if (!b) continue;
      for (const a of b) {
        const dx = a.pos.x - x, dz = a.pos.z - z, rr = r + (a.radius || 0);
        if (dx * dx + dz * dz <= rr * rr && (!pred || pred(a))) out.push(a);
      }
    }
    return out;
  }
}
export const hash = new SpatialHash(4);

// enemies of `team` within r of (x,z) that are alive & targetable
const _q = [];
export function enemiesNear(x, z, r, team, out = []) {
  hash.query(x, z, r, _q);
  out.length = 0;
  for (const a of _q) if (!a.dead && a.team !== team && a.team !== 2 && a.targetable !== false) out.push(a);
  return out;
}
export function alliesNear(x, z, r, team, out = []) {
  hash.query(x, z, r, _q);
  out.length = 0;
  for (const a of _q) if (!a.dead && a.team === team) out.push(a);
  return out;
}
export function corpsesNear(x, z, r, pred = null) {
  const out = [];
  for (const a of G.actors) if (a.dead && a.corpse && !a.consumed && (a.pos.x - x) ** 2 + (a.pos.z - z) ** 2 <= r * r && (!pred || pred(a))) out.push(a);
  return out;
}

// timers (game time; paused with game)
const timers = [];
export function after(sec, fn) { timers.push({ t: sec, fn }); }
export function tickTimers(dt) {
  for (let i = timers.length - 1; i >= 0; i--) { const t = timers[i]; t.t -= dt; if (t.t <= 0) { timers.splice(i, 1); try { t.fn(); } catch (e) { console.error(e); } } }
}
export function clearTimers() { timers.length = 0; }

export const tmpV = () => new THREE.Vector3();

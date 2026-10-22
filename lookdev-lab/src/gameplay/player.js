// The hero, ported from Ashen Crown (src/game/player.js): the same click-to-move / attack intents, A* paths
// on the nav grid, melee timing (impact frame / attack speed), hit recovery, block and death — driven by
// the lab's preview character. No items: stats come from the class and level (v1 formulas, a starter
// weapon per class). Right-click skills run through the lab's skill runtime (see host.js).
import * as THREE from 'three';
import { G, Events, enemiesNear } from './state.js';
import { Actor } from './actor.js';
import { attackPacket, resolveAttack, rnd, floatAt, heal } from './combat.js';
import { spawnProjectile } from './projectiles.js';
import { FX } from './fx.js';
import { Engine } from './engine.js';
import { clamp } from './util.js';
import { CastHold, Notice, TRANSIENT, gateCast, castMessage } from '../skills/castControl.js';

export const CLASSES = {
	barbarian: { name: 'Barbarian', base: { str: 30, dex: 20, vit: 25, ene: 10 }, perLevel: { str: 2, dex: 1, vit: 2 }, life: [55, 2, 4], mana: [10, 1, 1], arC: 20, block: 25 },
	sorceress: { name: 'Sorceress', base: { str: 10, dex: 25, vit: 10, ene: 35 }, perLevel: { dex: 1, vit: 2, ene: 2 }, life: [40, 1, 2], mana: [35, 2, 2], arC: -15, block: 20 },
	necromancer: { name: 'Necromancer', base: { str: 15, dex: 25, vit: 15, ene: 25 }, perLevel: { str: 1, vit: 2, ene: 2 }, life: [45, 1.5, 2], mana: [25, 2, 2], arC: -10, block: 20 },
};
/** Starter weapons (v1 newCharacter: hand axe, short staff, wand) — damage, speed factor, reach. */
const WEAPONS = {
	barbarian: { min: 3, max: 6, speed: 1, reach: 1.55, shield: 18 },
	sorceress: { min: 1, max: 5, speed: 1.1, reach: 1.9, shield: 0 },
	necromancer: { min: 2, max: 4, speed: 1, reach: 1.25, shield: 0 },
};
export const XP_NEXT = (L) => Math.round(110 * Math.pow(L, 1.75) + 50);

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _hits = [];

/** v1 skills.js meleeStrike: weapon packet + attack roll + blood. */
export function meleeStrike(P, target, o = {}) {
	if (!target || target.dead) return 'none';
	const p = attackPacket(P, o);
	const res = resolveAttack(P, target, p);
	if (res === 'hit' || res === 'killed') {
		FX.burst(target.bloodColor === null ? 'bone' : 'blood', target.chestPos(_v), { count: p.crit ? 14 : 7, dir: _v2.set(target.pos.x - P.pos.x, 0.4, target.pos.z - P.pos.z).normalize() });
		if (p.crit) {
			Engine.rig.shake(0.12);
			G.hitstop = Math.max(G.hitstop, 0.045);
		}
	}
	return res;
}

export class Player extends Actor {
	/**
	 * @param {import('./heroModel.js').HeroModel} model
	 * @param {{ cls: string, level: number, ranged: boolean, reach: number, skills: object }} o
	 */
	constructor(model, o) {
		super({ kind: 'player', type: o.cls, team: 0, model, level: o.level, name: CLASSES[o.cls].name });
		this.cls = o.cls;
		this.C = CLASSES[o.cls];
		this.radius = 0.38;
		this.ranged = !!o.ranged;
		this.reachOverride = o.reach || 0;
		this.skills = o.skills || null; // { cast(id, localPoint, target) -> bool, cost(id), supports?(id), status?(id) -> null | 'cooldown' | 'casting' | 'town', label?(id) }
		this.right = o.right || null;
		this.walk = false;
		this.cooldowns = {};
		this.intent = null;
		this.input = null;
		this.swing = 0;
		this.special = {};
		this.castHold = new CastHold(); // the right button: a press is buffered while busy, a hold repeats
		this.castFail = null; // why the last useSkill() failed (see castControl REASONS)
		this.onNotice = null; // (text, kind, key) -> void, set by the host; default is a floating text over the hero
		this.notice = new Notice((text, kind, key) => (this.onNotice ? this.onNotice(text, kind, key) : floatAt(this, text, 'miss', 1.2)), { interval: 1.2, clock: () => G.time });
		this.stats = {};
		this.xp = 0;
		this.kills = 0;
		this.setLevel(o.level || 1);
	}

	// ---------------------------------------------------------------- stats (v1 recalc without items)
	setLevel(level) {
		this.level = clamp(Math.round(level), 1, 99);
		this.xp = Math.max(this.xp, this.xpAt(this.level));
		this.recalc(true);
	}

	xpAt(level) {
		let xp = 0;
		for (let L = 1; L < level; L++) xp += XP_NEXT(L);
		return xp;
	}

	recalc(initial = false) {
		const C = this.C;
		const W = WEAPONS[this.cls];
		const lifeFrac = initial ? 1 : this.life / Math.max(1, this.maxLife);
		const manaFrac = initial ? 1 : this.mana / Math.max(1, this.maxMana);
		const S = { ...C.base };
		for (const [k, v] of Object.entries(C.perLevel)) S[k] += v * (this.level - 1);
		this.stats = S;
		this.maxLife = Math.round(C.life[0] + (this.level - 1) * C.life[1] + (S.vit - C.base.vit) * C.life[2]);
		this.maxMana = Math.round(C.mana[0] + (this.level - 1) * C.mana[1] + (S.ene - C.base.ene) * C.mana[2]);
		// Weapon grows a little with level (stands in for finding better gear).
		const gear = 1 + (this.level - 1) * 0.12;
		const mult = 1 + S.str / 100;
		this.dmgMin = Math.max(1, W.min * gear * mult);
		this.dmgMax = Math.max(this.dmgMin + 1, W.max * gear * mult);
		this.ar = Math.max(1, (S.dex - 7) * 5 + C.arC + this.level * 6);
		this.def = Math.round(S.dex / 4 + 6 + this.level * 4);
		this.blockChance = W.shield ? clamp((W.shield + C.block) * Math.max(0, S.dex - 15) / (this.level * 2), 0, 50) : 0;
		this.atkSpeed = clamp(1 / W.speed, 0.5, 2.6);
		this.castSpeed = 1;
		this.moveSpeed = 5.6; // v1 run speed
		this.res = { fire: 0, cold: 0, light: 0, poison: 0 };
		this.crit = 0;
		this.life = initial ? this.maxLife : Math.max(1, lifeFrac * this.maxLife);
		this.mana = initial ? this.maxMana : manaFrac * this.maxMana;
		Events.emit('statsChanged');
	}

	reach() {
		return this.reachOverride || WEAPONS[this.cls].reach;
	}

	speed() {
		return this.moveSpeed * this.slowMul() * (this.walk ? 0.45 : 1);
	}

	// ---------------------------------------------------------------- XP (v1 gainXP / levelUp)
	gainXP(xp, mlvl) {
		if (this.dead) return;
		const d = mlvl - this.level;
		let k = 1;
		if (d < -5) k = Math.max(0.05, 1 + (d + 5) * 0.15);
		else if (d > 5) k = Math.max(0.35, 1 - (d - 5) * 0.08);
		this.xp += Math.max(1, Math.round(xp * k));
		this.kills++;
		while (this.level < 99 && this.xp >= this.xpAt(this.level + 1)) this.levelUp();
	}

	levelUp() {
		this.level++;
		this.recalc();
		this.life = this.maxLife;
		this.mana = this.maxMana;
		floatAt(this, `Level ${this.level}`, 'xp', 1.25);
		Events.emit('levelUp', this.level);
	}

	// ---------------------------------------------------------------- combat hooks
	onHitRecover() {
		const dur = 0.42;
		this.hitImmuneT = dur + 0.25;
		this.startAction('hit', 'hit', { speed: 0.42 / dur, lock: true });
	}
	onHurt(total) {
		if (total > 0) {
			Engine.hurtFlash(Math.min(0.9, 0.25 + (total / this.maxLife) * 2.5));
			Engine.rig.shake(Math.min(0.35, (total / this.maxLife) * 1.2));
		}
	}
	onBlock() {
		this.startAction('block', 'block', { speed: 1.4, lock: true });
	}
	onDeath() {
		this.model.play('death', { restart: true });
		this.intent = null;
		Engine.rig.shake(0.5);
		Events.emit('playerDied', this);
	}

	revive() {
		this.dead = false;
		this.corpse = false;
		this.deadT = 0;
		this.action = null;
		this.intent = null;
		this.st.freeze = this.st.chill = this.st.poison = this.st.burn = this.st.bleed = this.st.stun = 0;
		this.life = this.maxLife;
		this.mana = this.maxMana;
		this.castHold.clear();
		this.model.setTint(null);
		this.model.revive();
	}

	// ---------------------------------------------------------------- skill use (v1 useSkill)
	/**
	 * 'ok' | 'move' | 'busy' | 'fail'. A failure sets `castFail` to the reason (castControl REASONS, or 'town') and, unless `quiet`
	 * (a held button retrying), tells the player; transient reasons (busy, cooling) stay quiet while the button repeats.
	 */
	useSkill(id, point, target, inPlace = false, quiet = false) {
		if (this.action && this.action.lock) {
			this.castFail = 'busy';
			return 'busy';
		}
		if (id === 'attack') return this.attack(point, target, inPlace);
		const S = this.skills;
		const name = S?.label?.(id) || id;
		const fail = (reason) => {
			this.castFail = reason;
			if (!quiet || !TRANSIENT.has(reason)) this.notice.say(`${id}:${reason}`, castMessage(reason, name), reason === 'unsupported' ? 'error' : 'info');
			return 'fail';
		};
		this.castFail = null;
		if (!S || (S.supports && !S.supports(id))) return fail('unsupported');
		const status = S.status ? S.status(id) : null;
		if (status === 'town' || status === 'unknown') return fail(status === 'unknown' ? 'unsupported' : status);
		const cost = S.cost(id);
		const why = gateCast({ dead: this.dead, casting: status === 'casting', cooling: status === 'cooldown', mana: this.mana, cost });
		if (why) return fail(why);
		const refused = S.check?.(id, point, target); // a skill that can see up front it has nowhere to go: nothing is spent, nobody turns
		if (refused) return fail(refused);
		const tp = target && !target.dead ? target.pos : point;
		this.face(tp.x, tp.z, true);
		if (!S.cast(id, point, target)) return fail('failed');
		this.mana -= cost;
		return 'ok';
	}

	attack(point, target, inPlace) {
		if (target && !inPlace && !this.ranged) {
			const d = Math.hypot(target.pos.x - this.pos.x, target.pos.z - this.pos.z) - target.radius;
			if (d > this.reach()) return 'move';
		}
		if (target && this.ranged && !inPlace) {
			const d = Math.hypot(target.pos.x - this.pos.x, target.pos.z - this.pos.z);
			if (d > 14) return 'move';
		}
		const tp = target && !target.dead ? target.pos : point;
		this.face(tp.x, tp.z, true);
		const dir = new THREE.Vector3(tp.x - this.pos.x, 0, tp.z - this.pos.z);
		if (dir.lengthSq() < 1e-4) dir.set(Math.sin(this.facing), 0, Math.cos(this.facing));
		dir.normalize();
		const anim = this.swing++ % 2 ? 'attack2' : 'attack1';
		this.startAction('attack', anim, {
			speed: this.atkSpeed,
			onImpact: () => {
				if (this.ranged) this.shoot(dir);
				else if (target) meleeStrike(this, target);
				else this.swingAt(dir);
			},
		});
		return 'ok';
	}

	/** In-place swing (shift): first enemy in front. */
	swingAt(dir) {
		enemiesNear(this.pos.x + dir.x, this.pos.z + dir.z, this.reach(), 0, _hits);
		if (_hits[0]) meleeStrike(this, _hits[0]);
	}

	/** Bows / crossbows (ranged stance in the Character tab): an arrow with a normal attack roll. */
	shoot(dir) {
		const p = attackPacket(this, { melee: false });
		spawnProjectile({ kind: 'arrow', pos: new THREE.Vector3(this.pos.x + dir.x * 0.5, this.pos.y + this.height * 0.62, this.pos.z + dir.z * 0.5), dir, speed: 22, range: 16, team: 0, owner: this, packet: p, radius: 0.3, autoAttack: true });
	}

	// ---------------------------------------------------------------- per-frame (v1 update)
	update(dt) {
		if (this.dead) {
			this.model.update(dt, { speed: 0 });
			return;
		}
		this.tickStatus(dt);
		if (this.dead) return;
		this.mana = Math.min(this.maxMana, this.mana + (this.maxMana / 90) * dt);
		this.life = Math.min(this.maxLife, this.life + (this.maxLife / 300) * dt); // a trickle, the lab has no potions
		this.tickAction(dt);
		let speed = 0;
		if (!this.stunned) speed = this.processIntent(dt);
		this.separate(dt, 0.4);
		this.collide();
		this.speedNow = speed;
		this.updateModel(dt, speed);
		Engine.lowLife = this.life < this.maxLife * 0.3 ? 1 : 0;
	}

	processIntent(dt) {
		const I = this.input;
		if (I) this.handleInput(I, dt);
		const it = this.intent;
		if (!it) return 0;
		if (this.action && this.action.lock) return 0;
		if (it.type === 'move') {
			if (it.repath <= 0 || !this.path) {
				this.path = G.nav.path(this.pos.x, this.pos.z, it.point.x, it.point.z, 5000);
				this.pathI = 0;
				it.repath = 0.15;
			}
			it.repath -= dt;
			if (!this.path || !this.followPath(dt, this.speed())) {
				if (!I || !I.lmb) this.intent = null;
				return 0;
			}
			return this.speed();
		}
		if (it.type === 'skill') {
			const t = it.target;
			if (t && (t.dead || t.removed)) {
				this.intent = null;
				return 0;
			}
			const res = this.useSkill(it.skill, t ? t.pos : it.point, t, it.inPlace);
			if (res === 'move') return this.moveToward(t.pos.x, t.pos.z, dt, it);
			if (res === 'ok') {
				if (!it.repeat) this.intent = null;
				return 0;
			}
			if (res === 'busy') return 0;
			this.intent = null;
		}
		return 0;
	}

	moveToward(x, z, dt, it) {
		it.repath = (it.repath ?? 0) - dt;
		if (it.repath <= 0 || !this.path) {
			this.path = G.nav.path(this.pos.x, this.pos.z, x, z, 5000);
			this.pathI = 0;
			it.repath = 0.25;
		}
		const sp = this.speed();
		if (!this.path || !this.followPath(dt, sp)) this.steer(x, z, sp, dt, 0.1);
		return sp;
	}

	handleInput(I, dt) {
		// Left button: attack what is under the cursor, shift attacks in place, otherwise move (hold to steer).
		if (I.lmbDown) {
			const h = I.hover;
			if (h && h.type === 'actor') this.intent = { type: 'skill', skill: 'attack', target: h.ref, point: h.ref.pos.clone(), repeat: true };
			else if (I.shift) this.intent = { type: 'skill', skill: 'attack', target: null, point: I.ground.clone(), repeat: true, inPlace: true };
			else this.intent = { type: 'move', point: I.ground.clone(), repath: 0 };
		} else if (I.lmb && this.intent) {
			if (this.intent.type === 'move') {
				if (this.intent.point.distanceToSquared(I.ground) > 0.3) {
					this.intent.point.copy(I.ground);
					this.intent.repath = Math.min(this.intent.repath, 0.12);
				}
			} else if (this.intent.type === 'skill' && this.intent.inPlace) this.intent.point.copy(I.ground);
		}
		if (!I.lmb && this.intent && this.intent.type === 'skill' && this.intent.repeat) this.intent.repeat = false;
		// Right button: the selected skill at the monster / ground under the cursor. A press is buffered while the hero is busy, a hold repeats
		// (never through a running cast or a cooldown); the same press / hold / release intent as the reference controls.
		if (I.rmbDown) this.castHold.press('mouse');
		if (!I.rmb) this.castHold.release('mouse');
		if (this.right) {
			this.castHold.step(dt, ({ fresh }) => {
				const h = I.hover;
				const target = h && h.type === 'actor' ? h.ref : null;
				const r = this.useSkill(this.right, target ? target.pos.clone() : I.ground.clone(), target, false, !fresh);
				if (r === 'ok') this.intent = null;
				return { ok: r === 'ok', reason: r === 'ok' ? null : this.castFail };
			});
		} else this.castHold.clear();
	}

	/** Cast the right-button skill at the cursor once (a quickcast hotkey): a buffered press, like the right button. */
	quickcast() {
		this.castHold.press('quick');
		this.castHold.release('quick');
	}

	heal(amount) {
		heal(this, amount, true);
	}
}

export { rnd };

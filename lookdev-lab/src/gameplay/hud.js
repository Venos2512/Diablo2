// Diablo-style HUD for gameplay preview, built from the project's HUD sprite sheets
// (art-output/ui-hud-assets → scripts/prepare-hud.py → ./hud/*.webp): life / mana orbs in iron housings,
// stone bottom bar with mouse skills, potion belt and F1–F8 skills, XP bar, menu buttons,
// hovered-target name plate, death banner.
import { toast } from '../ui/toast.js';
import { SKILLS, SKILL_ORDER } from '../skills/skills.js';

import orbFrameLife from './hud/orb_frame_life.webp';
import orbFrameMana from './hud/orb_frame_mana.webp';
import orbLife from './hud/orb_life.webp';
import orbMana from './hud/orb_mana.webp';
import orbEmpty from './hud/orb_empty.webp';
import orbGlass from './hud/orb_glass.webp';
import barPanel from './hud/bar_panel.webp';
import xpTrough from './hud/xp_trough.webp';
import xpFill from './hud/xp_fill.webp';
import slotMouse from './hud/slot_mouse.webp';
import slotSkill from './hud/slot_skill.webp';
import slotPotion from './hud/slot_potion.webp';
import slotSelected from './hud/slot_selected.webp';
import nameplate from './hud/nameplate.webp';
import fillLife from './hud/fill_life.webp';
import fillChampion from './hud/fill_champion.webp';
import btnCharacter from './hud/btn_character.webp';
import btnCharacterHover from './hud/btn_character_hover.webp';
import btnInventory from './hud/btn_inventory.webp';
import btnInventoryHover from './hud/btn_inventory_hover.webp';
import btnSkills from './hud/btn_skills.webp';
import btnSkillsHover from './hud/btn_skills_hover.webp';
import btnQuests from './hud/btn_quests.webp';
import btnQuestsHover from './hud/btn_quests_hover.webp';
import btnMap from './hud/btn_map.webp';
import btnMapHover from './hud/btn_map_hover.webp';
import btnSystem from './hud/btn_system.webp';
import btnSystemHover from './hud/btn_system_hover.webp';
import skillSlash from './hud/skill_slash.webp';
import skillBash from './hud/skill_bash.webp';
import skillCharge from './hud/skill_charge.webp';
import skillHolyFire from './hud/skill_holy_fire.webp';
import skillWarCry from './hud/skill_war_cry.webp';
import skillHeal from './hud/skill_heal.webp';
import skillWhirl from './hud/skill_whirl.webp';
import skillAura from './hud/skill_aura.webp';
import statusPoison from './hud/status_poison.webp';
import statusBurn from './hud/status_burn.webp';
import statusFreeze from './hud/status_freeze.webp';
import statusBleed from './hud/status_bleed.webp';
import potionLife from './hud/potion_life.webp';
import potionMana from './hud/potion_mana.webp';
import potionRejuv from './hud/potion_rejuv.webp';
import scrollPortal from './hud/scroll_portal.webp';

const ELITE_COLORS = { champion: '#7aa8ff', unique: '#c7b377', boss: '#ff7a3a', minion: '#c9c0aa', normal: '#e0e0e0' };

/** Placeholder icon per lab skill (the sheet's icons are knight skills; they stand in until class icons exist). */
const SKILL_ICONS = {
	fireball: skillHolyFire, frozenorb: statusFreeze, chainlightning: skillAura, meteor: statusBurn, blizzard: skillWhirl,
	firewall: skillWarCry, bonespear: skillSlash, bonespirit: statusBleed, poisonnova: statusPoison, blessedhammer: skillBash,
	holyfreeze: skillHeal, teleport: skillCharge,
};
const POTION_ICONS = { life: potionLife, mana: potionMana, rejuv: potionRejuv, portal: scrollPortal };
const BUTTONS = [
	['Character', btnCharacter, btnCharacterHover], ['Inventory', btnInventory, btnInventoryHover], ['Skills', btnSkills, btnSkillsHover],
	['Quests', btnQuests, btnQuestsHover], ['Map', btnMap, btnMapHover], ['System', btnSystem, btnSystemHover],
];
/** Width of the whole bottom bar at scale 1 (orb housing + panel + orb housing), see .gp-bottom in styles.css. */
const BAR_WIDTH = 1090;

export class GameHud {
	constructor(viewport) {
		const el = document.createElement('div');
		el.className = 'gp-hud';
		el.hidden = true;
		const skill = (id, i) => `<div class="gp-slot gp-skillslot" data-skill="${id}" title="${SKILLS[id]?.label ?? id} (F${i + 1})">
			<img src="${SKILL_ICONS[id] ?? skillSlash}" alt=""><b>F${i + 1}</b></div>`;
		el.innerHTML = `
			<div class="gp-target" hidden>
				<div class="gp-plate"><i></i><span class="gp-target-name"></span></div>
				<div class="gp-target-mods"></div>
			</div>
			<div class="gp-bottom">
				<div class="gp-orb gp-life"><div class="gp-globe"><i></i></div><span></span></div>
				<div class="gp-center">
					<div class="gp-top">
						<div class="gp-level"></div>
						<div class="gp-buttons">${BUTTONS.map(([label], i) => `<button type="button" data-i="${i}" title="${label}"></button>`).join('')}</div>
					</div>
					<div class="gp-xp"><i></i></div>
					<div class="gp-panel">
						<div class="gp-slot gp-mouse gp-lmb" title="Left click: attack"><img src="${skillSlash}" alt=""><b>L</b></div>
						<div class="gp-belt">${['life', 'mana', 'rejuv', 'portal'].map((p, i) => `<div class="gp-slot gp-potion" data-potion="${p}"><img src="${POTION_ICONS[p]}" alt=""><b>${i + 1}</b><em></em></div>`).join('')}</div>
						<div class="gp-skills">${SKILL_ORDER.slice(0, 8).map(skill).join('')}</div>
						<div class="gp-slot gp-mouse gp-rmb"><img alt=""><b>R</b></div>
					</div>
				</div>
				<div class="gp-orb gp-mana"><div class="gp-globe"><i></i></div><span></span></div>
			</div>
			<div class="gp-dead" hidden>You have fallen<small>Enter to revive · Esc to leave play</small></div>
			<div class="gp-hurt"></div>`;
		const vars = {
			'orb-frame-life': orbFrameLife, 'orb-frame-mana': orbFrameMana, 'orb-life': orbLife, 'orb-mana': orbMana, 'orb-empty': orbEmpty,
			'orb-glass': orbGlass, 'bar-panel': barPanel, 'xp-trough': xpTrough, 'xp-fill': xpFill, 'slot-mouse': slotMouse,
			'slot-skill': slotSkill, 'slot-potion': slotPotion, 'slot-selected': slotSelected, nameplate, 'fill-life': fillLife,
			'fill-champion': fillChampion,
		};
		for (const [name, url] of Object.entries(vars)) el.style.setProperty(`--hud-${name}`, `url("${url}")`);
		el.querySelectorAll('.gp-buttons button').forEach((b) => {
			const [label, normal, hover] = BUTTONS[b.dataset.i];
			b.style.setProperty('--img', `url("${normal}")`);
			b.style.setProperty('--img-hover', `url("${hover}")`);
			b.addEventListener('click', () => toast(`${label}: not in the lab preview yet`, 'info', 1200));
		});
		viewport.appendChild(el);
		this.el = el;
		this.q = (s) => el.querySelector(s);
		this.hurtAmount = 0;
		this.right = null;
		// Fit the bar to narrow viewports (the lab's side panels leave ~900 px).
		new ResizeObserver(() => el.style.setProperty('--hud-scale', String(Math.min(1, (el.clientWidth - 16) / BAR_WIDTH)))).observe(el);
	}

	show(on) {
		this.el.hidden = !on;
	}

	hurt(amount) {
		this.hurtAmount = Math.max(this.hurtAmount, amount);
	}

	/** @param {{ player, hover, skillLabel: string, belt?: { kind: string, count: number }[] }} state */
	update(dt, { player, hover, skillLabel, belt }) {
		if (!player) return;
		const life = Math.max(0, player.life / Math.max(1, player.maxLife));
		const mana = Math.max(0, player.mana / Math.max(1, player.maxMana));
		this.q('.gp-life i').style.clipPath = `inset(${(1 - life) * 100}% 0 0 0)`;
		this.q('.gp-mana i').style.clipPath = `inset(${(1 - mana) * 100}% 0 0 0)`;
		this.q('.gp-life span').textContent = `${Math.ceil(player.life)} / ${player.maxLife}`;
		this.q('.gp-mana span').textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;
		const from = player.xpAt(player.level);
		const to = player.xpAt(player.level + 1);
		const xp = Math.min(1, (player.xp - from) / Math.max(1, to - from));
		this.q('.gp-xp i').style.clipPath = `inset(0 ${(1 - xp) * 100}% 0 0)`;
		this.q('.gp-level').textContent = `${player.C.name} · Level ${player.level} · ${player.kills} kills`;
		this.q('.gp-dead').hidden = !player.dead;

		if (this.right !== player.right) {
			this.right = player.right;
			const rmb = this.q('.gp-rmb');
			rmb.querySelector('img').src = SKILL_ICONS[player.right] ?? skillSlash;
			rmb.title = skillLabel;
			for (const s of this.el.querySelectorAll('.gp-skillslot')) s.classList.toggle('on', s.dataset.skill === player.right);
		}
		if (belt) {
			this.el.querySelectorAll('.gp-potion').forEach((s, i) => {
				const n = belt[i]?.count ?? 0;
				s.querySelector('em').textContent = n > 1 ? String(n) : '';
				s.classList.toggle('empty', n <= 0);
			});
		}

		const target = hover && hover.type === 'actor' ? hover.ref : null;
		const t = this.q('.gp-target');
		t.hidden = !target;
		if (target) {
			const kind = target.displayKind || 'normal';
			const name = this.q('.gp-target-name');
			name.textContent = target.name;
			name.style.color = ELITE_COLORS[kind] || ELITE_COLORS.normal;
			const bar = this.q('.gp-plate i');
			bar.style.clipPath = `inset(0 ${(1 - Math.max(0, target.life / target.maxLife)) * 100}% 0 0)`;
			bar.classList.toggle('elite', kind !== 'normal' && kind !== 'minion');
			this.q('.gp-target-mods').textContent = (target.modNames || []).join(' · ');
		}

		this.hurtAmount = Math.max(0, this.hurtAmount - dt * 1.6);
		const lowLife = life < 0.3 && !player.dead ? 0.25 + 0.15 * Math.sin(performance.now() / 180) : 0;
		this.q('.gp-hurt').style.opacity = String(Math.min(0.8, this.hurtAmount + lowLife));
	}
}

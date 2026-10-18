// Minimal Diablo-style HUD for gameplay preview: life / mana orbs, XP bar, hovered-target bar, death banner.
const ELITE_COLORS = { champion: '#7aa8ff', unique: '#d8b45a', boss: '#ff7a3a', minion: '#c9c0aa', normal: '#e8e0cc' };

export class GameHud {
	constructor(viewport) {
		const el = document.createElement('div');
		el.className = 'gp-hud';
		el.hidden = true;
		el.innerHTML = `
			<div class="gp-target" hidden><div class="gp-target-name"></div><div class="gp-target-bar"><i></i></div><div class="gp-target-mods"></div></div>
			<div class="gp-orb gp-life"><i></i><span></span></div>
			<div class="gp-center">
				<div class="gp-skill"></div>
				<div class="gp-xp"><i></i></div>
				<div class="gp-level"></div>
			</div>
			<div class="gp-orb gp-mana"><i></i><span></span></div>
			<div class="gp-dead" hidden>You have fallen<small>Enter to revive · Esc to leave play</small></div>
			<div class="gp-hurt"></div>`;
		viewport.appendChild(el);
		this.el = el;
		this.q = (s) => el.querySelector(s);
		this.hurtAmount = 0;
	}

	show(on) {
		this.el.hidden = !on;
	}

	hurt(amount) {
		this.hurtAmount = Math.max(this.hurtAmount, amount);
	}

	update(dt, { player, hover, skillLabel }) {
		if (!player) return;
		const life = player.life / Math.max(1, player.maxLife);
		const mana = player.mana / Math.max(1, player.maxMana);
		this.q('.gp-life i').style.height = `${Math.max(0, life) * 100}%`;
		this.q('.gp-mana i').style.height = `${Math.max(0, mana) * 100}%`;
		this.q('.gp-life span').textContent = `${Math.ceil(player.life)} / ${player.maxLife}`;
		this.q('.gp-mana span').textContent = `${Math.floor(player.mana)} / ${player.maxMana}`;
		const from = player.xpAt(player.level);
		const to = player.xpAt(player.level + 1);
		this.q('.gp-xp i').style.width = `${Math.min(1, (player.xp - from) / Math.max(1, to - from)) * 100}%`;
		this.q('.gp-level').textContent = `${player.C.name} · Level ${player.level} · ${player.kills} kills`;
		this.q('.gp-skill').textContent = skillLabel;
		this.q('.gp-dead').hidden = !player.dead;

		const target = hover && hover.type === 'actor' ? hover.ref : null;
		const t = this.q('.gp-target');
		t.hidden = !target;
		if (target) {
			const kind = target.displayKind || 'normal';
			const name = this.q('.gp-target-name');
			name.textContent = target.name;
			name.style.color = ELITE_COLORS[kind] || ELITE_COLORS.normal;
			this.q('.gp-target-bar i').style.width = `${Math.max(0, target.life / target.maxLife) * 100}%`;
			this.q('.gp-target-mods').textContent = (target.modNames || []).join(' · ');
		}

		this.hurtAmount = Math.max(0, this.hurtAmount - dt * 1.6);
		const lowLife = life < 0.3 && !player.dead ? 0.25 + 0.15 * Math.sin(performance.now() / 180) : 0;
		this.q('.gp-hurt').style.opacity = String(Math.min(0.8, this.hurtAmount + lowLife));
	}
}

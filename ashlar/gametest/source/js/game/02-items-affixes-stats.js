// ===== game part 02-items-affixes-stats (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
function Hd(e4 = 7) {
  let t2 = new Bd(44, 44);
  t2.walk.fill(1);
  let n2 = new Float32Array(2025), r2 = new Float32Array(2025).fill(1), i2 = new Uint8Array(1936 * 4), a2 = new Uint8Array(1936);
  for (let t3 = 0; t3 <= 44; t3 += 1) for (let r3 = 0; r3 <= 44; r3 += 1) {
    let i3 = Math.hypot(r3 - 22, t3 - 22);
    n2[t3 * 45 + r3] = (Fd(r3 * 0.08, t3 * 0.08, 3, e4) - 0.5) * 1.2 + Math.max(0, i3 - 9) * 0.06;
  }
  for (let t3 = 0; t3 < 44; t3 += 1) for (let n3 = 0; n3 < 44; n3 += 1) {
    let r3 = (t3 * 44 + n3) * 4, o3 = Math.hypot(n3 + 0.5 - 22, t3 + 0.5 - 22), s3 = Fd(n3 * 0.2, t3 * 0.2, 3, e4 + 1), c3 = Math.max(0, Math.min(1, (6 - o3) / 3 + (s3 - 0.5)));
    i2[r3] = Math.round(255 * (1 - c3)), i2[r3 + 1] = Math.round(255 * c3 * 0.7), i2[r3 + 2] = Math.round(255 * c3 * 0.3), i2[r3 + 3] = o3 < 2.2 ? 200 : 0, a2[t3 * 44 + n3] = o3 > 5 ? Math.round(220 * Math.min(1, (o3 - 5) / 4) * (0.5 + s3)) : 0;
  }
  let o2 = new Id(e4), s2 = [], c2 = (e5, t3, n3, r3, i3 = 1, a3 = 0) => s2.push({ kind: e5, x: t3, z: n3, rot: r3, scale: i3, variant: a3 });
  c2(`tent`, 15.5, 17.5, 0.9, 1, 0), c2(`banner`, 18.4, 15.2, 0.5, 1, 0), c2(`gnarledTree`, 13, 12, 0.4, 1.5, 1), c2(`deadTree`, 24, 11, 1.2, 1.4, 2), c2(`deadTree`, 10, 23, 2.1, 1.3, 0), c2(`cart`, 27.5, 15.5, 2.4, 1, 1), c2(`ruinWall`, 12, 18, 0.7, 1, 1), c2(`ruinWall`, 10.5, 20, 1.2, 1, 2), c2(`standingStone`, 30, 13, 0.3, 1.3, 1), c2(`logPile`, 26, 18.5, 0.8), c2(`bench`, 18.8, 22.8, 1.2, 1, 0);
  for (let e5 = 0; e5 < 40; e5 += 1) {
    let e6 = o2.range(0, Math.PI * 2), t3 = o2.range(11, 20), n3 = o2.next(), r3 = Math.cos(e6 - Math.PI / 4) > 0.3 && t3 < 17;
    c2(n3 < 0.4 ? r3 ? `rock` : `deadTree` : n3 < 0.7 ? `rock` : `bush`, 22 + Math.cos(e6) * t3, 22 + Math.sin(e6) * t3, o2.range(0, 6.28), o2.range(0.8, 1.4), o2.int(0, 3));
  }
  return { areaId: `title`, theme: `moor`, w: 44, h: 44, nav: t2, height: n2, splat: i2, ao: r2, props: s2, objects: [{ kind: `campfire`, x: 22, z: 22, rot: 0, tier: 2 }], npcs: [], spawns: [], lights: [{ x: 22, y: 1.3, z: 22, color: `#ff8a3a`, intensity: 40, distance: 18, flicker: 2, priority: 5 }], water: [], entries: { start: { x: 22, z: 22 } }, grass: a2, regions: { fire: { x: 22, z: 22, r: 3 } } };
}
var Ud = [`weapon`], Wd = [`helm`, `armor`, `shield`, `gloves`, `boots`, `belt`], Gd = [`ring`, `amulet`], Kd = [...Ud, ...Wd, ...Gd, `charm`, `jewel`], qd = [`helm`, `armor`, `shield`, `gloves`, `boots`, `belt`], Jd = [];
function Yd(e4, t2, n2, r2, i2, a2, o2 = 10, s2) {
  Jd.push({ id: e4, name: t2, kind: `prefix`, level: n2, cats: r2, group: i2, mods: a2, weight: o2, classOnly: s2 });
}
function Xd(e4, t2, n2, r2, i2, a2, o2 = 10) {
  Jd.push({ id: e4, name: t2, kind: `suffix`, level: n2, cats: r2, group: i2, mods: a2, weight: o2 });
}
Yd(`ed1`, `Jagged`, 1, Ud, `ed`, [{ stat: `ed`, min: 10, max: 20 }]), Yd(`ed2`, `Deadly`, 6, Ud, `ed`, [{ stat: `ed`, min: 21, max: 30 }]), Yd(`ed3`, `Vicious`, 11, Ud, `ed`, [{ stat: `ed`, min: 31, max: 40 }]), Yd(`ed4`, `Brutal`, 18, Ud, `ed`, [{ stat: `ed`, min: 41, max: 50 }], 6), Yd(`ed5`, `Merciless`, 26, Ud, `ed`, [{ stat: `ed`, min: 51, max: 65 }], 3), Yd(`edar1`, `Fine`, 3, Ud, `ed`, [{ stat: `ed`, min: 16, max: 25 }, { stat: `ar`, min: 10, max: 20 }]), Yd(`edar2`, `Warrior's`, 10, Ud, `ed`, [{ stat: `ed`, min: 26, max: 35 }, { stat: `ar`, min: 21, max: 40 }]), Yd(`edar3`, `Soldier's`, 16, Ud, `ed`, [{ stat: `ed`, min: 36, max: 45 }, { stat: `ar`, min: 41, max: 60 }], 6), Yd(`ar1`, `Bronze`, 1, Ud, `ar`, [{ stat: `ar`, min: 10, max: 20 }]), Yd(`ar2`, `Iron`, 5, Ud, `ar`, [{ stat: `ar`, min: 21, max: 40 }]), Yd(`ar3`, `Steel`, 10, Ud, `ar`, [{ stat: `ar`, min: 41, max: 60 }]), Yd(`ar4`, `Silver`, 16, Ud, `ar`, [{ stat: `ar`, min: 61, max: 80 }]), Yd(`def1`, `Sturdy`, 1, qd, `edArmor`, [{ stat: `edArmor`, min: 10, max: 20 }]), Yd(`def2`, `Strong`, 6, qd, `edArmor`, [{ stat: `edArmor`, min: 21, max: 30 }]), Yd(`def3`, `Glorious`, 12, qd, `edArmor`, [{ stat: `edArmor`, min: 31, max: 40 }]), Yd(`def4`, `Blessed`, 18, qd, `edArmor`, [{ stat: `edArmor`, min: 41, max: 50 }], 6), Yd(`flatdef1`, `Hardened`, 2, qd, `def`, [{ stat: `def`, min: 5, max: 10 }]), Yd(`flatdef2`, `Fortified`, 9, qd, `def`, [{ stat: `def`, min: 11, max: 20 }]), Yd(`rf1`, `Crimson`, 1, [...Wd, ...Gd], `resFire`, [{ stat: `resFire`, min: 5, max: 10 }]), Yd(`rf2`, `Russet`, 8, [...Wd, ...Gd], `resFire`, [{ stat: `resFire`, min: 11, max: 20 }]), Yd(`rf3`, `Garnet`, 16, [...Wd, ...Gd], `resFire`, [{ stat: `resFire`, min: 21, max: 30 }], 6), Yd(`rc1`, `Azure`, 1, [...Wd, ...Gd], `resCold`, [{ stat: `resCold`, min: 5, max: 10 }]), Yd(`rc2`, `Lapis`, 8, [...Wd, ...Gd], `resCold`, [{ stat: `resCold`, min: 11, max: 20 }]), Yd(`rc3`, `Cobalt`, 16, [...Wd, ...Gd], `resCold`, [{ stat: `resCold`, min: 21, max: 30 }], 6), Yd(`rl1`, `Ochre`, 1, [...Wd, ...Gd], `resLight`, [{ stat: `resLight`, min: 5, max: 10 }]), Yd(`rl2`, `Amber`, 8, [...Wd, ...Gd], `resLight`, [{ stat: `resLight`, min: 11, max: 20 }]), Yd(`rl3`, `Tawny`, 16, [...Wd, ...Gd], `resLight`, [{ stat: `resLight`, min: 21, max: 30 }], 6), Yd(`rp1`, `Beryl`, 1, [...Wd, ...Gd], `resPoison`, [{ stat: `resPoison`, min: 5, max: 10 }]), Yd(`rp2`, `Jade`, 8, [...Wd, ...Gd], `resPoison`, [{ stat: `resPoison`, min: 11, max: 20 }]), Yd(`ra1`, `Shimmering`, 6, [...Wd, ...Gd], `resAll`, [{ stat: `resAll`, min: 5, max: 10 }], 6), Yd(`ra2`, `Prismatic`, 18, [...Wd, ...Gd], `resAll`, [{ stat: `resAll`, min: 11, max: 15 }], 3), Yd(`mana1`, `Lizard's`, 1, [...Gd, `helm`, `armor`, `shield`, `weapon`, `charm`], `mana`, [{ stat: `mana`, min: 5, max: 10 }]), Yd(`mana2`, `Snake's`, 7, [...Gd, `helm`, `armor`, `shield`, `weapon`, `charm`], `mana`, [{ stat: `mana`, min: 11, max: 20 }]), Yd(`mana3`, `Serpent's`, 14, [...Gd, `helm`, `armor`, `shield`, `weapon`, `charm`], `mana`, [{ stat: `mana`, min: 21, max: 30 }]), Yd(`skS`, `Arcanist's`, 6, [`weapon`, `helm`, `amulet`, `shield`], `classSkills`, [{ stat: `classSkills`, min: 1, max: 1 }], 4, `sorceress`), Yd(`skB`, `Reaver's`, 6, [`weapon`, `helm`, `amulet`, `shield`], `classSkills`, [{ stat: `classSkills`, min: 1, max: 1 }], 4, `barbarian`), Yd(`skN`, `Gravecaller's`, 6, [`weapon`, `helm`, `amulet`, `shield`], `classSkills`, [{ stat: `classSkills`, min: 1, max: 1 }], 4, `necromancer`), Yd(`allsk`, `Exalted`, 22, [`amulet`, `helm`, `weapon`], `allSkills`, [{ stat: `allSkills`, min: 1, max: 1 }], 1), Yd(`blk`, `Bulwark`, 4, [`shield`], `block`, [{ stat: `block`, min: 10, max: 20 }]), Yd(`mf1`, `Fortuitous`, 8, [...Gd, `helm`, `armor`, `boots`, `gloves`], `mf`, [{ stat: `mf`, min: 6, max: 12 }], 5), Yd(`thorn1`, `Barbed`, 4, [`armor`, `shield`], `thorns`, [{ stat: `thorns`, min: 3, max: 8 }]), Yd(`fcrP`, `Seer's`, 9, [`amulet`, `ring`, `weapon`, `helm`], `fcrP`, [{ stat: `fcr`, min: 10, max: 10 }], 5), Yd(`lifeC`, `Vital`, 4, [`charm`], `lifeC`, [{ stat: `life`, min: 3, max: 15 }]), Yd(`arC`, `Keen`, 4, [`charm`, `jewel`], `arC`, [{ stat: `ar`, min: 5, max: 25 }]), Yd(`edJ`, `Ruthless`, 6, [`jewel`], `edJ`, [{ stat: `ed`, min: 5, max: 20 }]), Yd(`resC`, `Warded`, 4, [`charm`, `jewel`], `resC`, [{ stat: `resAll`, min: 2, max: 5 }], 6), Xd(`life1`, `of the Jackal`, 1, [...Wd, ...Gd, `charm`, `jewel`], `life`, [{ stat: `life`, min: 1, max: 5 }]), Xd(`life2`, `of the Fox`, 5, [...Wd, ...Gd, `charm`, `jewel`], `life`, [{ stat: `life`, min: 6, max: 10 }]), Xd(`life3`, `of the Wolf`, 10, [...Wd, ...Gd, `charm`], `life`, [{ stat: `life`, min: 11, max: 20 }]), Xd(`life4`, `of the Tiger`, 16, [...Wd, ...Gd], `life`, [{ stat: `life`, min: 21, max: 30 }]), Xd(`life5`, `of the Mammoth`, 24, [`armor`, `shield`, `helm`, `belt`], `life`, [{ stat: `life`, min: 31, max: 40 }], 6), Xd(`str1`, `of Strength`, 1, Kd, `str`, [{ stat: `str`, min: 1, max: 3 }]), Xd(`str2`, `of Might`, 6, Kd, `str`, [{ stat: `str`, min: 4, max: 6 }]), Xd(`str3`, `of the Ox`, 12, Kd, `str`, [{ stat: `str`, min: 7, max: 9 }]), Xd(`dex1`, `of Dexterity`, 1, Kd, `dex`, [{ stat: `dex`, min: 1, max: 3 }]), Xd(`dex2`, `of Skill`, 6, Kd, `dex`, [{ stat: `dex`, min: 4, max: 6 }]), Xd(`dex3`, `of Accuracy`, 12, Kd, `dex`, [{ stat: `dex`, min: 7, max: 9 }]), Xd(`vit1`, `of Vigor`, 1, Kd, `vit`, [{ stat: `vit`, min: 1, max: 3 }]), Xd(`vit2`, `of Fortitude`, 8, Kd, `vit`, [{ stat: `vit`, min: 4, max: 7 }]), Xd(`ene1`, `of Energy`, 1, Kd, `ene`, [{ stat: `ene`, min: 1, max: 3 }]), Xd(`ene2`, `of the Mind`, 6, Kd, `ene`, [{ stat: `ene`, min: 4, max: 6 }]), Xd(`ene3`, `of Brilliance`, 12, Kd, `ene`, [{ stat: `ene`, min: 7, max: 10 }]), Xd(`fire1`, `of Embers`, 3, [...Ud, `ring`, `amulet`, `gloves`], `fire`, [{ stat: `fireMin`, min: 1, max: 2 }, { stat: `fireMax`, min: 3, max: 6 }]), Xd(`fire2`, `of Flame`, 10, [...Ud], `fire`, [{ stat: `fireMin`, min: 3, max: 6 }, { stat: `fireMax`, min: 8, max: 14 }]), Xd(`fire3`, `of Burning`, 18, [...Ud], `fire`, [{ stat: `fireMin`, min: 7, max: 12 }, { stat: `fireMax`, min: 16, max: 28 }], 6), Xd(`cold1`, `of Frost`, 3, [...Ud, `ring`, `amulet`, `gloves`], `cold`, [{ stat: `coldMin`, min: 1, max: 2 }, { stat: `coldMax`, min: 2, max: 4 }, { stat: `coldLen`, min: 1, max: 1 }]), Xd(`cold2`, `of the Icicle`, 10, [...Ud], `cold`, [{ stat: `coldMin`, min: 3, max: 5 }, { stat: `coldMax`, min: 6, max: 10 }, { stat: `coldLen`, min: 1.5, max: 1.5 }]), Xd(`light1`, `of Sparks`, 3, [...Ud, `ring`, `amulet`, `gloves`], `light`, [{ stat: `lightMin`, min: 1, max: 1 }, { stat: `lightMax`, min: 5, max: 9 }]), Xd(`light2`, `of Thunder`, 12, [...Ud], `light`, [{ stat: `lightMin`, min: 1, max: 3 }, { stat: `lightMax`, min: 14, max: 26 }]), Xd(`pois1`, `of Venom`, 4, [...Ud, `gloves`], `poison`, [{ stat: `poisonDmg`, min: 8, max: 16 }, { stat: `poisonLen`, min: 3, max: 3 }]), Xd(`ll1`, `of the Leech`, 4, [...Ud, `ring`, `amulet`, `gloves`], `lifeSteal`, [{ stat: `lifeSteal`, min: 3, max: 4 }]), Xd(`ll2`, `of the Lamprey`, 14, [...Ud, `ring`, `amulet`], `lifeSteal`, [{ stat: `lifeSteal`, min: 5, max: 7 }], 6), Xd(`ml1`, `of the Bat`, 4, [...Ud, `ring`, `amulet`, `gloves`], `manaSteal`, [{ stat: `manaSteal`, min: 3, max: 4 }]), Xd(`ias1`, `of Readiness`, 3, [...Ud, `gloves`], `ias`, [{ stat: `ias`, min: 10, max: 10 }]), Xd(`ias2`, `of Alacrity`, 11, [...Ud, `gloves`], `ias`, [{ stat: `ias`, min: 20, max: 20 }]), Xd(`fcr1`, `of the Apprentice`, 5, [`ring`, `amulet`, `weapon`, `helm`, `gloves`], `fcr`, [{ stat: `fcr`, min: 10, max: 10 }]), Xd(`fcr2`, `of the Magus`, 15, [`amulet`, `weapon`], `fcr`, [{ stat: `fcr`, min: 20, max: 20 }], 5), Xd(`frw1`, `of Pacing`, 2, [`boots`], `frw`, [{ stat: `frw`, min: 10, max: 10 }]), Xd(`frw2`, `of Haste`, 10, [`boots`], `frw`, [{ stat: `frw`, min: 20, max: 20 }]), Xd(`frw3`, `of Speed`, 20, [`boots`], `frw`, [{ stat: `frw`, min: 30, max: 30 }], 5), Xd(`fhr1`, `of Balance`, 4, [`armor`, `shield`, `belt`, `amulet`, `charm`], `fhr`, [{ stat: `fhr`, min: 10, max: 17 }]), Xd(`mf1`, `of Fortune`, 6, [...Gd, `helm`, `armor`, `boots`, `gloves`, `charm`], `mf`, [{ stat: `mf`, min: 5, max: 15 }], 6), Xd(`mf2`, `of Luck`, 16, [...Gd, `helm`, `armor`, `boots`], `mf`, [{ stat: `mf`, min: 16, max: 25 }], 3), Xd(`gf1`, `of Greed`, 2, Kd, `gf`, [{ stat: `gf`, min: 20, max: 40 }], 8), Xd(`gf2`, `of Wealth`, 12, Kd, `gf`, [{ stat: `gf`, min: 41, max: 80 }], 4), Xd(`lr1`, `of Light`, 1, [...Wd, ...Gd, `weapon`], `light radius`, [{ stat: `lightRadius`, min: 1, max: 1 }, { stat: `ar`, min: 10, max: 15 }], 6), Xd(`lr2`, `of the Sun`, 10, [...Wd, ...Gd, `weapon`], `light radius`, [{ stat: `lightRadius`, min: 2, max: 2 }, { stat: `ar`, min: 20, max: 30 }], 4), Xd(`reg1`, `of Regeneration`, 4, [...Wd, ...Gd], `regen`, [{ stat: `lifeRegen`, min: 3, max: 5 }]), Xd(`mreg1`, `of Clarity`, 4, [...Gd, `helm`, `shield`], `mregen`, [{ stat: `manaRegen`, min: 10, max: 25 }]), Xd(`dr1`, `of Warding`, 6, [`armor`, `shield`, `helm`, `belt`], `dr`, [{ stat: `dr`, min: 1, max: 3 }]), Xd(`dr2`, `of Protection`, 16, [`armor`, `shield`], `dr`, [{ stat: `dr`, min: 4, max: 7 }], 5), Xd(`blk1`, `of Blocking`, 4, [`shield`], `blk`, [{ stat: `block`, min: 10, max: 10 }]), Xd(`max1`, `of Ruin`, 6, Ud, `maxdmg`, [{ stat: `dmgMax`, min: 2, max: 6 }]), Xd(`min1`, `of Cleaving`, 6, Ud, `mindmg`, [{ stat: `dmgMin`, min: 1, max: 4 }]), Xd(`crit1`, `of Slaughter`, 12, Ud, `crit`, [{ stat: `crit`, min: 5, max: 12 }], 5), Xd(`lpk1`, `of the Vulture`, 6, Ud, `lpk`, [{ stat: `lifePerKill`, min: 2, max: 5 }]), Xd(`stam1`, `of Endurance`, 1, [`boots`, `belt`, `charm`], `stam`, [{ stat: `stamina`, min: 10, max: 30 }]), Xd(`cbf1`, `of the Thaw`, 10, [`ring`, `amulet`, `boots`, `gloves`, `belt`], `cbf`, [{ stat: `cbf`, min: 1, max: 1 }], 4), Xd(`undead1`, `of Sanctity`, 4, Ud, `undead`, [{ stat: `dmgUndead`, min: 30, max: 60 }, { stat: `arUndead`, min: 50, max: 100 }], 6);
var Zd = Jd, Qd = [`Grim`, `Doom`, `Blood`, `Storm`, `Bone`, `Dusk`, `Gloom`, `Raven`, `Wraith`, `Hollow`, `Ash`, `Thorn`, `Night`, `Carrion`, `Grave`, `Rune`, `Ember`, `Soul`, `Dread`, `Shadow`, `Vile`, `Pale`, `Mourn`, `Cinder`, `Iron`], $d = { weapon: [`Bite`, `Song`, `Edge`, `Fang`, `Gnash`, `Scythe`, `Thirst`, `Wound`, `Mangler`, `Reaver`, `Spike`, `Hew`], helm: [`Crown`, `Visage`, `Brow`, `Hood`, `Veil`, `Horn`, `Mask`, `Cowl`], armor: [`Shroud`, `Hide`, `Carapace`, `Mantle`, `Coat`, `Shell`, `Pelt`, `Wrap`], shield: [`Ward`, `Aegis`, `Wall`, `Bastion`, `Guard`, `Rampart`, `Tower`], gloves: [`Grasp`, `Claw`, `Fist`, `Hold`, `Touch`, `Knuckle`], boots: [`Stalker`, `Track`, `Road`, `Trail`, `Spur`, `Stride`], belt: [`Cord`, `Coil`, `Lash`, `Buckle`, `Clasp`, `Strap`], ring: [`Band`, `Coil`, `Spiral`, `Loop`, `Whorl`, `Circle`], amulet: [`Eye`, `Heart`, `Talisman`, `Beads`, `Scarab`, `Star`] }, ef = [{ id: `u_gravewarden`, name: `The Gravewarden's Ward`, base: `buckler`, level: 3, flavor: `Pried from the grip of a sentry who never left his post.`, mods: [{ stat: `edArmor`, value: 60 }, { stat: `block`, value: 20 }, { stat: `resAll`, value: 10 }, { stat: `dmgUndead`, value: 30 }] }, { id: `u_emberkiss`, name: `Emberkiss`, base: `wand`, level: 4, flavor: `Warm to the touch, even in the grave-cold.`, mods: [{ stat: `classSkills`, value: 1, cls: `necromancer` }, { stat: `fcr`, value: 20 }, { stat: `fireMin`, value: 4 }, { stat: `fireMax`, value: 9 }, { stat: `mana`, value: 15 }] }, { id: `u_thornmaw`, name: `Thornmaw`, base: `handAxe`, level: 4, flavor: `Every notch is a name.`, mods: [{ stat: `ed`, value: 80 }, { stat: `dmgMax`, value: 6 }, { stat: `lifeSteal`, value: 5 }, { stat: `ias`, value: 20 }] }, { id: `u_mournhide`, name: `Mournhide`, base: `leather`, level: 6, flavor: `Tanned from something that wept.`, mods: [{ stat: `edArmor`, value: 80 }, { stat: `life`, value: 25 }, { stat: `fhr`, value: 20 }, { stat: `resPoison`, value: 25 }, { stat: `frw`, value: 10 }] }, { id: `u_cinderveil`, name: `Cinderveil`, base: `cap`, level: 5, flavor: `Smoke curls from its stitching.`, mods: [{ stat: `edArmor`, value: 70 }, { stat: `resFire`, value: 30 }, { stat: `mana`, value: 20 }, { stat: `lightRadius`, value: 2 }, { stat: `fireMin`, value: 2 }, { stat: `fireMax`, value: 6 }] }, { id: `u_nightwhisper`, name: `Nightwhisper`, base: `ring`, level: 8, flavor: `It speaks only when the light dies.`, mods: [{ stat: `mana`, value: 25 }, { stat: `manaRegen`, value: 15 }, { stat: `fcr`, value: 10 }, { stat: `mf`, value: 15 }, { stat: `dex`, value: 5 }] }, { id: `u_weepingeye`, name: `The Weeping Eye`, base: `amulet`, level: 9, flavor: `Its tears never dry.`, mods: [{ stat: `allSkills`, value: 1 }, { stat: `resAll`, value: 12 }, { stat: `life`, value: 20 }, { stat: `lifeRegen`, value: 4 }] }, { id: `u_bloodspur`, name: `Bloodspur`, base: `leatherBoots`, level: 5, flavor: `They know the way home. They do not take it.`, mods: [{ stat: `edArmor`, value: 70 }, { stat: `frw`, value: 30 }, { stat: `fhr`, value: 10 }, { stat: `resFire`, value: 15 }, { stat: `stamina`, value: 30 }] }, { id: `u_ravencall`, name: `Ravencall`, base: `shortSword`, level: 2, flavor: `Carrion birds follow its wielder.`, mods: [{ stat: `ed`, value: 70 }, { stat: `ar`, value: 60 }, { stat: `ias`, value: 20 }, { stat: `coldMin`, value: 2 }, { stat: `coldMax`, value: 6 }, { stat: `coldLen`, value: 1 }] }, { id: `u_hollowcrown`, name: `The Hollow Crown`, base: `skullCap`, level: 10, flavor: `Something still wears it from inside.`, mods: [{ stat: `edArmor`, value: 90 }, { stat: `life`, value: 30 }, { stat: `manaSteal`, value: 4 }, { stat: `resLight`, value: 25 }, { stat: `str`, value: 8 }] }, { id: `u_ashstaff`, name: `Staff of Smoldering Ash`, base: `shortStaff`, level: 3, flavor: `Kindling for a sorceress.`, mods: [{ stat: `classSkills`, value: 1, cls: `sorceress` }, { stat: `fcr`, value: 10 }, { stat: `mana`, value: 20 }, { stat: `resFire`, value: 20 }, { stat: `ene`, value: 8 }] }, { id: `u_gutterking`, name: `Gutterking's Grin`, base: `club`, level: 3, flavor: `Crowned by the smallest, cruelest thing.`, mods: [{ stat: `ed`, value: 90 }, { stat: `dmgMin`, value: 3 }, { stat: `crit`, value: 15 }, { stat: `gf`, value: 75 }] }, { id: `u_ironlung`, name: `Iron Lung`, base: `ringMail`, level: 12, flavor: `Breathe in. Breathe in again.`, mods: [{ stat: `edArmor`, value: 100 }, { stat: `life`, value: 40 }, { stat: `drPct`, value: 10 }, { stat: `resCold`, value: 30 }] }, { id: `u_veyrabow`, name: `Veyra's Thorned Sash`, base: `lightBelt`, level: 6, flavor: `Torn from the Bloodwitch as she fell.`, mods: [{ stat: `edArmor`, value: 80 }, { stat: `life`, value: 30 }, { stat: `lifeSteal`, value: 4 }, { stat: `fhr`, value: 20 }, { stat: `resAll`, value: 8 }] }], tf = [{ id: `vigil`, name: `Vigil Watcher's Garb`, items: [{ id: `s_vigil_hood`, name: `Vigil Watcher's Hood`, base: `cap`, level: 4, mods: [{ stat: `def`, value: 20 }, { stat: `lightRadius`, value: 1 }, { stat: `mana`, value: 15 }] }, { id: `s_vigil_coat`, name: `Vigil Watcher's Coat`, base: `leather`, level: 5, mods: [{ stat: `def`, value: 35 }, { stat: `life`, value: 20 }, { stat: `resCold`, value: 20 }] }, { id: `s_vigil_cord`, name: `Vigil Watcher's Cord`, base: `sash`, level: 3, mods: [{ stat: `def`, value: 10 }, { stat: `fhr`, value: 15 }, { stat: `resPoison`, value: 20 }] }, { id: `s_vigil_grip`, name: `Vigil Watcher's Grip`, base: `leatherGloves`, level: 3, mods: [{ stat: `ias`, value: 10 }, { stat: `ar`, value: 40 }, { stat: `dex`, value: 5 }] }], bonus: { 2: [{ stat: `life`, value: 25 }, { stat: `resAll`, value: 5 }], 3: [{ stat: `mf`, value: 25 }, { stat: `frw`, value: 15 }], 4: [{ stat: `allSkills`, value: 1 }, { stat: `resAll`, value: 15 }, { stat: `lifeSteal`, value: 4 }] } }], nf = [{ id: `rw_ember`, name: `Ember`, runes: [1, 2], cats: [`weapon`], mods: [{ stat: `ed`, value: 60 }, { stat: `fireMin`, value: 6 }, { stat: `fireMax`, value: 18 }, { stat: `lightRadius`, value: 2 }, { stat: `ar`, value: 75 }] }, { id: `rw_whisper`, name: `Whisper`, runes: [3, 1], cats: [`armor`], mods: [{ stat: `fhr`, value: 25 }, { stat: `frw`, value: 25 }, { stat: `fcr`, value: 25 }, { stat: `dex`, value: 6 }, { stat: `mana`, value: 25 }] }, { id: `rw_vigil`, name: `Vigil`, runes: [2, 3, 4], cats: [`shield`, `helm`], mods: [{ stat: `resAll`, value: 20 }, { stat: `life`, value: 30 }, { stat: `edArmor`, value: 50 }, { stat: `block`, value: 15 }] }, { id: `rw_requiem`, name: `Requiem`, runes: [5, 6, 7], cats: [`weapon`], mods: [{ stat: `allSkills`, value: 1 }, { stat: `ed`, value: 140 }, { stat: `lifeSteal`, value: 7 }, { stat: `coldMin`, value: 8 }, { stat: `coldMax`, value: 24 }, { stat: `crit`, value: 20 }] }, { id: `rw_lantern`, name: `Lantern`, runes: [1, 8], cats: [`helm`, `armor`], mods: [{ stat: `lightRadius`, value: 3 }, { stat: `mf`, value: 40 }, { stat: `resAll`, value: 10 }, { stat: `life`, value: 20 }] }], rf = { sorceress: { id: `sorceress`, name: `Sorceress`, blurb: `A mistress of fire, frost and lightning who commands the battlefield from afar.`, str: 10, dex: 25, vit: 10, ene: 35, life: 40, mana: 35, stamina: 74, lifePerLevel: 1, lifePerVit: 2, manaPerLevel: 2, manaPerEne: 2, staminaPerLevel: 1, staminaPerVit: 1, baseAR: -15, attackTime: 0.68, castTime: 0.52, trees: [`Fire Spells`, `Cold Spells`, `Lightning Spells`], startItems: [{ base: `shortStaff`, equip: true }, { base: `hp1`, qty: 4 }, { base: `mp1`, qty: 2 }, { base: `tpTome`, qty: 6 }, { base: `idTome`, qty: 4 }] }, barbarian: { id: `barbarian`, name: `Barbarian`, blurb: `A towering warrior of the northern peaks, unmatched with blade and battle-cry.`, str: 30, dex: 20, vit: 25, ene: 10, life: 55, mana: 10, stamina: 92, lifePerLevel: 2, lifePerVit: 4, manaPerLevel: 1, manaPerEne: 1, staminaPerLevel: 1, staminaPerVit: 1, baseAR: 20, attackTime: 0.6, castTime: 0.62, trees: [`Combat Skills`, `Combat Masteries`, `Warcries`], startItems: [{ base: `handAxe`, equip: true }, { base: `buckler`, equip: true }, { base: `hp1`, qty: 4 }, { base: `tpTome`, qty: 6 }, { base: `idTome`, qty: 4 }] }, necromancer: { id: `necromancer`, name: `Necromancer`, blurb: `A priest of balance who raises the dead and curses the living.`, str: 15, dex: 25, vit: 15, ene: 25, life: 45, mana: 25, stamina: 79, lifePerLevel: 1.5, lifePerVit: 2, manaPerLevel: 2, manaPerEne: 2, staminaPerLevel: 1, staminaPerVit: 1, baseAR: -10, attackTime: 0.66, castTime: 0.56, trees: [`Summoning`, `Poison and Bone`, `Curses`], startItems: [{ base: `wand`, equip: true }, { base: `hp1`, qty: 4 }, { base: `mp1`, qty: 2 }, { base: `tpTome`, qty: 6 }, { base: `idTome`, qty: 4 }] } }, af = (() => {
  let e4 = [0, 0, 200, 600, 1500, 3200, 5600, 8800, 13e3, 18500, 25500];
  for (let t2 = 11; t2 < 100; t2 += 1) {
    let n2 = (t2 - 11) / 88;
    e4.push(Math.round(e4[t2 - 1] * (1.2424 + -0.19740000000000002 * n2)));
  }
  return e4;
})();
function of(e4, t2) {
  let n2 = e4 - t2;
  return n2 > 5 ? Math.max(0.05, 1 - (n2 - 5) * 0.15) : n2 < -5 ? Math.max(0.2, e4 / t2) : 1;
}
var sf = [];
function I(e4) {
  sf.push({ slot: null, qlvl: 1, reqLvl: 0, reqStr: 0, reqDex: 0, maxSockets: 0, price: 50, weight: 10, ...e4 });
}
I({ id: `dagger`, name: `Dagger`, cat: `weapon`, slot: `mainHand`, w: 1, h: 2, visual: `dagger`, wclass: `dagger`, qlvl: 3, dmg: [1, 4], speed: -20, maxSockets: 1, price: 30 }), I({ id: `kris`, name: `Kris`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `kris`, wclass: `dagger`, qlvl: 8, dmg: [2, 11], speed: -20, reqDex: 45, maxSockets: 3, price: 90 }), I({ id: `shortSword`, name: `Short Sword`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `shortSword`, wclass: `sword`, qlvl: 1, dmg: [2, 7], speed: 0, maxSockets: 2, price: 60 }), I({ id: `scimitar`, name: `Scimitar`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `scimitar`, wclass: `sword`, qlvl: 5, dmg: [2, 6], speed: -20, reqDex: 21, maxSockets: 2, price: 80 }), I({ id: `broadSword`, name: `Broad Sword`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `broadSword`, wclass: `sword`, qlvl: 9, dmg: [7, 14], speed: 0, reqStr: 48, maxSockets: 3, price: 150 }), I({ id: `longSword`, name: `Long Sword`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `longSword`, wclass: `sword`, qlvl: 12, dmg: [3, 19], speed: -10, reqStr: 55, reqDex: 39, maxSockets: 4, price: 190 }), I({ id: `greatSword`, name: `Two-Handed Sword`, cat: `weapon`, slot: `mainHand`, w: 1, h: 4, visual: `greatSword`, wclass: `sword`, twoHanded: true, qlvl: 10, dmg: [8, 18], speed: 0, reqStr: 35, reqDex: 27, maxSockets: 3, price: 220 }), I({ id: `handAxe`, name: `Hand Axe`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `handAxe`, wclass: `axe`, qlvl: 3, dmg: [3, 6], speed: 0, maxSockets: 2, price: 45 }), I({ id: `axe`, name: `Axe`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `axe`, wclass: `axe`, qlvl: 7, dmg: [4, 11], speed: 10, reqStr: 32, maxSockets: 4, price: 110 }), I({ id: `doubleAxe`, name: `Double Axe`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `doubleAxe`, wclass: `axe`, qlvl: 13, dmg: [5, 13], speed: 10, reqStr: 43, maxSockets: 5, price: 170 }), I({ id: `greatAxe`, name: `Great Axe`, cat: `weapon`, slot: `mainHand`, w: 2, h: 4, visual: `greatAxe`, wclass: `axe`, twoHanded: true, qlvl: 15, dmg: [12, 32], speed: 0, reqStr: 80, reqDex: 30, maxSockets: 4, price: 280 }), I({ id: `club`, name: `Club`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `club`, wclass: `mace`, qlvl: 1, dmg: [1, 6], speed: -10, maxSockets: 2, price: 30 }), I({ id: `mace`, name: `Mace`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `mace`, wclass: `mace`, qlvl: 3, dmg: [3, 10], speed: 0, reqStr: 27, maxSockets: 2, price: 70 }), I({ id: `morningStar`, name: `Morning Star`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `morningStar`, wclass: `mace`, qlvl: 10, dmg: [7, 16], speed: 0, reqStr: 36, maxSockets: 3, price: 160 }), I({ id: `flail`, name: `Flail`, cat: `weapon`, slot: `mainHand`, w: 2, h: 3, visual: `flail`, wclass: `mace`, qlvl: 16, dmg: [1, 24], speed: -10, reqStr: 41, reqDex: 35, maxSockets: 5, price: 210 }), I({ id: `wand`, name: `Wand`, cat: `weapon`, slot: `mainHand`, w: 1, h: 2, visual: `wand`, wclass: `wand`, qlvl: 2, dmg: [2, 4], speed: 0, maxSockets: 1, price: 40 }), I({ id: `boneWand`, name: `Bone Wand`, cat: `weapon`, slot: `mainHand`, w: 1, h: 2, visual: `boneWand`, wclass: `wand`, qlvl: 9, dmg: [3, 7], speed: -20, maxSockets: 2, price: 120, fixed: [{ stat: `mana`, value: 5 }] }), I({ id: `graveWand`, name: `Grave Wand`, cat: `weapon`, slot: `mainHand`, w: 1, h: 2, visual: `graveWand`, wclass: `wand`, qlvl: 15, dmg: [4, 9], speed: 0, reqStr: 25, maxSockets: 2, price: 200, classOnly: `necromancer`, fixed: [{ stat: `classSkills`, value: 1 }] }), I({ id: `shortStaff`, name: `Short Staff`, cat: `weapon`, slot: `mainHand`, w: 1, h: 3, visual: `shortStaff`, wclass: `staff`, twoHanded: true, qlvl: 1, dmg: [1, 5], speed: -10, maxSockets: 2, price: 40 }), I({ id: `longStaff`, name: `Long Staff`, cat: `weapon`, slot: `mainHand`, w: 1, h: 4, visual: `longStaff`, wclass: `staff`, twoHanded: true, qlvl: 8, dmg: [2, 8], speed: 0, maxSockets: 3, price: 90 }), I({ id: `gnarledStaff`, name: `Gnarled Staff`, cat: `weapon`, slot: `mainHand`, w: 1, h: 4, visual: `gnarledStaff`, wclass: `staff`, twoHanded: true, qlvl: 13, dmg: [4, 12], speed: 10, maxSockets: 4, price: 160, fixed: [{ stat: `fcr`, value: 10 }] }), I({ id: `sorceryOrb`, name: `Arcane Orb`, cat: `weapon`, slot: `mainHand`, w: 1, h: 2, visual: `sorceryOrb`, wclass: `orb`, qlvl: 6, dmg: [2, 5], speed: -10, maxSockets: 2, price: 140, classOnly: `sorceress`, fixed: [{ stat: `mana`, value: 12 }, { stat: `classSkills`, value: 1 }] }), I({ id: `cap`, name: `Cap`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `cap`, qlvl: 1, def: [3, 5], maxSockets: 2, price: 35 }), I({ id: `skullCap`, name: `Skull Cap`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `skullCap`, qlvl: 5, def: [8, 11], reqStr: 15, maxSockets: 2, price: 60 }), I({ id: `helm`, name: `Helm`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `helm`, qlvl: 11, def: [15, 18], reqStr: 26, maxSockets: 2, price: 110 }), I({ id: `fullHelm`, name: `Full Helm`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `fullHelm`, qlvl: 15, def: [23, 26], reqStr: 41, maxSockets: 3, price: 170 }), I({ id: `mask`, name: `Mask`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `mask`, qlvl: 13, def: [9, 27], reqStr: 23, maxSockets: 3, price: 150 }), I({ id: `hornedHelm`, name: `Horned Helm`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `hornedHelm`, qlvl: 9, def: [12, 19], reqStr: 30, maxSockets: 2, price: 140, classOnly: `barbarian`, fixed: [{ stat: `classSkills`, value: 1 }] }), I({ id: `circlet`, name: `Circlet`, cat: `helm`, slot: `head`, w: 2, h: 2, visual: `circlet`, qlvl: 14, def: [8, 12], maxSockets: 2, price: 180, weight: 4, fixed: [{ stat: `mana`, value: 10 }] }), I({ id: `quilted`, name: `Quilted Armor`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorQuilted`, qlvl: 1, def: [8, 11], reqStr: 12, maxSockets: 2, price: 60 }), I({ id: `leather`, name: `Leather Armor`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorLeather`, qlvl: 3, def: [14, 17], reqStr: 15, maxSockets: 2, price: 80 }), I({ id: `studded`, name: `Studded Leather`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorStudded`, qlvl: 8, def: [32, 35], reqStr: 27, maxSockets: 2, price: 140 }), I({ id: `ringMail`, name: `Ring Mail`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorRing`, qlvl: 11, def: [45, 48], reqStr: 36, maxSockets: 3, price: 190 }), I({ id: `scaleMail`, name: `Scale Mail`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorScale`, qlvl: 13, def: [57, 60], reqStr: 44, maxSockets: 2, price: 230 }), I({ id: `chainMail`, name: `Chain Mail`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorChain`, qlvl: 15, def: [72, 75], reqStr: 48, maxSockets: 2, price: 280 }), I({ id: `breastPlate`, name: `Breast Plate`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorBreast`, qlvl: 18, def: [65, 68], reqStr: 30, maxSockets: 3, price: 300 }), I({ id: `splintMail`, name: `Splint Mail`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorSplint`, qlvl: 20, def: [90, 95], reqStr: 51, maxSockets: 2, price: 360 }), I({ id: `plateMail`, name: `Plate Mail`, cat: `armor`, slot: `body`, w: 2, h: 3, visual: `armorPlate`, qlvl: 24, def: [108, 116], reqStr: 65, maxSockets: 2, price: 450, weight: 6 }), I({ id: `buckler`, name: `Buckler`, cat: `shield`, slot: `offHand`, w: 2, h: 2, visual: `buckler`, qlvl: 1, def: [4, 6], block: 25, reqStr: 12, maxSockets: 1, price: 40 }), I({ id: `smallShield`, name: `Small Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 2, visual: `smallShield`, qlvl: 5, def: [8, 10], block: 30, reqStr: 22, maxSockets: 2, price: 70 }), I({ id: `largeShield`, name: `Large Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 3, visual: `largeShield`, qlvl: 11, def: [12, 14], block: 37, reqStr: 34, maxSockets: 3, price: 130 }), I({ id: `kiteShield`, name: `Kite Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 3, visual: `kiteShield`, qlvl: 15, def: [16, 18], block: 33, reqStr: 47, maxSockets: 3, price: 180 }), I({ id: `spikedShield`, name: `Spiked Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 3, visual: `spikedShield`, qlvl: 11, def: [15, 25], block: 32, reqStr: 30, maxSockets: 2, price: 160, fixed: [{ stat: `thorns`, value: 4 }] }), I({ id: `boneShield`, name: `Bone Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 3, visual: `boneShield`, qlvl: 19, def: [10, 30], block: 30, reqStr: 25, maxSockets: 2, price: 200 }), I({ id: `towerShield`, name: `Tower Shield`, cat: `shield`, slot: `offHand`, w: 2, h: 3, visual: `towerShield`, qlvl: 22, def: [22, 25], block: 44, reqStr: 75, maxSockets: 3, price: 260, weight: 6 }), I({ id: `shrunkenHead`, name: `Shrunken Head`, cat: `shield`, slot: `offHand`, w: 2, h: 2, visual: `shrunkenHead`, qlvl: 4, def: [2, 6], block: 20, maxSockets: 2, price: 120, classOnly: `necromancer`, fixed: [{ stat: `mana`, value: 8 }, { stat: `classSkills`, value: 1 }] }), I({ id: `leatherGloves`, name: `Leather Gloves`, cat: `gloves`, slot: `gloves`, w: 2, h: 2, visual: `leatherGloves`, qlvl: 3, def: [2, 3], price: 40 }), I({ id: `heavyGloves`, name: `Heavy Gloves`, cat: `gloves`, slot: `gloves`, w: 2, h: 2, visual: `heavyGloves`, qlvl: 7, def: [5, 6], price: 70 }), I({ id: `chainGloves`, name: `Chain Gloves`, cat: `gloves`, slot: `gloves`, w: 2, h: 2, visual: `chainGloves`, qlvl: 12, def: [8, 9], reqStr: 25, price: 110 }), I({ id: `gauntlets`, name: `Gauntlets`, cat: `gloves`, slot: `gloves`, w: 2, h: 2, visual: `gauntlets`, qlvl: 20, def: [12, 15], reqStr: 60, price: 170 }), I({ id: `leatherBoots`, name: `Boots`, cat: `boots`, slot: `boots`, w: 2, h: 2, visual: `leatherBoots`, qlvl: 3, def: [2, 3], price: 40 }), I({ id: `heavyBoots`, name: `Heavy Boots`, cat: `boots`, slot: `boots`, w: 2, h: 2, visual: `heavyBoots`, qlvl: 7, def: [5, 6], reqStr: 18, price: 70 }), I({ id: `chainBoots`, name: `Chain Boots`, cat: `boots`, slot: `boots`, w: 2, h: 2, visual: `chainBoots`, qlvl: 12, def: [8, 9], reqStr: 30, price: 110 }), I({ id: `greaves`, name: `Greaves`, cat: `boots`, slot: `boots`, w: 2, h: 2, visual: `greaves`, qlvl: 20, def: [12, 15], reqStr: 70, price: 170 }), I({ id: `sash`, name: `Sash`, cat: `belt`, slot: `belt`, w: 2, h: 1, visual: `sash`, qlvl: 3, def: [2, 2], beltRows: 2, price: 40 }), I({ id: `lightBelt`, name: `Light Belt`, cat: `belt`, slot: `belt`, w: 2, h: 1, visual: `lightBelt`, qlvl: 7, def: [3, 3], beltRows: 2, price: 60 }), I({ id: `belt`, name: `Belt`, cat: `belt`, slot: `belt`, w: 2, h: 1, visual: `belt`, qlvl: 12, def: [5, 5], beltRows: 3, reqStr: 25, price: 100 }), I({ id: `heavyBelt`, name: `Heavy Belt`, cat: `belt`, slot: `belt`, w: 2, h: 1, visual: `heavyBelt`, qlvl: 18, def: [7, 7], beltRows: 3, reqStr: 45, price: 140 }), I({ id: `platedBelt`, name: `Plated Belt`, cat: `belt`, slot: `belt`, w: 2, h: 1, visual: `platedBelt`, qlvl: 24, def: [8, 11], beltRows: 4, reqStr: 60, price: 200, weight: 5 }), I({ id: `ring`, name: `Ring`, cat: `ring`, slot: `ringLeft`, w: 1, h: 1, visual: `ring1`, qlvl: 1, price: 250, weight: 6 }), I({ id: `amulet`, name: `Amulet`, cat: `amulet`, slot: `amulet`, w: 1, h: 1, visual: `amulet1`, qlvl: 1, price: 400, weight: 4 });
var cf = [`Minor`, `Light`, ``, `Greater`, `Super`], lf = [30, 60, 100, 180, 320], uf = [20, 40, 80, 150, 250];
for (let e4 = 0; e4 < 5; e4 += 1) {
  let t2 = e4 + 1, n2 = cf[e4] ? `${cf[e4]} ` : ``;
  I({ id: `hp${t2}`, name: `${n2}Healing Potion`, cat: `potion`, w: 1, h: 1, visual: `hpPotion${t2}`, qlvl: [1, 4, 10, 18, 26][e4], price: [20, 45, 90, 150, 240][e4], potion: { kind: `hp`, amount: lf[e4], duration: [7, 6.5, 6, 5.5, 5][e4] }, weight: 30 }), I({ id: `mp${t2}`, name: `${n2}Mana Potion`, cat: `potion`, w: 1, h: 1, visual: `mpPotion${t2}`, qlvl: [1, 4, 10, 18, 26][e4], price: [20, 45, 90, 150, 240][e4], potion: { kind: `mp`, amount: uf[e4], duration: 5 }, weight: 25 });
}
I({ id: `rejuv`, name: `Rejuvenation Potion`, cat: `potion`, w: 1, h: 1, visual: `rejuvPotion`, qlvl: 5, price: 300, potion: { kind: `rejuv`, amount: 35, duration: 0 }, weight: 6 }), I({ id: `fullRejuv`, name: `Full Rejuvenation Potion`, cat: `potion`, w: 1, h: 1, visual: `fullRejuvPotion`, qlvl: 15, price: 900, potion: { kind: `rejuv`, amount: 100, duration: 0 }, weight: 1 }), I({ id: `stamina`, name: `Stamina Potion`, cat: `potion`, w: 1, h: 1, visual: `staminaPotion`, qlvl: 1, price: 30, potion: { kind: `stamina`, amount: 100, duration: 30 }, weight: 8 }), I({ id: `tpScroll`, name: `Scroll of Town Portal`, cat: `scroll`, w: 1, h: 1, visual: `tpScroll`, qlvl: 1, price: 50, weight: 20 }), I({ id: `idScroll`, name: `Scroll of Identify`, cat: `scroll`, w: 1, h: 1, visual: `idScroll`, qlvl: 1, price: 50, weight: 20 }), I({ id: `tpTome`, name: `Tome of Town Portal`, cat: `tome`, w: 1, h: 2, visual: `tpTome`, qlvl: 1, price: 150, stack: 20, weight: 2 }), I({ id: `idTome`, name: `Tome of Identify`, cat: `tome`, w: 1, h: 2, visual: `idTome`, qlvl: 1, price: 150, stack: 20, weight: 2 });
var df = { amethyst: `Amethyst`, topaz: `Topaz`, sapphire: `Sapphire`, emerald: `Emerald`, ruby: `Ruby`, diamond: `Diamond`, skull: `Skull` }, ff = { chipped: `Chipped`, flawed: `Flawed`, normal: ``, flawless: `Flawless`, perfect: `Perfect` }, pf = { chipped: 1, flawed: 8, normal: 16, flawless: 26, perfect: 40 };
for (let e4 of [`amethyst`, `topaz`, `sapphire`, `emerald`, `ruby`, `diamond`, `skull`]) for (let t2 of [`chipped`, `flawed`, `normal`, `flawless`, `perfect`]) {
  let n2 = ff[t2] ? `${ff[t2]} ` : ``;
  I({ id: `gem_${e4}_${t2}`, name: `${n2}${df[e4]}`, cat: `gem`, w: 1, h: 1, visual: `gem_${e4}_${t2}`, qlvl: pf[t2], price: 40 * (1 + [`chipped`, `flawed`, `normal`, `flawless`, `perfect`].indexOf(t2) * 3), gem: { type: e4, grade: t2 }, weight: t2 === `chipped` ? 6 : t2 === `flawed` ? 3 : t2 === `normal` ? 1 : 0.25 });
}
var mf = [3, 6, 10, 14, 18, 22, 27, 32];
[`Ash`, `Vor`, `Thal`, `Ner`, `Kesh`, `Mor`, `Ul`, `Zyr`].forEach((e4, t2) => {
  I({ id: `rune${t2 + 1}`, name: `${e4} Rune`, cat: `rune`, w: 1, h: 1, visual: `rune_${t2 + 1}`, qlvl: mf[t2], reqLvl: mf[t2], price: 100 * (t2 + 1), rune: t2 + 1, weight: 8 / (t2 + 1) });
}), I({ id: `jewel`, name: `Jewel`, cat: `jewel`, w: 1, h: 1, visual: `jewel`, qlvl: 5, price: 300, weight: 2 }), I({ id: `charmSmall`, name: `Small Charm`, cat: `charm`, w: 1, h: 1, visual: `charmSmall`, qlvl: 5, price: 250, weight: 3 }), I({ id: `charmLarge`, name: `Large Charm`, cat: `charm`, w: 1, h: 2, visual: `charmLarge`, qlvl: 10, price: 400, weight: 1.5 }), I({ id: `charmGrand`, name: `Grand Charm`, cat: `charm`, w: 1, h: 3, visual: `charmGrand`, qlvl: 15, price: 600, weight: 1 }), I({ id: `gold`, name: `Gold`, cat: `gold`, w: 1, h: 1, visual: `gold`, qlvl: 1, price: 0, weight: 0 }), I({ id: `coffer`, name: `Alchemist's Coffer`, cat: `coffer`, w: 2, h: 2, visual: `coffer`, qlvl: 1, price: 1e3, weight: 0 });
var hf = Object.fromEntries(sf.map((e4) => [e4.id, e4])), gf = sf, _f = { amethyst: { weapon: (e4) => [{ stat: `ar`, value: [40, 60, 80, 100, 150][e4] }], armor: (e4) => [{ stat: `str`, value: [3, 4, 6, 8, 10][e4] }], shield: (e4) => [{ stat: `def`, value: [8, 12, 18, 24, 30][e4] }] }, topaz: { weapon: (e4) => [{ stat: `lightMin`, value: 1 }, { stat: `lightMax`, value: [8, 14, 22, 30, 40][e4] }], armor: (e4) => [{ stat: `mf`, value: [9, 13, 16, 20, 24][e4] }], shield: (e4) => [{ stat: `resLight`, value: [12, 16, 22, 30, 40][e4] }] }, sapphire: { weapon: (e4) => [{ stat: `coldMin`, value: [1, 3, 4, 6, 10][e4] }, { stat: `coldMax`, value: [3, 5, 7, 10, 14][e4] }, { stat: `coldLen`, value: 1 }], armor: (e4) => [{ stat: `mana`, value: [10, 17, 24, 31, 38][e4] }], shield: (e4) => [{ stat: `resCold`, value: [12, 16, 22, 30, 40][e4] }] }, emerald: { weapon: (e4) => [{ stat: `poisonDmg`, value: [10, 20, 40, 60, 100][e4] }, { stat: `poisonLen`, value: 3 }], armor: (e4) => [{ stat: `dex`, value: [3, 4, 6, 8, 10][e4] }], shield: (e4) => [{ stat: `resPoison`, value: [12, 16, 22, 30, 40][e4] }] }, ruby: { weapon: (e4) => [{ stat: `fireMin`, value: [3, 5, 8, 10, 15][e4] }, { stat: `fireMax`, value: [4, 8, 12, 16, 20][e4] }], armor: (e4) => [{ stat: `life`, value: [10, 17, 24, 31, 38][e4] }], shield: (e4) => [{ stat: `resFire`, value: [12, 16, 22, 30, 40][e4] }] }, diamond: { weapon: (e4) => [{ stat: `dmgUndead`, value: [28, 34, 44, 54, 68][e4] }], armor: (e4) => [{ stat: `ar`, value: [20, 40, 60, 80, 100][e4] }], shield: (e4) => [{ stat: `resAll`, value: [6, 8, 11, 14, 19][e4] }] }, skull: { weapon: (e4) => [{ stat: `lifeSteal`, value: [2, 2, 3, 3, 4][e4] }, { stat: `manaSteal`, value: [1, 2, 2, 3, 3][e4] }], armor: (e4) => [{ stat: `lifeRegen`, value: [2, 3, 3, 4, 5][e4] }, { stat: `manaRegen`, value: [8, 8, 12, 12, 19][e4] }], shield: (e4) => [{ stat: `thorns`, value: [4, 8, 12, 16, 20][e4] }] } }, vf = { 1: { weapon: [{ stat: `ar`, value: 50 }, { stat: `lightRadius`, value: 1 }], armor: [{ stat: `def`, value: 15 }, { stat: `lightRadius`, value: 1 }], shield: [{ stat: `def`, value: 15 }] }, 2: { weapon: [{ stat: `ed`, value: 15 }], armor: [{ stat: `fhr`, value: 15 }], shield: [{ stat: `fhr`, value: 15 }] }, 3: { weapon: [{ stat: `manaSteal`, value: 3 }], armor: [{ stat: `mana`, value: 15 }], shield: [{ stat: `mana`, value: 15 }] }, 4: { weapon: [{ stat: `fireMin`, value: 5 }, { stat: `fireMax`, value: 30 }], armor: [{ stat: `resFire`, value: 30 }, { stat: `maxRes`, value: 1 }], shield: [{ stat: `resFire`, value: 35 }] }, 5: { weapon: [{ stat: `coldMin`, value: 3 }, { stat: `coldMax`, value: 14 }, { stat: `coldLen`, value: 1.5 }], armor: [{ stat: `resCold`, value: 30 }], shield: [{ stat: `resCold`, value: 35 }] }, 6: { weapon: [{ stat: `lightMin`, value: 1 }, { stat: `lightMax`, value: 50 }], armor: [{ stat: `resLight`, value: 30 }], shield: [{ stat: `resLight`, value: 35 }] }, 7: { weapon: [{ stat: `lifeSteal`, value: 7 }], armor: [{ stat: `drPct`, value: 7 }], shield: [{ stat: `drPct`, value: 7 }] }, 8: { weapon: [{ stat: `crit`, value: 20 }], armor: [{ stat: `mf`, value: 20 }], shield: [{ stat: `resAll`, value: 12 }] } }, yf = { chipped: 0, flawed: 1, normal: 2, flawless: 3, perfect: 4 }, bf = (e4, t2) => (n2) => e4 + t2 * (n2 - 1), xf = (e4, t2, n2, r2) => (i2) => [Math.round(e4 + n2 * (i2 - 1)), Math.round(t2 + r2 * (i2 - 1))], Sf = () => 0, Cf = { attack: { id: `attack`, name: `Attack`, classId: `all`, tree: 0, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 1, kind: `attack`, element: `physical`, anim: `attack1`, allowLeft: true, desc: `Strike with your weapon.`, mana: Sf, cooldown: Sf, needsTarget: true }, fireBolt: { id: `fireBolt`, name: `Fire Bolt`, classId: `sorceress`, tree: 0, row: 0, col: 1, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `missile`, element: `fire`, anim: `cast`, allowLeft: true, desc: `Creates a magical flaming missile.`, mana: () => 2.5, cooldown: Sf, dmg: xf(3, 6, 2, 3), speed: 15, range: 18, synergies: [{ skill: `fireball`, pct: 16 }, { skill: `meteor`, pct: 16 }] }, fireball: { id: `fireball`, name: `Fireball`, classId: `sorceress`, tree: 0, row: 1, col: 1, reqLevel: 6, prereqs: [`fireBolt`], maxLevel: 20, kind: `missile`, element: `fire`, anim: `cast`, allowLeft: true, desc: `Creates an explosive sphere of fiery death.`, mana: bf(5, 0.5), cooldown: Sf, dmg: xf(8, 16, 5, 7), radius: () => 2.1, speed: 13, range: 18, synergies: [{ skill: `fireBolt`, pct: 14 }, { skill: `meteor`, pct: 14 }] }, meteor: { id: `meteor`, name: `Meteor`, classId: `sorceress`, tree: 0, row: 2, col: 1, reqLevel: 12, prereqs: [`fireball`], maxLevel: 20, kind: `meteor`, element: `fire`, anim: `castUp`, allowLeft: false, desc: `Summons a meteor from the heavens to crush and incinerate your enemies.`, mana: bf(17, 1), cooldown: () => 0.9, dmg: xf(45, 65, 14, 17), radius: () => 3.2, duration: () => 3, synergies: [{ skill: `fireBolt`, pct: 5 }, { skill: `fireball`, pct: 5 }] }, iceBolt: { id: `iceBolt`, name: `Ice Bolt`, classId: `sorceress`, tree: 1, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `missile`, element: `cold`, anim: `cast`, allowLeft: true, desc: `Creates a magical bolt of ice that damages and chills your enemy.`, mana: () => 3, cooldown: Sf, dmg: xf(3, 5, 2, 2.5), duration: bf(2, 0.4), speed: 15, range: 18, synergies: [{ skill: `glacialOrb`, pct: 10 }] }, frostNova: { id: `frostNova`, name: `Frost Nova`, classId: `sorceress`, tree: 1, row: 1, col: 2, reqLevel: 6, prereqs: [], maxLevel: 20, kind: `nova`, element: `cold`, anim: `castUp`, allowLeft: false, desc: `Creates an expanding ring of ice that damages and slows all nearby enemies.`, mana: bf(9, 1), cooldown: Sf, dmg: xf(4, 8, 3, 4), radius: () => 7, duration: bf(4, 0.5), synergies: [{ skill: `iceBolt`, pct: 8 }] }, glacialOrb: { id: `glacialOrb`, name: `Glacial Orb`, classId: `sorceress`, tree: 1, row: 2, col: 1, reqLevel: 12, prereqs: [`iceBolt`, `frostNova`], maxLevel: 20, kind: `orb`, element: `cold`, anim: `cast`, allowLeft: false, desc: `A pulsating orb that shreds the area with jagged shards of ice.`, mana: bf(25, 0.5), cooldown: () => 1, dmg: xf(10, 14, 4, 5), duration: bf(3, 0.3), speed: 6.5, range: 13, synergies: [{ skill: `iceBolt`, pct: 15 }] }, chargedBolt: { id: `chargedBolt`, name: `Charged Bolt`, classId: `sorceress`, tree: 2, row: 0, col: 1, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `multiMissile`, element: `lightning`, anim: `cast`, allowLeft: true, desc: `Creates multiple, randomly directed bolts of electrical energy.`, mana: bf(3, 0.5), cooldown: Sf, dmg: xf(2, 8, 1, 2), count: (e4) => Math.min(12, 3 + Math.floor(e4 / 2)), speed: 9, range: 9, synergies: [{ skill: `chainLightning`, pct: 6 }] }, teleport: { id: `teleport`, name: `Teleport`, classId: `sorceress`, tree: 2, row: 1, col: 0, reqLevel: 6, prereqs: [], maxLevel: 20, kind: `teleport`, element: `magic`, anim: `cast`, allowLeft: false, desc: `Instantly transports you to a destination within line of sight.`, mana: (e4) => Math.max(10, 24 - e4), cooldown: () => 0.25, range: 18 }, chainLightning: { id: `chainLightning`, name: `Chain Lightning`, classId: `sorceress`, tree: 2, row: 2, col: 1, reqLevel: 12, prereqs: [`chargedBolt`], maxLevel: 20, kind: `chain`, element: `lightning`, anim: `cast`, allowLeft: true, desc: `Creates a bolt of lightning that arcs through several targets.`, mana: bf(9, 0.5), cooldown: Sf, dmg: xf(1, 40, 3, 8), count: (e4) => 3 + Math.floor(e4 / 4), range: 15, synergies: [{ skill: `chargedBolt`, pct: 8 }] }, bash: { id: `bash`, name: `Bash`, classId: `barbarian`, tree: 0, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `melee`, element: `physical`, anim: `attack2`, allowLeft: true, desc: `A powerful blow that knocks your enemy back.`, mana: () => 2, cooldown: Sf, weaponPct: bf(50, 10), arPct: bf(20, 5), needsTarget: true }, leapAttack: { id: `leapAttack`, name: `Leap Attack`, classId: `barbarian`, tree: 0, row: 1, col: 1, reqLevel: 6, prereqs: [`bash`], maxLevel: 20, kind: `leap`, element: `physical`, anim: `leap`, allowLeft: false, desc: `Leap into the fray, crushing everything where you land.`, mana: bf(9, 0.25), cooldown: () => 0.6, weaponPct: bf(100, 20), radius: () => 2.2, range: 11 }, whirlwind: { id: `whirlwind`, name: `Whirlwind`, classId: `barbarian`, tree: 0, row: 2, col: 1, reqLevel: 12, prereqs: [`leapAttack`], maxLevel: 20, kind: `whirlwind`, element: `physical`, anim: `spin`, allowLeft: false, desc: `A whirling dance of death that cuts a path through the legions of Hell.`, mana: (e4) => Math.max(10, 20 - e4 * 0.5), cooldown: Sf, weaponPct: bf(5, 7), radius: () => 2.4, range: 9 }, weaponMastery: { id: `weaponMastery`, name: `Weapon Mastery`, classId: `barbarian`, tree: 1, row: 0, col: 1, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `passive`, element: `physical`, anim: `idle`, allowLeft: false, desc: `Passive — improves skill with all melee weapons.`, mana: Sf, cooldown: Sf, weaponPct: bf(28, 6), arPct: bf(28, 8) }, ironHide: { id: `ironHide`, name: `Iron Hide`, classId: `barbarian`, tree: 1, row: 1, col: 0, reqLevel: 6, prereqs: [], maxLevel: 20, kind: `passive`, element: `physical`, anim: `idle`, allowLeft: false, desc: `Passive — toughens your skin, increasing defense.`, mana: Sf, cooldown: Sf, weaponPct: bf(30, 10) }, swiftness: { id: `swiftness`, name: `Swiftness`, classId: `barbarian`, tree: 1, row: 2, col: 2, reqLevel: 12, prereqs: [`ironHide`], maxLevel: 20, kind: `passive`, element: `physical`, anim: `idle`, allowLeft: false, desc: `Passive — increases movement and attack speed.`, mana: Sf, cooldown: Sf, weaponPct: bf(13, 2) }, howl: { id: `howl`, name: `Howl`, classId: `barbarian`, tree: 2, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `shout`, element: `physical`, anim: `taunt`, allowLeft: false, desc: `A terrifying cry that sends nearby monsters fleeing.`, mana: () => 4, cooldown: () => 0.5, radius: bf(6, 0.5), duration: bf(3, 0.4) }, warCry: { id: `warCry`, name: `War Cry`, classId: `barbarian`, tree: 2, row: 1, col: 1, reqLevel: 6, prereqs: [`howl`], maxLevel: 20, kind: `shout`, element: `physical`, anim: `taunt`, allowLeft: false, desc: `A deafening shout that damages and stuns all nearby enemies.`, mana: bf(10, 0.5), cooldown: () => 0.6, dmg: xf(10, 14, 5, 7), radius: () => 6, duration: bf(1, 0.2) }, rallyingRoar: { id: `rallyingRoar`, name: `Rallying Roar`, classId: `barbarian`, tree: 2, row: 2, col: 1, reqLevel: 12, prereqs: [`warCry`], maxLevel: 20, kind: `buff`, element: `physical`, anim: `castUp`, allowLeft: false, desc: `Inspires you and your allies, increasing maximum life and mana.`, mana: bf(7, 0.5), cooldown: () => 1, duration: bf(30, 6), weaponPct: bf(35, 3) }, raiseSkeleton: { id: `raiseSkeleton`, name: `Raise Skeleton`, classId: `necromancer`, tree: 0, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `summon`, element: `physical`, anim: `castUp`, allowLeft: false, desc: `Raise a skeleton warrior from a corpse to fight by your side.`, mana: bf(6, 1), cooldown: Sf, dmg: xf(2, 5, 1, 1.5), count: (e4) => e4 < 4 ? e4 : 2 + Math.floor(e4 / 3), needsCorpse: true }, earthGolem: { id: `earthGolem`, name: `Earthen Golem`, classId: `necromancer`, tree: 0, row: 1, col: 2, reqLevel: 6, prereqs: [`raiseSkeleton`], maxLevel: 20, kind: `summon`, element: `physical`, anim: `castUp`, allowLeft: false, desc: `Creates a hulking golem of earth that draws enemies and slows them.`, mana: bf(15, 3), cooldown: () => 1, dmg: xf(3, 8, 2, 3), count: () => 1 }, skeletalMage: { id: `skeletalMage`, name: `Skeletal Mage`, classId: `necromancer`, tree: 0, row: 2, col: 0, reqLevel: 12, prereqs: [`raiseSkeleton`], maxLevel: 20, kind: `summon`, element: `magic`, anim: `castUp`, allowLeft: false, desc: `Raise a skeletal mage that hurls elemental bolts.`, mana: bf(8, 1), cooldown: Sf, dmg: xf(4, 8, 2, 3), count: (e4) => e4 < 4 ? e4 : 2 + Math.floor(e4 / 3), needsCorpse: true }, teeth: { id: `teeth`, name: `Teeth`, classId: `necromancer`, tree: 1, row: 0, col: 0, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `multiMissile`, element: `magic`, anim: `cast`, allowLeft: true, desc: `Fires a barrage of summoned barbed teeth.`, mana: bf(3, 0.5), cooldown: Sf, dmg: xf(2, 4, 1, 1.5), count: (e4) => Math.min(12, 2 + Math.floor(e4 / 2)), speed: 14, range: 14, synergies: [{ skill: `boneSpear`, pct: 15 }, { skill: `corpseExplosion`, pct: 10 }] }, corpseExplosion: { id: `corpseExplosion`, name: `Corpse Explosion`, classId: `necromancer`, tree: 1, row: 1, col: 2, reqLevel: 6, prereqs: [`teeth`], maxLevel: 20, kind: `corpseExplosion`, element: `fire`, anim: `cast`, allowLeft: false, desc: `Causes a corpse to explode, damaging all nearby enemies.`, mana: () => 15, cooldown: () => 0.3, radius: bf(2.6, 0.25), needsCorpse: true }, boneSpear: { id: `boneSpear`, name: `Bone Spear`, classId: `necromancer`, tree: 1, row: 2, col: 1, reqLevel: 12, prereqs: [`corpseExplosion`], maxLevel: 20, kind: `missile`, element: `magic`, anim: `cast`, allowLeft: true, desc: `Summons a deadly spike of bone that pierces through all enemies.`, mana: bf(7, 0.25), cooldown: Sf, dmg: xf(16, 24, 8, 10), speed: 22, range: 20, pierce: true, synergies: [{ skill: `teeth`, pct: 7 }] }, amplifyDamage: { id: `amplifyDamage`, name: `Amplify Damage`, classId: `necromancer`, tree: 2, row: 0, col: 1, reqLevel: 1, prereqs: [], maxLevel: 20, kind: `curse`, element: `magic`, anim: `castUp`, allowLeft: false, desc: `Curses enemies so they take double physical damage.`, mana: () => 4, cooldown: Sf, radius: bf(2, 0.66), duration: bf(8, 3) }, terror: { id: `terror`, name: `Terror`, classId: `necromancer`, tree: 2, row: 1, col: 0, reqLevel: 6, prereqs: [`amplifyDamage`], maxLevel: 20, kind: `curse`, element: `magic`, anim: `castUp`, allowLeft: false, desc: `Curses enemies so they flee in terror.`, mana: () => 7, cooldown: Sf, radius: bf(4, 0.5), duration: bf(4, 0.6) }, lifeTap: { id: `lifeTap`, name: `Life Tap`, classId: `necromancer`, tree: 2, row: 2, col: 2, reqLevel: 12, prereqs: [`amplifyDamage`], maxLevel: 20, kind: `curse`, element: `magic`, anim: `castUp`, allowLeft: false, desc: `Curses enemies so that hits against them heal the attacker.`, mana: () => 9, cooldown: Sf, radius: bf(2, 0.4), duration: bf(10, 2) } };
function wf(e4) {
  return Object.values(Cf).filter((t2) => t2.classId === e4);
}
var Tf = `str.dex.vit.ene.life.mana.stamina.lifePct.manaPct.dmgMin.dmgMax.ed.edArmor.ar.arPct.def.defPct.block.resFire.resCold.resLight.resPoison.resAll.maxRes.fireMin.fireMax.coldMin.coldMax.coldLen.lightMin.lightMax.poisonDmg.poisonLen.magicMin.magicMax.lifeSteal.manaSteal.ias.fcr.frw.fhr.mf.gf.lightRadius.allSkills.classSkills.lifeRegen.manaRegen.dr.drPct.thorns.crit.lifePerKill.manaPerKill.cbf.sockets.dmgUndead.arUndead.repLife`.split(`.`);
function Ef() {
  let e4 = {};
  for (let t2 of Tf) e4[t2] = 0;
  return e4;
}
var Df = { sorceress: `Sorceress`, barbarian: `Barbarian`, necromancer: `Necromancer` };
function Of(e4, t2) {
  let n2 = Math.round(e4.value), r2 = n2 >= 0 ? `+` : ``;
  switch (e4.stat) {
    case `str`:
      return `${r2}${n2} to Strength`;
    case `dex`:
      return `${r2}${n2} to Dexterity`;
    case `vit`:
      return `${r2}${n2} to Vitality`;
    case `ene`:
      return `${r2}${n2} to Energy`;
    case `life`:
      return `${r2}${n2} to Life`;
    case `mana`:
      return `${r2}${n2} to Mana`;
    case `stamina`:
      return `${r2}${n2} Maximum Stamina`;
    case `lifePct`:
      return `Increase Maximum Life ${n2}%`;
    case `manaPct`:
      return `Increase Maximum Mana ${n2}%`;
    case `dmgMin`:
      return `${r2}${n2} to Minimum Damage`;
    case `dmgMax`:
      return `${r2}${n2} to Maximum Damage`;
    case `ed`:
      return `${r2}${n2}% Enhanced Damage`;
    case `edArmor`:
      return `${r2}${n2}% Enhanced Defense`;
    case `ar`:
      return `${r2}${n2} to Attack Rating`;
    case `arPct`:
      return `${r2}${n2}% Bonus to Attack Rating`;
    case `def`:
      return `${r2}${n2} Defense`;
    case `defPct`:
      return `${r2}${n2}% Defense`;
    case `block`:
      return `${n2}% Increased Chance of Blocking`;
    case `resFire`:
      return `Fire Resist ${r2}${n2}%`;
    case `resCold`:
      return `Cold Resist ${r2}${n2}%`;
    case `resLight`:
      return `Lightning Resist ${r2}${n2}%`;
    case `resPoison`:
      return `Poison Resist ${r2}${n2}%`;
    case `resAll`:
      return `All Resistances ${r2}${n2}`;
    case `maxRes`:
      return `${r2}${n2}% to All Maximum Resistances`;
    case `coldLen`:
      return `Chills for ${e4.value.toFixed(1)} seconds`;
    case `poisonDmg`:
      return `+${n2} Poison Damage over time`;
    case `lifeSteal`:
      return `${n2}% Life Stolen per Hit`;
    case `manaSteal`:
      return `${n2}% Mana Stolen per Hit`;
    case `ias`:
      return `+${n2}% Increased Attack Speed`;
    case `fcr`:
      return `+${n2}% Faster Cast Rate`;
    case `frw`:
      return `+${n2}% Faster Run/Walk`;
    case `fhr`:
      return `+${n2}% Faster Hit Recovery`;
    case `mf`:
      return `${n2}% Better Chance of Getting Magic Items`;
    case `gf`:
      return `${n2}% Extra Gold from Monsters`;
    case `lightRadius`:
      return `${r2}${n2} to Light Radius`;
    case `allSkills`:
      return `+${n2} to All Skills`;
    case `classSkills`:
      return `+${n2} to ${t2 ?? `Class`} Skill Levels`;
    case `lifeRegen`:
      return `Replenish Life +${n2}`;
    case `manaRegen`:
      return `Regenerate Mana ${n2}%`;
    case `dr`:
      return `Damage Reduced by ${n2}`;
    case `drPct`:
      return `Damage Reduced by ${n2}%`;
    case `thorns`:
      return `Attacker Takes Damage of ${n2}`;
    case `crit`:
      return `${n2}% Deadly Strike`;
    case `lifePerKill`:
      return `+${n2} Life after each Kill`;
    case `manaPerKill`:
      return `+${n2} to Mana after each Kill`;
    case `cbf`:
      return `Cannot Be Frozen`;
    case `sockets`:
      return `Socketed (${n2})`;
    case `dmgUndead`:
      return `+${n2}% Damage to Undead`;
    case `arUndead`:
      return `+${n2} to Attack Rating against Undead`;
    case `repLife`:
      return `Replenish Life +${n2}`;
    default:
      return `${e4.stat} ${n2}`;
  }
}
var kf = [[`fireMin`, `fireMax`, `Adds {a}-{b} Fire Damage`], [`coldMin`, `coldMax`, `Adds {a}-{b} Cold Damage`], [`lightMin`, `lightMax`, `Adds {a}-{b} Lightning Damage`], [`magicMin`, `magicMax`, `Adds {a}-{b} Magic Damage`], [`dmgMin`, `dmgMax`, `Adds {a}-{b} Damage`]];
function Af(e4, t2) {
  let n2 = /* @__PURE__ */ new Map(), r2 = [];
  for (let t3 of e4) {
    if (t3.stat === `classSkills` && t3.cls) {
      r2.push(Of(t3, Df[t3.cls]));
      continue;
    }
    n2.set(t3.stat, (n2.get(t3.stat) ?? 0) + t3.value);
  }
  for (let [e5, t3, i3] of kf) n2.has(e5) && n2.has(t3) && (r2.push(i3.replace(`{a}`, String(Math.round(n2.get(e5)))).replace(`{b}`, String(Math.round(n2.get(t3))))), n2.delete(e5), n2.delete(t3));
  let i2 = [`resFire`, `resCold`, `resLight`, `resPoison`];
  if (i2.every((e5) => n2.has(e5)) && new Set(i2.map((e5) => n2.get(e5))).size === 1) {
    n2.set(`resAll`, (n2.get(`resAll`) ?? 0) + n2.get(`resFire`));
    for (let e5 of i2) n2.delete(e5);
  }
  for (let e5 of `allSkills.classSkills.fcr.ias.frw.fhr.ed.edArmor.dmgMin.dmgMax.ar.arPct.crit.fireMin.fireMax.coldMin.coldMax.coldLen.lightMin.lightMax.poisonDmg.magicMin.magicMax.lifeSteal.manaSteal.def.defPct.block.str.dex.vit.ene.life.mana.lifePct.manaPct.stamina.resAll.resFire.resCold.resLight.resPoison.maxRes.dr.drPct.thorns.lifeRegen.repLife.manaRegen.lifePerKill.manaPerKill.mf.gf.lightRadius.cbf.dmgUndead.arUndead`.split(`.`)) {
    if (!n2.has(e5)) continue;
    let i3 = n2.get(e5);
    e5 === `poisonLen` || i3 === 0 || r2.push(Of({ stat: e5, value: i3 }, t2));
  }
  return r2;
}
var jf = 1;
function Mf() {
  return jf++;
}
function Nf(e4) {
  jf <= e4 && (jf = e4 + 1);
}
function Pf(e4) {
  return hf[e4.base];
}
function Ff(e4) {
  return e4.cat === `weapon` ? `weapon` : e4.cat === `shield` ? `shield` : `armor`;
}
function If(e4) {
  let t2 = Pf(e4), n2 = [];
  t2.fixed && n2.push(...t2.fixed), (e4.identified || e4.quality === `normal` || e4.quality === `superior` || e4.quality === `low` || e4.quality === `runeword`) && n2.push(...e4.mods);
  let r2 = Ff(t2);
  for (let t3 of e4.socketed) n2.push(...Lf(t3, r2));
  return n2;
}
function Lf(e4, t2) {
  let n2 = Pf(e4);
  return n2.gem ? _f[n2.gem.type][t2](yf[n2.gem.grade]) : n2.rune ? vf[n2.rune][t2] : n2.cat === `jewel` ? e4.mods : [];
}
function Rf(e4) {
  let t2 = Pf(e4);
  if (!t2.dmg) return [1, 2];
  let n2 = e4.superior ?? 0, r2 = 0, i2 = 0;
  for (let t3 of If(e4)) t3.stat === `ed` && (n2 += t3.value), t3.stat === `dmgMin` && (r2 += t3.value), t3.stat === `dmgMax` && (i2 += t3.value);
  let a2 = e4.quality === `low` ? 0.75 : 1, o2 = (1 + n2 / 100) * a2, s2 = Math.max(1, Math.floor(t2.dmg[0] * o2) + r2);
  return [s2, Math.max(s2 + 1, Math.floor(t2.dmg[1] * o2) + i2)];
}
function zf(e4) {
  let t2 = Pf(e4);
  if (!t2.def) return 0;
  let n2 = e4.def ?? t2.def[0], r2 = e4.superior ?? 0, i2 = 0;
  for (let t3 of If(e4)) t3.stat === `edArmor` && (r2 += t3.value), t3.stat === `def` && (i2 += t3.value);
  let a2 = e4.quality === `low` ? 0.75 : 1;
  return Math.floor(n2 * (1 + r2 / 100) * a2) + i2;
}
function Bf(e4) {
  let t2 = Pf(e4);
  if (t2.cat === `tome`) return t2.price + (e4.qty ?? 0) * 25;
  let n2 = t2.price * { low: 0.5, normal: 1, superior: 1.5, magic: 2.5, rare: 5, set: 8, unique: 12, crafted: 6, runeword: 15, misc: 1 }[e4.quality];
  return n2 += e4.mods.length * 40 + e4.ilvl * 6, n2 += e4.socketed.reduce((e5, t3) => e5 + Bf(t3) * 0.5, 0), Math.max(1, Math.round(n2));
}
function Vf(e4) {
  let t2 = Pf(e4);
  return !e4.identified && t2.cat !== `gem` && t2.cat !== `rune` ? Math.max(1, Math.round(Bf(e4) * 0.12)) : Math.max(1, Math.round(Bf(e4) * 0.25));
}
function Hf(e4) {
  return e4.uniqueId ? ef.find((t2) => t2.id === e4.uniqueId) : void 0;
}
function Uf(e4) {
  return e4.setId ? tf.find((t2) => t2.id === e4.setId) : void 0;
}
function Wf(e4) {
  return e4.runeword ? nf.find((t2) => t2.id === e4.runeword) : void 0;
}
function Gf(e4) {
  if (e4.quality !== `normal` && e4.quality !== `superior` || e4.socketed.length !== e4.sockets) return false;
  let t2 = e4.socketed.map((e5) => Pf(e5).rune ?? -1);
  if (t2.some((e5) => e5 < 0)) return false;
  let n2 = Pf(e4).cat;
  for (let r2 of nf) if (r2.runes.length === t2.length && r2.cats.includes(n2) && r2.runes.every((e5, n3) => e5 === t2[n3])) return e4.runeword = r2.id, e4.quality = `runeword`, e4.name = r2.name, e4.mods = [...r2.mods], true;
  return false;
}
function Kf(e4) {
  return JSON.parse(JSON.stringify(e4));
}
function qf(e4, t2) {
  return e4 * t2 / (e4 + t2);
}
function Jf(e4, t2, n2, r2) {
  let i2 = [1, 2, 4, 6][n2.tier], a2 = n2.mf, o2 = 45e-4 * i2 * (1 + qf(a2, 250) / 100), s2 = 85e-4 * i2 * (1 + qf(a2, 500) / 100), c2 = 0.05 * i2 * (1 + qf(a2, 600) / 100), l2 = 0.26 * Math.min(2.5, i2 * 0.9) * (1 + a2 / 100), u2 = e4.next(), d2;
  if (d2 = u2 < o2 ? `unique` : u2 < o2 + s2 ? `set` : u2 < o2 + s2 + c2 ? `rare` : u2 < o2 + s2 + c2 + l2 ? `magic` : e4.chance(0.09) ? `superior` : e4.chance(0.06) ? `low` : `normal`, (t2.cat === `ring` || t2.cat === `amulet` || t2.cat === `charm` || t2.cat === `jewel`) && ((d2 === `normal` || d2 === `superior` || d2 === `low`) && (d2 = `magic`), d2 === `set` && !tf.some((e5) => e5.items.some((e6) => e6.base === t2.id)) && (d2 = `rare`)), r2) {
    let e5 = [`low`, `normal`, `superior`, `magic`, `rare`, `set`, `unique`];
    e5.indexOf(d2) < e5.indexOf(r2) && (d2 = r2);
  }
  return d2;
}
function Yf(e4, t2, n2) {
  return Zd.filter((r2) => r2.kind === n2 && r2.level <= t2 && r2.cats.includes(e4.cat));
}
function Xf(e4, t2) {
  return t2.mods.map((n2) => {
    let r2 = n2.min === n2.max ? n2.min : n2.min + e4.next() * (n2.max - n2.min), i2 = { stat: n2.stat, value: Number.isInteger(n2.min) && Number.isInteger(n2.max) ? Math.round(r2) : Math.round(r2 * 10) / 10 };
    return n2.stat === `classSkills` && t2.classOnly && (i2.cls = t2.classOnly), i2;
  });
}
function Zf(e4, t2, n2, r2, i2) {
  let a2 = /* @__PURE__ */ new Set(), o2 = (r3, i3) => {
    let o3 = [];
    for (let s2 = 0; s2 < i3; s2 += 1) {
      let i4 = Yf(t2, n2, r3).filter((e5) => !a2.has(e5.group));
      if (!i4.length) break;
      let s3 = e4.weighted(i4, (e5) => e5.weight);
      a2.add(s3.group), o3.push(s3);
    }
    return o3;
  };
  return { pre: o2(`prefix`, r2), suf: o2(`suffix`, i2) };
}
function Qf(e4, t2, n2, r2) {
  let i2 = gf.filter((i3) => i3.weight > 0 && i3.qlvl <= Math.max(1, t2) && i3.cat !== `gold` && i3.cat !== `coffer` && (!n2 || n2.includes(i3.cat)) && (!i3.classOnly || !r2 || i3.classOnly === r2 || e4.chance(0.5)));
  return e4.weighted(i2, (e5) => e5.weight * (1 + Math.min(1, e5.qlvl / Math.max(1, t2))));
}
function $f(e4, t2 = 1, n2) {
  let r2 = hf[e4];
  return { uid: Mf(), base: e4, quality: r2.cat === `gem` || r2.cat === `rune` || r2.cat === `potion` || r2.cat === `scroll` || r2.cat === `tome` || r2.cat === `gold` || r2.cat === `coffer` ? `misc` : `normal`, ilvl: t2, identified: true, name: r2.name, mods: [], affixes: [], sockets: 0, socketed: [], def: r2.def ? r2.def[0] : void 0, qty: n2 ?? (r2.stack ? 1 : void 0) };
}
function ep(e4, t2, n2 = {}) {
  let r2 = n2.baseId ? hf[n2.baseId] : Qf(e4, t2.ilvl, n2.cats ?? [`weapon`, `helm`, `armor`, `shield`, `gloves`, `boots`, `belt`, `ring`, `amulet`, `charm`, `jewel`], n2.classId), i2 = $f(r2.id, t2.ilvl);
  i2.def = r2.def ? e4.int(r2.def[0], r2.def[1]) : void 0;
  let a2 = n2.quality ?? Jf(e4, r2, t2, n2.minQuality);
  if (a2 === `unique`) {
    let n3 = ef.filter((e5) => e5.base === r2.id && e5.level <= t2.ilvl + 3);
    if (n3.length) {
      let t3 = e4.pick(n3);
      return i2.quality = `unique`, i2.uniqueId = t3.id, i2.name = t3.name, i2.mods = [...t3.mods], i2.identified = false, i2;
    }
    a2 = `rare`;
  }
  if (a2 === `set`) {
    let n3 = tf.flatMap((e5) => e5.items.map((t3) => ({ s: e5, i: t3 }))).filter((e5) => e5.i.base === r2.id && e5.i.level <= t2.ilvl + 3);
    if (n3.length) {
      let t3 = e4.pick(n3);
      return i2.quality = `set`, i2.setId = t3.s.id, i2.setItemId = t3.i.id, i2.name = t3.i.name, i2.mods = [...t3.i.mods], i2.identified = false, i2;
    }
    a2 = `rare`;
  }
  if (i2.quality = a2, a2 === `magic`) {
    let n3 = e4.next(), a3 = n3 < 0.5 ? 1 : +(n3 < 0.75), o2 = n3 < 0.5 ? 1 : n3 < 0.75 ? 0 : 1, { pre: s2, suf: c2 } = Zf(e4, r2, t2.ilvl, a3, o2);
    if (!s2.length && !c2.length) {
      let n4 = Zf(e4, r2, t2.ilvl, 0, 1);
      c2.push(...n4.suf);
    }
    for (let t3 of [...s2, ...c2]) i2.mods.push(...Xf(e4, t3)), i2.affixes.push(t3.id);
    i2.name = [s2[0]?.name, r2.name, c2[0]?.name].filter(Boolean).join(` `), i2.identified = false;
  } else if (a2 === `rare`) {
    let n3 = e4.int(3, 6), a3 = Math.min(3, e4.int(1, n3 - 1)), o2 = Math.min(3, n3 - a3), { pre: s2, suf: c2 } = Zf(e4, r2, t2.ilvl, a3, o2);
    for (let t3 of [...s2, ...c2]) i2.mods.push(...Xf(e4, t3)), i2.affixes.push(t3.id);
    let l2 = $d[r2.cat] ?? [`Charm`, `Token`, `Relic`, `Idol`];
    i2.name = `${e4.pick(Qd)} ${e4.pick(l2)}`, i2.identified = false;
  } else a2 === `superior` ? (i2.superior = e4.int(5, 15), i2.name = `Superior ${r2.name}`) : a2 === `low` && (i2.lowQ = e4.pick([`Crude`, `Cracked`, `Damaged`]), i2.name = `${i2.lowQ} ${r2.name}`);
  if ((a2 === `normal` || a2 === `superior`) && r2.maxSockets > 0 && e4.chance(0.28)) {
    let n3 = t2.ilvl < 12 ? Math.min(3, r2.maxSockets) : r2.maxSockets;
    i2.sockets = e4.int(1, Math.max(1, n3));
  }
  return i2;
}
function tp(e4, t2) {
  let n2 = [`amethyst`, `topaz`, `sapphire`, `emerald`, `ruby`, `diamond`, `skull`], r2 = t2 >= 16 && e4.chance(0.3) ? `normal` : t2 >= 8 && e4.chance(0.4) ? `flawed` : `chipped`;
  return $f(`gem_${e4.pick(n2)}_${r2}`, t2);
}
function np(e4, t2) {
  let n2 = gf.filter((e5) => e5.cat === `rune` && e5.qlvl <= t2 + 2);
  return $f((n2.length ? e4.weighted(n2, (e5) => e5.weight) : hf.rune1).id, t2);
}
function rp(e4, t2) {
  let n2 = Math.min(5, Math.max(1, 1 + Math.floor(t2 / 7) + +!!e4.chance(0.25) - +!!e4.chance(0.3))), r2 = e4.next();
  return $f(r2 < 0.05 ? t2 >= 12 && e4.chance(0.15) ? `fullRejuv` : `rejuv` : r2 < 0.1 ? `stamina` : `${r2 < 0.6 ? `hp` : `mp`}${n2}`, t2);
}
function ip(e4, t2, n2, r2, i2) {
  let a2 = [], o2 = 0, s2 = [1, 2, 3, 6][t2.tier];
  for (let c2 = 0; c2 < s2; c2 += 1) {
    let s3 = t2.tier >= 2 && c2 < t2.tier - 1 || t2.tier === 3;
    if (!s3 && !e4.chance(n2)) continue;
    let l2 = e4.next();
    if (!s3 && l2 < 0.28) o2 += Math.round(t2.ilvl * e4.range(4, 12) * (1 + r2 / 100) * (t2.tier >= 2 ? 3 : 1));
    else if (!s3 && l2 < 0.58) a2.push(rp(e4, t2.ilvl));
    else if (!s3 && l2 < 0.62) a2.push($f(e4.chance(0.6) ? `tpScroll` : `idScroll`, t2.ilvl));
    else if (l2 < 0.655) a2.push(tp(e4, t2.ilvl));
    else if (l2 < 0.672 + t2.tier * 0.02) a2.push(np(e4, t2.ilvl));
    else {
      let n3 = t2.tier === 3 && c2 === 0 ? `rare` : t2.tier >= 2 && c2 < 2 ? `magic` : void 0;
      a2.push(ep(e4, t2, { minQuality: n3, classId: i2 }));
    }
  }
  return { items: a2, gold: o2 };
}
function ap(e4, t2, n2) {
  let r2 = ip(e4, { ...t2, tier: Math.min(3, n2) }, 0.85, 0);
  return r2.gold += Math.round(t2.ilvl * e4.range(10, 30) * n2), r2;
}
var op = class e2 {
  cols;
  rows;
  cells;
  items = /* @__PURE__ */ new Map();
  constructor(e4, t2) {
    this.cols = e4, this.rows = t2, this.cells = new Int32Array(e4 * t2);
  }
  size(e4) {
    let t2 = Pf(e4);
    return [t2.w, t2.h];
  }
  inBounds(e4, t2, n2) {
    let [r2, i2] = this.size(e4);
    return t2 >= 0 && n2 >= 0 && t2 + r2 <= this.cols && n2 + i2 <= this.rows;
  }
  test(e4, t2, n2) {
    if (!this.inBounds(e4, t2, n2)) return { ok: false, swap: 0 };
    let [r2, i2] = this.size(e4), a2 = 0;
    for (let o2 = n2; o2 < n2 + i2; o2 += 1) for (let n3 = t2; n3 < t2 + r2; n3 += 1) {
      let t3 = this.cells[o2 * this.cols + n3];
      if (t3 && t3 !== e4.uid) {
        if (a2 && a2 !== t3) return { ok: false, swap: 0 };
        a2 = t3;
      }
    }
    return { ok: true, swap: a2 };
  }
  place(e4, t2, n2) {
    let [r2, i2] = this.size(e4);
    for (let a2 = n2; a2 < n2 + i2; a2 += 1) for (let n3 = t2; n3 < t2 + r2; n3 += 1) this.cells[a2 * this.cols + n3] = e4.uid;
    this.items.set(e4.uid, { item: e4, x: t2, y: n2 });
  }
  remove(e4) {
    let t2 = this.items.get(e4);
    if (!t2) return null;
    for (let t3 = 0; t3 < this.cells.length; t3 += 1) this.cells[t3] === e4 && (this.cells[t3] = 0);
    return this.items.delete(e4), t2.item;
  }
  at(e4, t2) {
    if (e4 < 0 || t2 < 0 || e4 >= this.cols || t2 >= this.rows) return null;
    let n2 = this.cells[t2 * this.cols + e4];
    return n2 ? this.items.get(n2)?.item ?? null : null;
  }
  findSpace(e4) {
    let [t2, n2] = this.size(e4);
    for (let e5 = 0; e5 + t2 <= this.cols; e5 += 1) for (let r2 = 0; r2 + n2 <= this.rows; r2 += 1) {
      let i2 = true;
      for (let a2 = r2; a2 < r2 + n2 && i2; a2 += 1) for (let n3 = e5; n3 < e5 + t2; n3 += 1) if (this.cells[a2 * this.cols + n3]) {
        i2 = false;
        break;
      }
      if (i2) return { x: e5, y: r2 };
    }
    return null;
  }
  autoPlace(e4) {
    let t2 = this.findSpace(e4);
    return t2 ? (this.place(e4, t2.x, t2.y), true) : false;
  }
  list() {
    return [...this.items.values()];
  }
  clear() {
    this.cells.fill(0), this.items.clear();
  }
  find(e4) {
    for (let t2 of this.items.values()) if (e4(t2.item)) return t2.item;
    return null;
  }
  toJSON() {
    return this.list();
  }
  static from(t2, n2, r2) {
    let i2 = new e2(t2, n2);
    for (let e4 of r2) i2.test(e4.item, e4.x, e4.y).ok && !i2.test(e4.item, e4.x, e4.y).swap ? i2.place(e4.item, e4.x, e4.y) : i2.autoPlace(e4.item);
    return i2;
  }
}, sp = { low: `grey`, normal: `white`, superior: `white`, magic: `blue`, rare: `yellow`, set: `green`, unique: `gold`, crafted: `orange`, runeword: `gold`, misc: `white` };
function cp(e4, t2) {
  let n2 = Pf(e4);
  return !(n2.classOnly && n2.classOnly !== t2.classId || t2.str < lp(e4) || t2.dex < up(e4) || t2.level < dp(e4));
}
function lp(e4) {
  return Pf(e4).reqStr;
}
function up(e4) {
  return Pf(e4).reqDex;
}
function dp(e4) {
  let t2 = Pf(e4).reqLvl;
  return (e4.quality === `magic` || e4.quality === `rare`) && (t2 = Math.max(t2, Math.floor(e4.ilvl * 0.6) - 1)), (e4.quality === `unique` || e4.quality === `set`) && (t2 = Math.max(t2, Math.max(1, e4.ilvl - 2))), Math.max(0, t2);
}
function fp(e4) {
  return e4.quality === `normal` && e4.sockets > 0 ? `grey` : sp[e4.quality];
}
function pp(e4, t2) {
  let n2 = Pf(e4), r2 = [], i2 = fp(e4), a2 = !e4.identified;
  if (e4.quality === `runeword` ? (r2.push({ text: e4.name, color: `gold`, size: `title` }), r2.push({ text: n2.name, color: `grey`, size: `title` }), Wf(e4) && r2.push({ text: `'${e4.socketed.map((e5) => Pf(e5).name.replace(` Rune`, ``)).join(``)}'`, color: `gold` })) : !a2 && (e4.quality === `rare` || e4.quality === `unique` || e4.quality === `set`) ? (r2.push({ text: e4.name, color: i2, size: `title` }), r2.push({ text: n2.name, color: i2, size: `title` })) : a2 ? r2.push({ text: n2.name, color: i2, size: `title` }) : r2.push({ text: e4.name, color: i2, size: `title` }), n2.cat === `gold` && r2.push({ text: `${e4.qty ?? 0} Gold`, color: `white` }), n2.dmg) {
    let [t3, i3] = Rf(e4), a3 = t3 !== n2.dmg[0] || i3 !== n2.dmg[1];
    r2.push({ text: `${n2.twoHanded ? `Two-Hand` : `One-Hand`} Damage: ${t3} to ${i3}`, color: a3 ? `blue` : `tan` });
    let o3 = n2.speed ?? 0;
    r2.push({ text: `${o3 <= -15 ? `Very Fast` : o3 < 0 ? `Fast` : o3 === 0 ? `Normal` : `Slow`} Attack Speed`, color: `tan`, size: `small` });
  }
  if (n2.def) {
    let t3 = zf(e4);
    r2.push({ text: `Defense: ${t3}`, color: t3 === (e4.def ?? n2.def[0]) ? `tan` : `blue` });
  }
  if (n2.block && r2.push({ text: `Chance to Block: ${n2.block}%`, color: `tan` }), n2.beltRows && r2.push({ text: `Belt Size: +${n2.beltRows * 4 - 4} Slots`, color: `tan` }), n2.classOnly) {
    let e5 = n2.classOnly === t2.classId;
    r2.push({ text: `(${rf[n2.classOnly].name} Only)`, color: e5 ? `tan` : `red` });
  }
  let o2 = lp(e4), s2 = up(e4), c2 = dp(e4);
  if (o2 && r2.push({ text: `Required Strength: ${o2}`, color: t2.str >= o2 ? `tan` : `red` }), s2 && r2.push({ text: `Required Dexterity: ${s2}`, color: t2.dex >= s2 ? `tan` : `red` }), c2 > 1 && r2.push({ text: `Required Level: ${c2}`, color: t2.level >= c2 ? `tan` : `red` }), n2.potion) {
    let e5 = n2.potion;
    e5.kind === `hp` ? r2.push({ text: `Replenishes ${e5.amount} Life over ${e5.duration} seconds`, color: `white` }) : e5.kind === `mp` ? r2.push({ text: `Replenishes ${e5.amount} Mana over ${e5.duration} seconds`, color: `white` }) : e5.kind === `rejuv` ? r2.push({ text: `Restores ${e5.amount}% of Life and Mana instantly`, color: `white` }) : r2.push({ text: `Fast stamina recovery for 30 seconds`, color: `white` }), r2.push({ text: `Right-click to drink · keys 1–4 from the belt`, color: `grey`, size: `small` });
  }
  if (n2.cat === `scroll` && r2.push({ text: n2.id === `tpScroll` ? `Right-click to open a portal to town` : `Right-click, then click an item to identify it`, color: `grey`, size: `small` }), n2.cat === `tome` && (r2.push({ text: `Quantity: ${e4.qty ?? 0}`, color: `white` }), r2.push({ text: n2.id === `tpTome` ? `Right-click to open a portal to town` : `Right-click, then click an item to identify it`, color: `grey`, size: `small` })), n2.gem) {
    r2.push({ text: `Can be inserted into socketed items`, color: `grey`, size: `small` });
    let e5 = [`chipped`, `flawed`, `normal`, `flawless`, `perfect`].indexOf(n2.gem.grade);
    r2.push({ text: `Weapons: ${Af(_f[n2.gem.type].weapon(e5)).join(`, `)}`, color: `white` }), r2.push({ text: `Armor: ${Af(_f[n2.gem.type].armor(e5)).join(`, `)}`, color: `white` }), r2.push({ text: `Shields: ${Af(_f[n2.gem.type].shield(e5)).join(`, `)}`, color: `white` });
  }
  if (n2.rune && (r2.push({ text: `Can be inserted into socketed items`, color: `grey`, size: `small` }), r2.push({ text: `Weapons: ${Af(vf[n2.rune].weapon).join(`, `)}`, color: `white` }), r2.push({ text: `Armor: ${Af(vf[n2.rune].armor).join(`, `)}`, color: `white` }), r2.push({ text: `Shields: ${Af(vf[n2.rune].shield).join(`, `)}`, color: `white` })), n2.cat === `coffer` && r2.push({ text: `Place items inside and Transmute to combine them`, color: `grey`, size: `small` }), a2) r2.push({ text: `Unidentified`, color: `red` });
  else {
    let i3 = rf[t2.classId].name, a3 = Af([...n2.fixed ?? [], ...mp(e4)], i3);
    for (let t3 of a3) r2.push({ text: t3, color: e4.quality === `set` ? `green` : `blue` });
    let o3 = Af(e4.socketed.flatMap((e5) => Lf(e5, Ff(n2))), i3);
    for (let e5 of o3) r2.push({ text: e5, color: `blue` });
    e4.sockets > 0 && r2.push({ text: `Socketed (${e4.sockets})`, color: `blue` });
    let s3 = Uf(e4);
    if (s3) {
      let e5 = t2.setCount(s3.id);
      r2.push({ text: ``, color: `white` });
      for (let [t3, n3] of Object.entries(s3.bonus)) {
        let a4 = e5 >= Number(t3);
        for (let e6 of Af(n3, i3)) r2.push({ text: `${e6} (${t3} items)`, color: a4 ? `green` : `grey`, size: `small` });
      }
      r2.push({ text: s3.name, color: `gold` });
      for (let e6 of s3.items) r2.push({ text: e6.name, color: `green`, size: `small` });
    }
    let c3 = Hf(e4);
    c3 && r2.push({ text: c3.flavor, color: `grey`, size: `small` });
  }
  let l2 = cp(e4, t2) && !a2, u2 = n2.slot !== null;
  return { uid: e4.uid, name: a2 ? n2.name : e4.name, nameColor: i2, quality: e4.quality, identified: e4.identified, w: n2.w, h: n2.h, icon: t2.icon(e4), lines: r2, unusable: u2 && !l2, socketCount: e4.sockets, socketed: e4.socketed.map((e5) => t2.icon(e5)), quantity: n2.cat === `tome` ? e4.qty : void 0, priceBuy: t2.vendor ? Bf(e4) : void 0, priceSell: t2.vendor ? Vf(e4) : void 0 };
}
function mp(e4) {
  return e4.mods;
}
var hp = [`head`, `amulet`, `body`, `mainHand`, `offHand`, `ringLeft`, `ringRight`, `belt`, `gloves`, `boots`];
function gp(e4, t2, n2) {
  let r2 = rf[t2], i2 = { version: 1, id: `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`, name: e4, classId: t2, hardcore: n2, dead: false, level: 1, xp: 0, base: { str: r2.str, dex: r2.dex, vit: r2.vit, ene: r2.ene }, statPoints: 0, skillPoints: 1, skills: {}, bar: { left: `attack`, right: `attack`, hotkeys: [null, null, null, null, null, null, null, null] }, gold: 120, stashGold: 0, inventory: [], stash: [], cube: [], equipment: {}, belt: Array(16).fill(null), difficulty: `normal`, unlocked: [`normal`], quests: { normal: {}, nightmare: {}, hell: {} }, questData: {}, waypoints: { normal: [`town`], nightmare: [`town`], hell: [`town`] }, corpse: null, merc: null, kills: 0, deaths: 0, playTime: 0, lastPlayed: Date.now(), uidHigh: 0 }, a2 = new op(10, 4), o2 = 0;
  for (let e5 of r2.startItems) {
    let t3 = hf[e5.base];
    if (t3.cat === `potion`) {
      for (let t4 = 0; t4 < (e5.qty ?? 1); t4 += 1) o2 < 4 ? i2.belt[o2++] = $f(e5.base, 1) : a2.autoPlace($f(e5.base, 1));
      continue;
    }
    let n3 = $f(e5.base, 1, t3.stack ? e5.qty : void 0);
    e5.equip && t3.slot ? i2.equipment[t3.slot] = n3 : a2.autoPlace(n3);
  }
  return i2.inventory = a2.list(), i2;
}
var _p = { normal: 0, nightmare: -40, hell: -100 };
function vp(e4, t2) {
  return e4 <= 0 ? e4 : t2 * e4 / (t2 + e4);
}
function yp(e4) {
  return hp.map((t2) => e4.equipment[t2]).filter((e5) => !!e5);
}
function bp(e4) {
  let t2 = /* @__PURE__ */ new Map();
  for (let n2 of yp(e4)) n2.setId && n2.identified && t2.set(n2.setId, (t2.get(n2.setId) ?? 0) + 1);
  return t2;
}
function xp(e4, t2 = []) {
  let n2 = rf[e4.classId], r2 = Ef(), i2 = (t3) => {
    for (let n3 of t3) n3.stat === `classSkills` && n3.cls && n3.cls !== e4.classId || (r2[n3.stat] += n3.value);
  }, a2 = yp(e4).filter((e5) => e5.identified);
  for (let t3 = 0; t3 < 4; t3 += 1) {
    let t4 = e4.base.str, n3 = e4.base.dex;
    for (let e5 of a2) for (let r4 of If(e5)) r4.stat === `str` && (t4 += r4.value), r4.stat === `dex` && (n3 += r4.value);
    let r3 = a2.filter((r4) => cp(r4, { classId: e4.classId, level: e4.level, str: t4, dex: n3 }));
    if (r3.length === a2.length) break;
    a2 = r3;
  }
  for (let e5 of a2) i2(If(e5));
  for (let [t3, n3] of bp(e4)) {
    let e5 = tf.find((e6) => e6.id === t3);
    if (e5) for (let [t4, r3] of Object.entries(e5.bonus)) n3 >= Number(t4) && i2(r3);
  }
  for (let t3 of e4.inventory) Pf(t3.item).cat === `charm` && t3.item.identified && i2(t3.item.mods);
  i2(t2);
  let o2 = (t3) => {
    let n3 = e4.skills[t3] ?? 0;
    return n3 > 0 ? n3 + r2.allSkills + r2.classSkills : 0;
  }, s2 = o2(`weaponMastery`), c2 = o2(`ironHide`), l2 = o2(`swiftness`);
  s2 && (r2.ed += Cf.weaponMastery.weaponPct?.(s2) ?? 0, r2.arPct += Cf.weaponMastery.arPct?.(s2) ?? 0, r2.crit += Math.min(30, 3 + s2)), c2 && (r2.defPct += Cf.ironHide.weaponPct?.(c2) ?? 0), l2 && (r2.frw += Cf.swiftness.weaponPct?.(l2) ?? 0, r2.ias += Math.min(40, 5 + l2 * 2));
  let u2 = { str: e4.base.str + r2.str, dex: e4.base.dex + r2.dex, vit: e4.base.vit + r2.vit, ene: e4.base.ene + r2.ene }, d2 = e4.level, f2 = n2.life + (d2 - 1) * n2.lifePerLevel + (u2.vit - n2.vit) * n2.lifePerVit + r2.life, p2 = n2.mana + (d2 - 1) * n2.manaPerLevel + (u2.ene - n2.ene) * n2.manaPerEne + r2.mana;
  f2 *= 1 + r2.lifePct / 100, p2 *= 1 + r2.manaPct / 100;
  let m2 = n2.stamina + (d2 - 1) * n2.staminaPerLevel + (u2.vit - n2.vit) * n2.staminaPerVit + r2.stamina, h2 = e4.equipment.mainHand && e4.equipment.mainHand.identified ? e4.equipment.mainHand : null, g2 = h2 ? Pf(h2) : null, _2 = 1, v2 = 2;
  if (h2 && g2) {
    let [e5, t3] = Rf(h2), n3 = g2.wclass === `dagger` ? (u2.str * 0.75 + u2.dex * 0.75) / 100 : u2.str / 100, i3 = r2.ed;
    for (let e6 of If(h2)) e6.stat === `ed` && (i3 -= e6.value);
    let a3 = 1 + n3 + i3 / 100;
    _2 = Math.max(1, Math.floor(e5 * a3)), v2 = Math.max(_2 + 1, Math.floor(t3 * a3));
    let o3 = 0, s3 = 0;
    for (let e6 of If(h2)) e6.stat === `dmgMin` && (o3 += e6.value), e6.stat === `dmgMax` && (s3 += e6.value);
    _2 += r2.dmgMin - o3, v2 += r2.dmgMax - s3;
  } else _2 = Math.max(1, Math.floor(1 * (1 + u2.str / 100)) + r2.dmgMin), v2 = Math.max(_2 + 1, Math.floor(3 * (1 + u2.str / 100)) + r2.dmgMax);
  let y2 = Math.max(1, Math.round(((u2.dex - 7) * 5 + n2.baseAR + r2.ar) * (1 + r2.arPct / 100))), b2 = Math.floor(u2.dex / 4);
  for (let e5 of a2) b2 += zf(e5);
  b2 = Math.round(b2 * (1 + r2.defPct / 100));
  let x2 = e4.equipment.offHand && e4.equipment.offHand.identified ? e4.equipment.offHand : null, S2 = x2 ? Pf(x2) : null, C2 = 0;
  if (S2?.block) {
    let e5 = S2.block + r2.block;
    C2 = Math.max(0, Math.min(75, Math.floor(e5 * Math.max(0, u2.dex - 15) / (d2 * 2))));
  }
  let w2 = _p[e4.difficulty], T2 = 75 + r2.maxRes, E2 = (e5) => Math.min(T2, e5 + r2.resAll + w2), D2 = vp(r2.ias, 120), O2 = vp(r2.fcr, 120), k2 = vp(r2.frw, 150), A2 = g2?.speed ?? 0, ee2 = Math.max(0.28, n2.attackTime * (1 + A2 / 100) * (100 / (100 + D2))), te2 = Math.max(0.28, n2.castTime * (100 / (100 + O2))), ne2 = g2 ? g2.wclass === `staff` || g2.twoHanded ? 1.75 : g2.wclass === `dagger` || g2.wclass === `wand` ? 1.35 : 1.55 : 1.25;
  return { attrs: u2, stats: r2, lifeMax: Math.round(f2), manaMax: Math.round(p2), staminaMax: Math.round(m2), dmgMin: Math.round(_2), dmgMax: Math.round(v2), ar: y2, def: b2, block: C2, res: { fire: E2(r2.resFire), cold: E2(r2.resCold), lightning: E2(r2.resLight), poison: E2(r2.resPoison) }, resCap: T2, attackTime: ee2, castTime: te2, walk: 6 * (1 + k2 / 100), run: 9 * (1 + k2 / 100), reach: ne2, skillBonus: r2.allSkills + r2.classSkills, twoHanded: !!g2?.twoHanded, hasShield: !!S2 && S2.cat === `shield`, weaponVisual: g2 ? g2.visual : null };
}
function Sp(e4, t2, n2) {
  if (n2 === `attack`) return 1;
  let r2 = e4.skills[n2] ?? 0;
  return r2 > 0 ? r2 + t2.skillBonus : 0;
}
function Cp(e4, t2) {
  let n2 = Cf[t2], r2 = 0;
  for (let t3 of n2.synergies ?? []) r2 += (e4.skills[t3.skill] ?? 0) * t3.pct;
  return 1 + r2 / 100;
}
function wp(e4, t2, n2) {
  return n2.identified ? cp(n2, { classId: e4.classId, level: e4.level, str: t2.attrs.str, dex: t2.attrs.dex }) : false;
}
function Tp(e4) {
  let t2 = e4.equipment.belt;
  return t2 ? Pf(t2).beltRows ?? 1 : 1;
}

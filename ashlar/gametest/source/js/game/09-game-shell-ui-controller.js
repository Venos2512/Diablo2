// ===== game part 09-game-shell-ui-controller (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
Ed(), Od(), Ld();
var Bg = [`character`, `quests`, `stash`, `vendor`, `cube`, `waypoint`, `mercenary`], Vg = [`inventory`, `skills`], Hg = [`menu`, `options`, `help`], Ug = class {
  canvas;
  uiRoot;
  deps;
  presenter;
  input;
  bridge;
  saves = new zg();
  loop;
  automap;
  uiHandle = null;
  session = null;
  frame = 0;
  elapsed = 0;
  paused = false;
  pausedForShot = false;
  reducedMotion = false;
  rng = new Id(1);
  seedOverride = null;
  ground = new N();
  holdRepeat = 0;
  rightRepeat = 0;
  lastHoverTarget = null;
  transitioning = false;
  titleLayout = Hd(7);
  hitstop = 0;
  heartT = 0;
  spinLoop = null;
  stepAt = { x: 0, z: 0 };
  bossUnit = null;
  trackerFighting = false;
  options;
  constructor(e4, t2, n2) {
    this.canvas = e4, this.uiRoot = t2, this.deps = n2, this.options = { ...nh(), ...this.saves.loadOptions() ?? {} }, this.presenter = new Ag(e4, n2.models, n2.props, t2.parentElement ?? document.body), this.input = new jd(e4), this.input.onFirstGesture = () => {
      this.deps.audio.unlock().then(() => this.applyAudio());
    }, this.bridge = new ah(n2.models, this.options), this.automap = new Pg(t2.parentElement ?? document.body), this.loop = new Ad((e5) => this.tick(e5), (e5, t3) => this.render(e5, t3)), this.presenter.onThunder = (e5) => {
      window.setTimeout(() => this.deps.audio.play(`thunder`, { volume: 0.5 + e5 * 0.5 }), 400 + (1 - e5) * 1400);
    }, this.applyOptions(), this.installHooks(), document.addEventListener(`visibilitychange`, () => {
      document.hidden && this.saveNow();
    }), window.addEventListener(`pagehide`, () => this.saveNow());
  }
  periodicSave = 0;
  booted = null;
  bootResolve = null;
  whenReady() {
    return this.booted ||= new Promise((e4) => this.bootResolve = e4), this.booted;
  }
  async boot() {
    this.whenReady();
    let e4 = this.bridge.model;
    e4.screen = `loading`, e4.loading = { title: `GAMETEST`, subtitle: `Forging the world…`, progress: 0, tip: `Hold Alt to show every item on the ground.` }, this.bridge.bump(`screen`, `loading`), this.mountUI(), this.loop.start(), await this.deps.models.prepareModels(this.presenter.renderer, (t2) => {
      e4.loading.progress = t2 * 0.8, this.bridge.bump(`loading`);
    }), e4.loading.progress = 0.9, this.bridge.bump(`loading`), await this.deps.audio.prepare((t2) => {
      e4.loading.progress = 0.9 + t2 * 0.1, this.bridge.bump(`loading`);
    }), this.showTitle(), this.bootResolve?.();
  }
  mountUI() {
    if (this.uiHandle) return;
    this.uiHandle = this.deps.ui.mountUI(this.uiRoot, this.bridge.model, this.actions);
    let e4 = this.uiRoot.querySelector(`#world-labels`);
    e4 && this.presenter.labels.attachTo(e4);
  }
  showTitle() {
    this.endSession(false);
    let e4 = this.bridge.model;
    e4.screen = `title`, e4.loading = null, e4.openPanels = [], this.bridge.bump(`screen`, `loading`, `panels`), this.presenter.showTitleScene(this.titleLayout, oh()), this.deps.audio.setMusic(`title`), this.deps.audio.setAmbience(`title`, 0.3), this.refreshCharacterList();
  }
  showCharSelect() {
    let e4 = this.bridge.model;
    this.refreshCharacterList(), e4.screen = this.bridge.model.characters.length ? `charSelect` : `charCreate`, this.bridge.bump(`screen`);
  }
  refreshCharacterList() {
    let e4 = this.saves.list().map((e5) => ({ id: e5.id, name: e5.name, classId: e5.classId, className: rf[e5.classId].name, level: e5.level, hardcore: e5.hardcore, dead: e5.dead, areaName: `Grayvigil Encampment`, difficulty: e5.difficulty, difficultiesUnlocked: e5.unlocked }));
    this.bridge.setCharacters(e4);
  }
  startSession(e4, t2, n2 = `town`, r2 = `start`) {
    this.endSession(false), this.presenter.hideTitleScene(), e4.difficulty = t2;
    let i2 = this.seedOverride ?? Math.floor(Math.random() * 1e9) >>> 0, a2 = new eh(e4, i2);
    this.session = a2, this.bridge.session = a2, this.wireSession(a2), a2.enter(n2, r2), e4.merc?.hired && !e4.merc.dead && a2.spawnMerc(), this.presenter.attach(a2.world, i2), this.presenter.cam.snap(), this.afterAreaEnter();
    let o2 = this.bridge.model;
    return o2.screen = `game`, o2.loading = null, o2.death = null, o2.openPanels = [], this.syncPanelFlags(), this.setPaused(false), this.bridge.syncAll(), this.bridge.bump(`screen`, `loading`, `death`, `panels`), this.syncHeroVisuals(), this.automap.setWorld(a2.world), e4.level === 1 && e4.playTime < 1 && n2 === `town` && window.setTimeout(() => {
      this.session === a2 && (this.bridge.toast(`Left-click to move, attack and pick up. Right-click uses your skill.`, `white`, 7), this.bridge.toast(`Spend your skill point (T), then head out the gate. Press H for help.`, `tan`, 7));
    }, 1800), a2;
  }
  endSession(e4 = true) {
    this.session && (this.spinLoop?.stop(0), this.spinLoop = null, e4 && this.saveNow(), this.presenter.detach(), this.presenter.clearAreaCache(), this.session = null, this.bridge.session = null, this.bossUnit = null, this.bridge.model.boss = null, this.bridge.model.hero = null, this.automap.setWorld(null));
  }
  wireSession(e4) {
    let t2 = e4.events;
    t2.on(`message`, (e5) => this.bridge.toast(e5.text, e5.color)), t2.on(`sound`, (e5) => this.deps.audio.play(e5.id, { x: e5.x, z: e5.z, volume: e5.volume })), t2.on(`changed`, ({ sections: e5 }) => {
      this.bridge.apply(e5), e5.includes(`equipment`) && this.syncHeroVisuals();
    }), t2.on(`levelUp`, () => {
      this.presenter.floatAtUnit(e4.hero, `Level Up`, Dd.levelUp, 2.6), this.deps.audio.stinger(`questComplete`);
    }), t2.on(`dialog`, ({ npc: e5 }) => this.openDialog(e5)), t2.on(`openPanel`, ({ panel: e5 }) => this.openPanel(e5)), t2.on(`travel`, ({ to: e5, entry: t3 }) => void this.travel(e5, t3)), t2.on(`heroDied`, (t3) => {
      let n2 = this.bridge.model;
      n2.death = { killedBy: t3.killedBy, damageType: t3.damageType, goldLost: t3.goldLost, hardcore: e4.ch.hardcore }, n2.openPanels = [], this.syncPanelFlags(), this.bridge.bump(`death`, `panels`), this.deps.audio.stinger(`death`), this.deps.audio.setMusic(`none`, 1), this.saveNow();
    }), t2.on(`questComplete`, ({ name: e5 }) => {
      this.bridge.toast(`Quest Complete: ${e5}`, `gold`, 5), this.deps.audio.stinger(`questComplete`), this.updateQuestMarkers();
    }), t2.on(`bossIntro`, (t3) => {
      this.bossUnit = t3, this.deps.audio.stinger(`bossIntro`), this.deps.audio.setMusic(`boss`, 1.5), this.deps.audio.duck(0.4, 1.5), this.presenter.cam.cinematic = { target: new N(t3.x, e4.world.heightAt(t3.x, t3.z) + 1, t3.z), viewHeight: 9 }, window.setTimeout(() => this.presenter.cam.cinematic = null, 1600), this.bridge.toast(`${t3.name}`, `gold`, 3);
    }), t2.on(`bossDefeated`, () => {
      this.deps.audio.setMusic(`victory`, 1), window.setTimeout(() => {
        this.session?.world.def.id === `hollowFields` && this.deps.audio.setMusic(`wilderness`, 4);
      }, 9e3), this.presenter.cam.addTrauma(0.6), this.updateQuestMarkers();
    }), t2.on(`saveNeeded`, () => this.saveSoon());
  }
  wireWorld() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.world;
    t2.__wired || (t2.__wired = true, t2.events.on(`sound`, (e5) => {
      e5.id !== `whirlwindLoop` && this.session?.world === t2 && this.deps.audio.play(e5.id, { x: e5.x, z: e5.z, volume: e5.volume, pitch: e5.pitch });
    }), t2.events.on(`hitstop`, (e5) => {
      this.session?.world === t2 && (this.hitstop = Math.max(this.hitstop, e5));
    }), t2.events.on(`damage`, (e5) => {
      if (this.session?.world === t2 && (e5.crit && e5.target.kind === `monster` && this.deps.audio.play(`critHit`, { x: e5.target.x, z: e5.target.z, volume: 0.8 }), e5.target.kind === `hero` && e5.amount > 0)) {
        let t3 = this.presenter.pipeline.gradeUniforms;
        t3.uHurt.value = Math.min(0.85, t3.uHurt.value + e5.amount / Math.max(1, e5.target.lifeMax) * 2.2), this.deps.audio.play(`playerHurt`, { volume: 0.7 });
      }
    }), t2.events.on(`death`, ({ unit: e5 }) => {
      this.session?.world === t2 && (e5.kind === `hero` && this.deps.audio.play(`playerDeath`), e5 === this.bossUnit && (this.bossUnit = null, this.bridge.model.boss = null, this.bridge.bump(`boss`)));
    }), t2.events.on(`bossPhase`, ({ phase: e5 }) => {
      this.session?.world === t2 && (this.bridge.toast(e5 === 1 ? `The blood moon rises…` : `Phase change`, `red`, 3), this.presenter.cam.addTrauma(0.5), this.deps.audio.duck(0.5, 1));
    }));
  }
  afterAreaEnter() {
    let e4 = this.session;
    if (!e4) return;
    this.wireWorld();
    let t2 = e4.world.def;
    this.deps.audio.setMusic(t2.music), this.deps.audio.setAmbience(t2.ambience, t2.rain), t2.kind !== `town` && this.deps.audio.stinger(`areaEnter`), this.presenter.showAllLabels = this.options.alwaysShowItemLabels, this.updateQuestMarkers(), this.syncHeroVisuals(), this.automap.setWorld(e4.world), this.saveSoon();
  }
  updateQuestMarkers() {
    let e4 = this.session, t2 = this.presenter.questNpcs;
    if (t2.clear(), !e4) return;
    let n2 = e4.ch.quests[e4.diff];
    n2.den === `rewardPending` && t2.add(`healer`), n2.bloodwitch === `rewardPending` && t2.add(`captain`), e4.ch.questData.cofferGiven || t2.add(`sage`);
  }
  async travel(e4, t2) {
    let n2 = this.session;
    if (!n2 || this.transitioning) return;
    this.transitioning = true;
    let r2 = this.presenter.pipeline.gradeUniforms, i2 = this.bridge.model, a2 = (e5, t3) => new Promise((n3) => {
      let i3 = performance.now(), a3 = r2.uFade.value, o2 = () => {
        let s2 = Math.min(1, (performance.now() - i3) / t3);
        r2.uFade.value = a3 + (e5 - a3) * s2, s2 < 1 ? requestAnimationFrame(o2) : n3();
      };
      o2();
    });
    this.deps.audio.play(t2 === `portal` ? `portalEnter` : `waypointTravel`, { volume: 0.7 }), await a2(1, 260), i2.loading = { title: Ep[e4].name, subtitle: `Act ${Ep[e4].act}`, progress: 0.4, tip: Ep[e4].tip }, i2.screen = `loading`, this.bridge.bump(`screen`, `loading`), await new Promise((e5) => setTimeout(e5, 30)), n2.closeVendor(), i2.openPanels = i2.openPanels.filter((e5) => Vg.includes(e5)), this.syncPanelFlags(), this.setPaused(false), this.closeDialog(), this.bridge.bump(`panels`), n2.enter(e4, t2), this.presenter.attach(n2.world, n2.seed), this.presenter.cam.snap(), this.afterAreaEnter(), i2.loading = null, i2.screen = `game`, this.bridge.syncAll(), this.bridge.bump(`screen`, `loading`), await a2(0, 380), this.transitioning = false;
  }
  syncHeroVisuals() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = e4.ch.equipment, n2 = (e5) => t2[e5] ? Pf(t2[e5]).visual : null;
    this.presenter.setHeroEquipment({ mainHand: n2(`mainHand`), offHand: n2(`offHand`), head: n2(`head`), body: n2(`body`), gloves: n2(`gloves`), boots: n2(`boots`) });
  }
  saveTimer = 0;
  saveSoon() {
    this.saveTimer = 0.6;
  }
  saveNow() {
    let e4 = this.session;
    e4 && this.saves.save(e4.persist());
  }
  openPanel(e4) {
    let t2 = this.bridge.model;
    t2.openPanels.includes(e4) || (Bg.includes(e4) && (t2.openPanels = t2.openPanels.filter((e5) => !Bg.includes(e5))), Vg.includes(e4) && (t2.openPanels = t2.openPanels.filter((e5) => !Vg.includes(e5))), Hg.includes(e4) && (t2.openPanels = t2.openPanels.filter((e5) => !Hg.includes(e5))), t2.openPanels.push(e4), (e4 === `stash` || e4 === `vendor` || e4 === `cube`) && (t2.openPanels.includes(`inventory`) || t2.openPanels.push(`inventory`)), e4 === `menu` && this.setPaused(true), this.deps.audio.play(`uiOpen`, { volume: 0.6 })), this.syncPanelFlags(), this.bridge.bump(`panels`);
  }
  closePanel(e4) {
    let t2 = this.bridge.model;
    t2.openPanels = t2.openPanels.filter((t3) => t3 !== e4), e4 === `vendor` && this.session?.closeVendor(), (e4 === `menu` || e4 === `options` || e4 === `help`) && this.setPaused(t2.openPanels.some((e5) => Hg.includes(e5))), this.syncPanelFlags(), this.bridge.bump(`panels`), this.deps.audio.play(`uiClose`, { volume: 0.5 });
  }
  syncPanelFlags() {
    let e4 = this.session;
    if (!e4) return;
    let t2 = this.bridge.model.openPanels;
    e4.uiOpen.stash = t2.includes(`stash`), e4.uiOpen.cube = t2.includes(`cube`), !t2.includes(`vendor`) && e4.vendor && e4.closeVendor();
  }
  setPaused(e4) {
    this.paused = e4, this.loop.paused = e4, this.deps.audio.setPaused(e4);
  }
  dialogNpc = null;
  openDialog(e4) {
    let t2 = this.session;
    if (!t2) return;
    this.dialogNpc = e4;
    let n2 = t2.ch.quests[t2.diff], r2 = [], i2 = ``;
    switch (e4.npcKind) {
      case `healer`:
        i2 = n2.den === `rewardPending` ? `You have cleansed the Den. The moor breathes easier tonight — and so will you. Take this gift of insight.` : n2.den === `active` ? `There is a cave out on the Mournmoor where something festers. Purge it, and the Sisterhood will reward you. Your wounds I have mended.` : `Rest a while, traveler. My herbs will see you whole.`, n2.den === `rewardPending` && r2.push({ id: `quest_den`, label: `Claim Reward` }), r2.push({ id: `trade`, label: `Trade` });
        break;
      case `smith`:
        i2 = `Steel is all that stands between us and the dark. Need an edge? I have a few to spare — for a price.`, r2.push({ id: `trade`, label: `Trade` });
        break;
      case `sage`:
        i2 = t2.ch.questData.cofferGiven ? `Bring me what you cannot read, and I shall unveil its secrets. Knowledge is the only light that never gutters.` : `Ah, a new face. Take this coffer — an old alchemist’s box. Place gems or runes within and transmute them into something finer.`, r2.push({ id: `identify`, label: `Identify Items` });
        break;
      case `captain`:
        i2 = n2.bloodwitch === `rewardPending` ? `Veyra is at rest… She was one of us, once. You have my thanks, and a sister of the Vigil will ride with you.` : `Veyra — once our finest archer — now haunts the Gravewatch in the Hollow Fields, raising the dead. End her torment.`, n2.bloodwitch === `rewardPending` && r2.push({ id: `quest_bloodwitch`, label: `Claim Reward` }), r2.push({ id: `hire`, label: t2.merc && !t2.merc.dead ? `Mercenary (hired)` : `Hire Mercenary (${t2.ch.questData[`freeMerc_${t2.diff}`] === 1 ? `free` : `${150 + t2.ch.level * 60} gold`})` });
        break;
    }
    if (r2.push({ id: `leave`, label: `Leave` }), e4.npcKind === `sage` && !t2.ch.questData.cofferGiven) {
      let e5 = $f(`coffer`, 1);
      t2.inv.autoPlace(e5) && (t2.ch.questData.cofferGiven = 1, t2.changed(`grids`), this.updateQuestMarkers());
    }
    this.bridge.model.dialog = { npcName: e4.name, npcTitle: { healer: `Healer of the Vigil`, smith: `Blacksmith`, sage: `Keeper of Lore`, captain: `Captain of the Vigil` }[e4.npcKind ?? `healer`], text: i2, options: r2 }, this.bridge.bump(`dialog`), this.deps.audio.play(`uiOpen`, { volume: 0.5 });
  }
  closeDialog() {
    this.bridge.model.dialog = null, this.dialogNpc = null, this.bridge.bump(`dialog`);
  }
  actions = { titleContinue: () => {
    this.deps.audio.play(`uiClick`), this.showCharSelect();
  }, openCreate: () => {
    this.bridge.model.screen = `charCreate`, this.bridge.bump(`screen`);
  }, backToCharSelect: () => {
    this.showCharSelect(), this.bridge.model.characters.length || (this.bridge.model.screen = `title`, this.bridge.bump(`screen`));
  }, createCharacter: ({ name: e4, classId: t2, hardcore: n2 }) => {
    let r2 = gp(e4.trim().replace(/[^A-Za-z\- ]/g, ``).slice(0, 15) || rf[t2].name, t2, n2);
    this.saves.save(r2), this.deps.audio.play(`uiClick`), this.enterGameWithLoading(r2, `normal`);
  }, playCharacter: (e4, t2) => {
    let n2 = this.saves.load(e4);
    if (!n2 || n2.dead) return;
    let r2 = n2.unlocked.includes(t2) ? t2 : `normal`;
    this.deps.audio.play(`uiClick`), this.enterGameWithLoading(n2, r2);
  }, deleteCharacter: (e4) => {
    this.saves.remove(e4), this.refreshCharacterList();
  }, previewClass: (e4) => {
    let t2 = e4 ? oh().indexOf(e4) : -1;
    this.presenter.titleRigs.forEach((e5, n2) => {
      e5.setHighlight(n2 === t2 ? `#ffd27a` : null), n2 === t2 && e5.play(`taunt`, { duration: 1.4 });
    });
  }, togglePanel: (e4) => {
    this.bridge.model.openPanels.includes(e4) ? this.closePanel(e4) : this.openPanel(e4);
  }, closeAllPanels: () => this.closeAll(), toggleAutomap: () => this.automap.toggle(), clickGridCell: (e4, t2, n2) => this.session?.clickGrid(e4, t2, n2), rightClickGridItem: (e4, t2) => this.session?.rightClick(e4, t2), clickEquipSlot: (e4) => this.session?.clickEquip(e4), clickBeltSlot: (e4) => this.session?.clickBelt(e4), useBeltSlot: (e4) => this.session?.useBelt(e4 % 4), sellCursorItem: () => this.session?.sellCursor(), transmute: () => this.session?.transmute(), transferGold: (e4) => this.session?.transferGold(e4), learnSkill: (e4) => this.session?.learn(e4), setSkill: (e4, t2) => this.session?.setSkill(e4, t2), setHotkey: (e4, t2) => this.session?.setHotkey(e4, t2), addStatPoint: (e4) => this.session?.addStat(e4), toggleRun: () => {
    let e4 = this.session;
    e4 && (e4.hero.ai.runToggle = (e4.hero.ai.runToggle ?? 1) > 0 ? 0 : 1, this.bridge.syncVitals(), this.bridge.bump(`hero`));
  }, chooseDialogOption: (e4) => this.dialogOption(e4), travel: (e4) => {
    this.closeAll(), this.travel(e4, `waypoint`);
  }, hireMercenary: () => this.session?.hireMerc(), resume: () => this.closeAll(), saveAndExit: () => {
    this.saveNow(), this.setPaused(false), this.showTitle();
  }, setOption: (e4, t2) => {
    this.options[e4] = t2, this.bridge.model.options = { ...this.options }, this.bridge.bump(`options`), this.applyOptions(), this.saves.saveOptions(this.options);
  }, acknowledgeDeath: () => {
    let e4 = this.session, t2 = this.bridge.model;
    if (!(!e4 || !t2.death && !e4.hero.dead)) {
      if (t2.death = null, this.bridge.bump(`death`), e4.ch.hardcore) {
        this.saveNow(), this.showTitle();
        return;
      }
      e4.respawn();
    }
  } };
  resume(e4, t2) {
    let n2 = this.saves.load(e4);
    if (!n2 || n2.dead) return;
    let r2 = [`normal`, `nightmare`, `hell`].includes(t2) && n2.unlocked.includes(t2) ? t2 : `normal`;
    this.enterGameWithLoading(n2, r2);
  }
  async enterGameWithLoading(e4, t2) {
    let n2 = this.bridge.model;
    n2.screen = `loading`, n2.loading = { title: `Act I`, subtitle: Ep.town.name, progress: 0.3, tip: Ep.town.tip }, this.bridge.bump(`screen`, `loading`), await new Promise((e5) => setTimeout(e5, 40)), this.startSession(e4, t2);
  }
  dialogOption(e4) {
    let t2 = this.session, n2 = this.dialogNpc;
    if (!(!t2 || !n2)) {
      if (this.deps.audio.play(`uiClick`, { volume: 0.6 }), e4 === `leave`) return this.closeDialog();
      if (e4 === `trade`) {
        this.closeDialog(), t2.openVendor(n2);
        return;
      }
      if (e4 === `identify`) {
        let e5 = t2.identifyAll();
        this.bridge.toast(e5 ? `Old Aldric identifies ${e5} item${e5 > 1 ? `s` : ``}.` : `You carry nothing that needs identifying.`, `white`), this.closeDialog();
        return;
      }
      if (e4 === `quest_den`) {
        t2.claimQuest(`den`), this.updateQuestMarkers(), this.openDialog(n2);
        return;
      }
      if (e4 === `quest_bloodwitch`) {
        t2.claimQuest(`bloodwitch`), this.updateQuestMarkers(), this.openDialog(n2);
        return;
      }
      e4 === `hire` && (t2.hireMerc(), this.openDialog(n2));
    }
  }
  closeAll() {
    let e4 = this.bridge.model, t2 = e4.openPanels.some((e5) => Hg.includes(e5));
    e4.openPanels = [], this.session?.closeVendor(), this.syncPanelFlags(), t2 && this.setPaused(false), this.closeDialog(), this.bridge.bump(`panels`);
  }
  applyOptions() {
    let e4 = this.options;
    this.presenter.cam.shakeEnabled = e4.screenShake && !this.reducedMotion, this.presenter.damageNumbers = e4.damageNumbers, this.presenter.showAllLabels = e4.alwaysShowItemLabels, this.presenter.pipeline.quality !== e4.quality && this.presenter.pipeline.setQuality(e4.quality), this.deps.props.setFadeCoverage?.(this.presenter.pipeline.quality !== `low`), this.deps.models.setFadeCoverage?.(this.presenter.pipeline.quality !== `low`), document.documentElement.style.setProperty(`--ui-scale`, String(e4.uiScale)), this.applyAudio();
  }
  applyAudio() {
    let e4 = this.options;
    this.deps.audio.setVolumes({ master: e4.masterVolume, music: e4.musicVolume, sfx: e4.sfxVolume, ui: e4.sfxVolume, ambience: e4.ambienceVolume });
  }
  handleKeys() {
    let e4 = this.input.consumeKeys(), t2 = this.bridge.model;
    for (let n2 of e4) {
      if (t2.screen === `title`) {
        this.actions.titleContinue();
        continue;
      }
      if (t2.screen !== `game` || this.transitioning || this.paused && n2 !== `Escape`) continue;
      if (t2.death) {
        (n2 === `Escape` || n2 === `Space` || n2 === `Enter`) && this.actions.acknowledgeDeath();
        continue;
      }
      let e5 = this.session;
      switch (n2) {
        case `Escape`:
          t2.dialog ? this.closeDialog() : t2.openPanels.length ? this.closeAll() : this.openPanel(`menu`);
          break;
        case `Space`:
          this.closeAll();
          break;
        case `KeyC`:
          this.actions.togglePanel(`character`);
          break;
        case `KeyI`:
        case `KeyB`:
          this.actions.togglePanel(`inventory`);
          break;
        case `KeyT`:
        case `KeyS`:
          this.actions.togglePanel(`skills`);
          break;
        case `KeyQ`:
          this.actions.togglePanel(`quests`);
          break;
        case `KeyO`:
          this.actions.togglePanel(`mercenary`);
          break;
        case `KeyH`:
          this.actions.togglePanel(`help`);
          break;
        case `Tab`:
          this.automap.toggle();
          break;
        case `KeyR`:
          this.actions.toggleRun();
          break;
        case `Digit1`:
        case `Digit2`:
        case `Digit3`:
        case `Digit4`:
          e5?.useBelt(Number(n2.slice(5)) - 1);
          break;
        default:
          if (/^F[1-8]$/.test(n2) && e5) {
            let t3 = e5.ch.bar.hotkeys[Number(n2.slice(1)) - 1];
            t3 && (this.input.shift && Cf[t3].allowLeft ? e5.setSkill(`left`, t3) : e5.setSkill(`right`, t3), this.bridge.toast(Cf[t3].name, `white`, 1.2));
          }
      }
    }
    this.input.wheel && this.presenter.cam.wheelZoom(this.input.wheel);
  }
  handlePointer(e4) {
    let t2 = this.session, n2 = this.bridge.model, r2 = this.input.pointer;
    if (this.presenter.altHeld = this.input.alt, !t2 || n2.screen !== `game` || this.paused || this.transitioning) {
      this.presenter.hover = null;
      return;
    }
    let i2 = t2.hero, a2 = r2.inside ? this.presenter.pick(r2.x, r2.y) : null;
    if (this.presenter.hover = a2, this.updateTarget(a2), i2.dead || n2.death) return;
    let o2 = this.presenter.groundPoint(r2.x, r2.y, this.ground);
    if (r2.leftPressed && n2.dialog && this.closeDialog(), r2.leftPressed && t2.cursor) {
      t2.dropCursor();
      return;
    }
    let s2 = t2.ch.bar.left, c2 = t2.ch.bar.right;
    if (r2.leftPressed) if (this.holdRepeat = 0, this.input.shift && o2) this.castAt(s2, a2?.kind === `unit` && a2.unit.kind === `monster` ? a2.unit : null, true);
    else if (a2?.kind === `unit`) {
      let e5 = a2.unit;
      e5.kind === `monster` ? this.attackTarget(e5, s2, true) : e5.kind === `npc` ? i2.cmd = { type: `talk`, npc: e5 } : i2.cmd = { type: `move`, x: e5.x, z: e5.z, hold: false }, this.lastHoverTarget = e5;
    } else a2?.kind === `item` ? i2.cmd = { type: `pickup`, itemId: a2.item.id } : a2?.kind === `object` ? i2.cmd = { type: `interact`, objectId: a2.object.id } : o2 && (i2.cmd = { type: `move`, x: this.ground.x, z: this.ground.z, hold: true }, i2.ai.cmdFresh = 1, this.presenter.vfx.handle({ t: `click`, x: this.ground.x, z: this.ground.z, color: `#d8c08a` }));
    else if (r2.leftDown && o2 && this.input.shift) {
      if (this.holdRepeat -= e4, this.holdRepeat <= 0 && !i2.action) {
        this.holdRepeat = 0.12;
        let e5 = a2?.kind === `unit` && a2.unit.kind === `monster` ? a2.unit : null;
        this.castAt(s2, e5, true);
      }
    } else if (r2.leftDown && o2) {
      let t3 = i2.cmd;
      t3?.type === `move` && t3.hold ? (t3.x = this.ground.x, t3.z = this.ground.z) : !t3 && this.lastHoverTarget && !this.lastHoverTarget.dead && this.lastHoverTarget.kind === `monster` ? this.attackTarget(this.lastHoverTarget, s2, true) : !t3 && !i2.action && (this.holdRepeat -= e4, this.holdRepeat <= 0 && (this.holdRepeat = 0.1, i2.cmd = { type: `move`, x: this.ground.x, z: this.ground.z, hold: true }, i2.ai.cmdFresh = 1));
    }
    if (r2.leftReleased && (i2.cmd?.type === `move` && (i2.cmd.hold = false), i2.cmd?.type === `attack` && (i2.cmd.hold = false), this.lastHoverTarget = null), (r2.rightPressed || r2.rightDown && this.rightRepeat <= 0) && (this.rightRepeat = 0.06, o2 && !i2.action)) {
      let e5 = a2?.kind === `unit` && a2.unit.kind === `monster` ? a2.unit : null;
      this.castAt(c2, e5, false);
    }
    r2.rightDown && (this.rightRepeat -= e4);
  }
  attackTarget(e4, t2, n2) {
    let r2 = this.session, i2 = Cf[t2];
    i2.kind === `attack` || i2.kind === `melee` || i2.kind === `leap` ? r2.hero.cmd = { type: `attack`, target: e4, hold: n2, inPlace: false, skill: t2 } : r2.hero.cmd = { type: `cast`, skill: t2, x: e4.x, z: e4.z, target: e4 };
  }
  castAt(e4, t2, n2) {
    let r2 = this.session.hero, i2 = Cf[e4], a2 = t2 ? t2.x : this.ground.x, o2 = t2 ? t2.z : this.ground.z;
    if (i2.kind === `attack` || i2.kind === `melee`) {
      if (t2) {
        r2.cmd = { type: `attack`, target: t2, hold: false, inPlace: n2, skill: e4 };
        return;
      }
      r2.facing = Math.atan2(a2 - r2.x, o2 - r2.z), r2.cmd = { type: `cast`, skill: e4, x: a2, z: o2, target: null };
      return;
    }
    r2.cmd = { type: `cast`, skill: e4, x: a2, z: o2, target: t2 };
  }
  updateTarget(e4) {
    let t2 = this.bridge.model, n2 = null;
    if (e4?.kind === `unit`) {
      let t3 = e4.unit;
      if (t3.kind === `monster`) {
        let e5 = t3.tier;
        n2 = { name: t3.name, nameColor: e5 === `unique` || e5 === `boss` ? `gold` : e5 === `champion` ? `blue` : `white`, subtitle: t3.tier === `unique` || t3.tier === `boss` ? this.session.world.modsText(t3) || (t3.mdef?.undead ? `Undead` : ``) : e5 === `champion` ? `Champion` : e5 === `minion` ? `Minion` : t3.mdef?.undead ? `Undead` : ``, lifeFrac: Math.max(0, t3.life / t3.lifeMax), kind: e5 === `boss` ? `boss` : `monster` };
      } else t3.kind === `npc` ? n2 = { name: t3.name, nameColor: `white`, subtitle: ``, lifeFrac: 1, kind: `npc` } : t3.kind === `ally` && (n2 = { name: t3.name, nameColor: `green`, subtitle: `Ally`, lifeFrac: Math.max(0, t3.life / t3.lifeMax), kind: `ally` });
    } else e4?.kind === `object` && (n2 = { name: jg(e4.object), nameColor: `white`, subtitle: ``, lifeFrac: 1, kind: `object` });
    let r2 = t2.target;
    (r2?.name ?? ``) !== (n2?.name ?? ``) || Math.abs((r2?.lifeFrac ?? 0) - (n2?.lifeFrac ?? 0)) > 4e-3 ? (t2.target = n2, this.bridge.bump(`target`)) : r2 && n2 && (r2.lifeFrac = n2.lifeFrac);
    let i2 = this.session?.world;
    this.bossUnit && (!i2 || i2.boss !== this.bossUnit || !i2.bossEngaged) && (this.bossUnit = null);
    let a2 = this.bossUnit, o2 = !!(a2 && !a2.dead);
    if (o2 !== this.trackerFighting && (this.trackerFighting = o2, this.session?.changed(`tracker`)), a2 && !a2.dead) {
      let e5 = Math.max(0, a2.life / a2.lifeMax);
      (!t2.boss || Math.abs(t2.boss.lifeFrac - e5) > 2e-3 || t2.boss.phase !== a2.bossPhase + 1) && (t2.boss = { name: a2.name, title: `Fallen Sister of the Vigil`, lifeFrac: e5, phase: a2.bossPhase + 1 }, this.bridge.bump(`boss`));
    } else t2.boss && (t2.boss = null, this.bridge.bump(`boss`));
  }
  tick(e4) {
    let t2 = this.session;
    !t2 || this.bridge.model.screen !== `game` || this.paused || this.pausedForShot || this.transitioning || (t2.world.tick(e4), t2.tickHooks(), t2.ch.playTime += e4);
  }
  render(e4, t2) {
    this.frame += 1, this.elapsed += t2, this.pausedForShot || (this.handleKeys(), this.handlePointer(t2)), this.hitstop > 0 && (this.hitstop -= t2, this.loop.timeScale = this.hitstop > 0 ? 0.08 : 1);
    let n2 = this.session;
    if (n2) {
      this.deps.audio.setListener(n2.hero.x, n2.hero.z);
      let e5 = n2.hero, r2 = e5.life / e5.lifeMax < 0.25 && !e5.dead, i2 = this.presenter.pipeline.gradeUniforms;
      i2.uHurt.value = Math.max(r2 ? 0.35 + Math.sin(this.elapsed * 5) * 0.15 : 0, i2.uHurt.value - t2 * 1.5), r2 && !this.paused ? (this.heartT -= t2, this.heartT <= 0 && (this.heartT = 1.05, this.deps.audio.play(`lowLifeWarning`, { volume: 0.7 }))) : this.heartT = 0;
      let a2 = e5.dead || this.bridge.model.death ? 0.85 : 0;
      i2.uDesat.value += (a2 - i2.uDesat.value) * Math.min(1, t2 * 2.5);
      let o2 = e5.action?.kind === `spin` && !e5.dead;
      if (o2 && !this.spinLoop ? this.spinLoop = this.deps.audio.loop(`whirlwindLoop`, { x: e5.x, z: e5.z, volume: 0.8 }) : !o2 && this.spinLoop && (this.spinLoop.stop(0.25), this.spinLoop = null), this.spinLoop?.setPosition(e5.x, e5.z), !e5.dead && !this.transitioning) {
        let t3 = Math.hypot(e5.x - this.stepAt.x, e5.z - this.stepAt.z);
        if (t3 > 6) this.stepAt = { x: e5.x, z: e5.z };
        else if (t3 > (e5.running ? 1.75 : 1.3)) {
          this.stepAt = { x: e5.x, z: e5.z };
          let t4 = n2.world.def.theme;
          this.deps.audio.play(t4 === `town` ? `footstepStone` : t4 === `cave` ? `footstepDirt` : `footstepGrass`, { x: e5.x, z: e5.z, volume: 0.32 });
        }
      }
      this.saveTimer > 0 && (this.saveTimer -= t2, this.saveTimer <= 0 && this.saveNow()), this.periodicSave += t2, this.periodicSave >= 300 && (this.periodicSave = 0, this.saveNow()), this.bridge.syncVitals(), this.automap.update(n2.world, t2, this.bridge.model.screen === `game` && !this.bridge.model.death);
    }
    this.presenter.render(e4, t2, { paused: this.pausedForShot && this.reducedMotion || this.paused }), this.bridge.tickToasts(this.pausedForShot ? 0 : t2), this.uiHandle?.update(t2), this.input.endFrame(), this.publishDiagnostics();
  }
  installHooks() {
    let e4 = /* @__PURE__ */ new Set([`title`, `charSelect`, `charCreate`, `town`, `active-play`, `combat`, `barbarian`, `necromancer`, `dungeon`, `boss`, `inventory`, `skills`, `loot`, `death`, `fields`, `vendor`]);
    window.__THREE_GAME_TEST_HOOKS__ = { seed: (e5) => {
      this.rng.reseed(e5), this.seedOverride = e5 >>> 0;
    }, setState: async (t2) => {
      if (!e4.has(t2)) throw Error(`Unknown test state: ${t2}`);
      return await this.whenReady(), await this.applyTestState(t2), this.render(1, 0.016), { state: t2 };
    }, setPausedForScreenshot: (e5) => {
      this.pausedForShot = e5;
    }, setReducedMotion: (e5) => {
      this.reducedMotion = e5, this.presenter.vfx.reducedMotion = e5, this.applyOptions();
    }, hideDebugUi: () => {
    } };
  }
  async applyTestState(e4) {
    this.pausedForShot = false, this.seedOverride === null && (this.seedOverride = 42);
    let t2 = new Id(this.seedOverride);
    if (e4 === `title` || e4 === `charSelect` || e4 === `charCreate`) {
      this.showTitle(), e4 !== `title` && (this.bridge.model.screen = e4 === `charSelect` && this.bridge.model.characters.length ? `charSelect` : `charCreate`, this.bridge.bump(`screen`));
      return;
    }
    let n2 = e4 === `barbarian` ? `barbarian` : e4 === `necromancer` ? `necromancer` : `sorceress`, r2 = gp(n2 === `sorceress` ? `Ysolde` : n2 === `barbarian` ? `Haldor` : `Mordrin`, n2, false), i2 = e4 === `town` ? 3 : e4 === `boss` ? 14 : 12;
    r2.level = i2, r2.xp = Math.round(af[i2] + (af[Math.min(99, i2 + 1)] - af[i2]) * 0.42), r2.statPoints = 3, r2.skillPoints = 2, r2.base.vit += i2 * 2, r2.base.ene += i2, r2.base.str += i2 * 2, r2.gold = 4210;
    let a2 = { sorceress: [`fireBolt`, `fireBolt`, `fireBolt`, `fireball`, `fireball`, `fireball`, `meteor`, `iceBolt`, `frostNova`, `glacialOrb`, `chargedBolt`, `teleport`], barbarian: [`bash`, `bash`, `leapAttack`, `whirlwind`, `whirlwind`, `weaponMastery`, `weaponMastery`, `ironHide`, `howl`, `warCry`, `rallyingRoar`], necromancer: [`raiseSkeleton`, `raiseSkeleton`, `raiseSkeleton`, `teeth`, `corpseExplosion`, `boneSpear`, `boneSpear`, `amplifyDamage`, `earthGolem`, `skeletalMage`, `terror`] };
    for (let e5 of a2[n2]) r2.skills[e5] = (r2.skills[e5] ?? 0) + 1;
    for (r2.bar.left = n2 === `barbarian` ? `bash` : n2 === `sorceress` ? `fireBolt` : `teeth`, r2.bar.right = n2 === `sorceress` ? `fireball` : n2 === `barbarian` ? `whirlwind` : `boneSpear`, r2.bar.hotkeys = a2[n2].filter((e5, t3, n3) => n3.indexOf(e5) === t3 && Cf[e5].kind !== `passive`).slice(0, 8); r2.bar.hotkeys.length < 8; ) r2.bar.hotkeys.push(null);
    let o2 = { ilvl: i2, mf: 0, tier: 1 }, s2 = [[`head`, `skullCap`], [`body`, n2 === `barbarian` ? `scaleMail` : `studded`], [`gloves`, `heavyGloves`], [`boots`, `heavyBoots`], [`belt`, `lightBelt`], [`amulet`, `amulet`], [`ringLeft`, `ring`]];
    n2 === `barbarian` && s2.push([`mainHand`, `broadSword`], [`offHand`, `kiteShield`]), n2 === `sorceress` && s2.push([`mainHand`, `gnarledStaff`]), n2 === `necromancer` && s2.push([`mainHand`, `boneWand`], [`offHand`, `shrunkenHead`]);
    for (let [e5, n3] of s2) {
      let i3 = ep(t2, o2, { baseId: n3, quality: t2.chance(0.5) ? `rare` : `magic` });
      i3.identified = true, r2.equipment[e5] = i3;
    }
    r2.belt = Array(16).fill(null);
    for (let e5 = 0; e5 < 8; e5 += 1) r2.belt[e5] = $f(e5 % 4 < 2 ? `hp3` : `mp3`, i2);
    let c2 = e4 === `town` || e4 === `vendor` ? `town` : e4 === `dungeon` ? `den` : e4 === `boss` || e4 === `fields` ? `hollowFields` : `mournmoor`, l2 = this.startSession(r2, `normal`, c2, c2 === `town` ? `start` : c2 === `den` ? `fromMoor` : c2 === `hollowFields` ? `waypoint` : `fromTown`);
    for (let e5 = 0; e5 < 6; e5 += 1) l2.inv.autoPlace(ep(t2, o2, {}));
    l2.inv.autoPlace($f(`rune2`, 6)), l2.inv.autoPlace($f(`gem_ruby_flawed`, 8)), l2.changed(`grids`);
    let u2 = l2.world, d2 = l2.hero;
    if (e4 === `boss`) {
      let e5 = u2.layout.regions.gravewatch, t3 = u2.nav.nearestWalkable(e5.x + 3.5, e5.z + 2.5, 4);
      d2.setPos(t3.x, t3.z), u2.boss && (u2.alertPack(u2.boss), u2.bossEngaged = true, this.bossUnit = u2.boss, d2.facing = Math.atan2(u2.boss.x - d2.x, u2.boss.z - d2.z));
    } else if (c2 !== `town`) {
      if (c2 === `den`) {
        let e5 = u2.layout.regions.grotto, t3 = e5 ? u2.nav.findPath(d2.x, d2.z, e5.x, e5.z, 2e4) : null;
        if (t3 && t3.length) {
          let e6 = [{ x: d2.x, z: d2.z }, ...t3], n3 = 0, r4 = null, i4 = -1;
          for (let t4 = 1; t4 < e6.length && n3 <= 20; t4 += 1) {
            let a3 = e6[t4 - 1], o3 = e6[t4], s3 = Math.hypot(o3.x - a3.x, o3.z - a3.z);
            for (let e7 = 0; e7 < s3 && n3 <= 20; e7 += 1, n3 += 1) {
              if (n3 < 8) continue;
              let t5 = a3.x + (o3.x - a3.x) * e7 / s3, c3 = a3.z + (o3.z - a3.z) * e7 / s3, l3 = 0;
              for (let e8 = -4; e8 <= 4; e8 += 1) for (let n4 = -4; n4 <= 4; n4 += 1) u2.nav.walkableAt(t5 + n4, c3 + e8) && (l3 += 1);
              l3 > i4 && (i4 = l3, r4 = { x: t5, z: c3 });
            }
          }
          r4 && d2.setPos(r4.x, r4.z);
        }
      }
      let r3 = c2 === `den` ? [`rotwalker`, `gutterkin`, `gutterkin`, `spinehog`] : c2 === `hollowFields` ? [`bonewretch`, `bonewretch`, `hollowArcher`, `bonewretch`, `rotwalker`] : [`gutterkin`, `gutterkin`, `gutterkin`, `gutterkinShaman`, `rotwalker`], i3 = [];
      if (r3.forEach((e5, t3) => {
        let n3 = t3 / r3.length * Math.PI * 1.2 - 2.2, a3 = u2.nav.nearestWalkable(d2.x + Math.cos(n3) * 5.5, d2.z + Math.sin(n3) * 5.5, 4);
        if (!a3) return;
        let o3 = u2.spawnMonster(e5, a3.x, a3.z, t3 === 0 ? `champion` : `normal`);
        o3.aggro = true, i3.push(o3);
      }), e4 === `loot`) for (let e5 of i3.slice(1)) u2.kill(e5, d2, `fire`);
      if (e4 === `combat`) {
        let e5 = i3[0];
        e5 && (d2.mana = d2.manaMax, d2.facing = Math.atan2(e5.x - d2.x, e5.z - d2.z), d2.cmd = { type: `cast`, skill: `fireball`, x: e5.x, z: e5.z, target: e5 });
      }
      if (n2 === `necromancer`) {
        for (let e5 = 0; e5 < 2; e5 += 1) {
          let t3 = u2.nav.nearestWalkable(d2.x - 1.5 + e5 * 3, d2.z + 1.5, 3) ?? { x: d2.x, z: d2.z }, n3 = u2.spawnMonster(`gutterkin`, t3.x, t3.z, `normal`);
          u2.kill(n3, null, `physical`), n3.deathT = 3;
        }
        for (let [e5, t3, n3] of [[`skeletonWarrior`, 1.2, -1.2], [`skeletonWarrior`, -1.2, 1.2], [`skeletonMage`, -1.1, -1.1]]) {
          let r4 = u2.nav.nearestWalkable(d2.x + t3, d2.z + n3, 3) ?? { x: d2.x + t3, z: d2.z + n3 }, i4 = Km(u2, d2, e5, 3, r4.x, r4.z);
          i4.summonSkill = e5 === `skeletonMage` ? `skeletalMage` : `raiseSkeleton`, u2.addUnit(i4);
        }
      }
      if (e4 === `loot` || e4 === `active-play` || e4 === `inventory` || e4 === `combat`) {
        let e5 = [ep(t2, { ilvl: 10, mf: 0, tier: 3 }, { quality: `unique` }), ep(t2, o2, { quality: `rare` }), ep(t2, o2, { quality: `magic` }), $f(`rune3`, 10), $f(`hp3`, 10)];
        u2.spill(d2.x + 2.5, d2.z + 1.5, e5, 312);
        for (let e6 of u2.items) e6.t = 2;
      }
    }
    if (e4 === `vendor`) {
      let e5 = u2.units.find((e6) => e6.npcKind === `smith`);
      e5 && (d2.setPos(e5.x + 1.5, e5.z + 1.5), l2.openVendor(e5));
    }
    e4 === `inventory` && (this.openPanel(`inventory`), this.openPanel(`character`)), e4 === `skills` && this.openPanel(`skills`), this.settleFrames(6), (e4 === `necromancer` || e4 === `loot`) && this.settleFrames(30, () => {
      d2.life = d2.lifeMax;
    }), e4 === `combat` && this.settleFrames(9, () => {
      d2.life = d2.lifeMax;
    }), e4 === `death` && (d2.life = 0, u2.kill(d2, u2.units.find((e5) => e5.kind === `monster`) ?? null, `physical`), this.settleFrames(25)), this.presenter.cam.snapZoom(1), this.bridge.syncAll();
  }
  settleFrames(e4, t2) {
    let n2 = this.presenter.pipeline, r2 = n2.skipDraw;
    n2.skipDraw = true;
    try {
      for (let n3 = 0; n3 < e4; n3 += 1) t2?.(), this.tick(1 / 25), this.render(1, 1 / 25);
    } finally {
      n2.skipDraw = r2;
    }
  }
  publishDiagnostics() {
    let e4 = this.session, t2 = e4?.hero, n2 = this.presenter.stats(), r2 = this.canvas;
    window.__THREE_GAME_DIAGNOSTICS__ = { frame: this.frame, elapsed: this.elapsed, score: e4?.ch.kills ?? 0, targetScore: 0, complete: e4 ? e4.ch.quests[e4.diff].bloodwitch === `complete` || e4.ch.quests[e4.diff].bloodwitch === `rewardPending` : false, player: { position: { x: t2?.x ?? 0, y: 0, z: t2?.z ?? 0 }, speed: t2?.speed ?? 0 }, renderer: { calls: n2.calls, triangles: n2.triangles, geometries: n2.geometries, textures: n2.textures }, canvas: { clientWidth: r2.clientWidth, clientHeight: r2.clientHeight, width: r2.width, height: r2.height, dpr: this.presenter.pipeline.size.dpr }, game: { screen: this.bridge.model.screen, area: e4?.world.def.id ?? null, level: e4?.ch.level ?? 0, life: t2 ? Math.round(t2.life) : 0, lifeMax: t2?.lifeMax ?? 0, mana: t2 ? Math.round(t2.mana) : 0, xp: e4?.ch.xp ?? 0, gold: e4?.ch.gold ?? 0, kills: e4?.ch.kills ?? 0, enemiesAlive: e4?.world.enemiesAlive ?? 0, units: e4?.world.units.length ?? 0, missiles: e4?.world.missiles.length ?? 0, groundItems: e4?.world.items.length ?? 0, particles: this.presenter.vfx.particles.count, heroDead: t2?.dead ?? false, props: this.presenter.areaStats, quality: this.presenter.pipeline.quality } };
  }
};
function Wg() {
  let e4 = { setPosition() {
  }, setVolume() {
  }, stop() {
  } };
  return { unlocked: false, async unlock() {
  }, async prepare() {
  }, play() {
  }, loop: () => e4, stinger() {
  }, setListener() {
  }, setMusic() {
  }, setAmbience() {
  }, setVolumes() {
  }, duck() {
  }, setPaused() {
  }, dispose() {
  } };
}
var Gg = { mountUI(e4, t2, n2) {
  let r2 = document.createElement(`div`);
  r2.style.cssText = `position:absolute;left:12px;bottom:12px;color:#e8dccb;font:13px Georgia,serif;pointer-events:auto;background:rgba(0,0,0,.55);padding:8px 10px;border:1px solid #6b5a3a`, e4.appendChild(r2);
  let i2 = document.createElement(`button`);
  return i2.textContent = `Play`, i2.style.cssText = `position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);pointer-events:auto;font:20px Georgia;padding:10px 24px`, e4.appendChild(i2), i2.onclick = () => {
    t2.screen === `title` ? n2.titleContinue() : t2.screen === `charSelect` ? t2.characters[0] ? n2.playCharacter(t2.characters[0].id, `normal`) : n2.openCreate() : t2.screen === `charCreate` && n2.createCharacter({ name: `Wanderer`, classId: `sorceress`, hardcore: false });
  }, { update() {
    let e5 = t2.hero;
    i2.style.display = t2.screen === `game` || t2.screen === `loading` ? `none` : `block`, r2.textContent = e5 ? `${t2.area?.name ?? ``} · Lv ${e5.level} · Life ${e5.life}/${e5.lifeMax} · Mana ${e5.mana}/${e5.manaMax} · Gold ${e5.gold}${t2.target ? ` · ${t2.target.name} ${(t2.target.lifeFrac * 100).toFixed(0)}%` : ``}` : t2.screen;
  }, destroy() {
    r2.remove(), i2.remove();
  } };
} };
Ed();
var Kg = class {
  root = new Qr();
  height;
  radius;
  state = `idle`;
  progress = 1;
  body;
  mat;
  t = 0;
  dur = 1;
  flashT = 0;
  sockets = /* @__PURE__ */ new Map();
  constructor(e4, t2, n2) {
    this.height = t2, this.radius = n2, this.mat = new Yo({ color: e4, roughness: 0.7 }), this.body = new xa(new oo(n2, Math.max(0.1, t2 - n2 * 2), 4, 12), this.mat), this.body.position.y = t2 / 2, this.body.castShadow = true, this.root.add(this.body);
    let r2 = new xa(new ao(n2 * 0.5, n2 * 0.5, n2), this.mat);
    r2.position.set(0, t2 * 0.8, n2), this.root.add(r2);
    for (let e5 of [`rightHand`, `leftHand`, `head`, `chest`, `castPoint`, `weaponTip`, `mouth`, `back`, `overhead`]) {
      let r3 = new Zr();
      r3.position.set(0, e5 === `overhead` ? t2 + 0.3 : t2 * 0.7, e5 === `castPoint` ? n2 + 0.3 : 0), this.root.add(r3), this.sockets.set(e5, r3);
    }
  }
  play(e4, t2) {
    this.state = e4, this.t = 0, this.dur = t2?.duration ?? 0.6, this.progress = 0;
  }
  update(e4, t2) {
    this.t += e4;
    let n2 = [`idle`, `townIdle`, `walk`, `run`, `spin`, `channel`].includes(this.state);
    this.progress = n2 ? 1 : Math.min(1, this.t / this.dur);
    let r2 = 0, i2 = this.height / 2;
    (this.state === `walk` || this.state === `run`) && (i2 += Math.abs(Math.sin(t2.time * t2.speed * 1.6)) * 0.06), (this.state === `attack1` || this.state === `attack2` || this.state === `cast`) && (r2 = Math.sin(this.progress * Math.PI) * 0.35), (this.state === `death` || this.state === `dead`) && (r2 = -Math.min(1, this.state === `dead` ? 1 : this.progress) * 1.45), this.state === `resurrect` && (r2 = -(1 - this.progress) * 1.45), this.state === `spin` && (this.body.rotation.y += e4 * 18), this.body.position.y = r2 < -0.5 ? this.radius : i2, this.body.rotation.x = r2, this.flashT > 0 && (this.flashT -= e4, this.mat.emissiveIntensity = Math.max(0, this.flashT / 0.15) * 1.5);
  }
  getSocket(e4) {
    return this.sockets.get(e4) ?? this.root;
  }
  setEquipment(e4) {
  }
  setTint(e4, t2 = 0.5) {
    e4 && this.mat.color.lerp(new P(e4), t2);
  }
  flash(e4 = `#ffffff`) {
    this.mat.emissive.set(e4), this.flashT = 0.15;
  }
  setStatus(e4) {
  }
  setHighlight(e4) {
  }
  setDissolve(e4) {
  }
  setFade(e4) {
    this.root.visible = e4 > 0.05;
  }
  dispose() {
    this.body.geometry.dispose(), this.mat.dispose();
  }
}, qg = { gutterkin: [`#a3241c`, 1, 0.32], gutterkinShaman: [`#c0582a`, 1.15, 0.34], rotwalker: [`#5c6b45`, 1.9, 0.42], spinehog: [`#6b5a44`, 0.8, 0.38], bonewretch: [`#d8ccb0`, 1.9, 0.38], hollowArcher: [`#3e3a4a`, 1.8, 0.36], bloodwitch: [`#8a1020`, 2, 0.42], weepingQueen: [`#4a2050`, 4.5, 1.1] }, Jg = { async prepareModels() {
}, createHero(e4) {
  return new Kg(e4 === `sorceress` ? `#3550c0` : e4 === `barbarian` ? `#9a7040` : `#2a3a34`, 1.85, 0.38);
}, createMonster(e4) {
  let [t2, n2, r2] = qg[e4];
  return new Kg(t2, n2, r2);
}, createAlly(e4) {
  return new Kg(e4 === `earthGolem` ? `#8a6a44` : `#d8e8e0`, e4 === `earthGolem` ? 2.4 : 1.85, e4 === `earthGolem` ? 0.6 : 0.36);
}, createNpc(e4) {
  return new Kg(`#8a7a60`, 1.8, 0.36);
}, createItemModel(e4) {
  let t2 = new xa(new ao(0.5, 0.1, 0.3), new Yo({ color: `#b0a080`, metalness: 0.4, roughness: 0.5 })), n2 = new Qr();
  return n2.add(t2), n2;
}, getItemIcon(e4, t2, n2, r2 = 48) {
  let i2 = document.createElement(`canvas`);
  i2.width = t2 * r2, i2.height = n2 * r2;
  let a2 = i2.getContext(`2d`);
  return a2 && (a2.fillStyle = `#8a7a5a`, a2.fillRect(6, 6, i2.width - 12, i2.height - 12)), i2.toDataURL();
} }, Yg = class {
  root = new Qr();
  height = 1;
  pickRadius = 0.8;
  fx = { fire: [], glow: [] };
  constructor(e4) {
    let t2 = e4 === `waypoint` ? `#3a5a8a` : e4 === `portal` ? `#2a6aff` : e4 === `campfire` ? `#6a3a1a` : `#6a5a40`, n2 = e4 === `waypoint` ? new co(2, 2.2, 0.3, 24) : e4 === `portal` ? new Uo(0.8, 0.12, 8, 24) : new ao(0.9, 0.7, 0.6), r2 = new xa(n2, new Yo({ color: t2, emissive: e4 === `portal` ? `#2050ff` : `#000000`, emissiveIntensity: 2 }));
    r2.position.y = e4 === `portal` ? 1.2 : 0.35, r2.castShadow = true, this.root.add(r2), e4 === `campfire` && this.fx.fire.push(new N(0, 0.3, 0));
  }
  setState() {
  }
  update() {
  }
  dispose() {
  }
};
function Xg() {
  let e4 = new Yo({ color: `#7a7060`, roughness: 0.9 }), t2 = /* @__PURE__ */ new Map();
  return { geometry(e5, n2) {
    let r2 = `${e5}${n2}`, i2 = t2.get(r2);
    return i2 || (i2 = [`deadTree`, `gnarledTree`, `palisade`, `standingStone`, `ruinPillar`, `torchPost`, `banner`, `totem`, `statue`].includes(e5) ? new co(0.2, 0.35, 3.5, 6).translate(0, 1.75, 0) : new fo(0.6).translate(0, 0.4, 0), t2.set(r2, i2)), i2;
  }, material: () => e4, castsShadow: () => true, update() {
  }, object: (e5) => new Yg(e5), caveWalls(t3) {
    let n2 = [], r2 = t3.wallHeight;
    if (!r2) return n2;
    let i2 = new ao(1, 1, 1), a2 = 0;
    for (let e5 = 0; e5 < r2.length; e5 += 1) r2[e5] > 0 && (a2 += 1);
    let o2 = new Ga(i2, e4, a2), s2 = 0, c2 = new wr();
    for (let e5 = 0; e5 < r2.length; e5 += 1) {
      if (r2[e5] <= 0) continue;
      let n3 = e5 % t3.w + 0.5, i3 = Math.floor(e5 / t3.w) + 0.5;
      c2.compose(new N(n3, r2[e5] / 2, i3), new ir(), new N(1, r2[e5], 1)), o2.setMatrixAt(s2++, c2);
    }
    return o2.castShadow = true, n2.push(o2), n2;
  } };
}

# 05a — Cloth, long garments and hanging accessories: industry, engines and tools

Research note for the ASHLAR rigging skill (Blender 5.2 → glTF 2.0 → three.js).
Runtime: LBS, ≤ 4 influences per vertex, no constraints/physics in the file, clips are baked bone keys.
Does not repeat `04_cloth_long_accessories.md` except where a claim there is corrected (see §0).
Academic papers are out of scope (another agent covers them).

Tags used on every claim: **official doc** · **talk** (GDC/CEDEC/SIGGRAPH talk, or its listing/abstract) ·
**interview** (developer interview or press write-up of one) · **practitioner** (credited rigger/tech-artist blog or breakdown) · **forum** (community post).
Where a source was only seen as a search snippet, the claim says so.

---

## 0. Research limits and corrections to note 04

- **Correction (licence of three-vrm spring bones):** note 04 left this "unconfirmed". It is now confirmed MIT:
  - `packages/three-vrm-springbone/package.json` → `"license": "MIT"`, `"files"` includes `LICENSE` (**official repo**, read via raw GitHub, 2026-10-23): https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm-springbone/package.json
  - Root `LICENSE`: "Copyright (c) 2019-2026 pixiv Inc. MIT License" (**official repo**): https://github.com/pixiv/three-vrm/blob/dev/LICENSE
  - The package-level `LICENSE` file itself returned 404 at the path I guessed; the root LICENSE and `package.json` are the evidence used here.
- **Not verified:** whether `@pixiv/three-vrm-springbone` runs on an arbitrary glTF skeleton. Still needs a test. Not searched further in this pass.
- **Searches that found nothing usable for the specific titles:** Ghost of Tsushima (bone-based hair/cloth), Horizon Forbidden West (cloth/hair), Diablo Immortal (any rig or cape detail), HoYoverse/Genshin CEDEC talks, Monster Hunter, FFXIV, Blue Protocol, Lost Ark, Black Desert, Apex, Fortnite, Riot/LoL, Overwatch, FromSoftware, Ubisoft/AC, NieR. Details in §1.
- **Not found:** Unity Dynamic Bone and UniVRM SpringBone licence texts (not fetched in this pass; gap).
- **Not found:** any published skirt chain count, bone-per-chain number, or leg-driver clamp from a shipped game, studio talk, or credited rigger. Our draft numbers for these remain unsourced (see §8).
- **Our search tool returned mostly forum, store and blog pages.** Where a claim rests on a secondary write-up of a talk, the tag says so.

---

## 1. Shipped games and studio talks

Each entry: baked vs runtime; bone counts; collision; LOD of cloth bones.

### 1a. Found

- **Final Fantasy XV (Square Enix, SIGGRAPH Asia 2015 talk; secondary write-up).** Team used a traditional bone structure for stiff materials (hair, leather) because vertex-based cloth handled them poorly; the bone rig lets artists set constraints on bone animation so physics and hand animation can mix.
  - Baked vs runtime: runtime simulation on bones, with artist constraints.
  - Bone counts: not given.
  - Collision: not given.
  - Source: https://www.dualshockers.com/final-fantasy-xv-dev-explains-how-the-games-hair-defies-physics-and-artists-can-draw-the-wind/ (**interview**, secondary) and the SIGGRAPH Asia 2015 talk it summarises (**talk**, not fetched).
- **Final Fantasy XVI (Square Enix, CEDEC 2023 talk, Higashikawa & Kawasaki).** Riggers check silhouettes so clothed characters clip correctly against the environment; standard skeletons for NPCs allow animation reuse; main characters get unique bone structures.
  - Bone counts, cloth-bone approach, collision: not in the snippet. The full talk is in Japanese in Famitsu/GameBusiness; not read in this pass.
  - Source: https://www.siliconera.com/cedec-2023-final-fantasy-xvi-presentation-detailed-rigging-process/ (**talk** summary, **interview**-level). Japanese write-up: https://www.famitsu.com/news/202308/26314473.html (**talk**, not read).
- **Destiny (Bungie, GDC 2015 talk "Character Cloth and Hair Tools in Bungie's Destiny", Sanocki & Burke).** Custom Maya tools for building cloth and hair with real-time in-game preview. Slides and recording not found; no bone counts seen.
  - Source: GDC listing via https://planetdestiny.pcinvasion.com/?p=3105 (**talk** listing, secondary) and https://nl.linkedin.com/in/natbird (speaker profile, not a source for facts).
  - Cape and coat-tail cloth in Destiny was **Havok Cloth** (runtime), per a 2014 press release reported at https://www.mcvuk.com/development-news/destiny-powered-by-havok-physics/ (**interview**, press). Baked vs runtime: runtime cloth. Bone counts: not given.
- **Warframe (Digital Extremes, official Steam Workshop guide "Creating a Syandana").** Syandanas (back cape-like cosmetics) must "move plausibly". The guide advises against complex weight changes that are hard to communicate; "a large metal panel mid-way down a cloth chain transitioning back to cloth is difficult to simulate and it won't likely read well."
  - Source: https://www.warframe.com/steamworkshop/creating-a-syandana (**official doc**).
  - This is the only official source found on cape/chain construction; it gives a rule, not a number.
  - A forum poster says most syandanas are bone chains, not cloth simulation, and that cloth sim struggles on thick meshes; another says DE runs cloth internally (https://steamcommunity.com/workshop/filedetails/discussion/888942789/135512625255754498?l=dutch and https://forums.warframe.com/topic/944832-should-tennogen-creators-be-allowed-to-use-prime-models-deluxe-skins-and-even-make-changes-to-existing-wf-mesh-for-their-work/?page=2; **forum**, unverified).
- **Ghost of Tsushima (Sucker Punch, GDC 2021 "Blowing from the West", Bill Rockenbeck).** GPU cloth for clothing and banners, collision and layering; thousands of cloth pieces.
  - Baked vs runtime: runtime GPU cloth. Bone counts: none. Hair: not covered in the talk overview.
  - Source: https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating (**talk**, overview only; members-gated).
- **Horizon Forbidden West (Guerrilla).** No hair/cloth talk found in the GDC 2022/2023 lineup searched. "Evolving the Horizon Series" (GDC 2022) covers animation systems; its full content was not read.
  - Source: https://www.gamedeveloper.com/gdc2023/the-best-art-and-animation-talks-of-gdc (**talk** listing). Clothing-vs-animation interference was discussed in an interview (https://www.nme.com/news/aloys-hug-in-horizon-forbidden-west-burning-shores-is-a-technical-marvel-3442279; **interview**): animation was adjusted so limbs do not intersect the cloth.
- **Polycount developer (MMO, not named):** ran cloth offline, looped it, and constrained skeleton bones to the baked result to avoid runtime PhysX cost.
  - Source: https://polycount.com/discussion/comment/1418462 (**forum**). Same as note 04.
- **Film-side forum (Polycount):** game skirts are often driven by a hidden simulated mesh, with the visible mesh skinned to those bones; exporters bake only bone motion, so the sim itself does not carry into the engine.
  - Source: https://polycount.com/discussion/comment/1415513 (**forum**).
- **Blender Artists (skirt rigging threads, used in note 04):** problems with summed leg drivers and legs crossing; a Limit Distance tutorial approach anchors the bottom skirt bone to the leg.
  - Source: https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573 (**forum**).

### 1b. Not found (searched, nothing usable)

- Ghost of Tsushima bone-based hair: not found.
- Horizon Forbidden West hair/cloth bones: not found.
- Diablo Immortal (any cape, hair or rig detail, dev or artist): not found. Search returned only academic secondary-motion papers.
- HoYoverse / Genshin / Honkai Star Rail CEDEC talks on cloth or hair bones: not found. Search returned only Polycount and FFXV items.
- Monster Hunter, FFXIV (only a forum speculation that YoshiP mentioned more bones over time: https://forum.square-enix.com/ffxiv/showthread.php?p=6376300, **forum**), Blue Protocol, NieR, Riot/LoL, Overwatch, Apex, Fortnite, Assassin's Creed, Elden Ring, Lost Ark, Black Desert: not found.
- Street Fighter 6 (CEDEC 2024): cloth as Havok Cloth + RE Engine "Chain" feature (https://cgworld.jp/article/202410-cedec03-sf6.html; **talk** summary). Only CEDEC cloth-related item found; not the target genre, but it names a shipped chain-based feature.

---

## 2. Engine features and plugins

### 2a. Unreal Engine — AnimDynamics (built-in)

- Official doc: https://docs.unrealengine.com/4.26/API/Runtime/AnimGraphRuntime/BoneControllers/FAnimNode_AnimDynamics/index.html and https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/AnimNode_AnimDynamics.html (**official doc**).
- Facts from the reference: `bChain` makes the node simulate a connected chain with the solver; the node simulates its own physics bodies, using approximated boxes for inertia rather than the character's physics asset.
- Parameters: linear and angular spring constants (stiffness); linear and angular damping overrides (angular damping default **0.7**, values below 0.7 have no effect in the 4.26 reference); gravity scale and gravity override; angular bias ("twist reduction for chain forces").
- Chain length is **not** a named property in the reference; it follows the bones included in the chain.
- Licence: built-in (Epic EULA).
- Collision: the node's own boxes; not the body's collision.
- LOD of cloth bones: not documented.
- Source for the 0.7 default: the 4.26 C++ reference (official doc).

### 2b. Unreal Engine — Kawaii Physics (third-party)

- **Licence (read from `LICENSE` in the repo via GitHub API, 2026-10-23):** "MIT License — Copyright (c) 2019-2026 pafuhana1213". README badge also says MIT. Source: https://github.com/pafuhana1213/KawaiiPhysics/blob/master/LICENSE (**official repo**).
- Engine support: UE 5.3–5.8 (per README badge).
- Official docs: https://pafuhana1213.github.io/KawaiiPhysics-Portal/en/docs (**official doc**); parameter page: https://pafuhana1213.github.io/KawaiiPhysics-Portal/en/docs/parameters/physics.
- **Features relevant to our leg problem (README feature list, **official doc**):**
  - `BoneConstraint`: "Constrain the distance between bones to keep skirts from clipping through the legs."
  - `SyncBone`: "Sync animation-driven bones (e.g. legs) into the simulation so cloth follows the body and avoids penetration."
  - Collision: sphere, capsule, tapered capsule, box, plane; limits data asset; physics asset; world collision.
  - Keeps bone lengths fixed.
  - Source: https://github.com/pafuhana1213/KawaiiPhysics/blob/master/README.md (**official repo**).
- **Parameter defaults (from the `FKawaiiPhysicsSettings` struct in the parameter reference, **official doc**):**
  - `Damping` = **0.1** ("smaller values reflect more acceleration, so it sways more")
  - `Stiffness` = **0.05** ("higher values maintain the original shape more strongly")
  - `WorldDampingLocation` = **0.8**, `WorldDampingRotation` = **0.8** (note: "actual reflection factor = 1 − value"; higher = less sway)
  - `Radius` = **3.0** (collision radius per bone, UE units = cm)
  - `LimitAngle` = **0.0** (0 = no limit in the struct default)
  - Source: https://pafuhana1213.github.io/KawaiiPhysics-Portal/en/docs/parameters/physics (**official doc**).
- Known issues from a developer: Chaos Cloth + Kawaii Physics collision trouble on a red skirt and cape cloths; they used a different physics asset for each to stop overlap (reported in a search snippet from a student project; the thread URL was not kept, so treat as **forum**, unverified).
- Note: the README says packaging a Blueprint-only project can error; convert to C++.

### 2c. Unreal Engine — Chaos Cloth

- No official parameter values for skirts or capes were found.
- A solo developer's cape (Arbennian, UE5) used Chaos Physics; they spent roughly 3 months on a custom system to avoid artifacts (https://giuliomarronedittli.artstation.com/projects/DAGOJ0; **practitioner**).
- An UE 5.8 forum thread on a floor-length robe with long sleeves reports the robe runs but "doesn't behave like cloth" and asks whether a sim-cage is the right structure (https://forums.unrealengine.com/t/ue5-8-chaos-cloth-on-a-floor-length-robe-with-long-sleeves-am-i-going-about-this-the-right-way/2736226; **forum**).
- Style3D (a garment-software vendor) says Chaos Cloth lags on multi-layer garments; vendor claim, not verified (https://www.style3d.com/blog/?p=16703; **practitioner**, vendor).

### 2d. Unreal Engine — Spring Controller, Physics Control

- Not searched in this pass. Gap.

### 2e. Unity — Dynamic Bone, UniVRM / Unity-chan SpringBone, Magica Cloth 2

- **Dynamic Bone:** licence not found in this pass. Gap.
- **UniVRM SpringBone:** not searched in this pass. Gap.
- **Magica Cloth 2 (MagicaSoft):**
  - Two modes: **BoneCloth** (driven by Transform bones) and **MeshCloth** (driven by mesh vertices). Source: its Readme in a mirror repo, https://kindnick-git.duckdns.org/kindnick/Streamingle_URP/media/branch/main/Assets/External/MagicaCloth2/Readme.txt (**official** text, but via a mirror; use the MagicaSoft store/manual as primary).
  - Unity 2021.3.16+; needs Burst, Collections, Mathematics (same Readme).
  - Scale: the physics engine treats 1.0 Unity unit as 1 m; forum advice is to size characters about 1.0–2.0 units before setup (**forum**; Unity discussion thread https://discussions.unity.com/t/released-magica-cloth/773425?page=37).
  - Collision: edge collision, backstop and self-collision listed on store page (vendor, **official** listing); older forum reply says no self-collision (outdated, pre-v2).
  - Licence: no licence text found in the Readme. Third-party listings at $12 are resellers. Check MagicaSoft store terms before shipping.
  - Parameter values for skirts: not found.

### 2f. Godot 4.x — SpringBoneSimulator3D

- Official class reference, Godot 4.5: https://docs.godotengine.org/en/4.5/classes/class_springbonesimulator3d.html (**official doc**).
- Class is a `SkeletonModifier3D` intended for "hair, cloth, and tails".
- Per-joint settings: `set_joint_stiffness()`, `set_joint_drag()`, `set_joint_gravity()`; `get_drag_damping_curve()`, `get_gravity_damping_curve()`, `get_gravity_direction()`.
- Shared settings can be driven by a `Curve` across all joints; `set_individual_config(true)` enables per-joint values.
- A constant external force can be set; the docs describe it as equal to the result when the parent Skeleton3D moves in the opposite direction (wind, anti-gravity).
- **Numeric defaults and typical values:** not found in the reference text read. Gap.
- Licence: Godot is MIT (engine docs).

### 2g. three.js — `@pixiv/three-vrm` spring bones

- Package: `@pixiv/three-vrm-springbone` **3.5.5**, `"license": "MIT"`, `"description": "Spring bone module for @pixiv/three-vrm"` (**official repo**): https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm-springbone/package.json
- Root licence: "Copyright (c) 2019-2026 pixiv Inc. MIT License" (**official repo**): https://github.com/pixiv/three-vrm/blob/dev/LICENSE
- Works on a plain glTF skeleton: **not verified**. The package is described as a module of three-vrm, which is built around VRM. Needs a test.
- Spring bone spec defaults: the VRMC_springBone spec has no default values (per note 04).
- Typical values from VRM-tool defaults (community, see below).

### 2h. Typical parameter values (cross-engine, for skirts, capes, hair)

| Source | Type | Stiffness | Damping / drag | Gravity | Collider / hit radius | Notes |
|---|---|---|---|---|---|---|
| Kawaii Physics struct default (UE) | official doc | 0.05 | Damping 0.1 (lower = more sway) | — (world damping 0.8) | Radius 3.0 (cm) | https://pafuhana1213.github.io/KawaiiPhysics-Portal/en/docs/parameters/physics |
| VgoSpringBone (Unity VRM tool) defaults | forum/practitioner (repo README) | 1.0 | drag 0.2 | gravity power 0.2, dir (0,−1,0) | hitRadius 0.02 | https://github.com/izayoijiichan/vgospringbone (cited via search snippet) |
| VRMMetalKit guidance | practitioner blog | — | — | clothing 1.0–1.5; light hair 0.3–0.5; normal hair 0.7–1.0 | — | https://mtools.sasshoes.com/blog/vrmmetalkit-master-per-joint-gravity |
| UE AnimDynamics (4.26 ref.) | official doc | linear/angular spring constants (no default read) | angular damping default 0.7 | gravity scale/override | — | https://docs.unrealengine.com/4.26/API/Runtime/AnimGraphRuntime/BoneControllers/FAnimNode_AnimDynamics/index.html |
| VRoid Studio skirt defaults | — | not found | not found | not found | not found | Official VRoid docs not reached in search. Gap. |

Note: the values are not in the same units or meaning across tools (Kawaii damping "lower sways more"; VRM drag "higher = duller"; UE angular damping ≥ 0.7). Do not copy numbers between engines.

---

## 3. DCC rigging tools and their skirt or cape features

- **Auto-Rig Pro (kilt/skirt module):**
  - No official leg-collision doc found. Searches returned forum posts only.
  - A user reports the kilt's collision sliders disappear when the ARP armature is merged into a custom armature. ARP developer: keep the ARP armature as the main armature and add custom bones to it.
  - Source: https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573 and https://blenderartists.org/t/auto-rig-pro-3-72/672834?page=56 (**forum**, developer reply).
  - Chain counts: not found.
- **Rigify:** no skirt/cape module found in this pass. Gap.
- **mGear:**
  - Mgear 5.0 introduces a `shifter_component_spring` (simulates basic spring behaviour). Source: https://digitalproduction.com/2025/05/20/rig-it-like-its-free-mgear-5-0-and-uegear-1-0/ (**practitioner/press**).
  - Older mGear 4 "post spring" tool: creates spring dynamics on top of an FK chain, chain aligned to X axis, parameter `dist` = distance of the position spring. Source: https://mgear4.readthedocs.io/en/latest/mgear/mgear.rigbits.postSpring.html (**official doc**).
  - The name `chain_spring` was not found. Chain counts: not found.
  - An 80.lv skirt rig (multilayer, Maya mGear) uses `chain_IK_spline_variable_FK_01`, not a spring component. https://80.lv/articles/check-out-a-multilayered-3d-skirt-rig-made-with-maya-mgear (**practitioner**).
- **AdvancedSkeleton:** not searched in this pass. Gap.
- **Cascadeur AutoPhysics:**
  - A beginner tutorial (Cascadeur 2025.1+) covers AutoPhysics filters and sliders, with a secondary-motion section. No skirt- or cape-specific detail found.
  - Source: https://cascadeur.com/tutor/physicspipeline2025 (**official doc** / tutorial index).
  - Baked: yes (Cascadeur outputs keys). Bone counts, collision: not found.
- **Maya nHair / make dynamic:** not searched in this pass. Gap.
- **3ds Max / CAT:** not searched in this pass. Gap.
- **Wiggle 2 (shteeve3d; RTX fork v2.2.5):**
  - Official Blender extensions listing: https://extensions.blender.org/add-ons/wiggle-2/ (**official store**). Licence and Blender 5 status: see note 04 §3b (not re-checked here).
  - Features per the GitHub README: rope/chain wiggle, pinning, collision with a mesh or collection. Source: https://github.com/shteeve3d/blender-wiggle-2 (**official repo**).
  - Tutorials: limited, tails-focused, per a community post. Skirt tutorial not confirmed.
- **Easy Ring Bone (Blender, paid):** generates 3–256 vertical bone chains around rings, with 1–32 bones per chain, naming like `Skirt_01_01`. These are tool limits, not recommendations. Source: https://superhivemarket.com/products/easy-ring-bone-onion365 (**store**).
- **BoneBrush 2.0 (paid):** spring-driven bone chains for hair and skirts; no mesh collision, self-collision or cloth. Source: https://superhivemarket.com/products/bonebrush-creature-rigger-tool/faq (**store**).
- **SPCRJointDynamics (Unity; UE4 version on GitHub):** mass-spring-damper, appearance-focused, needs a basic bone setup. Source: https://github.com/SPARK-inc/SPCRJointDynamicsUE4 (**official repo**; licence not read).

---

## 4. Practitioner rules from credited riggers or tech-art blogs

- **Joint-based cape rig for engine export (practitioner):** one artist ran dynamics through the joints, not the mesh, because joint rigs survive engine export; three joint chains, NURBS curves on each chain, one IK spline handle per chain. Source: https://chikarahonda.artstation.com/blog/62D9/making-dynamic-capes (**practitioner**; page not readable in this pass, snippet only).
- **Skirt built from six bones, inner and outer layers, locators with aligned axes:** student blog. Source: https://3danimationcrystal.myblog.arts.ac.uk/?p=3363 (**practitioner**, student; snippet only).
- **Limit Distance from leg to the bottom skirt bone:** forum tutorial approach; a looping skirt around the body needs extra handling. Source: https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573 (**forum**).
- **Weight rule (Warframe official):** avoid complex weight changes that are hard to communicate; do not put a rigid panel mid-way down a cloth chain. Source: https://www.warframe.com/steamworkshop/creating-a-syandana (**official doc**).
- **Chain layout and counts:** no credited rigger gave a radial chain count. Not found.
- **Bones per cape or hair strand:** only the 3-chain cape above and the 6-bone skirt. Not found as a general rule.
- **Leg collision tricks:** Kawaii Physics `BoneConstraint` (distance constraint between bones) and `SyncBone` (animated leg bones enter the sim) — the closest shipped-plugin approach (**official doc**, see §2b). Also SyncBone is a runtime feature, not a bake.
- **Avoiding tearing between chains:** not found. Kawaii's `Keeps bone lengths fixed` (**official doc**) is the closest runtime rule.
- **Weighting slit skirts and coat tails:** not found.
- **LBS 4-influence workarounds:** not found from a shipped game. Unity's limit is official (note 04: QualitySettings.skinWeights, One/Two/Four Bones or Auto; more than 4 needs GPU compute skinning or CPU fallback; https://docs.unity3d.com/2023.2/Documentation/ScriptReference/QualitySettings-skinWeights.html, **official**).

---

## 5. Bone budgets per character

No current console or PC cloth/hair bone budget was found. Figures found:

| Figure | Source | Tag | Notes |
|---|---|---|---|
| 15–60 bones typical desktop; ~30 for good quality on desktop and mobile; keep under 30 on mobile | Unity legacy manual (v4.6 / 2018 mirrors): https://docs.unity3d.com/460/Documentation/Manual/ModelingOptimizedCharacters.html | **official doc** (legacy, ~2011–2018) | Old. Does not separate cloth/hair. |
| ~100–120 bones on one on-screen character working on iOS | https://www.tech-artists.org/t/next-gen-console-bone-limits/3949 | **forum** | Secondhand; not every bone weights. |
| iOS limit ~32 bones per rig | forum mention in search snippet | **forum** | Unverified; conflicts with the 100–120 report. |
| Ryse ~770 bones per character at full LOD (faces 260) | same tech-artists thread | **forum** | Uncited; treat as unverified. |
| 60–70 weighted bones for a full character | https://opengameart.org/comment/2308 | **forum** | 2010-era community suggestion. |
| Bone counts for Diablo IV, PoE2, Genshin, FFXIV, Monster Hunter, Destiny, Warframe | — | — | Not found. |
| Cloth/hair bone share of total | — | — | Not found. |

Conclusion: no current primary number for total bones on console/PC/mobile, and no split between body, cloth and hair. Our draft's ≤ 30 mobile total and ≤ 15 % accessory share are consistent with the only official figure but have no source for the 15 % share.

---

## 6. Licences as they appear in the LICENSE file

| Project | Licence (as in LICENSE/package.json) | Where | Tag |
|---|---|---|---|
| `@pixiv/three-vrm-springbone` 3.5.5 | `"license": "MIT"` | package.json, https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm-springbone/package.json | **official repo** |
| `@pixiv/three-vrm` (root) | "MIT License — Copyright (c) 2019-2026 pixiv Inc." | https://github.com/pixiv/three-vrm/blob/dev/LICENSE | **official repo** |
| Kawaii Physics (UE plugin) | "MIT License — Copyright (c) 2019-2026 pafuhana1213" | https://github.com/pafuhana1213/KawaiiPhysics/blob/master/LICENSE | **official repo** |
| Magica Cloth 2 | no licence text found in the Readme (uses Unity-chan sample; credit line) | Readme mirror | — |
| Wiggle 2 RTX / Wiggle Bones | GPL-3.0-or-later per store listing (note 04); not re-checked here | extensions.blender.org | **official store** |
| Dynamic Bone, UniVRM SpringBone, SPCRJointDynamics | not checked | — | gap |

Rule: a licence in a README badge is not enough; use the LICENSE file or package.json field. Kawaii Physics README and LICENSE agree (MIT).

---

## 7. Gaps and what would settle them

1. GDC Vault / CEDEC archives for Ghost, Horizon, Diablo Immortal, HoYoverse, Monster Hunter, FFXIV: members-gated; needs slide decks or a fetchable transcript.
2. Epic AnimDynamics: the 5.x editor page and `AnimNode_AnimDynamics.h` for chain length and gravity defaults.
3. VRoid Studio: official skirt defaults (open the file in VRoid Studio and read the physics panel, or the VRoid Hub docs).
4. Kawaii Physics portal: `/docs/parameters` for the other struct values (chain/limit values, BoneConstraint distances).
5. Godot 4.5 SpringBoneSimulator3D: property defaults (the reference text read here did not show them).
6. three-vrm-springbone on a non-VRM glTF: a test in our viewer.
7. Dynamic Bone / UniVRM / Magica Cloth 2 licences from their stores.
8. Diablo Immortal: contact with an artist or GDC/Blizzard/NetEase talk titles.

---

## 8. Implications for our rules

Our draft (from the task brief) compared with the evidence above. Each rule is confirmed, changed or added. Where the evidence is absent, the rule stays as our assumption.

1. **Radial skirt chains 4/6/8 by length.** *Unsourced, keep as a starting guess.* No shipped source or credited rigger gives chain counts. The student blog uses six bones per skirt (**practitioner**), which supports 4–6 for a skirt, not 8. Easy Ring Bone's range (3–256 chains) is a tool limit, not a rule (**store**). *Change:* make 8 conditional on a floor-length, multi-layer skirt; default 4 (front/back/sides) plus 2 for a full robe. Keep this as our assumption until tested.
2. **1–6 bones per chain at about 0.09 × character height per bone.** *Unsourced.* No source gives a bone length rule. Kawaii Physics keeps bone lengths fixed and uses per-bone collision radius 3.0 cm (UE units) (**official doc**), which implies bone length is a free choice, not a height ratio. *Change:* drop the 0.09 × height formula; set bone length from the garment's visible segment (equal length along a chain, as in note 04) and check the number of bones against the bone budget in §5.
3. **Leg-push driver: front chains react to hip flexion, back to extension, sides to abduction, clamped at 60°.** *Not confirmed by any shipped source.* Forum drivers that sum thigh rotations failed by stacking (note 04, Blender Artists threads, **forum**). Kawaii Physics solves the same problem with runtime distance constraints (`BoneConstraint`) and animated-leg collision (`SyncBone`), not with a driver (**official doc**). *Change:* prefer a collision/distance-constraint approach in the sim (bake it) over a hand-written driver; keep the driver only as a cheap pre-bake, and drop the "front/back/sides" split unless the sim test needs it. The 60° clamp is unsourced.
4. **No thigh weights on hanging cloth.** *Consistent with forum practice* (weights on the hips/root and bake motion; Polycount hidden-sim approach, **forum**). No shipped source states it directly. *Keep.* Add: the Warframe guide advises against complex weight changes that are hard to communicate (**official doc**) — keep weights simple and monotone along a chain.
5. **Secondary motion baked to bones in the animation step, or runtime spring bones.** *Confirmed as both options exist.* Baking: Polycount developer bakes to bones for an MMO (**forum**); FFXV uses bone structures with constraints so artists can mix physics and keys (**interview**). Runtime: VRMC_springBone (MIT package, **official repo**), Godot SpringBoneSimulator3D (**official doc**), Kawaii Physics (MIT, **official doc**). *Add:* the three.js runtime path is MIT-licensed and can be used; whether it runs on a plain glTF skeleton is still a test (§0). Our default stays bake-first, because the glTF output has no runtime spring unless we ship one.
6. **Parameters (new, from evidence).** Use the table in §2h as a range, not as presets: Kawaii default damping 0.1, stiffness 0.05 (**official doc**); VRM tool defaults stiffness 1.0, drag 0.2, gravity 0.2, hit radius 0.02 m (**forum**); VRMMetalKit clothing gravity 1.0–1.5 (**practitioner**). These are in different units and mean different things. *Add:* do not copy numbers across engines; calibrate on our rig with the QA poses in note 04 §6.
7. **Bone budget.** *Partly confirmed.* Unity's legacy ~30 for mobile (**official doc**, old) matches our ≤ 30 mobile total. The 100–120 iOS figure (**forum**) gives a ceiling. *Change:* the 15 % accessory share is unsourced; keep as an internal target only.
8. **Layered robes and capes (note 04 §5).** Not checked further here. The Unreal cape case (~3 months custom work, **practitioner**) and the Kawaii + Chaos collision trouble (**forum**) both point to separating layers by physics asset or collider, which matches note 04.
9. **Add: Warframe weight/layout rule** (official, see §4): no rigid panel mid-chain. Add to our rules: a chain must be one material and one weight behaviour; split a chain at a material change.
10. **Add: Kawaii `BoneConstraint` and `SyncBone` as the reference for leg collision** (official doc). Our rule 3 should cite these as the closest shipped approach.
11. **Add: licence rule.** Confirmed MIT for three-vrm spring bones and Kawaii Physics, from their LICENSE/package.json (**official repo**). Dynamic Bone, UniVRM and Magica Cloth 2 licences are unchecked and must not be copied from.

Net result: most of the draft numbers are not supported by any shipped source. The only numbers with support are the ≤ 30 mobile bone total (Unity legacy) and the 4-influence limit (Unity official). The leg-driver approach has no shipped precedent; a collision/distance-constraint approach does (Kawaii).

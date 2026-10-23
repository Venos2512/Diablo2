# 05b — Cloth papers, open-source libraries and Blender tooling for LBS garment rigs

Research sub-agent note, 2026-10-23. Follows `04_cloth_long_accessories.md` and does not repeat it
(VRMC_springBone fields, three-vrm, Unity/Warp/SoftMax talks, Polycount bake forum, add-on table
for Spring Bones / SpringFX / Pegaso, and the 04 recommendation list are not restated here).

Runtime context is unchanged: glTF 2.0, three.js, LBS with ≤ 4 influences per vertex, no
constraints or physics in the file, clips baked to bone keys.

**Tags:** `paper` (peer-reviewed or arXiv), `code` (repository, with the licence as stated on the
page), `official` (vendor or project doc), `talk` (talk or abstract), `forum` (community post),
`store` (add-on listing), `snippet` (only seen in a search-result excerpt, not opened),
`none` (searched, nothing usable found).

**Research limits (read first)**
- Many pages were only read as search excerpts or as fetched summaries; where the primary page was
  not opened, the tag says so.
- `docs.blender.org` could not be fetched in this session (DNS failure), so the `nla.bake` and cloth
  manual statements below are from earlier notes or search excerpts, not re-read.
- The Houdini Dem Bones docs and the Make-It-Animatable paper PDF did not load as text.
- The SSDR, XPBD and garment-fitting papers' full text were not read; only abstracts or excerpts.
- No paper with a skirt/garment error-vs-bone-count curve was found (see §3).

---

## 1. Skinning decomposition (cloth or mesh sequence → bones + LBS weights)

This is the direct route for step (d): sim → bones.

### 1a. SSDR — Le & Deng, "Smooth Skinning Decomposition with Rigid Bones", SIGGRAPH Asia 2012 / ACM TOG 31(6)
- Project page: https://graphics.cs.uh.edu/ble/papers/2012sa-ssdr/index.html (`paper`, fetched)
- Preprint PDF: https://graphics.cs.uh.edu/wp-content/uploads/papers/2012/2012_SA_SSDR_preprint.pdf (`paper`, linked, not read)
- DOI: 10.1145/2366145.2366218 (per the search excerpt; `snippet`)
- Method as stated on the project page: least-squares fit of LBS-reconstructed vertices from example
  poses; sparse, convex vertex–bone weights; rigid bones via orthogonal constraints on the bone
  rotations; solved by block coordinate descent alternating weights and bone transforms.
  Sparse, convex weights are for compression and rendering; rigid bones are for motion editing,
  skeleton extraction and collision (`paper`, project page).
- Claim: "can measurably outperform" prior skinning-decomposition schemes (`paper`, project page).
  The page gives **no numbers, no bone-count used, no code link, and no mention of cloth or
  clothing**.
- Use for us: the reference algorithm behind Dem Bones (see 1b). The rigid-bone constraint is the
  part that matters for us, because the game runtime needs rigid bones.
- Licence/code: no code link found on the page (`none`).

### 1b. Dem Bones (EA SEED) — implementation of SSDR
- Repository: https://github.com/electronicarts/dem-bones (`code`)
  - Licence: **BSD 3-Clause** (LICENSE.md). The pre-built command-line tool also bundles Eigen,
    tclap, Alembic, FBX SDK 2020.0.1 and zlib, whose licences are listed in 3RDPARTYLICENSES.md
    (`code`, fetched). **Check the FBX SDK terms before shipping the binary**; use the library
    source instead, which is header-only.
  - Core: C++ **header-only** library (`include/DemBones`), Eigen + OpenMP, CMake build (`code`, fetched).
  - Usage examples in the repo: `AbcReader.cpp`, `FbxReader.cpp`, `FbxWriter.cpp` (`code`, fetched).
  - Docs: `docs/index.html` redirects to `htmls/index.html` (not opened). The API names
    (`nBones`, `nIters`, `nTransIters`, `nWeightsIters`, `bindUpdate`, `transAffine`, `weightsSmooth`)
    were confirmed only from forum and Houdini excerpts, not from the upstream API reference.
- Command-line flags seen in a forum thread (`forum`, https://www.tech-artists.org/t/dem-bones-advice/13319):
  `-b=<n>` bone count; `--nTransIters=0` solves weights from fixed transforms;
  `--nWeightsIters=0` solves transforms from fixed weights; `--bindUpdate=1` optimises existing
  transforms and weights; `--bindUpdate=2` used for joint grouping. The thread's example runs use
  5, 10 and 20 bones on one cloth animation. The poster asked what `--transAffine`,
  `--transAffineNorm` and `--weightsSmooth` do; **no answer was posted**.
- Houdini "Dem Bones Skinning Converter" exposes "Error Tolerance" and "Patience" as stop criteria
  (`official`, Houdini docs excerpt via search; the fetched page redirected and was not read).
- Input: animated mesh sequence (e.g. a geometry cache) → LBS (`code`, repo description). No
  statement found about whether a rest pose must be supplied or how it is chosen.
- Cloth use: the forum thread lists "convert cloth simulation into joints and a skinCluster" as a
  scenario (`forum`); no cloth-specific advice was posted.
- Mentioned in the Compressed Skinning paper as the standard baseline (`snippet`, arXiv 2406.11597).

**Dem Bones on Blender**
- Paid add-on "Blender DemBones" by Dene (Denis Chera) on itch.io, Gumroad, Blender Market and
  Superhive, listed at about $15 (`store`, https://dener.itch.io/blender-dembones). It wraps the
  open-source DemBones. The listing says the original (without the Blender integration) is free.
  **No licence for the paid add-on was stated in any listing found.** Do not copy its code.
  Blender 5.2 status: not checked.
- Blender Market/Superhive listings: same product (`store`).

### 1c. Compressed skinning for blendshapes — Kavan et al., arXiv 2406.11597
- https://arxiv.org/abs/2406.11597 (`paper`, abstract fetched)
- Abstract: restricts transform coefficients to about 10 % non-zeros; memory and speed savings
  claimed, no figures in the abstract. Input domain: **facial blendshapes**.
- Dem Bones comparison, proxy-bone count, MAE/MXE values: not on the abstract page. A search
  excerpt (`snippet`, not opened) said both methods used 40 proxy bones, with ~10× fewer
  transforms and a claim that 20 bones could match Dem Bones. **Treat those numbers as unverified.**
- Cloth: not studied in the paper as far as the abstract shows.
- Use for us: reference only. The sparsity idea (few nonzero bone coefficients per frame) is
  relevant to baking, but the method is an optimiser over a compressed format, not a runtime
  skinning change.

### 1d. Cloth → LBS follow-ups
- **AniDress** — https://arxiv.org/pdf/2401.15348 (`paper`, search excerpt, not opened). Builds a
  garment rigging model on LBS: virtual bones fitted to simulated garment motion with SSDR.
  Authors call the joints "virtual bones" that may sit off-surface. **Closest published match to our
  step (d).** Code and licence: not checked.
- arXiv 2312.14619 (`paper`, excerpt): argues LBS garment models stiffen loose skirts and
  dresses; proposes a generative decomposition instead. Use: problem statement only.
- arXiv 2512.05593 (`paper`, Dec 2025, excerpt): skinning-free cloth animation predicting vertex
  positions and normals; says LBS misaligns wrinkles. Use: reference only; outside the 2024 window.
- Kavan et al. 2010, fast cloth-like LBS approximation (https://users.cs.utah.edu/~ladislav/kavan10fast/kavan10fast.pdf,
  `paper`, title only from search). Frames skinning as a matrix decomposition. Not read.
- Practical game talks on cloth → bones: **none found** (`none`).

---

## 2. Garment segmentation, auto-rigging and skin transfer

### 2a. Auto-rigging methods (none were tested on garments)

| Method | Paper / repo | Licence as stated | Garment / loose-cloth handling | Usable for us |
|---|---|---|---|---|
| RigNet (Xu et al.) | https://github.com/zhan-xu/RigNet (`code`, fetched) | **GPL-3.0** (README) | Not addressed; input mesh simplified to 1K–5K vertices (MeshLab) | Reference only (GPL) |
| UniRig (VAST) | https://github.com/VAST-AI-Research/UniRig (`code`, fetched) | **MIT** (README/LICENSE sidebar) | Not mentioned. Inputs .obj/.fbx/.glb/.vrm. Two stages: skeleton then skin. Bone physics attributes "coming soon". Full checkpoints listed under "Planned Future Releases" | Possible skeleton/skin **prior** to compare against our weights. Weight licence unclear; full checkpoints not public as of the page |
| Anymate (Deng et al.) | arXiv 2505.06227, https://anymate3d.github.io/ (`paper`, fetched) | Code licence **not confirmed** (GitHub URL returned 404 on guess) | Abstract: 230K-asset dataset; no garments or cloth | Reference; check repo LICENSE before use |
| Make-It-Animatable (Guo et al., CVPR 2025) | arXiv 2411.18197; https://github.com/jasongzy/Make-It-Animatable (`code`, fetched) | README: **MIT**. HF Space metadata conflict: cc-by-nc-4.0 (older) vs apache-2.0 (later) (`snippet`) | Humanoid-first; training includes RaBit/3DBiCar with Mixamo rigs; v2 accepts mesh only; **no garment mention** | Reference. Its humanoid skin prior could give a base skin for the body under the cloth |
| MagicArticulate | — | **not found** (`none`) | — | — |
| SmartRig / SkinGPT-style | — | **not searched in time** | — | — |

Notes:
- No paper found that does garment segmentation with these tools. UniRig, Anymate and
  Make-It-Animatable all target bodies or objects, not loose layers over a body.
- RigNet is GPL, so do not copy code into a shipping pipeline.

### 2b. Robust Skin Weights Transfer — Abdrashitov, Raichstat, Monsen, Hill (Epic), SIGGRAPH Asia 2023 Technical Communications
- Project: https://www.dgp.toronto.edu/~rinat/projects/RobustSkinWeightsTransfer (`paper`, search excerpt)
- Preprint: https://www.dgp.toronto.edu/~rinat/projects/RobustSkinWeightsTransfer/preprint.pdf
  (`paper`; the PDF fetch failed to yield text, so the evaluation was not read)
- Method (project page excerpt): copy weights only where the source is confident, then fill the
  rest by interpolation ("weight inpainting"). Aimed at garments, which the authors say is the
  target use.
- Code: https://github.com/rin-23/RobustSkinWeightsTransferCode (`code`, fetched).
  - Licence: **MIT** (sidebar; LICENSE text not shown).
  - Needs Python bindings for libigl and Polyscope.
  - Works on any meshes with source weights (`sphere_to_plane_transfer.py` example).
  - **FBX loading of body and cloth meshes is "coming soon"**; "body to garment transfer" is listed
    as not yet available. So the garment path is **not usable as shipped**.
- Third-party Blender add-on: Sent From Space on Gumroad (listed from the repo; `store`, not checked).
  Unofficial Maya plugin: https://github.com/yamahigashi/MayaTransferInpaintWeights (MIT per excerpt, `code`).
- Use for us: **the best open method for step (c)** (weight cohesion across a layer seam). Port the
  idea (confident copy + inpaint) into our pipeline code; do not depend on the unfinished repo path.

### 2c. Segmentation, slits and panels
- No paper found on automatic slit/panel detection for garments (`none`). Searches returned only
  unrelated garment-fitting and rigging work.

### 2d. Curve skeleton / medial axis / mean curvature skeleton for thin sheets
- Not found in search (`none`): the Tagliasacchi mean-curvature-skeleton paper and related
  medial-axis work did not appear. **Gap; search again with the paper title if needed.**

### 2e. Geodesic distance (heat method)
- Crane, Weischedel, Wardetzky, "Geodesics in Heat", ACM TOG 32(5), 2013.
  https://arxiv.org/pdf/1204.6216 (`paper`, excerpt; PDF not read).
- Claim: solves two standard linear elliptic systems; works on triangle meshes and point clouds;
  about an order of magnitude faster than earlier methods at similar accuracy (`paper`, excerpt).
- Use for us: a geodesic distance from the waist/hip ring to every vertex gives a robust
  "distance along the garment" field for chain placement and for weight ramps (step a and c).
  Licence: no code found in this search (the paper is a method; implement from the paper or use
  an MIT/BSD library after checking).

---

## 3. LBS garment weighting, skirts, and bone counts

- **"Skirt rig"/kinematic skirt model, Kirchhoff skirt, LBS garment weighting paper:** not found (`none`).
  The only skirt-rig material is Blender Artists threads on driver-based skirts (`forum`) already
  covered in 04 §2b.
- **Error vs bone count for garments:** **no curve found** (`none`). The nearest things are:
  - Dem Bones sweeps of 5/10/20 bones on cloth in a forum thread (`forum`, no error values).
  - Compressed Skinning (facial) with a claimed 20–40 proxy bones (`snippet`, unverified).
  - Wu et al. 2018, garment fitting with a skeleton-based error metric (https://graphics.cs.uh.edu/wp-content/uploads/papers/2018/2018-CAVW-Garment-Fitting.pdf, `paper`, excerpt). Different task; the error is a fit metric, not a decomposition error.
  - Conclusion: **run our own sweep** (see §6).
- **Reducing tearing / bleed between chains:** the only source is the Robust Skin Weights Transfer
  confidence-then-fill idea (§2b, `paper`). No other paper on tearing found.
- **Position-based dynamics on bone chains:** XPBD paper below. No skirt or hair parameter table found.

---

## 4. Real-time secondary motion on bone chains

### 4a. XPBD — Macklin, Müller, Chentanez, "XPBD: Position-Based Simulation of Compliant Constrained Dynamics", MIG 2016, pp. 49–54, ACM
- DOI 10.1145/2994258.2994272 (`paper`, citation via DBLP / ACM references in excerpts).
- Problem solved: PBD stiffness depended on iteration count and timestep; XPBD uses compliance
  α (inverse stiffness) so stiffness is independent of iterations (`paper`, IPSJ report and Cornell
  CS5643 slides https://www.cs.cornell.edu/courses/cs5643/2025sp/slides/13pbd.pdf, excerpts; the
  slide PDF itself did not load as text).
- Practical notes (`paper`/excerpt): a long chain at high stiffness can under-reach its stiffness
  with too few solver iterations (iMSTK docs https://imstk.readthedocs.io/en/v5.0.0/PbdModel.html,
  `official` docs excerpt). Smaller time steps are preferred for stability.
- Stiffness/damping values for hair or skirts: **not found**.
- Code: the paper's authors' code and licence not checked in this session.

### 4b. Jiggle deformers
- Maya Jiggle deformer (`official`, https://help.autodesk.com/cloudhelp/ENU/MayaCRE-Modeling/files/GUID-81EA36EA-E283-4D09-9F9B-D5649413AED0.htm):
  Stiffness 0–1 (higher → faster, less elastic); Damping (high → less jiggle); Weight scales the
  effect; "Jiggle only when object stops" option.
- Valve `$jigglebone` (Source engine, `official`, https://developer.valvesoftware.com/wiki/$jigglebone):
  stiffness 1–1000, damping 0–10, separate yaw/pitch values, tip mass distance in inches matched to
  bone length, gravity affects mass. **Closest game-engine reference for a bone-only jiggle with
  numeric ranges.**
- Cinema 4D Jiggle (`official`, https://help.maxon.net/c4d/2027/en-us/Content/html/OCAJIGGLE.html):
  secondary motion without simulation setups. Reference only.

### 4c. Skin sliding
- Yang, Southern & Zhang, "Fast simulation of skin sliding", Computer Animation and Virtual Worlds 20
  (2009), pp. 333–342 (`paper`, excerpt via Bournemouth repository https://eprints.bournemouth.ac.uk/10615/).
  Remeshing by parameter-space resampling; force-density method for the surface parametrisation.
  Reduces texture distortion. Use: reference for skin slide on a skin layer, not for garments.
- A 2017 SIGGRAPH-era ADMM skin-slide deformer (Maya) generalising PBD/projective dynamics
  (`snippet`, title and venue not verified).

### 4d. Colliders
- Capsule colliders for legs: covered by VRMC_springBone (04 §1a). No additional paper found.
  The Blender cloth collision settings (§5a) are the other source.

### 4e. Stability and parameter guidance
- **No published tuned table for bone-chain skirts found** (`none`). Use XPBD guidance (4a) and
  Valve's `$jigglebone` ranges (4b) for starting points, then tune against QA (§6).

---

## 5. Blender tooling (2024–2026)

### 5a. Cloth modifier: collision and self-collision
- Blender Python API, `ClothCollisionSettings` (`official`, https://docs.blender.org/api/4.2/bpy.types.ClothCollisionSettings.html;
  seen as a search excerpt, page not fetched):
  - `use_self_collision`: off by default.
  - `collision_quality`: default 2, higher = better and slower.
  - `self_distance_min`: default 0.015, range 0.001–0.1.
  - `self_friction`: default 5.0.
  - `vertex_group_self_collisions`: triangles in this group skip self-collision. This is an exclusion
    group, **not** the pin group.
  - Older releases (2.6x–2.7x) used `self_collision_quality` with a smaller range.
- The Blender manual's cloth pages (pin group, shape, collision) were **not fetched**
  (docs.blender.org failed). Forum practice (`forum`, below) says to pin with a vertex group
  selected in the Cloth Shape panel and to place the Cloth modifier below the Armature modifier.

### 5b. Baking sim to bones (helper empties, constraints)
- Forum method (`forum`, https://forum.godotengine.org/t/my-method-to-bake-simulations-from-blender-to-godot/128489):
  one empty per vertex, one bone per vertex with Copy Location to the empty; bake with Visual Keying
  in Pose mode. A script of this kind can freeze Blender on high vertex counts.
- Forum method (`forum`, https://blenderartists.org/t/low-poly-cloth-simulation-as-target-for-bones/1576584):
  one empty per skinned bone, each empty parented to about **three** nearby sim vertices and oriented
  like its bone; three vertices gave better results than one.
- Forum (`forum`, https://blenderartists.org/t/skirt-falls-off-character/1253365): parent the skirt
  root to a hip bone with Child Of plus a waist pin group; Shrinkwrap before cloth helped it sit on
  the waist.
- Forum warning (`forum`, Ossim add-on developer): copying the main armature's transforms onto empties
  driven by that armature creates a dependency cycle; route through a secondary armature.
- **`nla.bake` flags** (from 04 §2e, `official` docs 4.2): `visual_keying`, `clear_constraints`,
  `bake_types`, `clean_curves` (4.2+). Not re-read in this session (docs.blender.org unreachable).

### 5c. Add-ons (licence and Blender 5 status, as listed)
- **Wiggle 2 RTX** (Chamiseul fork, 2.2.5): GPL-3.0-or-later per listing; 2.2.2 was a Blender 5.0
  hotfix; project says 5.x compatible. https://extensions.blender.org/add-ons/wiggle-2/ (`store`).
- **Wiggle Bones** (Hans_Xwh): GPL-3.0 per listing; targets 4.5+; a reviewer reports an install
  error on 5.2. https://extensions.blender.org/add-ons/wiggle-bones/ (`store`).
- **Original Wiggle 2** (shteeve3d): repository https://github.com/shteeve3d/blender-wiggle-2
  (`code`); licence not confirmed in the excerpt.
- **Blender DemBones** (Dene): paid, licence not stated (§1b, `store`).
- **Bonedynamics Pro** (Superhive): listed GPL, Blender 4.2–5.2; paid (`store`).
- **SpringFX** (Auron3d): Blender 5.1+ (`store`, 04 table).
- Use: none of these should be in the shipping pipeline without a licence read. Wiggle-style
  wiggles are GPL, so reading them as reference is fine; copying code into our tree is not.

---

## 6. QA metrics in papers

- **Skinning error (vertex error):** Compressed Skinning uses **mean absolute error (MAE)** and
  **max absolute error (MXE)** against the input blendshape/mesh, treating input as noise-free
  (`snippet`, arXiv 2406.11597 excerpt; values not opened). Use the same two numbers for our
  decomposition QA: per-frame mean and max vertex distance between the sim/source mesh and the
  LBS result.
- **Dem Bones stop criteria:** Error Tolerance and Patience (Houdini docs excerpt, §1b). Use as the
  convergence check in our bake log.
- **Penetration in garment papers:** none found in this search (`none`).
- **Hem / perimeter preservation:** none found (`none`). 04 §6 gives our own thresholds
  (`inference`).
- **Edge length / strain:** none quoted in the sources read (`none`). Add a per-edge stretch metric
  to QA (`inference`).

---

## 7. Bone-count sweep: how to get the curve ourselves

No published curve exists in what we could read. Recommended experiment (`inference`):
1. Take one walk, run and skirt-swing clip from a sim on a Tripo-like garment mesh.
2. Decompose with Dem Bones (BSD library, not the paid add-on) for N = 3, 4, 6, 8, 12, 16, 20 bones.
3. For each N, record per-frame MAE and MXE in cm and the max edge-stretch ratio.
4. Plot error vs N and vs total runtime bone count; pick the knee.
5. Repeat with the cap of 4 influences per vertex applied after the solve.

---

## Implications for our pipeline

- **Use now — Dem Bones (C++ library, BSD-3) for the bake-side decomposition experiment in
  step (d).** Reason: the only permissive, offline, header-only, cloth-applicable tool found. Check the
  FBX SDK licence only if the CLI binary is used. Do not use the paid Blender add-on.
- **Use now — Robust Skin Weights Transfer method (confident copy + inpaint), re-implemented in our
  code.** Reason: the closest published fit for step (c) at a layer seam; the official repo is
  MIT but its garment path is not finished, so port the idea, not the repo.
- **Use now — measurable QA: per-frame MAE and MXE of vertex error, plus Dem Bones
  Error Tolerance/Patience in the bake log.** Reason: the only metrics in the sources read.
- **Use now — Blender cloth collision settings from §5a** (`use_self_collision`, `collision_quality`,
  `self_distance_min`) when a sim is set up in Blender for the reference clip. Reason: API
  defaults are documented; verify on Blender 5.2 before use (docs not re-read).
- **Use later (R8 bake) — AniDress-style SSDR fit of a garment sim to virtual bones.** Reason: the
  closest published method to our bake step; code and licence not yet checked.
- **Use later (R8 bake) — Dem Bones bone-count sweep (§7).** Reason: no published curve; we must
  measure it.
- **Use later (R8 bake) — helper-empty / Copy Location bake with a secondary armature (§5b)** to avoid
  the dependency cycle. Reason: forum-level method; test on Blender 5.2.
- **Use later (R8 bake) — capsule colliders for legs in the runtime or sim** (04 §1a). Reason: no
  new source; needs the QA penetration metric first.
- **Use later (R8 bake) — XPBD chain with fixed bone lengths for the secondary sim.** Reason:
  published solver; parameters must be tuned by us (no tuned table found).
- **Reference only — RigNet (GPL-3.0), Make-It-Animatable (MIT README, humanoid-first), UniRig (MIT,
  checkpoints not public), Anymate (licence unverified).** Reason: none handle loose garments; use
  as skeleton/skin priors at most, after licence checks.
- **Reference only — Compressed Skinning (facial, sparsity idea).** Reason: optimiser on facial
  blendshapes; not garment-tested.
- **Reference only — Wiggle 2 / Wiggle Bones (GPL-3.0), Bonedynamics Pro, SpringFX, Valve
  `$jigglebone` ranges.** Reason: GPL add-ons cannot be copied into our tree; `$jigglebone` ranges
  are a useful starting point for tuning.
- **Reference only — heat method geodesic distance.** Reason: useful for ramps and chain placement;
  implement from the paper or check the licence of any library before use.
- **Gap — slit/panel detection, medial-axis/mean-curvature skeletons for thin sheets, skirt
  kinematic models, garment penetration metrics, and cloth-to-bone talks from shipped games.**
  Nothing usable found in this session. Search again with the paper titles listed in §2d and §3
  before deciding segmentation.

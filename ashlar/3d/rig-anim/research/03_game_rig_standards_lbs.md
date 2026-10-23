# Game rig standards for linear blend skinning (LBS) characters in a three.js ARPG

Date of research: 2026-10-22. Scope: research only, no repo changes. Target: plain LBS, max 4 influences per vertex, Blender rig, all constraints/drivers/B-bones baked away before export, facial rig out of scope.

Confidence tags: **HIGH** = official page fetched in this session; **MED** = secondary, vendor, forum, or search-snippet only; **LOW** = community post, blog, or recall with no URL confirmed; **unverified** = no source found in this session.

## Summary: what was and was not confirmed

- Confirmed (HIGH): Unity Humanoid needs at least 15 bones and a T-pose; Unity skinned-mesh quality caps (1/2/4/Auto); UE5 default 4 or 8 influences, "Unlimited" mode capped at 12, mobile cap of 75 bones per section; Kavan et al. 2007 dual-quaternion paper claim; Unity HumanBodyBones enum (55 values); Bell 1990 and Harrington 2007 predictor definitions and error table.
- Partly confirmed (MED): UE5 Manny/Quinn bone list (third-party guide only, no official list fetched); twist-bone naming; Rigify human-rig conventions; Blender glTF exporter bakes constraints when sampling; Lewis et al. 2000 pose-space deformation.
- Not confirmed (unverified): UE5 `*_correctiveRoot` and knee/elbow/butt correctives (no source names them); UE5 Manny bind-pose arm angle; Harrington/Bell regression coefficients (pages blocked or no text); Mixamo bone count and twist-bone absence; glTF "max 4 sets, weights sum to 1" wording (spec page too long to reach the skins section); Diablo IV / Diablo Immortal / PoE2 / Hades / Torchlight / Last Epoch rig talks (none found); shoulder, knee, and hip joint-centre rules from a standard source.

---

## 1. Reference skeletons

### 1.1 Unity Humanoid

- [HIGH] A Humanoid model needs "at least 15 bones organized in a way that loosely conforms to an actual human skeleton." Required bones must all match or the avatar is invalid; optional bones are recommended ("for better results, you also need to match the optional bones"). Default pose is T-pose, arms "straight out to the sides"; mismatch shows "Character not in T-Pose." (https://docs.unity3d.com/Manual/ConfiguringtheAvatar.html)
- [HIGH] The `HumanBodyBones` enum has 55 values plus `LastBone` (delimiter). Torso/head: Hips, Spine, Chest, UpperChest, Neck, Head, Jaw. Legs: Left/RightUpperLeg, LowerLeg, Foot, Toes. Arms: Left/RightShoulder, UpperArm, LowerArm, Hand. Eyes. Fingers: Thumb/Index/Middle/Ring/Little, each Proximal/Intermediate/Distal. There are no twist bones in the enum. (https://docs.unity3d.com/ScriptReference/HumanBodyBones.html)
- [MED] The 15 mandatory bones are most likely: Hips, Spine, Head, and Left/Right UpperLeg, LowerLeg, Foot, UpperArm, LowerArm, Hand. The count matches the 15-bone minimum, but the fetched page does not flag the mandatory set, so verify in the Configure Avatar view. Source for the list itself: recall, unverified.
- [MED] Skipped optional bones are interpolated (older 2017 manual wording surfaced in search). (https://docs.unity3d.com/ru/2017.3/Manual/ConfiguringtheAvatar.html)
- [MED] Naming descriptive bones (e.g. LeftArm, RightForearm) improves auto-matching (search snippet from the Unity manual above).

### 1.2 UE5 Manny / Quinn

No official Epic bone list was retrieved. The bone list below comes from a third-party guide; use it as a working reference and check against `SK_Mannequin` in the engine (Skeleton Tree tab).

- [MED] Core: root, pelvis, spine_01 to spine_05 (five spine bones; UE4 had three), neck_01, neck_02 (UE4 had one), head. (https://cosindra.ai/guides/ue5-manny-skeleton)
- [MED] Arm, per side: clavicle, upperarm, upperarm_twist_01, upperarm_twist_02, lowerarm, lowerarm_twist_01, lowerarm_twist_02, hand. (same URL)
- [MED] Hand, per side: thumb_01 to _03; index, middle, ring, pinky, each metacarpal plus _01 to _03. (same URL)
- [MED] Leg, per side: thigh, thigh_twist_01, thigh_twist_02, calf, calf_twist_01, calf_twist_02, foot, ball. (same URL)
- [MED] IK helpers: ik_foot_root, ik_foot_l, ik_foot_r, ik_hand_root, ik_hand_gun, ik_hand_l, ik_hand_r. Guide calls them "IK helper bones (foot and hand IK targets)". Treat them as non-deforming controls; "virtual" status not confirmed (LOW). (same URL)
- [MED] Weapon bones: a forum thread says the 5.6 templates ship only `SKM_Manny_Simple`, which lacks weapon_r and weapon_l; the full skeleton is sold separately on Fab. The cosindra list omits weapon bones. (https://forums.unrealengine.com/t/how-to-get-the-full-version-of-manny-quinn-s-skeleton-in-5-6-instead-of-skm-manny-simple/2580712)
- [LOW] Twist driving: a community post says a procedural control rig (CR_procedural) in ABP_Manny_postprocess distributes limb rotation to twist bones, and that CR_Manny reduces upperarm twistX in a pose driver. Post is about 2024. (https://forums.unrealengine.com/t/manny-twist-bones-how/1906562)
- [UNVERIFIED] `*_correctiveRoot`, and knee / elbow / butt correctives. None of the sources mention them. Assume absent unless confirmed in `SK_Mannequin`.
- [UNVERIFIED] Manny bind-pose arm angle. The Epic retargeting page fetched in this session (https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-retargeting-in-unreal-engine) has no bone list or pose angle; it only describes the Retarget Manager base pose and IK Retargeting.

### 1.3 Mixamo

- [MED] Bones carry a `mixamorig` prefix; the hierarchy root is Hips (pelvis). Cascadeur's mapping table maps Hips to pelvis and lists Spine, Spine2, Neck, Head, and Right/LeftUpLeg, Leg, Foot. (https://cascadeur.com/help/category/160)
- [LOW] Some exports add an `Armature` root bone; toe bones such as RightToeBase are present. (https://superhivemarket.com/products/animexport-pro/docs)
- [unverified] Mixamo bone count (about 65) and whether twist bones are absent. The search did not find Mixamo's own specification. Check a downloaded FBX before relying on either.

### 1.4 Rigify (Blender)

- [MED] Rigify assumes 1 unit = 1 m (human about 2 units tall), keeps the spine straight in front view, treats the last spine bone as the head and the next two bones down as neck, and puts deform bones in the DEF collection. (https://docs.blender.org/manual/en/4.3/addons/rigging/rigify/metarigs.html, from search snippet; the index page returned HTTP 403)
- [unverified] Rigify limb twist option details (not found).

### 1.5 Reallusion Character Creator 5 (comparison only)

- [LOW] Two twist bones per limb segment, named like `upperarm_twist_01_r`, mirrored into the UE5 export. (https://www.reallusion.com/FeedBackTracker/Issue/Inconsistent-twist-bone-hierarchy-in-Unreal-Engine-skeletons)

### 1.6 Minimal retarget-safe set (recommendation)

Built from the Unity 15 plus the UE-style names above. Unity's 15 are a subset.

- Spine / root (6): pelvis (Hips), spine_01, spine_02, spine_03 (Chest / UpperChest), neck_01, head.
- Per side (8 each, 16 total): clavicle, upperarm, lowerarm, hand, thigh, calf, foot, ball/toe.
- Subtotal without twists or fingers: 22 deform bones.
- Optional per side: 1 twist on upperarm, 1 twist on lowerarm (+2 per side, +4 total).
- Fingers: 15 per hand for full detail; ARPG hands can use one grip bone per hand (LOW).
- Recommendation: keep the 22-bone core fixed across the whole character family so retargets and sockets stay valid.

---

## 2. Twist distribution for LBS

### 2.1 Counts used in practice

- [MED] UE5 Manny: two twist bones per upper arm, forearm, thigh, and calf (see 1.2).
- [MED] Forum (Polycount): "a couple of twist joints in the upper arm" help deformation. Which post in the search results carried this is not confirmed. (https://polycount.com/discussion/comment/1862600 or 1862499)
- [LOW] Vendor advice: a dual-bone setup (main bone plus twist) for forearms and calves that need to twist. (https://www.tripo3d.ai/blog/explore/smart-mesh-skinning-weights-best-practices-for-low-poly)
- ARPG proposal (LOW): 1 twist per forearm (the grip and weapon area is visible at iso distance); 1 per upper arm; 0 on thigh and calf unless a skirt or cape needs them. Add the second upper-arm twist only for hero close-ups.

### 2.2 Fractions and placement

- [MED] Evenly spaced twist joints. Kiel Figgins places three forearm joints evenly between elbow and wrist, parented in a chain, with a single twist control under the elbow whose rotate X is connected to each joint's twist axis. The article says "to even spread the rotation from the controller to the joints." (https://www.3dfiggins.com/writeups/forearmTwist/)
- [MED] Standard convention (common studio practice, not sourced here): with N twist joints on a segment, joint k (k = 1..N) carries fraction k/(N+1) of the distal rotation. One twist = 50% at mid-segment; two = 33% and 67%.
- [MED] Derived rule (from LBS math, not sourced): the rotation a vertex gets is the weighted sum of joint rotations. For a vertex at arc position p (0 at elbow, 1 at wrist) to get twist p, its weights must interpolate linearly between the two joints whose fractions bracket p. The fractions must therefore equal joint positions along the segment.
- [LOW] Twist joints sit centred on the segment axis (bone Y in Blender) at k/(N+1) of length, not at the joint.
- [LOW] Blender convention: bone Y runs along the bone length. A CG Cookie thread says this causes export-axis mismatches for hand bones. (https://cgcookie.com/community/13968-orientation-of-bones-in-blender-and-unreal-engine)

### 2.3 Driving in the DCC

Each option below is pre-bake only. Drivers and constraints do not survive export.

1. **Copy Rotation, Y-only, local-to-local, from the distal bone** (hand for forearm, foot for calf). Influence = k/(N+1). Forum advice: set the twist bone and its source to Euler YXZ so Y evaluates first, and use local > local space. Results are inconsistent in the threads read (LOW). (https://polycount.com/discussion/comment/2390182; https://polycount.com/discussion/comment/2390230)
2. **Single twist control with direct connection** (Figgins method). Drawback: the author's own update says to "build in a corrective/manual solution from the start" if you use an automated roll. (https://www.3dfiggins.com/writeups/forearmTwist/)
3. **Swing-twist decomposition** (most robust for baking; standard quaternion math, source not fetched, Dobrowolski 2006 recalled, unverified). For a joint rotation q = (w, v) and the twist axis a (bone Y): project v onto a to get p = (v·a)·a; the twist quaternion is t = normalize(w, p); the swing is s = q·t⁻¹. The twist bone gets slerp(identity, t, k/(N+1)), composed with its rest pose. Compute offline in a Blender Python script and write keys directly.
4. **Damped Track**: aims a bone, does not control roll. Do not use it for twist (MED, reasoning only).

### 2.4 Bake and export

- [MED] The glTF Blender exporter samples the animation and, from 2019 onward, bakes every bone including constraint results when sampling is enabled. (https://lists.blender.org/pipermail/bf-extensions-cvs/2019-May/008163.html)
- [MED] The same exporter warns that constraints such as IK cannot be represented in glTF and the exporter bakes them per frame. (https://lists.blender.org/pipermail/bf-extensions-cvs/2019-April/007858.html)
- [MED] The exporter has a deform-only export option, which only takes effect with forced sampling. (https://developer.blender.org/rBAb9b1814a4c26f73aae7f306c9ff2e21b7b7bdcee)
- [LOW] Export of bendy-bone segments is unverified (no source found). Set bbone segments to 1 before export.
- [MED] A known bug: exporting "all objects animations" produced empty actions for constrained rigs, workaround was manual visual-key baking per action. (https://projects.blender.org/blender/blender-addons/issues/104864)
- Rule: bake per frame at project FPS, delete all constraints, then export.

### 2.5 Weight layout for forearm and upper-arm twist rings

Proposal derived from 2.2. Rule of thumb, not sourced:

- Elbow end (p = 0): lowerarm 100%.
- Mid-segment (p = 0.5): twist_01 100% at its centre, falling off over 1/4 segment each side.
- Wrist end (p = 1): hand 100%.
- Between joints: linear weights so that effective twist equals p.
- Falloff width: about 1/(N+1) of segment length, or 2 to 3 vertex rings, whichever is wider (LOW).

---

## 3. Helper and corrective bones under LBS

### 3.1 Why helpers are needed

- [HIGH] Kavan et al. (2007): LBS "has some serious drawbacks that require artist intervention," and remains dominant because of simplicity. (https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.html)
- [LOW] Known LBS artifacts (volume loss at elbows and knees, collapsing elbows and knees, candy-wrapper twisting along long bones). Sources are secondary, not fetched in full. Kavan's paper is the primary source for the drawbacks it names.

### 3.2 Helper types and evidence

| Helper | Purpose | Driven by | Evidence |
|---|---|---|---|
| Crease roll bone (armpit, front of shoulder, inside elbow, back of knee) | Hard crease, stops ballooning or collapse | Copy Rotation or child-of from parent joint at 0.3–0.5 | [MED] Polycount senior artist: "roll bones with hard creases at the armpit and front of the shoulder" (Polycount forum; exact comment ID not confirmed, search results include comment/752968 and comment/754168) |
| Bend bone at pivot | Holds a small vertex group at the crease | Copy Rotation at 0.5 from the two adjacent bones | [LOW] vendor blog (tripo3d URL above) |
| Deltoid / buttock / armpit corrective | Muscle bulge on angle | Driver from joint angle (pose-space) | [MED] Lewis, Cordner, Fong (2000) "Pose Space Deformation" (https://www.scribblethink.org/Work/PSD/PSD.pdf); [LOW] God of War (2018) muscles driven by three joint angles (https://x.com/rafagrassetti/status/1271878757863718914) |
| Helper bone rig, real-time | Muscle bulge and jiggle | Skeleton pose plus secondary dynamics | [LOW] research summary (https://www.researchgate.net/publication/283770579_Building_helper_bone_rigs_from_examples) |

- [unverified] What fraction of shipping games use angle-driven helpers. No survey or postmortem found.

### 3.3 Driving: how the bake handles it

- Angle drivers (Blender driver, Maya driven key) are evaluated in the DCC and must be baked to keys. They do not survive export.
- Pose-space morphs (blend shapes) are not bones and are outside the LBS brief. The brief requires deform bones plus baked keys, so correctives must be done as bones.
- Drive the corrective from the parent joint's local angle (elbow flex, knee flex, shoulder abduction), not from world space.

### 3.4 Cheapest effective helpers for an iso/top-down ARPG at distance

Proposal, ranked by value per bone:

1. Twist bones: 1 per forearm, 1 per upper arm (see section 2).
2. Elbow and knee crease weights: 2 to 3 shared vertex rings with 50/50 at the crease (no extra bones) [LOW].
3. Armpit and front-shoulder crease: 1 roll bone per side (drop at LOD2 and beyond) [MED].
4. Deltoid, buttock, and hip helpers: skip unless the camera is close. Judged by the camera distance; not verified.

---

## 4. Joint placement anatomy

### 4.1 Shoulder (glenohumeral) vs clavicle

- [MED] Glenohumeral (GH) centre = centre of the humeral-head sphere. An ISB poster uses this definition with the acromioclavicular point as the most distal point of the clavicle. (https://media.isbweb.org/images/conferences/isb-congresses/2013/poster/ps2-16e.pdf)
- [MED] Predictive regression errors for the humeral head centre: 5.3 mm in vitro and 8.5 mm in vivo (search snippet; the figure came from one of the Curtin or ISB results, https://espace.curtin.edu.au/handle/20.500.11937/18972 or https://media.isbweb.org/images/conf/2009/data/pdf/53.pdf, not confirmed which).
- [MED] MRI: in neutral the humeral-head centre sits about 1 mm inferior and 1.3 mm posterior to the glenoid centre (open MRI study, search snippet).
- [MED] Placing the GH centre with a fixed offset from the acromion is an approximation. Error grows with large elevation: an MRI study found 18 to 23 mm error at near-180° elevation for an acromion-plus-upper-arm marker cluster (search snippet).
- Rule (code): upperarm joint = fitted humeral-head sphere centre. Clavicle joint = sternoclavicular joint at the top of the sternum; clavicle bone runs to the acromion. Do not place the upperarm joint at the acromion.

### 4.2 Elbow

- [LOW] Hinge axis through the medial and lateral epicondyles; joint centre at the epicondyle midline; bone pivot slightly behind the front crease.
- [LOW] Pre-bend 5 to 10° in bind pose so the IK/solver bend direction is clear. A University of Washington rigging course page (URL not confirmed; search result) makes the same point for the knee: "The Knee is bent just a little so that the IK Handle control will know which way to bend."

### 4.3 Wrist

- [LOW] Wrist joint between the radial and ulnar styloid midline, hand bone rooted at the wrist crease.

### 4.4 Hip joint centre (HJC) regression

Verified in this session:

- [HIGH] Variable definitions (Table 1): IA = distance between left and right ASIS; LL = ASIS to medial malleolus through medial femoral epicondyle; PD = midpoint of two ASIS to midpoint of two PSIS. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5121588/)
- [HIGH] Bell et al. (1990): uses IA as the only predictor (PMC Table 3). Bell is derived from a small sample of living adult males (MED, search snippet).
- [HIGH] Mean absolute error (mm), X/Y/Z: Bell [21] 8.1 / 6.1 / 10.9. Harrington best-predictor set: X uses PD, 4.7; Y uses PD and IA, 3.3; Z uses IA and LL, 4.0. Harrington single-predictor set: X uses PD, 4.7; Y uses IA, 5.9; Z uses IA, 5.5. (PMC Table 3)
- [HIGH] The PMC authors note that PD-based values rise when pelvic depth is measured without medical imaging. (PMC footnote)
- [MED] Visual3D documents two Harrington sets; the second needs manually measured leg length; the CODA and V3D_Composite pelvis origins differ by an offset tied to pelvis depth (50% of pelvis depth). (https://has-motion.com/wiki/doku.php?id=visual3d:documentation:modeling:segments:hip_joint_landmarks; page returned 403, from search snippet)
- [MED] Harrington et al., J Biomech 2007;40(3):595-602 (MRI of 8 adults, 14 children, 10 children with cerebral palsy). (https://pubmed.ncbi.nlm.nih.gov/16584737/)
- [unverified] The actual regression coefficients for Bell and Harrington. Not obtained. Do not hard-code coefficients from this report. Fetch them from the originals before use.

Proportional rules usable in code (not coefficients, and not verified):

- [HIGH] Structure only: the Harrington best-predictor sets take PD for the first axis, PD plus IA for the second, and IA plus LL for the third (PMC Table 3). Bell takes IA only. Use these as the code inputs once the coefficients are fetched. The axis labels (X/Y/Z) follow the paper's convention, which was not confirmed.

### 4.5 Knee

- [MED] Vicon PiG does not put the knee at the epicondyle midpoint: per a Salford repository paper it estimates the knee centre half a knee-width from the lateral knee marker, on the knee axis. (https://salford-repository.worktribe.com/OutputFile/1494310; search snippet only.) Use the epicondyle midpoint as a rig convention, not as a biomechanics standard.
- [LOW] Pre-bend 5 to 10° in bind pose.

### 4.6 Ankle and foot

- [MED] PiG uses several markers from pelvis to calf to define the ankle centre, not a simple malleolus midpoint. (University of Dundee ankle-centre comparison, search snippet only: https://discovery.dundee.ac.uk/en/publications/a-method-to-calculate-the-centre-of-the-ankle-joint-a-comparison-/)
- [LOW] Rig convention: ankle joint at the midpoint of the malleoli; ball joint at the metatarsophalangeal line.

### 4.7 Spine, neck, and head pivot

- [LOW] Spine S-curve; spine joints set slightly behind the body centreline (no source fetched).
- [MED] Rigify front-view rule: keep the spine straight in front view; last spine bone = head; next two = neck. (metarigs page, 1.4)
- [MED] Atlanto-occipital joint sits between the superior articular facets of the atlas and the occipital condyles; sources disagree on whether it is a pivot or ellipsoid joint. Most head rotation happens at the atlanto-axial joint (about 45° per one source). (https://wiki.voka.io/anatomy-quizzes/head-and-neck/joints-of-head-and-neck/atlantooccipital-joint/; search snippets, conflicting)
- [LOW] Head pivot: at skull base, roughly at ear-canal height, and behind the face by about half the head depth. Verify on the mesh.

### 4.8 Proportional rules for code (height-based fallback)

Recalled from the Drillis and Contini (1966) body-segment table, widely reproduced in Winter's biomechanics text. **Not verified in this session**; check against the original before use.

- Segment lengths as fraction of stature H (recall): thigh 0.245 H; shank 0.246 H; upper arm 0.186 H; forearm 0.146 H; hand 0.108 H; foot length 0.152 H; biacromial (shoulder) width 0.259 H; bi-trochanter (hip) width 0.191 H.
- Joint heights from floor as fraction of H (recall): ankle 0.039 H; knee 0.285 H; hip (greater trochanter) 0.530 H; elbow 0.630 H; acromion (shoulder top) 0.818 H.
- Source for the Drillis and Contini model existence: https://the.oandplibrary.org/items/show/179693 (LOW, reference only).

---

## 5. Weight painting rules of thumb for LBS

### 5.1 Hard constraints (engine and format)

- [HIGH] Unity Skinned Mesh Renderer Quality: Auto (global limit), 1, 2, or 4 bones per vertex. For more than 4 with Auto, Skin Weights must be set to Unlimited in project settings. "It's better to set the number of bones that affect a vertex on import, rather than using a runtime cap." (https://docs.unity3d.com/Manual/class-SkinnedMeshRenderer.html)
- [HIGH] UE5 default: 4 or 8 influences per vertex by platform. Unlimited Bone Influences mode is capped at 12, and Epic recommends a threshold of 8. Mobile: 75 bones per section; 8-bit bone index covers 256 bones per section. (https://dev.epicgames.com/documentation/en-us/unreal-engine/skeletal-mesh-rendering-paths-in-unreal-engine)
- [LOW] A forum report says the UE 5.8 glTF importer keeps only the first four influences per vertex, which it attributes to the glTF spec. (https://forums.unrealengine.com/t/interchange-gltf-importer-truncates-skeletal-mesh-bone-influences-to-4-per-vertex/2745391)
- [MED] The glTF 2.0 spec: vertex weights in JOINTS_0/WEIGHTS_0 sum to 1.0, with extra influences from JOINTS_n/WEIGHTS_n sets. Source: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html; the skins section was not reached (page exceeds fetch limits), so this is **unverified in session**. Check section 3.7.3 before relying on it.
- [MED] three.js: the standard skinning shader uses a vec4 for skinIndex and skinWeight, so it is a 4-influence path. Recalled, unverified in session.

### 5.2 Influence and weight rules

- Cap at 4 influences per vertex (HIGH from 5.1). Prune weights below 1% (0.01), then renormalize (LOW, common practice).
- Shoulder: three-way blend clavicle / upperarm / chest. Balance the clavicle and upperarm weights in the deltoid region; the clavicle carries the arm's rise. [MED] Forum: "you just need to find a good balance of weights between the shoulder clavicle bone and the upper arm bone." (Polycount forum; comment ID not confirmed, search results include comment/1862499 and 1862600)
- Armpit: upperarm, chest, and crease roll bone (max 3 influences in that area) [LOW].
- Elbow and knee: 2 to 3 shared vertex rings, 50/50 at the crease, optional 1-bone bend bone to hold the crease group [LOW] (https://www.tripo3d.ai/blog/explore/smart-mesh-skinning-weights-best-practices-for-low-poly).
- Hip, groin, buttock: pelvis, thigh, spine (max 3). Transition across at least 10% of thigh length (LOW).
- Wrist: hand 100% except within the forearm twist ring (section 2.5) [LOW].
- Rigid parts (armor plates, helmets, belts, pouches, weapons): 100% to one bone (common practice, unsourced; MED as a rule of thumb).
- "No more than 2 influences where not needed": this is a rule of thumb (LOW). Use 2 max on fingers and small props; 4 max only at joints.
- Smooth falloff: use smoothstep across 2 to 3 vertex rings, not a hard step (LOW).

### 5.3 Clothing that overlaps the body

- [MED] Polycount: a bind-to-T-pose cloth sim can be baked to bones, then the cloth re-skinned to those bones; the forum author scripted it because it had to be repeated for hundreds of animations. (https://polycount.com/discussion/comment/2693484; search snippet; exact post not confirmed)
- [MED] Polycount: for mobile, bake sim animation into bones with skin weights to avoid a live cloth sim, or bake vertex cache. (https://polycount.com/discussion/comment/2694211; search snippet)
- [LOW] Skirt bones with copy rotation from both thighs at 50% each: no source confirmed; the setup in the threads read had constraint and growth problems (https://blenderartists.org/t/skirt-rigging-problem/670900). Keep copy-rotation influence at 0.5 per thigh and check at extreme leg angles.
- [LOW] Cape: 3 to 5 chain bones with baked sim; the cape must not intersect the body at bind (collision offset 1 to 2 cm is a proposal, unverified).

---

## 6. Stylized / ARPG specifics

- [MED] Diablo IV: art director John Mueller describes hand-crafted characters, componentized armor across hundreds of sets, multiple body types, and five starting classes; cutscenes rendered in-engine. (https://www.gamewatcher.com/diablo-4-character-art-rendering-story-cutscenes)
- [unverified] Diablo IV GDC rig talk, bone budget, influence count, or skeleton families. None found.
- [unverified] Diablo Immortal: no GDC talk, postmortem, or bone budget found.
- [unverified] Path of Exile 2, Hades, Torchlight, Last Epoch: no talks found in search.
- [LOW] Vendor guidance: cap at 4 influences for main characters and 2 for crowd LODs. (https://game-ace.com/blog/game-character-skinning/; attribution from search snippet, unconfirmed)
- [LOW] Mobile benchmark (vendor): going from 2 to 4 influences costs about 3 ms per frame with 10 characters on a Mali-G57. (https://truetech.dev/mobile-apps-development/services/animations/mobile-game-character-rigging-animation.html; attribution unconfirmed)
- [LOW] Bone budget: typical game rigs 50 to 100 bones, film rigs over 500. (https://mocaponline.com/blogs/mocap-news/character-rigging-game-dev-guide)
- [unverified] Skeleton families for monsters (shared skeleton across variants): no source found. Proposal: one skeleton per body plan (biped, quadruped, spider) with per-variant meshes, same bone names.
- [LOW] Weapon sockets: a shooter-project forum thread says aimpoint sockets should be Z up and X forward. Attach the socket to the hand bone and freeze transforms first, because the socket inherits the bone's rotation. (https://forums.unrealengine.com/t/support-thread-shooter-bp-project/126943?page=10)
- [LOW] Blender bone Y runs along the bone length (CG Cookie, see 2.2). Socket axis rule: document it once per skeleton family and do not rely on import defaults.

---

## 7. Test procedure before animation

### 7.1 Pose / ROM test clip

- [MED] Standard deformation test set: squat, arm raise, twist, wrist turn, head rotation; joints rotated in isolation; play one representative clip at speed. (https://www.tripo3d.ai/blog/rigging-tutorial; https://www.tripo3d.ai/blog/3d-character-checklist)
- [MED] Deformation testing is the last step before handing a rig to animators. (https://mocaponline.com/blogs/mocap-news/character-rigging-basics-guide; search snippet)

Joint angle ranges, with sources that disagree. The sources are clinical, not game targets.

| Joint | Clinical source A (Enlyte, MED) | Clinical source B (PMC table, MED) | Calculator (LOW) | Proposed game test target |
|---|---|---|---|---|
| Shoulder abduction | 0–180 | not listed | not listed | 0–170 (near 180, avoid singularity) |
| Elbow flexion | 0–145 | 0–140 | 0–140 | 0–150 |
| Knee flexion | not listed | 0–150 | 0–135 | 0–140 |
| Hip flexion | not listed | −30 to 100 | 0–120 | 0–120 |
| Spine twist | unverified | unverified | unverified | ±45 (user-specified; unverified) |

Sources: https://www.enlyte.com/insights/article/adjuster/understanding-normal-range-motion-joint-functionality; https://pmc.ncbi.nlm.nih.gov/articles/PMC9218764/table/T1; https://everycalculators.com/range-of-motion-calculator.html.

- [LOW] Forearm pronation/supination ±80–90; wrist flexion/extension ±60–80; neck rotation ±60; ankle dorsi/plantar 20/40. Unverified.

### 7.2 Deformation checklist per pose

- Volume loss at elbow, knee, and shoulder.
- Creases collapse or balloon (armpit, inside elbow, back of knee).
- Candy-wrapper twist on forearm and upper arm.
- Vertices pulled by distant bones (check the top-4 influence list).
- Rigid parts (armor, belts, pouches) bending like cloth.
- Clipping through body at extreme poses.
- Foot slide and contact on the walk clip.

### 7.3 Acceptance criteria

- [unverified] No studio acceptance criteria were found. The Tripo guide gives no numeric pass/fail values either.
- Proposal (no source): no visible tearing or collapse at iso camera distance; no body interpenetration deeper than 1 cm at character scale; no triangle stretched more than 15% in area at extremes; ROM clip passes at 100% of the targets in section 7.1.

---

## Rules a rigging skill should enforce

1. Max 4 influences per vertex on every LOD (Unity Quality 4; UE5 default 4 or 8); max 2 on crowd LODs (LOD2 and beyond) [HIGH for the cap; LOD2 rule LOW].
2. Weights normalized to sum 1.0 (tolerance 1e-4); prune weights below 0.01 and renormalize [MED/LOW].
3. Rigid parts (armor plates, helmets, belts, pouches, weapons) at 100% to one bone, no blending across the body [MED].
4. Export only deform bones: no constraints, drivers, IK, or B-bones in the exported skeleton; bbone segments set to 1 [MED].
5. Bake all DCC constraints and drivers to per-frame keys at project FPS before export [MED].
6. Core skeleton fixed at 22 deform bones (1 root, 3 spine, neck, head, and per side: clavicle, upperarm, lowerarm, hand, thigh, calf, foot, toe) [MED, recommendation].
7. Unity-compatible: all 15 Unity mandatory mappings present (Hips, Spine, Head, and per side UpperLeg, LowerLeg, Foot, UpperArm, LowerArm, Hand) [HIGH count / MED identity].
8. Bind pose: T-pose for Unity (arms horizontal, 0° elevation) [HIGH]; match the target engine's reference pose (unverified) for UE5.
9. One twist bone per forearm at k/(N+1) = 50% of elbow-to-wrist distance; N=2 twists only on hero upper arms (1 per upper arm for ARPG) [MED].
10. Twist fraction of each joint equals its position along the segment; weights interpolate linearly between adjacent twist joints [MED, derived].
11. Twist driven by Copy Rotation Y-only (or swing-twist offline), influence = k/(N+1), before the bake step [LOW/MED].
12. Elbow and knee: 2 to 3 shared vertex rings with 50/50 at the crease; no extra bones needed for the base set [LOW].
13. Shoulder: clavicle / upperarm / chest three-way blend; armpit area max 3 influences [MED/LOW].
14. Upperarm joint placed at the humeral-head sphere centre (GH centre), not at the acromion; clavicle joint at the sternoclavicular joint [MED].
15. Hip joint centre: use the Bell (IA) or Harrington (PD, IA, LL) regression only after fetching coefficients from the originals; do not hard-code numbers from this report [HIGH for error table; coefficients unverified].
16. Joint pre-bend 5 to 10° on elbow and knee in bind pose so IK and solver direction are unambiguous [LOW].
17. ROM clip must reach the targets in 7.1 (shoulder abduction 170, elbow 150, knee 140, hip flexion 120, spine twist ±45) with no volume loss beyond 20% of local cross-section [proposal, LOW].
18. Helpers: max 1 crease roll bone per limb joint; drop helpers at LOD2 and beyond [MED/LOW].
19. Cloth and skirts: baked to bones, max 2 copy-rotation constraints per skirt bone (baked before export), influence 0.5 per thigh [MED/LOW].
20. Weapon sockets: attached to the hand bone with documented axes (Z up, X forward) and frozen transforms [LOW].

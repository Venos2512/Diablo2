# PS Pyre Singer A — Tripo preparation

User request 2026-10-21: create this exact concept, including weapon, then rig with Sorceress skeleton.
Source: ashlar/art/heroes/PS_pyre_singer/vA/concept_v5b.png.

Body and pyre-staff are separate mesh assets. Preserve selected concept identity and asymmetry. The original left shoulder mantle and veil are explicit concept features and stay. Fire, smoke and embers are effects, not solid body geometry. Hero height will match the existing Sorceress skeleton after source inspection; do not invent or change the donor rest pose.

For T-pose: use existing design.txt unchanged. Read ashlar/art-direction/artdirection.md; prepend verbatim STYLE CORE (§3.1), T-POSE RULES (§3.6), CONTENT (§3.8) to each filled skill template and save full prompts. Use built-in image_gen only. Self-QA each image against §11 and concept. Do not run Tripo or spend credits in the image session.

Next: human review of contact sheet per Tripo workflow, then body + separate staff generation, UV, 4K texture, PBR. Budget estimate 145 credits each = 290 for two assets, excluding retries. Rig uses local Sorceress donor, no paid Tripo rig/animation. No new animation library or game integration requested.

Source clarification after reading concept_v5b.prompt.txt: pale cyan at LEFT shoulder fur and hem is frost-rime pigment (#BFE3F5), not merely rim lighting. Preserve it in the neutral-light T-pose. Original pyre-staff target length ~1.4H is stated by that prompt; final scale will use this as a visual check.

Scope update from user: export hero and weapon mesh only; rig is deferred. Use corrected _v2_fix views for Tripo. Do not start rigging or animation.

## Export completed — 2026-10-21

Selected variant 0: https://studio.tripo3d.ai/workspace/generate/79480fc4-4698-4096-8beb-01f271bafdf3 (5821 quad faces in Tripo).
Export: PS_pyre_singer_vA.glb, 19,818,448 bytes, 9,883 triangles, one mesh/material, baseColor + metallicRoughness + normal all 4096×4096. Valid GLB 2 header, 0 skins, 0 animations. Source height ~0.9995 m; actual game height remains uncommitted.
Visual QA: complete front/three-quarter/side/back; anatomical left slit/mantle and right lantern retained. Fur/hem have pointed geometry; fingers remain coarse at close range. No deformation QA because rig was deferred.
Cost: Generate 100 + UV 20 + texture 20 + PBR 5 = 145 credits. Hero and separate staff total 290; account 6760 -> 6470. Parallel tabs can show stale per-step balances; total confirmed after reload.
Skill file was not modified. No lab/game import or rigging performed. See glb_validation.json and _shots/final_views.png.

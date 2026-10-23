# Mesh intake (S1–S2)

Measure first and change nothing. The original GLB is never modified (`Agent.md` principle 2). Work on an imported copy inside the
rig `.blend`, and do the analysis on arrays exported to `rigkit-env`.

## S1 — Analyse

Export from Blender in one call: vertex positions (object space), triangles, UVs, material index, and loop→vertex maps. Write
`rig/_work/mesh.npz`. Then compute in `rigkit-env`:

| Measure | How | Why |
| --- | --- | --- |
| Seam weld map | Merge positions within `1e-6 × bbox diagonal`. Keep the vertex→welded-id map | Weights and smoothing run on welded ids. D01: 6,505 vertices → 5,389 positions |
| Islands | Connected components on the welded topology | Rigid parts (helmet, brick, horns, eyes, flaps) are usually separate islands |
| Boundary / non-manifold edges | Edge-face counts | Decides whether the watertight proxy is needed (bone heat and Pinocchio need a closed volume) |
| Self-intersections | BVH triangle-pair test (libigl/trimesh) | Clothing fused into legs, fingers merged |
| Symmetry plane | PCA axis, then mirror ICP on the welded points. Report the RMS and the worst region | D01: legs offset 10.5 mm, right ear differs. Never assume symmetry |
| Up / forward | Lowest vertices = soles. Face direction from the nose or toe tips (extreme points), checked on a render | D01 verified the front from the nose vertex |
| Pose | Arm angle to horizontal (T ≈ 0°, A ≈ 30–45°); min distance arm↔torso, leg↔leg, hand↔thigh | Rig quality depends on the separation |
| Fingers | Slice the hand perpendicular to the forearm axis; count connected loops per slice | 1 loop for most of the hand length = mitten hand (FL) |
| Cloth bridging | Faces whose nearest bones would be both thighs, below the crotch | Skirt/robe → needs skirt chains (FL tore in a deep crouch) |
| Thin parts | Local thickness by inward ray | Joint-inside tests and weight falloff must exempt them (ears, loincloth) |
| Texture sanity | GLB size > 1 MB and 3 maps present | A GLB under 1 MB has no textures: back to the Tripo pipeline |

Write `analysis.json` with all numbers and capture region shots (islands colored, symmetry error heat map) through MCP.

### Stop conditions (report to the user, do not rig around them)

- An arm touches the torso along more than a few centimetres, or the legs are fused. Rigging cannot separate them; propose a new
  T-pose (Astra image → Tripo).
- Fused fingers when the brief requires finger bones. The alternative is a mitten hand: one hand bone, no fingers, recorded in the
  brief.
- A skirt or robe fused to both legs without a gap, when the clip set needs deep crouches or wide strides. Flag it as an aesthetic risk
  and propose skirt chains (S6). The user decides.

## S2 — Normalize

- Uniform scale to the catalogue height in `ashlar/3d/README.md`. Tripo normalizes the longest side to 1 m, so the height is not 1 m.
  Define the height as the highest point of the body (D01: 0.5 m top of mesh, factor 0.679495687). Log the factor in the recipe.
- Feet at z = 0. Apply rotation and scale. The mesh object gets an identity transform and the armature as its parent; otherwise the
  exporter has to look the armature up by name.
- Verify: scaling back by `1/factor` reproduces the GLB positions within 1e-6 m, and UVs and the triangle count are unchanged.
- Blender convention used by the project: Z up, face toward −Y, character's left = +X. glTF export with +Y up turns this into face
  toward +Z.

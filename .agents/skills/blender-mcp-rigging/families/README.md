# Family templates (schema 0)

One JSON per skeleton family (`SKELETON_STANDARD.md` §2). `rigkit` builds the runtime skeleton, the control rig, the ROM set and the
skin rules from it. Schema 0 is a draft: P3 may adjust it, and changes go through the Sonnet → Opus review loop.

Status: `H.json` and `S.json` are written (2026-10-22). Q, W, A, L, F and O are added when the first asset of that family is rigged,
and their bone tables are copied into `SKELETON_STANDARD.md` §3 with the date.

## Fields

| Field | Meaning |
| --- | --- |
| `family`, `schema`, `version`, `extends`, `status` | identity; `extends` copies the parent and applies this file's overrides (keyed by name) |
| `conventions` | units, axes, side prefixes, which side is +X |
| `landmarks.center`, `landmarks.sided` | landmark ids; sided ids get `_L` / `_R` |
| `landmarks.rules` | how to locate each landmark (joint-placement.md) |
| `priors` | `{landmark: {z_over_H, tol_H, source}}`: sanity only, never placement |
| `bones[]` | runtime skeleton: `name`, `parent`, `kind` (`core`, `twist`, `aux`, `socket`), `deform`, `head`, `tail`, `hinge`, optional `hinge_R`, `bend_test`, optional `twist` |
| `ik[]` | IK chains for the control kit |
| `control_kit` | name of the control-rig builder (`humanoid_v1` = D01's kit + clavicle FK + twist drivers) |
| `rom[]` | ROM test per joint: control bone, local axis, range in degrees |
| `skin` | side-gate band, influence limits, joint profiles, default rigid parts. Optional `region_bones`: `{region: [allowed bones]}` (D01's sack cloth) |
| `builder` (optional) | builder defaults read by `rigkit` (`S_legacy_D01.json` uses it): pre-bend mode and angles, control-rig defaults such as pole distance (0.24 H), inside-mesh exemptions for thin parts, object names. `rigcore.template.resolve` carries it, together with `template` (path, version, sha256), into the resolved skeleton; `rigkit` reloads the family only for an older `skeleton.json`, with a warning |

## Expressions

- Sided entries use `{S}` → `L` / `R`. Bone `{S}_UpperArm` uses landmark `lm:shoulder_{S}`.
- Point expressions:
  - `origin`;
  - `lm:<id>`;
  - `lerp:<p>|<q>|<t>`;
  - `off:<p>|<dx>|<dy>|<dz>`: offset in units of H on Blender axes. For `R`, `dx` is negated.
- Hinge expressions:
  - `bend:<lmA>|<lmB>|<lmC>`: unit normal of the plane A–B–C;
  - `axis:+X`, `axis:-Y` and so on: world axis.

  `hinge_R` overrides the hinge on the right side when the mirrored convention differs (the hand in D01).
- `bend_test`: the expected effect of +20° on local X. The builder checks it and flips the roll by 180° if it fails.
- `twist`: `{driver, axis, factor}`. In the control rig the twist bone's `rotation_euler[1]` is driven by `factor × t`, where `t` is
  the driver bone's swing-twist angle about `axis`: a TRANSFORMS variable, ROT_Y, `SWING_TWIST_Y`, local space. Not Copy Rotation:
  that one is wrong in combined poses (failure-catalog #19). The motion is baked at R8.

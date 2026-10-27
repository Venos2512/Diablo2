"""rigkit - Blender-side package of the blender-mcp-rigging skill (schema 0). Runs inside Blender 5.2 (bpy, mathutils, light numpy).

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  H = catalogue height of the asset (D01 0.5 m).

Rules (CONTRACT.md): no dense linear algebra here (Blender's numpy has no fast BLAS); every call stays short; data API writes are
preferred over operators. The pure-Python parts of the A1 modules (pre-bend, bend-token parsing, control-bone plans, GLB reading,
state diffs) import ``bpy`` lazily, so unit tests run them in rigkit-env.

Modules (import them explicitly; this package does not import its submodules):

    bl        A1  modes, temp_override, object lookup by role, snapshot save, script args, reset_pose (keeps driven twist bones)
    meshio    A1  mesh.npz export (V, F, UV, mat, weld), evaluated / rest vertex positions
    intake    A1  S0/S2: GLB import read-only (sha256), uniform scale to H, feet at z = 0, apply transforms, armature parent
    skeleton  A1  S4: pre-bend, runtime armature from a resolved skeleton, rolls, bend tests + roll flips (apply_flips), checks
    control   A1  S5: control kit humanoid_v1 (FK, IK + poles by sweep + golden-section refinement, foot roll, IK/FK switches,
                  coupling, SWING_TWIST twist drivers, skirt hook); builder defaults carried in the skeleton
    functest  A1  S5: function tests (port of D01 v2_rig_function), combined-pose twist tests and pose extremes
    export    A1  S8: test GLB with the fixed exporter args; A1.1-A1.14 + extra checks -> validation.json (always written)
    state     A1  snapshot / diff of lm_* empties, vertex-group hashes and pose; override files
    skin_io   B   weights.npz <-> vertex groups
    poses, render, parity   C

0.2.0 (P3 review round 2): twist by drivers (not Copy Rotation), robust validation, post-flip skeleton.json, G2 bone-collection
names, carried builder block, pole refinement, ``bl.rad`` (was ``bl.deg``).
"""
__version__ = "0.2.0"
SCHEMA = 0

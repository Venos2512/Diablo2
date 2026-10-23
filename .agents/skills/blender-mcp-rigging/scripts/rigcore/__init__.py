"""rigcore - shared pure-Python package of the blender-mcp-rigging skill (schema 0).

Imported by BOTH Blender 5.2 (bpy side, rigkit/) and the solver environment (rigkit-env, solvers/).
Rules: numpy + standard library only (no bpy, no scipy, no trimesh); Python >= 3.11.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  H = catalogue height of the asset (D01 0.5 m).

Modules (import them explicitly; this package does not import its submodules):

    schema    file kinds, key/dtype/shape tables and validators (raise ValueError)
    npzio     save/load mesh.npz, weights.npz, poses.npz (+ atomic JSON io)
    mesh      weld_map, welded_faces, unique_edges, adjacency_csr, connected_components, seam_groups
    geom      vector helpers, lerp, on_line, bend_normal, roll_z_vector
    landmarks load/save landmarks.json, D01 converter, priors check, TEST-ONLY synthesizer
    template  family templates: load (+extends), expand {S}, expressions, resolve -> skeleton dict
    recipe    rig_recipe.json: new/load/save/validate, step log, script version stamp
"""
__version__ = "0.1.0"
SCHEMA = 0

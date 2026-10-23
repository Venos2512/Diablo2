"""solvers - numeric side of the blender-mcp-rigging skill; runs in E:\\tools\\rigkit-env (numpy, scipy, libigl, trimesh), never in Blender.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X (inputs from glTF are converted on load).

Modules (import them explicitly; this package does not import its submodules):

    glbmesh        A2  GLB -> mesh.npz without Blender (trimesh, process=False) + raw glTF accessors for skins
    analysis       A2  S1 -> analysis.json (weld, islands, boundary, per-region symmetry, pose, fingers, cloth bridging, thin parts,
                       stop flags; the texture stop only for Tripo-sourced GLBs)
    landmarks_geo  A2  S3 source a: landmarks from the mesh geometry (slicing, plateau ends, kneecap/olecranon bumps, head mass and
                       ears with radius/offset guards, sphere fit, boot ankle, clavicle segment test, inside-mesh push, precondition
                       downgrades)
    unirig_bridge  A2  run UniRig (lock, per-run work folder) or read its output; joints -> standard names by hierarchy/position; source d
    consensus      A2  fuse landmark sources -> landmarks.json + flags.json (plausibility gates with the family ratio bands, UniRig
                       sanity-only set, class tolerance tau, vision-only flags, vision decision records with the stale check, spine
                       tile, flag tiles with crops and section polylines, ready_for_user after the vision check)
    (proxy, skin_*, metrics, parity_cmp: owners B and C, see CONTRACT.md)
"""

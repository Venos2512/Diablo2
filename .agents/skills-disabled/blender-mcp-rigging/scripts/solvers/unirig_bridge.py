r"""solvers.unirig_bridge - UniRig (E:\tools\unirig) as landmark source d and as the input of skin candidate C.

Units: metres.  Frame: Blender, Z up, front -Y, left +X, after the S2 scale of the asset's mesh.npz (UniRig works on the original GLB:
glTF Y up, Tripo 1 m box; positions are converted with glbmesh.gltf_to_blender and the mesh's ``scale_factor`` / ``z_offset``).

Reads ``<asset>_rigged.glb`` (UniRig skeleton + skin merged onto the original mesh): the skin's joint tree, joint rest positions
(rest = bind: IBM x world = I is checked), and JOINTS_0/WEIGHTS_0. Maps the generic joints (``bone_0 .. bone_51``) to standard
names BY HIERARCHY AND POSITION, never by index (references/joint-placement.md, source d):

* hips = root of the joint tree (the largest tree if there are several roots);
* from the hips: the spine = the child whose subtree reaches highest; the legs = the children whose subtrees go below the hips;
* spine chain: single-child descent until the first node whose children include two lateral chains on opposite sides (= chest);
  the nodes in between become spine_01 / spine_02 (by arc length when their number is not 2);
* at the chest: the arms = the child subtrees with the largest lateral reach on each side of the chest x; the neck = the remaining
  child whose subtree reaches highest; neck chain = neck, head (further nodes -> head);
* arm chain: single-child descent from the arm root to the first node with >= 2 children (finger roots) or a leaf. With 4 nodes:
  clavicle (Mixamo "Shoulder"), upper arm, forearm, hand; with 3: upper arm, forearm, hand; longer chains: the two longest segments
  are the upper arm and the forearm, the hand is the node right after the forearm (never the chain end: that can be a fingertip),
  and the nodes after the hand are one more finger chain;
* finger chains collapse into the hand: their weights go to ``{S}_Hand``; landmark ``hand_tip`` = where the middle finger chain
  (the finger reaching farthest along elbow->wrist) leaves the mesh, ``palm`` = mean of the non-thumb finger roots;
* leg chain: thigh, calf, foot, toe (further nodes -> toe); ``toe_tip`` = where the ray ankle->ball (horizontal) leaves the mesh;
  ground points = projections to z = 0;
* side: left = +X (subtree mean x against the chest x for arms, the hips x for legs).

Known UniRig biases (failure-catalog #13): straight limbs, no cloth bones, coordinates quantized to ~1/256 of the box (2.7 mm on D01).

Outputs per asset in ``E:\tmp_rigkit\A2\unirig\<asset>\``:
  bone_map.json          {unirig_name: standard_bone_or_null}
  unirig_joints.json     per joint: parent, children, role, side, standard bone, positions (Blender S2 and raw glTF)
  landmarks_d.json       landmarks.json format (schema 0); sources {"d": pos}; confidence; decision = method
  correspondence.json/.npz  does the UniRig GLB mesh match mesh.npz vertex-for-vertex? else nearest-point indices
  unirig_weights.npz     weights.npz format: bones = UniRig joint names, rows = OUR mesh.npz vertex order (raw UniRig skin)

``run(glb, out_dir)`` runs UniRig itself (skeleton + skin + merge) in its own venv, re-issuing the stage commands of
E:\tools\unirig\scripts\unirig_rig.py with the working directory set to a fresh per-run folder under E:\tmp_unirig\work\ (a copy
of UniRig's ``configs`` in it), so Lightning's ``lightning_logs``, the extractor's ``logs`` and every intermediate npz stay out of
E:\tools\unirig\UniRig. An exclusive lock file (E:\tmp_unirig\unirig.lock) allows one run at a time (~10 GiB VRAM, ~90 s per mesh);
only the A2 writer runs UniRig. Remaining side effects (``KNOWN_SIDE_EFFECTS``): reads of the Hugging Face cache (checkpoints
already downloaded; a missing one would be downloaded into E:\hf-cache) and Python reading - not writing, PYTHONDONTWRITEBYTECODE -
the bytecode under E:\tools\unirig. Each run snapshots the UniRig tree before and after and reports any change.

CLI:
  python unirig_bridge.py read --asset-id D01_hodling --rigged E:\tmp_unirig\out\D01_hodling\D01_hodling_rigged.glb
        --mesh E:\tmp_rigkit\A2\D01_hodling\mesh.npz [--family S] [--out E:\tmp_rigkit\A2\unirig\D01_hodling]
  python unirig_bridge.py run --glb <original.glb> --out E:\tmp_unirig\out\<asset> [--seed 12345] [--no-skin] [--keep-work]
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import landmarks as rlm, npzio, schema  # noqa: E402
from solvers import glbmesh  # noqa: E402

SCRATCH = r"E:\tmp_rigkit\A2\unirig"
UNIRIG_ROOT = r"E:\tools\unirig"
UNIRIG_PY = os.path.join(UNIRIG_ROOT, ".venv", "Scripts", "python.exe")
UNIRIG_DRIVER = os.path.join(UNIRIG_ROOT, "scripts", "unirig_rig.py")
UNIRIG_REPO = os.path.join(UNIRIG_ROOT, "UniRig")
UNIRIG_IN = r"E:\tmp_unirig\in"
UNIRIG_OUT = r"E:\tmp_unirig\out"
UNIRIG_WORK = r"E:\tmp_unirig\work"
UNIRIG_LOCK = r"E:\tmp_unirig\unirig.lock"
UNIRIG_SUFFIXES = "obj,fbx,FBX,dae,glb,gltf,vrm"
#: what a run still touches outside its own work folder and the output folder (contract deviation, reported)
KNOWN_SIDE_EFFECTS = (
    r"reads the checkpoints from the Hugging Face cache E:\hf-cache (a missing checkpoint would be downloaded there)",
    r"reads (never writes: PYTHONDONTWRITEBYTECODE=1) the bytecode caches under E:\tools\unirig\UniRig\src",
    r"bpy (UniRig's FBX/GLB I/O) may create a per-user Blender config; BLENDER_USER_* point it into the work folder",
)
#: the environment of E:\tools\unirig\scripts\env.sh (caches and temp on E:)
UNIRIG_ENV = {
    "UV_CACHE_DIR": r"E:\uv-cache",
    "UV_PYTHON_INSTALL_DIR": r"E:\tools\unirig\uv-python",
    "PIP_CACHE_DIR": r"E:\pip-cache",
    "HF_HOME": r"E:\hf-cache",
    "TORCH_HOME": r"E:\torch-cache",
    "TEMP": r"E:\tmp_unirig\tmp",
    "TMP": r"E:\tmp_unirig\tmp",
    "TMPDIR": r"E:\tmp_unirig\tmp",
    "PYTHONUTF8": "1",
    "PYTHONIOENCODING": "utf-8",
    "HF_HUB_DISABLE_SYMLINKS_WARNING": "1",
}

#: confidence of a source-d landmark by how it was obtained (consensus multiplies it with the source weight)
CONF_JOINT = 1.0
CONF_DERIVED = 0.8
CONF_FALLBACK = 0.5

# --------------------------------------------------------------------------------------------------------------------------
# reading UniRig output
# --------------------------------------------------------------------------------------------------------------------------


def read_rigged_glb(path, skin_index: int = 0) -> dict:
    """UniRig ``*_rigged.glb`` -> {"names" (k,), "parent" int (k,) (-1 = root, indices into the skin joint list), "P_gltf" (k,3) joint
    rest positions (world, glTF frame), "bind_error" max |IBM x world - I|, "V_gltf" (n,3) mesh positions, "W" float32 (n,k) dense skin,
    "n_influences_max"}. Skin joint order = the GLB's ``skins[skin_index].joints`` order (UniRig's own list, not bone_i order)."""
    js, bin_ = glbmesh.read_glb(path)
    skins = js.get("skins", [])
    if not skins:
        raise ValueError(f"{path}: no skin (was UniRig run with --skin?)")
    sk = skins[skin_index]
    joints = [int(j) for j in sk["joints"]]
    world, parent_node = glbmesh.node_world_matrices(js)
    nodes = js["nodes"]
    names = [nodes[j].get("name", f"joint_{k}") for k, j in enumerate(joints)]
    pos_of = {j: k for k, j in enumerate(joints)}
    parent = np.full(len(joints), -1, dtype=np.int64)
    for k, j in enumerate(joints):
        p = parent_node.get(j)
        while p is not None and p not in pos_of:
            p = parent_node.get(p)
        parent[k] = -1 if p is None else pos_of[p]
    P = np.array([world[j][:3, 3] for j in joints], dtype=np.float64)
    bind_err = None
    if "inverseBindMatrices" in sk:
        ibm = glbmesh.accessor(js, bin_, sk["inverseBindMatrices"]).astype(np.float64).reshape(-1, 4, 4).transpose(0, 2, 1)
        bind_err = float(max(np.abs(ibm[k] @ world[j] - np.eye(4)).max() for k, j in enumerate(joints)))
    # the skinned mesh: first node that uses this skin
    mesh_node = next((i for i, n in enumerate(nodes) if n.get("skin") == skin_index and "mesh" in n), None)
    if mesh_node is None:
        raise ValueError(f"{path}: no mesh node uses skin {skin_index}")
    prims = js["meshes"][nodes[mesh_node]["mesh"]]["primitives"]
    Vs, Ws = [], []
    for pr in prims:
        at = pr["attributes"]
        V = glbmesh.accessor(js, bin_, at["POSITION"]).astype(np.float64)
        Wd = np.zeros((len(V), len(joints)), dtype=np.float64)
        for layer in range(4):
            jk, wk = f"JOINTS_{layer}", f"WEIGHTS_{layer}"
            if jk not in at:
                break
            J = glbmesh.accessor(js, bin_, at[jk]).astype(np.int64)
            Wl = glbmesh.accessor(js, bin_, at[wk]).astype(np.float64)
            if js["accessors"][at[wk]]["componentType"] != 5126 and not js["accessors"][at[wk]].get("normalized"):
                Wl = Wl / np.iinfo(glbmesh._COMPONENT_DTYPES[js["accessors"][at[wk]]["componentType"]]).max
            rows = np.repeat(np.arange(len(V)), J.shape[1])
            np.add.at(Wd, (rows, J.ravel()), Wl.ravel())
        Vs.append(V)
        Ws.append(Wd)
    V = np.concatenate(Vs, 0)
    if not np.allclose(world[mesh_node], np.eye(4), atol=1e-9):
        # glTF ignores the skinned mesh node's own transform; positions are in bind space - keep them as they are
        pass
    W = np.concatenate(Ws, 0)
    return {"names": names, "parent": parent, "P_gltf": P, "bind_error": bind_err, "V_gltf": V, "W": W.astype(np.float32),
            "n_influences_max": int((W > 1e-6).sum(1).max()) if len(W) else 0, "file": os.path.abspath(os.fspath(path)),
            "sha256": glbmesh.sha256_file(path)}


def to_mesh_frame(P_gltf, scale_factor: float, z_offset: float = 0.0) -> np.ndarray:
    """glTF positions of the original GLB -> Blender frame after S2 (``scale_factor``, ``z_offset`` from mesh.npz meta)."""
    P = glbmesh.gltf_to_blender(P_gltf) * float(scale_factor)
    P[..., 2] += float(z_offset or 0.0)
    return P


# --------------------------------------------------------------------------------------------------------------------------
# joint tree -> standard roles
# --------------------------------------------------------------------------------------------------------------------------


def _children(parent) -> list[list[int]]:
    ch: list[list[int]] = [[] for _ in range(len(parent))]
    for i, p in enumerate(parent):
        if p >= 0:
            ch[int(p)].append(i)
    return ch


def _subtree(i: int, ch) -> list[int]:
    out, st = [], [i]
    while st:
        k = st.pop()
        out.append(k)
        st.extend(ch[k])
    return out


def _chain(i: int, ch) -> list[int]:
    """Single-child descent from ``i``: [i, c1, c2, ...]; stops at the first node with 0 or >= 2 children (included)."""
    out = [i]
    while len(ch[out[-1]]) == 1:
        out.append(ch[out[-1]][0])
    return out


def map_joints(names, parent, P) -> dict:
    """Roles of the joints of a humanoid tree (see the module docstring). ``P`` (k,3) Blender frame.

    Returns ``{"joints": [{name, role, side, bone}], "pelvis": i, "spine": [..], "chest": i, "neck": [..], "arms": {S: {clavicle,
    upperarm, forearm, hand, fingers: [[..]]}}, "legs": {S: {thigh, calf, foot, toe, extra: [..]}}, "notes": [..]}`` (indices into the
    joint list; missing parts are None). Raises ValueError when the tree is not a biped (no spine with two arms, or not two legs)."""
    names = list(names)
    parent = np.asarray(parent)
    P = np.asarray(P, dtype=np.float64)
    k = len(names)
    ch = _children(parent)
    roots = [i for i in range(k) if parent[i] < 0]
    if not roots:
        raise ValueError("map_joints: no root joint")
    sizes = {r: len(_subtree(r, ch)) for r in roots}
    root = max(roots, key=lambda r: sizes[r])
    notes = []
    if len(roots) > 1:
        notes.append(f"{len(roots)} roots; using {names[root]} (largest tree)")
    zs = P[:, 2]
    height = float(zs[_subtree(root, ch)].max() - zs[_subtree(root, ch)].min())
    role = {i: ("extra", None) for i in range(k)}
    bone: dict[int, str | None] = {i: None for i in range(k)}

    # pelvis: the root; if the root has a single child, descend to the first branch (those nodes also map to pelvis)
    pelvis_chain = _chain(root, ch)
    branch = pelvis_chain[-1]
    for i in pelvis_chain:
        role[i] = ("pelvis", None)
        bone[i] = "pelvis"
    kids = ch[branch]
    if len(kids) < 3:
        raise ValueError(f"map_joints: the hips branch {names[branch]} has {len(kids)} children; expected spine + 2 legs")
    top = {c: float(zs[_subtree(c, ch)].max()) for c in kids}
    low = {c: float(zs[_subtree(c, ch)].min()) for c in kids}
    spine0 = max(kids, key=lambda c: top[c])
    xc_hips = float(P[root, 0])
    legs_c = [c for c in kids if c != spine0 and low[c] < zs[branch] - 0.25 * height]
    if len(legs_c) < 2:
        raise ValueError("map_joints: fewer than two leg chains below the hips")
    if len(legs_c) > 2:  # keep the two that reach lowest, one per side
        legs_c = sorted(legs_c, key=lambda c: low[c])[:2]
        notes.append("more than two downward chains at the hips; kept the two lowest")

    # spine chain up to the chest (the node whose children hold two lateral chains on opposite sides)
    spine, cur, chest = [], spine0, None
    while True:
        spine.append(cur)
        kc = ch[cur]
        if len(kc) >= 2:
            xc = float(P[cur, 0])
            reach = {c: float(np.abs(P[_subtree(c, ch), 0] - xc).max()) for c in kc}
            sgn = {c: float(np.mean(P[_subtree(c, ch), 0]) - xc) for c in kc}
            pos = [c for c in kc if sgn[c] > 0 and reach[c] > 0.15 * height]
            neg = [c for c in kc if sgn[c] < 0 and reach[c] > 0.15 * height]
            if pos and neg:
                chest = cur
                break
            cur = max(kc, key=lambda c: float(zs[_subtree(c, ch)].max()))  # keep climbing
            notes.append(f"spine node {names[spine[-1]]} branches without arms; climbing into {names[cur]}")
            continue
        if len(kc) == 0:
            break
        cur = kc[0]
    if chest is None:
        raise ValueError("map_joints: no chest (a spine node with two lateral arm chains)")
    spine_mid = spine[:-1]

    # spine_01 / spine_02 among the intermediate nodes (arc length from pelvis to chest)
    pts = np.concatenate([P[[root]], P[spine]], 0)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    s = s / max(s[-1], 1e-12)
    std_spine: dict[str, int | None] = {"spine_01": None, "spine_02": None}
    if len(spine_mid) == 2:
        std_spine = {"spine_01": spine_mid[0], "spine_02": spine_mid[1]}
    elif spine_mid:
        frac = s[1:-1]
        i1 = int(np.argmin(np.abs(frac - 1 / 3)))
        std_spine["spine_01"] = spine_mid[i1]
        rest = [j for j in range(len(spine_mid)) if j != i1]
        if rest:
            i2 = min(rest, key=lambda j: abs(frac[j] - 2 / 3))
            std_spine["spine_02"] = spine_mid[i2]
        notes.append(f"{len(spine_mid)} spine nodes between hips and chest; picked by arc length 1/3, 2/3")
    for j, i in enumerate(spine_mid):
        nm = next((n for n, v in std_spine.items() if v == i), None)
        if nm is None:  # an extra spine node: weights go to the nearer standard spine bone
            nm = "spine_01" if s[1 + j] < 0.5 else "spine_02"
        role[i] = ("spine", None)
        bone[i] = nm
    role[chest] = ("chest", None)
    bone[chest] = "chest"

    # arms and neck at the chest
    xc = float(P[chest, 0])
    kc = ch[chest]
    reach = {c: float(np.abs(P[_subtree(c, ch), 0] - xc).max()) for c in kc}
    sgn = {c: float(np.mean(P[_subtree(c, ch), 0]) - xc) for c in kc}
    armL = max((c for c in kc if sgn[c] > 0), key=lambda c: reach[c])
    armR = max((c for c in kc if sgn[c] < 0), key=lambda c: reach[c])
    rest = [c for c in kc if c not in (armL, armR)]
    neck_chain: list[int] = []
    if rest:
        neck0 = max(rest, key=lambda c: float(zs[_subtree(c, ch)].max()))
        neck_chain = _chain(neck0, ch)
        for c in rest:
            if c != neck0:
                for i in _subtree(c, ch):
                    role[i] = ("extra", None)
                    bone[i] = "chest"
                notes.append(f"extra chest child {names[c]} -> chest")
    else:
        notes.append("no neck chain at the chest")
    neck = head = None
    if len(neck_chain) == 1:
        head = neck_chain[0]
    elif len(neck_chain) >= 2:
        neck, head = neck_chain[0], neck_chain[1]
    if neck is not None:
        role[neck] = ("neck", None)
        bone[neck] = "neck"
    if head is not None:
        for i in _subtree(head, ch):
            role[i] = ("head", None) if i == head else ("head_extra", None)
            bone[i] = "head"

    arms = {}
    for side, a0 in (("L", armL), ("R", armR)):
        chain = _chain(a0, ch)
        hand = chain[-1]
        n = len(chain)
        clav = upper = fore = None
        tail: list[int] = []
        if n == 4:
            clav, upper, fore = chain[0], chain[1], chain[2]
        elif n == 3:
            upper, fore = chain[0], chain[1]
        elif n == 2:
            upper = chain[0]
            notes.append(f"arm {side}: only two nodes before the fingers; no forearm")
        elif n > 4:
            seg = np.linalg.norm(np.diff(P[chain], axis=0), axis=1)
            order = np.argsort(-seg)
            a, b = sorted(int(x) for x in order[:2])
            upper, fore = chain[a], chain[b]
            clav = chain[0] if a > 0 else None
            hand = chain[b + 1]  # the end of the forearm segment; chain[-1] can be a fingertip (review r1)
            tail = chain[b + 2:]
            notes.append(f"arm {side}: {n} nodes; upper arm/forearm = the two longest segments, hand = the node after the forearm"
                         + (f", {len(tail)} node(s) after the hand = one finger chain" if tail else ""))
        # fingers: the hand's child chains; after a long chain the single-child tail is one finger, the branches at its end the rest
        fingers = ([tail] + [_chain(c, ch) for c in ch[tail[-1]]]) if tail else [_chain(c, ch) for c in ch[hand]]
        for i in chain:
            r, b_ = "arm", f"{side}_Hand"
            if i == clav:
                r, b_ = "clavicle", f"{side}_Clavicle"
            elif i == upper:
                r, b_ = "upperarm", f"{side}_UpperArm"
            elif i == fore:
                r, b_ = "forearm", f"{side}_ForeArm"
            elif i == hand:
                r, b_ = "hand", f"{side}_Hand"
            elif upper is not None and fore is not None and chain.index(i) < chain.index(fore):
                r, b_ = "arm_extra", (f"{side}_UpperArm" if chain.index(i) > chain.index(upper) else f"{side}_Clavicle")
            elif fore is not None and chain.index(fore) < chain.index(i) < chain.index(hand):
                r, b_ = "arm_extra", f"{side}_ForeArm"
            elif i in tail:
                continue  # a finger chain after the hand: mapped with the fingers below
            role[i] = (r, side)
            bone[i] = b_
        for fi, f in enumerate(fingers):
            for i in set(f) | set(_subtree(f[0], ch)):
                role[i] = (f"finger{fi}", side)
                bone[i] = f"{side}_Hand"
        arms[side] = {"clavicle": clav, "upperarm": upper, "forearm": fore, "hand": hand, "fingers": fingers}

    legs = {}
    for c in legs_c:
        side = "L" if float(np.mean(P[_subtree(c, ch), 0])) > xc_hips else "R"
        if side in legs:
            side = "R" if side == "L" else "L"
            notes.append("both leg chains on one side of the hips x; sides assigned by order")
        chain = _chain(c, ch)
        names_leg = ["thigh", "calf", "foot", "toe"]
        bones_leg = [f"{side}_Thigh", f"{side}_Calf", f"{side}_Foot", f"{side}_Toe"]
        part = {"thigh": None, "calf": None, "foot": None, "toe": None, "extra": []}
        for j, i in enumerate(chain):
            if j < 4:
                part[names_leg[j]] = i
                role[i] = (names_leg[j], side)
                bone[i] = bones_leg[j]
            else:
                part["extra"].append(i)
                role[i] = ("toe_extra", side)
                bone[i] = f"{side}_Toe"
        tail = ch[chain[-1]]
        for t in tail:  # a branching foot (several toes): everything below -> toe
            for i in _subtree(t, ch):
                part["extra"].append(i)
                role[i] = ("toe_extra", side)
                bone[i] = f"{side}_Toe"
        legs[side] = part
    if set(legs) != {"L", "R"}:
        raise ValueError("map_joints: could not assign one leg per side")

    joints = [{"name": names[i], "parent": (names[int(parent[i])] if parent[i] >= 0 else None), "role": role[i][0],
               "side": role[i][1], "bone": bone[i]} for i in range(k)]
    return {"joints": joints, "root": root, "pelvis": root, "spine": spine_mid, "spine_std": std_spine, "chest": chest,
            "neck": neck, "head": head, "neck_chain": neck_chain, "arms": arms, "legs": legs, "notes": notes,
            "height": height}


def bone_map(m: dict) -> dict:
    """``{unirig_name: standard_bone_or_null}`` from ``map_joints`` (fingers -> ``{S}_Hand``, extra spine -> nearest spine bone)."""
    return {j["name"]: j["bone"] for j in m["joints"]}


# --------------------------------------------------------------------------------------------------------------------------
# source-d landmarks
# --------------------------------------------------------------------------------------------------------------------------


def _tip_along(geom, p, d, max_len: float):
    """Where the ray from ``p`` along ``d`` leaves the mesh: first crossing when ``p`` is inside, second when outside; None if no
    crossing within ``max_len``."""
    if geom is None:
        return None
    d = np.asarray(d, dtype=np.float64)
    if np.linalg.norm(d) == 0:
        return None
    d = d / np.linalg.norm(d)
    t = geom.ray_hits(np.asarray(p, dtype=np.float64)[None], d[None])[0]
    inside = bool(geom.winding(np.asarray(p, dtype=np.float64)[None])[0] > 0.5)
    k = 0 if inside else 1
    if t.size > k and t[k] <= max_len:
        return np.asarray(p, dtype=np.float64) + t[k] * d
    return None


def landmarks_from_map(m: dict, P, geom=None) -> dict:
    """Source-d landmarks ``{id: {"pos": (x,y,z), "confidence": c, "method": text}}`` from ``map_joints`` output and joint positions
    ``P`` (Blender frame, S2). ``geom`` (landmarks_geo.MeshGeom of OUR mesh) is used for the tip rays; without it the tips are
    extrapolated by one segment (confidence 0.5)."""
    P = np.asarray(P, dtype=np.float64)
    out: dict[str, dict] = {}
    nm = [j["name"] for j in m["joints"]]

    def put(lid, p, conf, method):
        if p is not None:
            out[lid] = {"pos": tuple(float(c) for c in p), "confidence": float(conf), "method": method}

    put("pelvis", P[m["pelvis"]], CONF_JOINT, f"hips = tree root {nm[m['pelvis']]}")
    for lid in ("spine_01", "spine_02"):
        i = m["spine_std"].get(lid)
        if i is not None:
            put(lid, P[i], CONF_JOINT, f"spine joint {nm[i]}")
    if m["spine_std"].get("spine_01") is None or m["spine_std"].get("spine_02") is None:
        pts = np.concatenate([P[[m["pelvis"]]], P[m["spine"]], P[[m["chest"]]]], 0)
        seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
        s = np.concatenate([[0.0], np.cumsum(seg)]) / max(seg.sum(), 1e-12)
        for lid, f in (("spine_01", 1 / 3), ("spine_02", 2 / 3)):
            if lid not in out:
                put(lid, np.array([np.interp(f, s, pts[:, c]) for c in range(3)]), CONF_DERIVED,
                    f"arc length {f:.2f} of the UniRig spine polyline")
    put("chest", P[m["chest"]], CONF_JOINT, f"chest = spine branch {nm[m['chest']]}")
    if m["neck"] is not None:
        put("neck", P[m["neck"]], CONF_JOINT, f"neck joint {nm[m['neck']]}")
    if m["head"] is not None:
        put("head", P[m["head"]], CONF_JOINT, f"head joint {nm[m['head']]}")
    if len(m["neck_chain"]) >= 3:
        put("head_top", P[m["neck_chain"][-1]], CONF_DERIVED, f"head end joint {nm[m['neck_chain'][-1]]}")
    for side, a in m["arms"].items():
        if a["clavicle"] is not None:
            put(f"clavicle_{side}", P[a["clavicle"]], CONF_JOINT, f"Mixamo shoulder bone head {nm[a['clavicle']]}")
        if a["upperarm"] is not None:
            put(f"shoulder_{side}", P[a["upperarm"]], CONF_JOINT, f"upper-arm head {nm[a['upperarm']]}")
        if a["forearm"] is not None:
            put(f"elbow_{side}", P[a["forearm"]], CONF_JOINT, f"forearm head {nm[a['forearm']]}")
        hand = a["hand"]
        put(f"wrist_{side}", P[hand], CONF_JOINT, f"hand head {nm[hand]}")
        fingers = a["fingers"]
        if fingers:
            ref = P[a["forearm"]] if a["forearm"] is not None else P[m["chest"]]
            axis = P[hand] - ref
            axis = axis / max(np.linalg.norm(axis), 1e-12)
            proj_tip = [float((P[f[-1]] - P[hand]) @ axis) for f in fingers]
            mid = fingers[int(np.argmax(proj_tip))]
            tipj = P[mid[-1]]
            dirv = tipj - P[mid[-2]] if len(mid) >= 2 else tipj - P[hand]
            seglen = float(np.linalg.norm(dirv))
            tip = _tip_along(geom, tipj, dirv, max_len=3 * max(seglen, 1e-6))
            if tip is not None:
                put(f"hand_tip_{side}", tip, CONF_DERIVED, f"middle finger chain {nm[mid[0]]}..{nm[mid[-1]]}, ray to the mesh surface")
            else:
                put(f"hand_tip_{side}", tipj + dirv, CONF_FALLBACK, f"middle finger end {nm[mid[-1]]} + one segment (no surface hit)")
            bases = [f[0] for f in fingers]
            if len(bases) >= 4:
                proj_base = [float((P[b] - P[hand]) @ axis) for b in bases]
                thumb = bases[int(np.argmin(proj_base))]
                bases = [b for b in bases if b != thumb]
            put(f"palm_{side}", P[bases].mean(0), CONF_DERIVED, f"mean of {len(bases)} non-thumb finger roots")
    for side, lg in m["legs"].items():
        for lid, key in (("hip", "thigh"), ("knee", "calf"), ("ankle", "foot"), ("ball", "toe")):
            if lg[key] is not None:
                put(f"{lid}_{side}", P[lg[key]], CONF_JOINT, f"{key} head {nm[lg[key]]}")
        if lg["toe"] is not None:
            ball = P[lg["toe"]]
            put(f"ball_ground_{side}", (ball[0], ball[1], 0.0), CONF_DERIVED, "UniRig toe head projected to z = 0")
            toe_end = lg["extra"][0] if lg["extra"] else None
            if toe_end is not None:
                tip = P[toe_end]
                put(f"toe_tip_{side}", tip, CONF_JOINT, f"toe end joint {nm[toe_end]}")
            else:
                d = ball - P[lg["foot"]] if lg["foot"] is not None else np.array([0.0, -1.0, 0.0])
                d = np.array([d[0], d[1], 0.0])
                tip = _tip_along(geom, ball, d, max_len=float(np.linalg.norm(d)) * 2 + 1e-6)
                if tip is not None:
                    put(f"toe_tip_{side}", tip, CONF_DERIVED, "ray from the toe head along ankle->toe (horizontal) to the mesh surface")
            if f"toe_tip_{side}" in out:
                tp = out[f"toe_tip_{side}"]["pos"]
                put(f"toe_ground_{side}", (tp[0], tp[1], 0.0), CONF_DERIVED, "toe_tip (d) projected to z = 0")
    return out


# --------------------------------------------------------------------------------------------------------------------------
# mesh correspondence
# --------------------------------------------------------------------------------------------------------------------------


def correspondence(V_ours, V_unirig, tol: float = 1e-7) -> dict:
    """Vertex correspondence between OUR mesh (n,3) and the UniRig mesh (k,3), both Blender frame + S2.

    Exact when the counts match and every vertex is within ``tol`` metres of the same index; otherwise ``ours_to_unirig`` = index of
    the nearest UniRig vertex (scipy KD-tree). Returns {"exact", "ours_to_unirig" int32 (n,), "dist" float64 (n,), "max_dist", ...}."""
    from scipy.spatial import cKDTree

    A = np.asarray(V_ours, dtype=np.float64)
    B = np.asarray(V_unirig, dtype=np.float64)
    if len(A) == len(B):
        d = np.linalg.norm(A - B, axis=1)
        if float(d.max()) <= tol:
            return {"exact": True, "ours_to_unirig": np.arange(len(A), dtype=np.int32), "dist": d, "max_dist": float(d.max()),
                    "n_ours": int(len(A)), "n_unirig": int(len(B)), "method": f"identity (max |dV| {d.max():.3g} m <= {tol:g})"}
    dist, idx = cKDTree(B).query(A, k=1)
    return {"exact": False, "ours_to_unirig": idx.astype(np.int32), "dist": dist, "max_dist": float(dist.max()), "n_ours": int(len(A)),
            "n_unirig": int(len(B)), "method": "nearest UniRig vertex by position (KD-tree)"}


# --------------------------------------------------------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------------------------------------------------------


def _save_npz(path, **arrays) -> str:
    """np.savez_compressed through a temp file + os.replace (readers never see half a file)."""
    tmp = f"{path}.tmp{os.getpid()}"
    with open(tmp, "wb") as fh:
        np.savez_compressed(fh, **arrays)
    os.replace(tmp, path)
    return path


def process(asset_id: str, rigged_glb, mesh_npz, family: str = "H", out_dir=None) -> dict:
    """Read UniRig output for one asset and write the A2 outputs (module docstring). Returns a summary dict."""
    from solvers.landmarks_geo import MeshGeom

    out_dir = out_dir or os.path.join(SCRATCH, asset_id)
    os.makedirs(out_dir, exist_ok=True)
    mesh = npzio.load_mesh(mesh_npz)
    meta = mesh["meta"]
    H = float(meta["H"])
    f, zo = float(meta["scale_factor"]), float(meta.get("z_offset") or 0.0)
    u = read_rigged_glb(rigged_glb)
    P = to_mesh_frame(u["P_gltf"], f, zo)
    m = map_joints(u["names"], u["parent"], P)
    bmap = bone_map(m)
    geom = MeshGeom(mesh["V"], mesh["F"], mesh["weld"])
    lms = landmarks_from_map(m, P, geom)

    Vu = to_mesh_frame(u["V_gltf"], f, zo)
    corr = correspondence(mesh["V"], Vu)
    W = u["W"][corr["ours_to_unirig"]]
    npzio.write_json(os.path.join(out_dir, "bone_map.json"), bmap)
    joints = []
    for i, j in enumerate(m["joints"]):
        joints.append(dict(j, index=i, children=[m["joints"][c]["name"] for c in range(len(m["joints"])) if u["parent"][c] == i],
                           pos=[round(float(c), 6) for c in P[i]], pos_gltf=[float(c) for c in u["P_gltf"][i]]))
    npzio.write_json(os.path.join(out_dir, "unirig_joints.json"), {
        "schema": 0, "asset_id": asset_id, "source": u["file"], "source_sha256": u["sha256"], "frame": "Blender + S2 (mesh.npz)",
        "scale_factor": f, "z_offset": zo, "bind_error": u["bind_error"], "n_joints": len(joints), "notes": m["notes"],
        "structure": {"pelvis": u["names"][m["pelvis"]], "spine": [u["names"][i] for i in m["spine"]], "chest": u["names"][m["chest"]],
                      "neck_chain": [u["names"][i] for i in m["neck_chain"]],
                      "arms": {s: {k: (u["names"][v] if isinstance(v, (int, np.integer)) else
                                       [[u["names"][i] for i in fc] for fc in v] if k == "fingers" else None)
                                   for k, v in a.items()} for s, a in m["arms"].items()},
                      "legs": {s: {k: (u["names"][v] if isinstance(v, (int, np.integer)) else
                                       [u["names"][i] for i in v] if isinstance(v, list) else None)
                                   for k, v in lg.items()} for s, lg in m["legs"].items()}},
        "joints": joints})
    details = {lid: {"sources": {"d": list(e["pos"])}, "confidence": e["confidence"], "decision": f"source d: {e['method']}",
                     "flagged": False} for lid, e in lms.items()}
    rlm.save_landmarks(os.path.join(out_dir, "landmarks_d.json"), asset_id, family, H, {k: e["pos"] for k, e in lms.items()}, details)
    corr_doc = {"schema": 0, "asset_id": asset_id, "exact": corr["exact"], "method": corr["method"], "n_ours": corr["n_ours"],
                "n_unirig": corr["n_unirig"], "max_dist_m": corr["max_dist"], "mean_dist_m": float(np.mean(corr["dist"])),
                "mesh_npz": os.path.abspath(os.fspath(mesh_npz)), "rigged_glb": u["file"],
                "note": "rows of unirig_weights.npz follow OUR mesh.npz vertex order through ours_to_unirig (correspondence.npz)"}
    npzio.write_json(os.path.join(out_dir, "correspondence.json"), corr_doc)
    _save_npz(os.path.join(out_dir, "correspondence.npz"), ours_to_unirig=corr["ours_to_unirig"], dist=corr["dist"],
              exact=np.array(corr["exact"]))
    npzio.save_weights(os.path.join(out_dir, "unirig_weights.npz"), u["names"], W,
                       meta={"candidate": "unirig_raw", "params": {"source": u["file"], "source_sha256": u["sha256"],
                                                                  "correspondence": corr["method"],
                                                                  "bones": "UniRig joint names; map with bone_map.json"}})
    summary = {"asset_id": asset_id, "out_dir": out_dir, "n_joints": len(joints), "n_landmarks_d": len(lms),
               "correspondence_exact": corr["exact"], "correspondence_max_dist_m": corr["max_dist"], "bind_error": u["bind_error"],
               "notes": m["notes"], "unmapped": [j["name"] for j in m["joints"] if j["bone"] is None]}
    return summary


def _pid_alive(pid: int) -> bool:
    """Is process ``pid`` running? (Windows: OpenProcess + GetExitCodeProcess == STILL_ACTIVE)."""
    if pid <= 0:
        return False
    if os.name == "nt":
        import ctypes

        k32 = ctypes.windll.kernel32
        h = k32.OpenProcess(0x1000, False, int(pid))  # PROCESS_QUERY_LIMITED_INFORMATION
        if not h:
            return False
        code = ctypes.c_ulong()
        ok = k32.GetExitCodeProcess(h, ctypes.byref(code))
        k32.CloseHandle(h)
        return bool(ok) and code.value == 259  # STILL_ACTIVE
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


class UniRigLock:
    """Exclusive lock file for UniRig runs (one at a time: ~10 GiB VRAM). Created with O_CREAT | O_EXCL and holding the owner's pid,
    start time and input; removed on exit when it is still ours. A lock whose owner process is gone is reported as stale and only
    removed with ``break_stale=True``."""

    def __init__(self, path: str = UNIRIG_LOCK, info: dict | None = None, break_stale: bool = False):
        self.path, self.info, self.break_stale = path, dict(info or {}), break_stale
        self.token = f"{os.getpid()}-{time.time_ns()}"

    def __enter__(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        body = json.dumps({"pid": os.getpid(), "token": self.token, "started": time.strftime("%Y-%m-%d %H:%M:%S"), **self.info})
        for attempt in (0, 1):
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            except FileExistsError:
                try:
                    held = json.load(open(self.path, encoding="utf-8"))
                except (OSError, ValueError):
                    held = {}
                pid = int(held.get("pid", -1))
                if not _pid_alive(pid) and self.break_stale and attempt == 0:
                    os.remove(self.path)
                    continue
                state = "running" if _pid_alive(pid) else "STALE (owner process gone; delete the file if no UniRig run is active)"
                raise RuntimeError(f"UniRig is locked by pid {pid} since {held.get('started')} ({state}): {self.path}") from None
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(body)
            return self
        raise RuntimeError(f"could not take the UniRig lock {self.path}")

    def __exit__(self, *exc):
        try:
            if json.load(open(self.path, encoding="utf-8")).get("token") == self.token:
                os.remove(self.path)
        except (OSError, ValueError):
            pass
        return False


def tree_snapshot(root: str) -> dict:
    """{relative path: (size, mtime_ns)} of every file under ``root`` (side-effect check of a UniRig run)."""
    out = {}
    for dp, _, files in os.walk(root):
        for f in files:
            fp = os.path.join(dp, f)
            try:
                st = os.stat(fp)
            except OSError:
                continue
            out[os.path.relpath(fp, root)] = (st.st_size, st.st_mtime_ns)
    return out


def tree_diff(before: dict, after: dict) -> dict:
    """Added, removed and changed paths between two ``tree_snapshot`` results."""
    return {"added": sorted(set(after) - set(before)), "removed": sorted(set(before) - set(after)),
            "changed": sorted(k for k in set(before) & set(after) if before[k] != after[k])}


def stage_commands(py: str, inp: str, work: str, name: str, seed: int, skin: bool, faces_target_count: int, ts: str) -> list:
    r"""The stage commands of E:\tools\unirig\scripts\unirig_rig.py (2026-10-22) for a run in ``work``: [(stage, argv, output)].
    UniRig writes each npz next to its input (it joins the npz folder with the input's absolute stem), so the input copy and the
    skeleton FBX live in ``work`` and every intermediate stays there."""
    skel_fbx = os.path.join(work, f"{name}_skeleton.fbx")
    skin_fbx = os.path.join(work, f"{name}_skin.fbx")
    rigged = os.path.join(work, f"{name}_rigged.glb")

    def extract(src, npz_dir):
        return [py, "-m", "src.data.extract", "--config=configs/data/quick_inference.yaml", f"--require_suffix={UNIRIG_SUFFIXES}",
                "--force_override=true", "--num_runs=1", "--id=0", f"--time={ts}", f"--faces_target_count={faces_target_count}",
                f"--input={src}", f"--output_dir={npz_dir}"]

    run_py = os.path.join(UNIRIG_REPO, "run.py")
    cmds = [("extract_skeleton", extract(inp, os.path.join(work, "npz_skel")), None),
            ("skeleton", [py, run_py, "--task=configs/task/quick_inference_skeleton_articulationxl_ar_256.yaml", f"--seed={seed}",
                          f"--input={inp}", f"--output={skel_fbx}", f"--npz_dir={os.path.join(work, 'npz_skel')}"], skel_fbx)]
    final_src = skel_fbx
    if skin:
        cmds += [("extract_skin", extract(skel_fbx, os.path.join(work, "npz_skin")), None),
                 ("skin", [py, run_py, "--task=configs/task/quick_inference_unirig_skin.yaml", f"--seed={seed}", f"--input={skel_fbx}",
                           f"--output={skin_fbx}", f"--npz_dir={os.path.join(work, 'npz_skin')}", "--data_name=raw_data.npz"], skin_fbx)]
        final_src = skin_fbx
    cmds.append(("merge", [py, "-m", "src.inference.merge", f"--require_suffix={UNIRIG_SUFFIXES}", "--num_runs=1", "--id=0",
                           f"--source={final_src}", f"--target={inp}", f"--output={rigged}"], rigged))
    return cmds


def run(glb, out_dir=None, seed: int = 12345, skin: bool = True, timeout: float = 1800.0, work_root: str = UNIRIG_WORK,
        lock_path: str = UNIRIG_LOCK, break_stale_lock: bool = False, faces_target_count: int = 50000, keep_work: bool = True,
        dry_run: bool = False) -> dict:
    r"""Run UniRig skeleton (+ skin + merge) on ``glb`` (never on the original: copied into the run folder first).

    Takes the exclusive lock, creates ``<work_root>\<name>_<yyyymmdd_hhmmss>_<pid>\`` with a copy of UniRig's ``configs`` and runs the
    stages (``stage_commands``) in UniRig's venv with that folder as the working directory, PYTHONPATH = the UniRig repo,
    PYTHONDONTWRITEBYTECODE=1, TEMP/TMP, MPLCONFIGDIR and BLENDER_USER_* inside the folder. Copies ``<name>_skeleton.fbx``,
    ``<name>_skin.fbx`` and ``<name>_rigged.glb`` to ``out_dir`` (default E:\tmp_unirig\out\<name>) and writes ``<name>_stats.json``
    and ``run.log`` there. Returns {"rigged_glb", "stats", "log", "seconds", "work", "side_effects": {"unirig_tree": diff, "known":
    KNOWN_SIDE_EFFECTS}}; raises RuntimeError on failure. ``dry_run`` prepares the folder and returns the commands without running."""
    glb = os.path.abspath(os.fspath(glb))
    name = os.path.splitext(os.path.basename(glb))[0]
    out_dir = os.path.abspath(out_dir or os.path.join(UNIRIG_OUT, name))
    if not dry_run and (not os.path.isfile(UNIRIG_PY) or not os.path.isfile(os.path.join(UNIRIG_REPO, "run.py"))):
        raise RuntimeError(f"UniRig is not installed where INSTALL_NOTES.md says ({UNIRIG_PY}, {UNIRIG_REPO})")
    stamp = time.strftime("%Y%m%d_%H%M%S")
    work = os.path.join(os.path.abspath(work_root), f"{name}_{stamp}_{os.getpid()}")
    with UniRigLock(lock_path, {"glb": glb, "work": work}, break_stale=break_stale_lock):
        for d in (out_dir, work, os.path.join(work, "logs"), os.path.join(work, "tmp"), os.path.join(work, "npz_skel"),
                  os.path.join(work, "npz_skin"), os.path.join(work, "blender_user")):
            os.makedirs(d, exist_ok=True)
        shutil.copytree(os.path.join(UNIRIG_REPO, "configs"), os.path.join(work, "configs"))
        inp = os.path.join(work, name + ".glb")
        shutil.copyfile(glb, inp)
        env = dict(os.environ)
        env.update(UNIRIG_ENV)
        tmp = os.path.join(work, "tmp")
        env.update({"TEMP": tmp, "TMP": tmp, "TMPDIR": tmp, "PYTHONPATH": UNIRIG_REPO, "PYTHONDONTWRITEBYTECODE": "1",
                    "MPLCONFIGDIR": os.path.join(work, "mpl"), "BLENDER_USER_CONFIG": os.path.join(work, "blender_user", "config"),
                    "BLENDER_USER_SCRIPTS": os.path.join(work, "blender_user", "scripts"),
                    "BLENDER_USER_DATAFILES": os.path.join(work, "blender_user", "datafiles")})
        env["PATH"] = os.path.join(UNIRIG_ROOT, ".venv", "Scripts") + os.pathsep + env.get("PATH", "")
        cmds = stage_commands(UNIRIG_PY, inp, work, name, seed, skin, faces_target_count, time.strftime("%Y_%m_%d_%H_%M_%S"))
        if dry_run:
            return {"work": work, "commands": [c for _, c, _ in cmds], "cwd": work, "env": {k: env[k] for k in
                    ("PYTHONPATH", "PYTHONDONTWRITEBYTECODE", "TEMP", "MPLCONFIGDIR", "BLENDER_USER_CONFIG")}}
        before = tree_snapshot(UNIRIG_REPO)
        log = os.path.join(out_dir, "run.log")
        stats: dict = {"input": glb, "input_copy": inp, "seed": seed, "work": work, "cwd": work}
        t0 = time.time()
        with open(log, "w", encoding="utf-8", errors="replace") as lf:
            for stage, argv, product in cmds:
                lf.write(f"[{stage}] cwd={work}\n{' '.join(argv)}\n")
                lf.flush()
                slog = os.path.join(work, "logs", f"{stage}.log")
                ts = time.time()
                with open(slog, "w", encoding="utf-8", errors="replace") as sf:
                    p = subprocess.run(argv, cwd=work, env=env, stdout=sf, stderr=subprocess.STDOUT, timeout=timeout)
                stats[stage] = {"seconds": round(time.time() - ts, 1), "rc": p.returncode, "log": slog}
                lf.write(f"[{stage}] rc={p.returncode} {stats[stage]['seconds']} s\n")
                if p.returncode != 0 or (product and not os.path.isfile(product)):
                    lf.write(open(slog, encoding="utf-8", errors="replace").read()[-4000:])
                    raise RuntimeError(f"UniRig stage {stage} failed (rc={p.returncode}); see {slog}")
        diff = tree_diff(before, tree_snapshot(UNIRIG_REPO))
        outputs = {}
        for _, _, product in cmds:
            if product:
                dst = os.path.join(out_dir, os.path.basename(product))
                shutil.copyfile(product, dst)
                outputs[os.path.basename(product)] = dst
        stats.update(outputs=outputs, total_seconds=round(time.time() - t0, 1),
                     side_effects={"unirig_tree": diff, "known": list(KNOWN_SIDE_EFFECTS)})
        stats_path = os.path.join(out_dir, f"{name}_stats.json")
        with open(stats_path, "w", encoding="utf-8") as fh:
            json.dump(stats, fh, indent=2)
        if not keep_work:
            shutil.rmtree(work, ignore_errors=True)
    return {"rigged_glb": os.path.join(out_dir, f"{name}_rigged.glb"), "stats": stats_path, "log": log,
            "seconds": stats["total_seconds"], "work": work, "side_effects": stats["side_effects"]}


def main(argv=None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="UniRig bridge: read output (bone map, source-d landmarks, skin) or run UniRig")
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("read")
    r.add_argument("--asset-id", required=True)
    r.add_argument("--rigged", required=True, help="UniRig <asset>_rigged.glb")
    r.add_argument("--mesh", required=True, help="our mesh.npz (glbmesh / rigkit.meshio)")
    r.add_argument("--family", default="H")
    r.add_argument("--out", default=None)
    g = sub.add_parser("run")
    g.add_argument("--glb", required=True)
    g.add_argument("--out", default=None)
    g.add_argument("--seed", type=int, default=12345)
    g.add_argument("--no-skin", action="store_true")
    g.add_argument("--work-root", default=UNIRIG_WORK)
    g.add_argument("--break-stale-lock", action="store_true", help="remove a lock whose owner process is gone")
    g.add_argument("--no-keep-work", action="store_true", help="delete the per-run work folder after a successful run")
    a = ap.parse_args(argv)
    if a.cmd == "read":
        print(json.dumps(process(a.asset_id, a.rigged, a.mesh, a.family, a.out), default=schema.json_default))
    else:
        print(json.dumps(run(a.glb, a.out, seed=a.seed, skin=not a.no_skin, work_root=a.work_root,
                             break_stale_lock=a.break_stale_lock, keep_work=not a.no_keep_work)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

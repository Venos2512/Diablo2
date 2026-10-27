"""W04 Mire-Sucker rig: paths and constants shared by the scripts in this folder (plain Python, no bpy).

Rig at the catalogue size (rig_v1 G1 2026-10-26): wing tips 0.87 H, H = 1.8 m -> 1.566 m.
Blender space after the glTF import: Z up, the fly faces -Y (proboscis tip is the most -Y point), +X = its left.
"""
import hashlib
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)                                   # <asset>/rig
ADIR = os.path.dirname(RIG)                                   # <asset>
ROOT = os.path.abspath(os.path.join(ADIR, '..', '..', '..', '..', '..'))   # repo root
AID = 'W04_mire_sucker'
GLB = os.path.join(ADIR, AID + '.glb')
GLB_SHA256 = '4f0305c6dcb8b95a78b98a4d285b19e6d434f0f89b074d7f53fd8764fa5c890a'   # rig_v1/r0/W04_mire_sucker_r0.json
TOOLS = os.path.join(ROOT, 'ashlar', '3d', 'act-01', '_batches', 'rig_v1', 'tools')   # imported, never modified
WORK = os.path.join(RIG, '_work')
QA = os.path.join(RIG, 'qa')
BLEND = os.path.join(RIG, AID + '_rig.blend')
LOG = os.path.join(RIG, 'rig.log')

H_HUMAN = 1.8
HEIGHT_M = round(0.87 * H_HUMAN, 4)                           # 1.566 m (wing tips, catalogue)
K = HEIGHT_M / H_HUMAN                                        # 0.87

MESH = AID + '_Body'
RUNTIME = AID + '_Skeleton'                                   # runtime skeleton (deform + sockets), goes to the GLB at R8
CONTROL = AID + '_Control'                                    # control rig (ctl_*), stays in the .blend


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

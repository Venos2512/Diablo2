"""U04 joint table (Tripo units: the GLB as is, faces -Y, z up, soles/hands on z = 0) and bone layout.

Measured in R1 (rig/_work/r1_probe.json: exact sections of the body; r1_cloth.json: smock/hood/tie).
Left side only (x > 0); the right side is the mirror x -> -x. Scale to metres with S (G1 decision).
Imported by the Blender stages (no bpy here).
"""

# ---- G1 scale options: metres per Tripo unit (GLB height 0.9897 = top of the hood)
GLB_TOP = 0.9897
SCALE_OPTIONS = {
    'A': dict(label='đỉnh đầu 0,65H = 1,17 m (danh mục)', s=0.65 * 1.8 / GLB_TOP),
    'B': dict(label='đỉnh đầu 0,80H = 1,44 m (design.txt, bóng H của concept)', s=0.80 * 1.8 / GLB_TOP),
}

# ---- spine (x = 0): ~62 % of the torso depth from the belly, from the exact y-sections
J = {
    'pelvis':      (0.0, 0.200, 0.655),    # hip centre height, between the hip joints
    'spine_01':    (0.0, 0.110, 0.672),
    'spine_02':    (0.0, 0.020, 0.690),
    'chest':       (0.0, -0.070, 0.712),
    'neck':        (0.0, -0.160, 0.752),   # base of the neck (C7), behind the collar of the smock
    'neck_02':     (0.0, -0.245, 0.808),   # mid neck (60 % of the neck depth toward the nape)
    'head':        (0.0, -0.330, 0.866),   # skull base
    'head_end':    (0.0, -0.400, 0.972),   # top of the skull (H convention: head joint -> head top; same as P04, after G1)
    'mouth':       (0.0, -0.440, 0.800),   # fx_mouth: inside the gape
    'hit':         (0.0, -0.540, 0.770),   # hit_origin: in front of the open jaws
    'jaw':         (0.0, -0.360, 0.805),   # hinge: widest point of the head behind the mouth corner
    'jaw_end':     (0.0, -0.445, 0.635),   # chin (lower jaw tip)
    # arm (L)
    'clav_in':     (0.030, -0.170, 0.715),
    'shoulder':    (0.158, -0.122, 0.690),
    'elbow':       (0.225, -0.120, 0.430),
    'wrist':       (0.252, -0.168, 0.125),
    'knuckle':     (0.262, -0.245, 0.055),
    'finger_end':  (0.268, -0.330, 0.018),
    # leg (L): hip -> knee (points forward) -> hock (points back) -> ankle (heel on the floor) -> ball -> toe tip
    'hip':         (0.110, 0.200, 0.610),
    'knee':        (0.174, 0.286, 0.405),  # 2026-10-27, user's mark in the editor (side view): bend at the end of the thigh;
                                           # x = middle of the leg section there (u04_knee_probe.py)
    'hock':        (0.168, 0.410, 0.310),  # points backward (design: bent joint pointing back at ~0.22H); 'knee' until 2026-10-27
    'ankle':       (0.145, 0.440, 0.115),
    'ball':        (0.160, 0.378, 0.088),
    'toe_end':     (0.170, 0.268, 0.075),
    # tie (x = 0): knot at the throat, two ends hanging down the chest
    'tie':         (0.0, -0.250, 0.605),
    'tie_mid':     (0.0, -0.252, 0.535),
    'tie_end':     (0.0, -0.255, 0.468),
}

# smock regions (Tripo units) -> chains of 2 bones; the chain points are computed from the cloth in the stage
SMOCK_CHAINS = {
    # name: (parent, rule)  rule(x, y, z, d) on the L side or centre; d = distance to the skin
    'smock_front':      ('chest',      'vạt ngực giữa hai tay'),
    'L_smock_shoulder': ('L_Clavicle', 'vạt vai: phủ vai, rủ xuống sườn ngay sau cánh tay'),
    'L_smock_flank':    ('spine_01',   'vạt sườn sau: rủ dưới sườn và bụng'),
    'smock_back':       ('pelvis',     'vạt mông: phủ mông, rủ sau đùi'),
}

# chain roots (Tripo units): on the line where the panel leaves the skin (R1, read off the distance map r1_cloth_*.png);
# chain tips come from the lowest hem band of each region
SMOCK_ROOTS = {
    'smock_front':      (0.0, -0.205, 0.640),
    'L_smock_shoulder': (0.215, -0.070, 0.660),
    'L_smock_flank':    (0.170, 0.075, 0.600),
    'smock_back':       (0.0, 0.300, 0.640),
}


def smock_region(x, y, z, d):
    """Region of a smock vertex (L or centre names; mirror R by the sign of x)."""
    side = 'L' if x >= 0 else 'R'
    ax = abs(x)
    if y > 0.215:
        return 'smock_back'
    if y < -0.095 and ax < 0.165:
        return 'smock_front'
    if ax >= 0.165 and y < 0.03:
        return f'{side}_smock_shoulder'
    if z < 0.66 and ax > 0.03:
        return f'{side}_smock_flank'
    return None                         # lies on the back: body weights only


def mirror(p):
    return (-p[0], p[1], p[2])


def scaled(s):
    return {k: tuple(round(c * s, 5) for c in v) for k, v in J.items()}

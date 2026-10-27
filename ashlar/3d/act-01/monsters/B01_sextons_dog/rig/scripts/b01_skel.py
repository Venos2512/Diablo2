"""B01 Sexton's Dog: runtime skeleton spec (family Q), joint positions in metres at the G1 scale.

Plain Python (no bpy). Joints were read from exact plane sections of the scaled mesh (rig/_work/sec_*.png,
b01_r1_sections.py) and the textured side/front/top renders: see rig/landmarks.json for the numbers and
their source. The dog faces -Y, its left is +X, soles on z = 0. L side is given; R is the X mirror.

Bone tuple: name, parent, head, tail, roll_ref, deform, connect.
roll_ref: world vector the bone's local Z axis is aligned to (EditBone.align_roll); legs and dangling
parts use forward (-Y) so local X is the sagittal bend axis on both sides (symmetric roll).
"""
FWD = (0.0, -1.0, 0.0)
UP = (0.0, 0.0, 1.0)

# ---- joints (L side, metres). Comments: where the number comes from.
J = {
    # spine, x = 0 (midline section x=0: topline / underline; bones at ~20-35 % of the depth below the back)
    'cog':          (0.0, 0.00, 0.86),    # centre of mass: between the paws (front y -0.40, hind y +0.66), spine height
    'pelvis':       (0.0, 0.58, 0.88),    # between the hip joints, raised to the sacrum
    'spine_01':     (0.0, 0.36, 0.91),    # lumbar start (back top 1.06, belly 0.54 at y 0.36)
    'spine_02':     (0.0, 0.10, 0.90),    # thoraco-lumbar (top 1.03, belly 0.42)
    'chest':        (0.0, -0.18, 0.92),   # mid-thorax (top 1.15 with fur, sternum 0.34)
    'neck_01':      (0.0, -0.50, 0.95),   # thoracic inlet under the withers hump (top 1.25 fur, bottom 0.45)
    'neck_02':      (0.0, -0.65, 0.96),   # middle of the neck, inside the collar (collar z 0.62..1.20)
    'head':         (0.0, -0.79, 0.97),   # skull base, just in front of the collar top
    'head_end':     (0.0, -1.04, 0.86),   # along the muzzle to the nose (nose tip y -1.08, z 0.82)
    'jaw':          (0.0, -0.875, 0.82),  # jaw hinge under the ear root, behind the eye
    'jaw_end':      (0.0, -1.00, 0.665),  # chin (lower lip lobe y -1.01..-0.93, z 0.63..0.71; mouth line z ~0.71)
    'tail_01':      (0.0, 0.665, 0.895),  # tail root inside the rump (midline top 0.98, under-tail 0.59 at y 0.665)
    'tail_02':      (0.0, 0.774, 0.728),  # centreline of the x=0 section (top/bottom midpoints), arc 0.20
    'tail_03':      (0.0, 0.861, 0.571),  # arc 0.38
    'tail_04':      (0.0, 0.970, 0.454),  # arc 0.54
    'tail_end':     (0.0, 1.060, 0.380),  # tip y 1.079, z 0.367
    # ear (one flap each side, hangs flat on the head: root at the skull top, flap down to z 0.72)
    'L_ear':        (0.175, -0.80, 1.00),   # flap root (top band of the x >= 0.19 flap: 0.212, -0.794, 1.005), inside the skull side
    'L_ear_end':    (0.222, -0.848, 0.745), # towards the flap bottom (0.225, -0.854, 0.715)
    # front leg (sections x=0.17 / 0.20, y=-0.38, z=0.30; side view)
    'L_Scapula':    (0.13, -0.38, 1.07),  # dorsal border of the shoulder blade, under the withers hump
    'L_UpperArm':   (0.22, -0.52, 0.72),  # shoulder joint, ~6 cm behind the chest front (y -0.575 at z 0.72)
    'L_ForeArm':    (0.24, -0.33, 0.50),  # elbow joint, in front of the elbow point (y -0.26, z 0.55)
    'L_Hand':       (0.22, -0.39, 0.15),  # carpus: forearm column centre (x 0.22, y -0.39) at the carpal pad height
    'L_Finger':     (0.26, -0.47, 0.05),  # metacarpal pad (ball of the paw)
    'L_Finger_end': (0.28, -0.61, 0.03),  # toe tips y -0.64
    # hind leg (sections x=0.17 / 0.20, y=0.55 / 0.70, z=0.30 / 0.55)
    'L_Thigh':      (0.15, 0.58, 0.77),   # hip joint: in front of / below the point of buttock (y 0.71, z 0.80)
    'L_Calf':       (0.17, 0.49, 0.52),   # stifle, ~7 cm behind the leg front (y 0.42 at z 0.52)
    'L_Foot':       (0.175, 0.70, 0.30),  # hock joint, in front of the hock point (y 0.77, z 0.33)
    'L_Toe':        (0.21, 0.67, 0.05),   # metatarsal pad (ball of the hind paw)
    'L_Toe_end':    (0.24, 0.53, 0.03),   # toe tips y 0.50
    # collar (rigid) and the chain + brass ring (one swinging bone)
    'collar':       (0.0, -0.69, 0.90),   # collar band centre (island centroid y -0.675, z 0.85)
    'collar_end':   (0.0, -0.70, 0.67),   # front-bottom of the band where the chain hangs
    'collar_ring':  (0.0, -0.684, 0.676), # inside the top of the first chain link (z 0.684)
    'collar_ring_end': (0.0, -0.683, 0.37),   # bottom of the ring (z 0.362)
    # sockets (no weights)
    'fx_head':      (0.0, -0.90, 0.95),
    'fx_mouth':     (0.0, -1.06, 0.76),
    'fx_chest':     (0.0, -0.45, 0.75),
    'hit_origin':   (0.0, -0.80, 0.80),
}


def mirror(p):
    return (-p[0], p[1], p[2])


def bones():
    """Runtime skeleton: list of (name, parent, head, tail, roll_ref, deform, connect)."""
    j = J
    B = [
        ('root', None, (0, 0, 0), (0, 0.25, 0), UP, False, False),
        ('ground', 'root', (0, 0, 0), (0, 0.12, 0), UP, False, False),
        ('hit_origin', 'root', j['hit_origin'], (j['hit_origin'][0], j['hit_origin'][1] - 0.1, j['hit_origin'][2]), UP, False, False),
        ('cog', 'root', j['cog'], (0, j['cog'][1] - 0.25, j['cog'][2]), UP, False, False),
        ('pelvis', 'cog', j['pelvis'], j['spine_01'], UP, True, False),
        ('spine_01', 'pelvis', j['spine_01'], j['spine_02'], UP, True, True),
        ('spine_02', 'spine_01', j['spine_02'], j['chest'], UP, True, True),
        ('chest', 'spine_02', j['chest'], j['neck_01'], UP, True, True),
        ('neck_01', 'chest', j['neck_01'], j['neck_02'], UP, True, True),
        ('neck_02', 'neck_01', j['neck_02'], j['head'], UP, True, True),
        ('head', 'neck_02', j['head'], j['head_end'], UP, True, True),
        ('jaw', 'head', j['jaw'], j['jaw_end'], UP, True, False),
        ('fx_head', 'head', j['fx_head'], (0, j['fx_head'][1], j['fx_head'][2] + 0.1), FWD, False, False),
        ('fx_mouth', 'head', j['fx_mouth'], (0, j['fx_mouth'][1] - 0.1, j['fx_mouth'][2]), UP, False, False),
        ('fx_chest', 'chest', j['fx_chest'], (0, j['fx_chest'][1] - 0.1, j['fx_chest'][2]), UP, False, False),
        ('tail_01', 'pelvis', j['tail_01'], j['tail_02'], UP, True, False),
        ('tail_02', 'tail_01', j['tail_02'], j['tail_03'], UP, True, True),
        ('tail_03', 'tail_02', j['tail_03'], j['tail_04'], UP, True, True),
        ('tail_04', 'tail_03', j['tail_04'], j['tail_end'], UP, True, True),
        ('collar', 'neck_01', j['collar'], j['collar_end'], FWD, True, False),
        ('collar_ring', 'collar', j['collar_ring'], j['collar_ring_end'], FWD, True, False),
    ]
    for s, f in (('L', lambda p: p), ('R', mirror)):
        B += [
            (f'{s}_ear', 'head', f(j['L_ear']), f(j['L_ear_end']), FWD, True, False),
            (f'{s}_Scapula', 'chest', f(j['L_Scapula']), f(j['L_UpperArm']), FWD, True, False),
            (f'{s}_UpperArm', f'{s}_Scapula', f(j['L_UpperArm']), f(j['L_ForeArm']), FWD, True, True),
            (f'{s}_ForeArm', f'{s}_UpperArm', f(j['L_ForeArm']), f(j['L_Hand']), FWD, True, True),
            (f'{s}_Hand', f'{s}_ForeArm', f(j['L_Hand']), f(j['L_Finger']), FWD, True, True),
            (f'{s}_Finger', f'{s}_Hand', f(j['L_Finger']), f(j['L_Finger_end']), FWD, True, True),
            (f'{s}_Thigh', 'pelvis', f(j['L_Thigh']), f(j['L_Calf']), FWD, True, False),
            (f'{s}_Calf', f'{s}_Thigh', f(j['L_Calf']), f(j['L_Foot']), FWD, True, True),
            (f'{s}_Foot', f'{s}_Calf', f(j['L_Foot']), f(j['L_Toe']), FWD, True, True),
            (f'{s}_Toe', f'{s}_Foot', f(j['L_Toe']), f(j['L_Toe_end']), FWD, True, True),
        ]
    return B


SOCKETS = ('ground', 'hit_origin', 'fx_head', 'fx_mouth', 'fx_chest')
STRUCTURAL = ('root', 'cog')

if __name__ == '__main__':
    B = bones()
    d = [b for b in B if b[5]]
    print(len(B), 'bones,', len(d), 'deform,', len(B) - len(d), 'non-deform')
    for b in B:
        print(f'{b[0]:16s} <- {str(b[1]):12s} deform={b[5]}')

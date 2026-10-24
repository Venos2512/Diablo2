"""Stage 1 of the Sorceress -> Flagellant rig transfer: landmark table + bone placement.

Imported by build_rig.py (inside Blender). Maths only.

Conventions (Blender world, metres, +Z up, character faces -Y, character-left = +X, same as the imported Sorceress GLB):
  * "u" = Flagellant mesh units as delivered by Tripo (height 1.0). S converts u -> metres (design height ~1.8 m, brief.md).
  * CX/CY = body axis of the Flagellant in u (the Tripo mesh is not centred: head/feet sit ~+0.015 in X, torso axis ~-0.045 in Y).
"""
from mathutils import Vector

S = 1.8                      # u -> metres (brief.md: H ~ 1.8 m)
CX, CY = 0.015, -0.045       # body axis in u (measured from slices / ortho renders)
SRC_ROOT_SCALE = 1.15        # D2R root node scale (pose scale on 'root'); source world = 1.15 * node-local chain


def U(xo, y, z):
    """target landmark in metres from (x offset from body axis, absolute y, absolute z) in u."""
    return Vector(((CX + xo) * S, y * S, z * S))


def side_pair(name, xo, y, z):
    return {'R_' + name: U(-xo, y, z), 'L_' + name: U(+xo, y, z)}


def arm_pair(name, xabs, y, z):
    return {'R_' + name: U(-xabs - CX, y, z), 'L_' + name: U(+xabs - CX, y, z)}


# --- anchor landmarks (target metres), measured on tgt ortho renders with a 0.1 u grid -------------------------------
def anchors():
    A = {}
    A['root'] = U(0, CY, 0.0)
    A['translate'] = U(0, CY, 0.0)
    A['anim'] = U(0, CY, 0.0)
    A['cog'] = U(0, CY, 0.525)
    A['spine_01'] = U(0, CY, 0.527)
    A['pelvis'] = U(0, CY, 0.520)
    A['spine_02'] = U(0, CY, 0.605)
    A['chest'] = U(0, CY, 0.680)
    A['neck'] = U(0, -0.030, 0.835)
    A['head'] = U(0.005, -0.052, 0.905)
    A.update(side_pair('Clavicle', 0.032, CY + 0.005, 0.800))
    # the Tripo arms are symmetric about x = 0 while the body axis sits at x = CX: arm landmarks use absolute x
    A.update(arm_pair('UpperArm', 0.130, CY, 0.808))
    A.update(arm_pair('ForeArm', 0.250, CY, 0.808))
    A.update(arm_pair('Wrist', 0.375, CY, 0.805))
    A.update(side_pair('Thigh', 0.058, CY, 0.505))
    A.update(side_pair('Calf', 0.078, CY - 0.012, 0.290))
    A.update(side_pair('Foot', 0.100, CY, 0.085))
    A.update(side_pair('Ball', 0.100, -0.100, 0.030))
    A.update(side_pair('Toe_END', 0.100, -0.145, 0.014))
    return A


# robe / skirt bones are not anatomical: they are laid along the robe panels of the Flagellant (see report)
def skirt_targets():
    T = {}
    # front panel: 6 bones from the sash (z .655) down to the hem (z .155), inside the apron / robe front
    for i in range(6):
        z = 0.655 - i * 0.100
        T['front_skirt_front_skirt_%02d' % (i + 1)] = U(0, -0.090 - 0.060 * (i / 5.0), z)
    # back panels, left/right of the rear slit: 5 bones
    for i in range(5):
        z = 0.640 - i * 0.120
        for s, sg in (('L', 1), ('R', -1)):
            T['%s_skirt_%02d' % (s, i + 1)] = U(sg * 0.060 + sg * 0.025 * (i / 4.0), 0.015 + 0.085 * (i / 4.0), z)
    # side panels: 4 bones flaring outwards (robe hem reaches |x| ~ 0.29 u)
    for i in range(4):
        z = 0.620 - i * 0.140
        for s, sg in (('L', 1), ('R', -1)):
            xo = 0.105 + (0.620 - z) * 0.30
            T['%s_side_skirt_side_skirt_%02d' % (s, i + 1)] = U(sg * xo, CY, z)
            T['%s_heavy_side_skirt_%02d' % (s, i + 1)] = U(sg * (xo + 0.015), CY - 0.030, z)
    # rosary rope hangs at the front, character-right of centre (brief.md): the charm chain follows it
    rope = [(-0.050, 0.640), (-0.068, 0.470), (-0.095, 0.300)]
    for i, (xo, z) in enumerate(rope):
        T['front_charm_%02d' % (i + 1)] = U(xo, -0.135, z)
    T['R_front_charm_01'] = U(-0.085, -0.140, 0.560)
    T['R_front_charm_02'] = U(-0.100, -0.140, 0.380)
    T['L_front_charm_01'] = U(+0.035, -0.140, 0.560)
    T['L_front_charm_02'] = U(+0.040, -0.140, 0.420)
    return T


def segmap(a_src, b_src, a_tgt, b_tgt, p):
    """map point p expressed along/around segment a_src->b_src onto a_tgt->b_tgt (t along, perpendicular * length ratio)."""
    d = b_src - a_src
    t = (p - a_src).dot(d) / d.length_squared
    perp = p - (a_src + t * d)
    k = (b_tgt - a_tgt).length / d.length
    return a_tgt + t * (b_tgt - a_tgt) + perp * k


def place_all(src, anchors_t, skirts_t):
    """src: name -> {'head': node-chain-unit head (xyz)}; returns name -> (Vector metres, rule string)."""
    W = {n: Vector(b['head']) * SRC_ROOT_SCALE for n, b in src.items()}   # source true world heads (metres)
    out = {}
    for n, p in anchors_t.items():
        out[n] = (p, 'anchor landmark')
    for n, p in skirts_t.items():
        out[n] = (p, 'robe panel')

    # face / jaw / helmet: similarity about 'head', then eye alignment
    kf = 0.80
    face_prefixes = ('eye', 'nose', 'lid', 'cheek', 'brow', 'mouth', 'nasal', 'zygo')
    face = [n for n in src if n in ('jaw', 'helmet', 'C_nose', 'C_brow', 'C_mouth_up', 'C_mouth_low')
            or (n[:2] in ('R_', 'L_') and n[2:].startswith(face_prefixes))]
    eyes_src = (W['R_eye'] + W['L_eye']) * 0.5
    eyes_tgt = U(0.005, -0.108, 0.942)
    shift = eyes_tgt - (anchors_t['head'] + kf * (eyes_src - W['head']))
    for n in face:
        out[n] = (anchors_t['head'] + kf * (W[n] - W['head']) + shift, 'head similarity k=0.8 + eye alignment')
    # hair chains: hang from the coif knot behind the head, shrunk (the Flagellant hair is hidden under the coif)
    knot = U(0.005, 0.045, 0.925)
    for n in src:
        if 'hair' in n:
            out[n] = (knot + 0.45 * (W[n] - W['main_hair_01']), 'coif-knot chain k=0.45')
    # hands: scale about the wrist (fingers, thumb, attach points); target finger tip ~0.115 u beyond the wrist
    for s in 'RL':
        wsrc, wtgt = W[s + '_Wrist'], anchors_t[s + '_Wrist']
        tip = (W[s + '_finger_B_C'] - wsrc).length
        kh = 0.115 * S / tip
        for n in src:
            if n.startswith(s + '_') and (('finger' in n) or ('thumb' in n) or n in (s + '_weapon_attach', s + '_Wrist_END')):
                out[n] = (wtgt + kh * (W[n] - wsrc), 'hand similarity k=%.2f' % kh)
    # forearm twist helpers / elbow helper / shoulder pad
    for s in 'RL':
        for n in [x for x in src if x.startswith(s + '_forearm_')]:
            out[n] = (segmap(W[s + '_ForeArm'], W[s + '_Wrist'], anchors_t[s + '_ForeArm'], anchors_t[s + '_Wrist'], W[n]),
                      'forearm segment map')
        out[s + '_elbow_helper'] = (anchors_t[s + '_ForeArm'].copy(), 'at elbow')
        out[s + '_shoulder_pad'] = (segmap(W[s + '_Clavicle'], W[s + '_UpperArm'], anchors_t[s + '_Clavicle'],
                                           anchors_t[s + '_UpperArm'], W[s + '_shoulder_pad']), 'clavicle->shoulder segment map')
    # weapon / shield attach helpers: similarity about the chest (arm-span ratio)
    ka = (anchors_t['L_Wrist'] - anchors_t['R_Wrist']).length / (W['L_Wrist'] - W['R_Wrist']).length
    for n in ('two_hand_weapon_main', 'two_hand_weapon_attach', 'two_hand_weapon_pivot', 'R_hand_adjust', 'L_hand_adjust', 'shield_attach'):
        out[n] = (anchors_t['chest'] + ka * (W[n] - W['chest']), 'chest similarity k=%.2f' % ka)
    missing = [n for n in src if n not in out]
    assert not missing, missing
    return out

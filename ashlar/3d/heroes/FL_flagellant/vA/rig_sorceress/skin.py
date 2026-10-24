"""Stage 2: skin weights for the single Flagellant mesh on the Sorceress-named skeleton.  Imported by build_rig.py.

Blender's heat/envelope auto weights cannot be used: the D2R bones keep the Sorceress *local axes* (needed so Sorceress rotation
data stays compatible), so the Blender bone tails do not follow the limbs.  Instead each deforming bone gets a logical segment
(head joint -> next joint) with a tapered radius, and every vertex is weighted by a soft-min of "distance to the segment surface":

    w_b = exp(-(d'_b - min d') / tau),   d'_b = max(0, dist(v, segment_b) - radius_b(t))

followed by island-aware Laplacian smoothing (the Tripo mesh has 111 welded islands: robe panels, head, torso, rope knots ...),
rigid binding of small accessory islands (lantern, pouch, rope knots, bracers ...), top-4 pruning and normalisation.
All lengths below are in Flagellant mesh units (u, height 1.0); they are multiplied by rig_fit.S.
"""
import bpy, bmesh
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
import rig_fit

S = rig_fit.S
TAU = 0.020 * S            # softness of the soft-min (m)
SMOOTH_ITERS = 8
SMOOTH_LAMBDA = 0.5
MAX_INFL = 4
SPATIAL_R = 0.07           # m, neighbour radius for cross-shell smoothing of the robe
SPATIAL_ITERS = 4
SPATIAL_ZMAX = 1.20        # m, only below the sash
RIGID_MAX_EXTENT = 0.26    # m: islands smaller than this (all axes) are bound rigidly (lantern, pouch, rope knots, coif, small trims)


def segments(pos):
    """bone -> (p0, p1, r0, r1) in metres. pos: bone head positions (metres, armature space)."""
    P = lambda n: pos[n]
    seg = {}
    down = lambda p, d: p + Vector((0, 0, -d * S))

    def add(n, p0, p1, r0, r1):
        seg[n] = (p0, p1, r0 * S, r1 * S)

    add('pelvis', P('pelvis'), down(P('pelvis'), 0.05), 0.115, 0.110)
    add('spine_01', P('spine_01'), P('spine_02'), 0.115, 0.120)
    add('spine_02', P('spine_02'), P('chest'), 0.120, 0.130)
    add('chest', P('chest'), P('neck'), 0.150, 0.140)
    add('neck', P('neck'), P('head'), 0.050, 0.050)
    add('head', P('head'), P('head') + Vector((0, 0, 0.095 * S)), 0.085, 0.075)
    for s in 'RL':
        add(s + '_Clavicle', P(s + '_Clavicle'), P(s + '_UpperArm'), 0.050, 0.050)
        add(s + '_UpperArm', P(s + '_UpperArm'), P(s + '_ForeArm'), 0.055, 0.050)
        add(s + '_ForeArm', P(s + '_ForeArm'), P(s + '_Wrist'), 0.050, 0.040)
        knuckle = sum((P('%s_finger_%s_A' % (s, c)) for c in 'ABCD'), Vector()) / 4.0
        add(s + '_Wrist', P(s + '_Wrist'), knuckle, 0.035, 0.030)
        for f in ('finger_A', 'finger_B', 'finger_C', 'finger_D', 'thumb_A'):
            a, b, c = (P('%s_%s_%s' % (s, f, k)) for k in 'ABC')
            tip = c + (c - b)
            add('%s_%s_A' % (s, f), a, b, 0.014, 0.012)
            add('%s_%s_B' % (s, f), b, c, 0.012, 0.011)
            add('%s_%s_C' % (s, f), c, tip, 0.011, 0.008)
        add(s + '_Thigh', P(s + '_Thigh'), P(s + '_Calf'), 0.080, 0.065)
        add(s + '_Calf', P(s + '_Calf'), P(s + '_Foot'), 0.065, 0.050)
        add(s + '_Foot', P(s + '_Foot'), P(s + '_Ball'), 0.060, 0.055)
        add(s + '_Ball', P(s + '_Ball'), P(s + '_Toe_END'), 0.050, 0.030)

    def chain(names, r):
        for i, n in enumerate(names):
            p0 = P(n)
            p1 = P(names[i + 1]) if i + 1 < len(names) else p0 + (p0 - P(names[i - 1]))
            add(n, p0, p1, r, r)

    chain(['front_skirt_front_skirt_%02d' % i for i in range(1, 7)], 0.070)
    for s in 'LR':
        chain(['%s_skirt_%02d' % (s, i) for i in range(1, 6)], 0.060)
        chain(['%s_side_skirt_side_skirt_%02d' % (s, i) for i in range(1, 5)], 0.060)
    return seg


def seg_distance(V, p0, p1, r0, r1):
    d = p1 - p0
    L2 = d.length_squared
    a = np.array(p0); dd = np.array(d)
    t = np.clip(((V - a) @ dd) / L2, 0.0, 1.0)
    cp = a + t[:, None] * dd
    dist = np.linalg.norm(V - cp, axis=1)
    r = r0 + (r1 - r0) * t
    return np.maximum(dist - r, 0.0)


def islands(me):
    n = len(me.vertices)
    e = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', e)
    e = e.reshape(-1, 2)
    par = np.arange(n)

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a
    for a, b in e:
        ra, rb = find(a), find(b)
        if ra != rb:
            par[ra] = rb
    return np.array([find(i) for i in range(n)]), e


def run(arm, mesh, placed, stats=None):
    me = mesh.data
    n = len(me.vertices)
    V = np.empty(n * 3)
    me.vertices.foreach_get('co', V)
    V = V.reshape(-1, 3)
    pos = {b.name: Vector(b.head_local) for b in arm.data.bones}
    seg = segments(pos)
    names = list(seg)
    D = np.stack([seg_distance(V, *seg[nm]) for nm in names], axis=1)       # (n, nb)
    Wt = np.exp(-(D - D.min(axis=1, keepdims=True)) / TAU)
    Wt /= Wt.sum(axis=1, keepdims=True)

    isl, edges = islands(me)
    # --- island-aware Laplacian smoothing ---
    deg = np.bincount(edges.ravel(), minlength=n).astype(float)
    deg[deg == 0] = 1
    for _ in range(SMOOTH_ITERS):
        acc = np.zeros_like(Wt)
        np.add.at(acc, edges[:, 0], Wt[edges[:, 1]])
        np.add.at(acc, edges[:, 1], Wt[edges[:, 0]])
        Wt = (1 - SMOOTH_LAMBDA) * Wt + SMOOTH_LAMBDA * acc / deg[:, None]
    # --- spatial smoothing of the long robe region: separate cloth shells (robe, apron, inner garment, wraps) must move coherently ---
    uniq = np.unique(isl)
    boot_isl = {r for r in uniq if V[isl == r][:, 2].max() < 0.30 and V[isl == r][:, 2].mean() < 0.25}
    robe_zone = (V[:, 2] < SPATIAL_ZMAX) & (V[:, 2] > 0.12) & ~np.isin(isl, list(boot_isl))
    kd = KDTree(n)
    for i in range(n):
        kd.insert(Vector(V[i]), i)
    kd.balance()
    nbr = [None] * n
    for i in np.nonzero(robe_zone)[0]:
        nbr[i] = [j for (_, j, _) in kd.find_range(Vector(V[i]), SPATIAL_R) if robe_zone[j]]
    for _ in range(SPATIAL_ITERS):
        new = Wt.copy()
        for i in np.nonzero(robe_zone)[0]:
            new[i] = 0.35 * Wt[i] + 0.65 * Wt[nbr[i]].mean(axis=0)
        Wt = new
    # --- rigid accessory islands ---
    rigid = []
    for r in uniq:
        m = isl == r
        P = V[m]
        ext = P.max(0) - P.min(0)
        c = P.mean(0)
        is_hand = abs(c[0]) > 0.55 and c[2] > 1.30
        is_boot = c[2] < 0.25 and P[:, 2].max() < 0.30
        if ext.max() < RIGID_MAX_EXTENT and not is_hand and not is_boot:
            Wt[m] = Wt[m].mean(axis=0)
            rigid.append(int(m.sum()))
    # --- prune to MAX_INFL and normalise ---
    idx = np.argsort(-Wt, axis=1)[:, :MAX_INFL]
    keep = np.zeros_like(Wt, dtype=bool)
    np.put_along_axis(keep, idx, True, axis=1)
    Wt = np.where(keep, Wt, 0.0)
    Wt[Wt < 0.01] = 0.0
    Wt /= Wt.sum(axis=1, keepdims=True)

    # --- write vertex groups ---
    for vg in list(mesh.vertex_groups):
        mesh.vertex_groups.remove(vg)
    groups = {nm: mesh.vertex_groups.new(name=nm) for nm in names}
    for j, nm in enumerate(names):
        col = Wt[:, j]
        nz = np.nonzero(col > 0)[0]
        for vi in nz:
            groups[nm].add([int(vi)], float(col[vi]), 'REPLACE')
    for b in arm.data.bones:
        b.use_deform = b.name in groups
    mod = mesh.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    mesh.parent = arm
    mesh.matrix_parent_inverse.identity()
    info = {'weighted_bones': len(names), 'islands': int(len(uniq)), 'rigid_islands': len(rigid),
            'tau_m': TAU, 'smooth_iters': SMOOTH_ITERS, 'max_influences': MAX_INFL}
    return info

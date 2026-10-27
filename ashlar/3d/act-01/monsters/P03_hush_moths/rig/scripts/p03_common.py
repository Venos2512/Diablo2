"""P03 Hush-Moths: shared helpers for the rig scripts (import inside headless Blender 5.1).

Coordinates: Blender, metres, moth facing -Y, up +Z, the moth's LEFT = +X (glTF export turns this into +Z forward, +Y up).
The GLB is never modified: every script re-imports it with the rig_v1 intake (importer weld, uniform scale to the real
height, feet on z = 0, bbox centred in x and y).
"""
import bpy, bmesh, os, sys, math, heapq, json
import numpy as np
from mathutils import Vector, Matrix, kdtree
from mathutils.bvhtree import BVHTree

TOOLS = 'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
import rigbatch as rb  # noqa: E402

ASSET = 'P03_hush_moths'
ADIR = 'D:/Claude/Diablo2/ashlar/3d/act-01/monsters/P03_hush_moths'
GLB = ADIR + '/P03_hush_moths.glb'
H_REF = 1.8
HEIGHT_DEFAULT = round(0.33 * H_REF, 4)      # catalogue: antenna tips at 0.33 H

ROLE_COL = {'body': (0.85, 0.62, 0.52), 'head': (0.35, 0.55, 0.95), 'eye': (0.95, 0.2, 0.2), 'antenna': (0.6, 0.3, 0.9),
            'wing_F': (0.3, 0.8, 0.45), 'wing_B': (0.2, 0.75, 0.85), 'leg': (0.95, 0.8, 0.15), 'other': (1, 0, 1)}


def r4(v, n=4):
    return [round(float(x), n) for x in v]


class Moth:
    """The imported mesh + island roles. All arrays in metres."""

    def __init__(self, height=HEIGHT_DEFAULT, name=ASSET):
        self.ob, self.info = rb.intake(GLB, name, height)
        self.me = self.ob.data
        self.S = self.info['scale']
        self.CO = np.array([v.co[:] for v in self.me.vertices])
        self.N = len(self.CO)
        self.lab, self.isl = rb._islands(self.ob)
        E = np.array([e.vertices[:] for e in self.me.edges])
        self.E = E
        self.adj = [[] for _ in range(self.N)]
        for a, b in E:
            d = float(np.linalg.norm(self.CO[a] - self.CO[b]))
            self.adj[a].append((b, d)); self.adj[b].append((a, d))
        self._roles()

    # -------------------------------------------------------------- island roles (rules from the R0/R1 numbers, GLB units)
    def _roles(self):
        U = self.CO / self.S
        order = sorted(range(len(self.isl)), key=lambda i: -len(self.isl[i]))
        self.body_i = order[0]
        self.role = {}
        for i in order:
            idx = np.array(self.isl[i]); P = U[idx]; c = P.mean(0); lo = P.min(0); hi = P.max(0)
            if i == self.body_i:
                role = 'body'
            elif hi[0] - lo[0] > 0.25 and c[2] > 0.25:
                role = 'wing_F'
            elif hi[0] - lo[0] > 0.2 and 0.08 < c[2] < 0.22:
                role = 'wing_B'
            elif lo[2] < 0.02:
                role = 'leg'
            elif c[2] > 0.26 and c[1] < -0.04:
                role = 'antenna'
            elif len(idx) > 150 and abs(c[0]) < 0.02:
                role = 'head'
            elif len(idx) < 80 and c[1] < -0.06 and 0.17 < c[2] < 0.26:
                role = 'eye'
            else:
                role = 'other'
            side = '' if role in ('body', 'head') else ('L' if c[0] > 0 else 'R')
            self.role[i] = (role, side)
        # legs: name by side and front->back order of the foot tip
        self.legs = {}
        for side in ('L', 'R'):
            ids = [i for i, (ro, s) in self.role.items() if ro == 'leg' and s == side]
            ids.sort(key=lambda i: self.CO[self.isl[i]][:, 1].min())
            for k, i in enumerate(ids):
                self.legs[f'{side}_Leg{k + 1}'] = i

    def ids(self, role, side=None):
        return [i for i, (ro, s) in self.role.items() if ro == role and (side is None or s == side)]

    def verts(self, role, side=None):
        out = []
        for i in self.ids(role, side):
            out += self.isl[i]
        return np.array(sorted(out), dtype=int)

    # -------------------------------------------------------------- geodesics
    def dijkstra(self, src, allowed):
        if not hasattr(src, '__len__'):
            src = [src]
        dist = {int(s): 0.0 for s in src}; h = [(0.0, int(s)) for s in src]
        while h:
            d, a = heapq.heappop(h)
            if d > dist.get(a, 1e9):
                continue
            for b, w in self.adj[a]:
                if b in allowed and d + w < dist.get(b, 1e9):
                    dist[b] = d + w; heapq.heappush(h, (d + w, b))
        return dist

    def leg_profile(self, name, nb=28):
        """Geodesic distance from the leg's inner end (the vertex farthest from the foot tip) + bins: centroid, radius."""
        idx = np.array(self.isl[self.legs[name]]); allowed = set(int(i) for i in idx)
        P = self.CO[idx]; zmin = P[:, 2].min()
        low = idx[P[:, 2] < zmin + 0.004 * self.S]
        tip = int(max(low, key=lambda i: math.hypot(self.CO[i][0], self.CO[i][1])))
        d_tip = self.dijkstra(tip, allowed)
        root = int(max(d_tip, key=d_tip.get))
        d = self.dijkstra(root, allowed)
        verts = np.array(list(d.keys())); g = np.array([d[i] for i in verts])
        edges = np.linspace(0, g.max() + 1e-9, nb + 1); prof = []
        for k in range(nb):
            m = (g >= edges[k]) & (g < edges[k + 1])
            if m.sum() < 3:
                continue
            Q = self.CO[verts[m]]; c = Q.mean(0)
            prof.append(dict(s=float((edges[k] + edges[k + 1]) / 2), n=int(m.sum()), c=c,
                             rad=float(np.linalg.norm(Q - c, axis=1).mean())))
        return dict(idx=idx, root=root, tip=tip, geo=dict(zip(verts.tolist(), g.tolist())), length=float(g.max()), prof=prof)

    # -------------------------------------------------------------- body BVH (inside test for leg entry points)
    def body_bvh(self):
        if getattr(self, '_bvh', None) is None:
            keep = set(self.isl[self.body_i])
            faces = [list(p.vertices) for p in self.me.polygons if all(v in keep for v in p.vertices)]
            self._bvh = BVHTree.FromPolygons([Vector(p) for p in self.CO], faces)
        return self._bvh

    def inside_body(self, p):
        """Parity of ray hits along +Z and -Z and +X (majority) against the body island."""
        bvh = self.body_bvh(); votes = 0
        for d in (Vector((0, 0, 1)), Vector((0, 0, -1)), Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, -1, 0))):
            o = Vector(p); n = 0
            for _ in range(40):
                hit = bvh.ray_cast(o, d)
                if hit[0] is None:
                    break
                n += 1; o = hit[0] + d * 1e-5
            votes += n % 2
        return votes >= 3

    def role_colors(self):
        return [ROLE_COL[self.role[self.lab[i]][0]] for i in range(self.N)]


def pca(P):
    c = P.mean(0); w, V = np.linalg.eigh(np.cov((P - c).T))
    o = np.argsort(w)[::-1]
    return c, w[o], V[:, o].T


def marker_object(name, points, radius=0.004, color=(0.05, 0.05, 0.05)):
    """Icosphere markers at points (list of (xyz, rgb or None)); vertex coloured; returns the object."""
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old)
    bm = bmesh.new(); cols = []
    for it in points:
        p, c = (it if isinstance(it, tuple) and len(it) == 2 and hasattr(it[0], '__len__') else (it, None))
        n0 = len(bm.verts)
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius, matrix=Matrix.Translation(Vector(p)))
        cols += [c or color] * (len(bm.verts) - n0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    rb.set_point_colors(ob, cols)
    return ob

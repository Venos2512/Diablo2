"""solvers.proxy - watertight voxel proxy of a mesh (open, multi-island, self-intersecting is fine) and the map from the original
welded vertices to the proxy surface (owner B, P3). Runs in rigkit-env (numpy, scipy, libigl).

``build_proxy(P, F, H, res=128)``:

1. regular grid of voxel size ``h = H / res`` (metres) over the bounding box, padded by ``pad`` voxels;
2. occupancy = generalized winding number > 0.5 (``igl.fast_winding_number``: robust to holes and open cloth) OR unsigned distance
   to the surface < ``shell_vox`` x h (``igl.point_mesh_squared_distance``; keeps thin open parts such as flaps and ears);
3. internal cavities filled (``scipy.ndimage.binary_fill_holes``), optional closing of ``closing_vox`` voxels;
4. one component: every extra 6-connected component (face neighbours: the topology the extracted surface sees) is bridged to the
   largest one by a 2-voxel-thick straight line between their nearest voxels (reported in ``info["bridges"]``);
5. surface = marching cubes (``igl.marching_cubes``) of the Gaussian-smoothed occupancy (sigma ``smooth_vox`` voxels) at 0.5,
   unreferenced vertices removed, faces oriented outward; surface pieces with fewer than ``speck_frac`` of the vertices (blobs that
   the smoothing detaches at a saddle; FL had one of 6 vertices) are dropped and counted in ``info["specks_dropped"]``;
6. checks: closed and edge-manifold (every edge in exactly 2 faces), one connected component, positive volume.

The proxy keeps the occupancy grid for O(1) inside tests (``inside``, ``segment_visible``). All lengths are metres; tolerances are
relative to ``H`` or ``h``, so no x10 rescaling is needed for small assets (Blender's bone heat needed it because of its absolute
1e-4 epsilons, research/01 Q4).

``map_points(proxy, Q, N=None)``: closest point on the proxy for each query point: distance, face, barycentric coordinates and the
cosine between the query normal and the proxy normal at the closest point (Robust Skin Weights Transfer matching). That normal is
the barycentric interpolation of the proxy's vertex normals, continuous across faces: when the closest point lies on an edge or a
vertex, the face the query returns is a tie broken by rounding, and a face normal would flip the 35 deg test with it (a +0.05 m
shift of a synthetic figure changed 2 accepted vertices and the weights by 0.007).

Frame: Blender, Z up, front -Y, left +X (the functions are frame-independent).
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass, field

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import igl
from scipy import ndimage

from rigcore import mesh as rmesh
from rigcore import npzio


@dataclass
class Proxy:
    V: np.ndarray            # (p,3) proxy vertices, metres
    F: np.ndarray            # (q,3) proxy triangles (outward)
    h: float                 # voxel size, metres
    origin: np.ndarray       # (3,) centre of voxel (0,0,0)
    occ: np.ndarray          # bool (nx,ny,nz) occupancy after fill / bridges
    info: dict = field(default_factory=dict)

    @property
    def dims(self):
        return self.occ.shape

    def face_normals(self) -> np.ndarray:
        return igl.per_face_normals(self.V, self.F, np.array([0.0, 0.0, 1.0]))

    def vertex_normals(self) -> np.ndarray:
        """Area-weighted unit vertex normals (cached)."""
        if "_vn" not in self.info:
            fn = np.cross(self.V[self.F[:, 1]] - self.V[self.F[:, 0]], self.V[self.F[:, 2]] - self.V[self.F[:, 0]])
            N = np.zeros_like(self.V)
            for c in range(3):
                np.add.at(N, self.F[:, c], fn)
            nn = np.linalg.norm(N, axis=1, keepdims=True)
            self.info["_vn"] = np.where(nn > 0, N / np.maximum(nn, 1e-300), 0.0)
        return self.info["_vn"]

    def voxel_index(self, Q) -> np.ndarray:
        return np.rint((np.asarray(Q, dtype=np.float64) - self.origin) / self.h).astype(np.int64)


def _grid(P, h, pad):
    lo = P.min(0) - pad * h
    hi = P.max(0) + pad * h
    dims = np.ceil((hi - lo) / h).astype(np.int64) + 1
    return lo, dims


def _centres(origin, dims, h):
    ix, iy, iz = (np.arange(d) for d in dims)
    X, Y, Z = np.meshgrid(ix, iy, iz, indexing="ij")
    return origin + h * np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1).astype(np.float64)


def _bridge(occ, info):
    """Connect every extra 6-connected component to the largest one with a 2-voxel-thick straight line."""
    lab, n = ndimage.label(occ)
    info["components_before_bridge"] = int(n)
    if n <= 1:
        info["bridges"] = []
        return occ
    sizes = np.bincount(lab.ravel())[1:]
    main = int(np.argmax(sizes)) + 1
    bridges = []
    for c in range(1, n + 1):
        if c == main:
            continue
        lab_now, _ = ndimage.label(occ)
        main_now = lab_now[tuple(np.argwhere(lab == main)[0])]
        comp_vox = np.argwhere(lab == c)
        if lab_now[tuple(comp_vox[0])] == main_now:
            continue  # already joined through an earlier bridge
        dist, ind = ndimage.distance_transform_edt(lab_now != main_now, return_indices=True)
        d = dist[tuple(comp_vox.T)]
        a = comp_vox[int(np.argmin(d))]
        b = ind[:, a[0], a[1], a[2]]
        steps = int(np.ceil(np.linalg.norm(b - a) * 2)) + 1
        line = np.rint(a[None, :] + (b - a)[None, :] * np.linspace(0.0, 1.0, steps)[:, None]).astype(np.int64)
        for off in np.array(np.meshgrid([0, 1], [0, 1], [0, 1], indexing="ij")).reshape(3, -1).T:
            q = np.clip(line + off, 0, np.array(occ.shape) - 1)
            occ[tuple(q.T)] = True
        bridges.append({"component_voxels": int(sizes[c - 1]), "length_vox": float(np.linalg.norm(b - a))})
    info["bridges"] = bridges
    return occ


def _edge_check(F):
    E = np.sort(np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]), axis=1)
    _, cnt = np.unique(E, axis=0, return_counts=True)
    return int((cnt == 1).sum()), int((cnt > 2).sum())


def build_proxy(P, F, H, res: int = 128, pad: int = 3, shell_vox: float = 0.75, closing_vox: int = 0, smooth_vox: float = 0.7,
                wn_threshold: float = 0.5, speck_frac: float = 0.005) -> Proxy:
    """Watertight one-component proxy of the triangle mesh (P, F) (metres). See the module docstring for the steps."""
    t0 = time.time()
    P = np.asarray(P, dtype=np.float64)
    F = np.asarray(F, dtype=np.int64)
    h = float(H) / float(res)
    origin, dims = _grid(P, h, pad)
    C = _centres(origin, dims, h)
    info: dict = {"res_per_H": int(res), "voxel_m": h, "dims": [int(d) for d in dims], "shell_vox": shell_vox,
                  "closing_vox": closing_vox, "smooth_vox": smooth_vox}
    wn = igl.fast_winding_number(P, F, C)
    occ = (wn > wn_threshold).reshape(tuple(dims))
    # thin parts: distance only where a triangle sample is within 2 voxels
    near = np.zeros(tuple(dims), bool)
    samples = np.concatenate([P[F].mean(1), P, 0.5 * (P[F[:, 0]] + P[F[:, 1]]), 0.5 * (P[F[:, 1]] + P[F[:, 2]]),
                              0.5 * (P[F[:, 2]] + P[F[:, 0]])])
    vi = np.clip(np.rint((samples - origin) / h).astype(np.int64), 0, dims - 1)
    near[tuple(vi.T)] = True
    near = ndimage.binary_dilation(near, iterations=2)
    qi = np.flatnonzero(near.ravel())
    d2, _, _ = igl.point_mesh_squared_distance(C[qi], P, F)
    shell = np.zeros(int(np.prod(dims)), bool)
    shell[qi] = d2 < (shell_vox * h) ** 2
    occ |= shell.reshape(tuple(dims))
    info["occupied_wn"] = int((wn > wn_threshold).sum())
    info["occupied_shell_only"] = int((shell & ~(wn > wn_threshold)).sum())
    occ = ndimage.binary_fill_holes(occ)
    if closing_vox > 0:
        occ = ndimage.binary_closing(occ, iterations=int(closing_vox)) | occ
    occ = _bridge(occ, info)
    occ = ndimage.binary_fill_holes(occ)
    S = ndimage.gaussian_filter(occ.astype(np.float64), sigma=smooth_vox) if smooth_vox > 0 else occ.astype(np.float64)
    # libigl marching cubes: values at grid corners, x fastest
    GV = _centres(origin, dims, h)
    order = np.arange(int(np.prod(dims))).reshape(tuple(dims)).ravel(order="F")
    Vp, Fp, _ = igl.marching_cubes(S.ravel(order="F"), GV[order], int(dims[0]), int(dims[1]), int(dims[2]), 0.5)
    Vp, Fp = np.asarray(Vp, dtype=np.float64), np.asarray(Fp, dtype=np.int64)
    # merge duplicate MC vertices (shared cube edges), drop degenerate faces
    weld = rmesh.weld_map(Vp, tol_rel=1e-9)
    Vp = rmesh.welded_positions(Vp, weld, mode="first")
    Fp = rmesh.welded_faces(Fp, weld, drop_degenerate=True).astype(np.int64)
    Vp, Fp = _remove_unreferenced(Vp, Fp)
    n_c, lab_c = rmesh.connected_components(len(Vp), rmesh.unique_edges(Fp))
    sizes = np.bincount(lab_c, minlength=n_c)
    keep_c = sizes >= max(1, speck_frac * len(Vp))
    keep_c[int(np.argmax(sizes))] = True
    info["specks_dropped"] = [int(s_) for s_ in sizes[~keep_c]]
    if not keep_c.all():
        Fp = Fp[keep_c[lab_c[Fp[:, 0]]]]
        Vp, Fp = _remove_unreferenced(Vp, Fp)
    vol = float(_signed_volume(Vp, Fp))
    if vol < 0:
        Fp = Fp[:, ::-1].copy()
        vol = -vol
    n_comp, _ = rmesh.connected_components(len(Vp), rmesh.unique_edges(Fp))
    boundary, nonmanifold = _edge_check(Fp)
    info.update({"vertices": int(len(Vp)), "faces": int(len(Fp)), "volume_m3": vol, "components": int(n_comp),
                 "boundary_edges": boundary, "nonmanifold_edges": nonmanifold, "seconds": round(time.time() - t0, 2)})
    info["watertight"] = bool(boundary == 0 and nonmanifold == 0 and n_comp == 1 and vol > 0)
    return Proxy(V=Vp, F=Fp, h=h, origin=origin, occ=occ, info=info)


def _remove_unreferenced(V, F):
    used = np.zeros(len(V), bool)
    used[F.ravel()] = True
    remap = np.full(len(V), -1, dtype=np.int64)
    remap[used] = np.arange(int(used.sum()))
    return V[used], remap[F]


def _signed_volume(V, F):
    a, b, c = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    return np.einsum("ij,ij->i", a, np.cross(b, c)).sum() / 6.0


def inside(proxy: Proxy, Q, dilate: int = 0) -> np.ndarray:
    """Point-in-proxy by the occupancy grid (nearest voxel); ``dilate`` voxels of tolerance. Points outside the grid: False."""
    occ = proxy.occ if dilate <= 0 else _dilated(proxy, dilate)
    idx = proxy.voxel_index(Q)
    ok = ((idx >= 0) & (idx < np.array(occ.shape))).all(1)
    out = np.zeros(len(idx), bool)
    out[ok] = occ[tuple(idx[ok].T)]
    return out


def _dilated(proxy: Proxy, n: int):
    key = f"_occ_dil{n}"
    if key not in proxy.info:
        proxy.info[key] = ndimage.binary_dilation(proxy.occ, iterations=n)
    return proxy.info[key]


def segment_visible(proxy: Proxy, A, B, skip_vox: float = 1.5, step_vox: float = 0.5, dilate: int = 1) -> np.ndarray:
    """For segments A[i] -> B[i] (metres): True when every sample farther than ``skip_vox`` voxels from both ends lies inside the
    (dilated) occupancy grid, i.e. the straight line stays inside the solid (bone heat visibility)."""
    A = np.asarray(A, dtype=np.float64)
    B = np.asarray(B, dtype=np.float64)
    L = np.linalg.norm(B - A, axis=1)
    n_s = int(np.ceil(L.max() / (step_vox * proxy.h))) + 1 if len(L) else 1
    occ = _dilated(proxy, dilate) if dilate > 0 else proxy.occ
    vis = np.ones(len(A), bool)
    t = np.linspace(0.0, 1.0, max(n_s, 2))
    for i0 in range(0, len(A), 4096):
        a, b, l_ = A[i0:i0 + 4096], B[i0:i0 + 4096], L[i0:i0 + 4096]
        pts = a[:, None, :] + (b - a)[:, None, :] * t[None, :, None]
        dist_a = l_[:, None] * t[None, :]
        use = (dist_a > skip_vox * proxy.h) & ((l_[:, None] - dist_a) > skip_vox * proxy.h)
        idx = np.rint((pts - proxy.origin) / proxy.h).astype(np.int64)
        okb = ((idx >= 0) & (idx < np.array(occ.shape))).all(-1)
        ins = np.zeros(okb.shape, bool)
        ins[okb] = occ[tuple(idx[okb].T)]
        vis[i0:i0 + 4096] = ~(use & ~ins).any(1)
    return vis


def map_points(proxy: Proxy, Q, N=None) -> dict:
    """Closest point on the proxy for each query point ``Q`` (m,3): ``dist`` (m), ``face``, ``bary`` (m,3), ``point`` (m,3) and,
    with query normals ``N``, ``cos`` = cosine between N and the proxy normal at the closest point (barycentric interpolation of
    the vertex normals; NaN for zero normals)."""
    Q = np.asarray(Q, dtype=np.float64)
    d2, fi, Cp = igl.point_mesh_squared_distance(Q, proxy.V, proxy.F)
    fi = np.asarray(fi, dtype=np.int64)
    A, B, Cc = (proxy.V[proxy.F[fi, k]] for k in range(3))
    bary = igl.barycentric_coordinates(np.asarray(Cp, dtype=np.float64), A, B, Cc)
    bary = np.clip(np.nan_to_num(bary, nan=1.0 / 3.0), 0.0, 1.0)
    bary /= bary.sum(1, keepdims=True)
    out = {"dist": np.sqrt(np.maximum(d2, 0.0)), "face": fi, "bary": bary, "point": np.asarray(Cp)}
    if N is not None:
        VN = proxy.vertex_normals()
        tri = proxy.F[fi]
        FN = VN[tri[:, 0]] * bary[:, 0:1] + VN[tri[:, 1]] * bary[:, 1:2] + VN[tri[:, 2]] * bary[:, 2:3]
        N = np.asarray(N, dtype=np.float64)
        nn = np.linalg.norm(N, axis=1) * np.linalg.norm(FN, axis=1)
        with np.errstate(invalid="ignore", divide="ignore"):
            out["cos"] = np.where(nn > 0, np.einsum("ij,ij->i", N, FN) / nn, np.nan)
    return out


def interpolate(proxy: Proxy, values, mp: dict) -> np.ndarray:
    """Barycentric interpolation of per-proxy-vertex ``values`` (p, ...) at the mapped points ``mp`` (from ``map_points``)."""
    values = np.asarray(values)
    tri = proxy.F[mp["face"]]
    b = mp["bary"]
    return (values[tri[:, 0]] * b[:, 0:1] + values[tri[:, 1]] * b[:, 1:2] + values[tri[:, 2]] * b[:, 2:3])


def main(argv=None):
    ap = argparse.ArgumentParser(description="watertight voxel proxy of mesh.npz (welded topology)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--out", required=True, help="proxy .npz (V, F, h, origin, occ, info JSON)")
    ap.add_argument("--res", type=int, default=128, help="voxels per H")
    a = ap.parse_args(argv)
    m = npzio.load_mesh(a.mesh)
    weld = m["weld"]
    P = rmesh.welded_positions(m["V"], weld, mode="mean")
    Fw = rmesh.welded_faces(m["F"], weld, drop_degenerate=True)
    px = build_proxy(P, Fw, float(m["meta"]["H"]), res=a.res)
    import json
    info = {k: v for k, v in px.info.items() if not k.startswith("_")}
    np.savez_compressed(a.out, V=px.V, F=px.F.astype(np.int32), h=px.h, origin=px.origin, occ=px.occ, info=json.dumps(info))
    print(json.dumps(info))
    return 0 if info["watertight"] else 1


if __name__ == "__main__":
    sys.exit(main())

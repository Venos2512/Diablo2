"""Dump the scaled source mesh (raw + welded) to rig/_work/w07_mesh.npz for analysis outside Blender.

blender -b --factory-startup -P w07_r1_export.py
"""
import bpy, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C

ob, info = C.import_scaled()
me = ob.data
n = len(me.vertices)
co = np.array([v.co[:] for v in me.vertices], dtype=np.float64)
me.calc_loop_triangles()
tris = np.array([t.vertices[:] for t in me.loop_triangles], dtype=np.int64)
tri_poly = np.array([t.polygon_index for t in me.loop_triangles], dtype=np.int64)
edges = np.array([e.vertices[:] for e in me.edges], dtype=np.int64)
rep, reps = C.weld_map(ob, dist=1e-5)
lab, groups = C.welded_islands(ob, rep)
np.savez_compressed(C.WORK + '/w07_mesh.npz', co=co, tris=tris, tri_poly=tri_poly, edges=edges,
                    rep=np.array(rep), island=np.array(lab), scale=info['scale'], height=info['height_m'])
print('EXPORT_DONE', n, len(tris), len(reps), len(groups))

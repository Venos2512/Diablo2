"""Export U04 for the skill's rig editor (read only: the .blend is not saved).

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_editor.py -- editor
  -> rig/editor/U04_charnel_ghoul_rig.json (+ _rig_tex/)   runtime skeleton, skin, base colour (rc.export_rig_json)
     rig/editor/U04_charnel_ghoul_anims.json              the R5 test poses as preview loops (not clips)
then: python -I rig_v1/tools/rig_editor_safe.py rig/editor/U04_charnel_ghoul_rig.json --port 8777

Poses go through the control rig as in u04_qa.py; per frame the runtime bones are written relative to their
parent's pose (anim_core.export_actions format).
"""
import bpy, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_qa as Q                          # mode 'editor': helpers only
C = Q.C; rb = C.rb; rt = Q.rt
OUT = os.path.join(os.path.dirname(C.BLEND), 'editor'); os.makedirs(OUT, exist_ok=True)
JS = os.path.join(OUT, C.AID + '_rig.json'); AN = os.path.join(OUT, C.AID + '_anims.json')

Q.reset()
Q.ob['rig_part'] = 'Body'                   # in memory only: the editor lists the mesh as the body part
# in memory only: the editor reads a joint at the head of a bone only when it is not connected, and a connected bone under a
# humanoid body bone (neck_02 under neck, Finger under Hand, Calf_02 under Calf) would get neither a joint nor a drawn bone
rt.hide_set(False); bpy.context.view_layer.objects.active = rt; rt.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for n in ('neck_02', 'L_Finger', 'R_Finger', 'L_Calf_02', 'R_Calf_02'):
    rt.data.edit_bones[n].use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')
rc = rb.load_skill(1.0)
rc.export_rig_json(rt, JS)

BONES = [b.name for b in rt.data.bones]


def scaled(p, s):
    return dict(props=p.get('props', {}), rot={n: [x * s for x in v] for n, v in p.get('rot', {}).items()},
                loc={n: [x * s for x in v] for n, v in p.get('loc', {}).items()})


def mix(pa, pb, w):
    out = dict(props=pa.get('props', {}), rot={}, loc={})
    for k in ('rot', 'loc'):
        A, B = pa.get(k, {}), pb.get(k, {})
        for n in set(A) | set(B):
            out[k][n] = [x + (y - x) * w for x, y in zip(A.get(n, [0, 0, 0]), B.get(n, [0, 0, 0]))]
    return out


def clip(name, desc, poses):
    data = {n: {'t': [], 'q': [], 's': []} for n in BONES}; prev = {}
    for p in poses:
        Q.apply_pose(p)
        for n in BONES:
            pb = rt.pose.bones[n]
            M = pb.matrix if not pb.parent else pb.parent.matrix.inverted() @ pb.matrix
            t, q, s = M.decompose()
            if n in prev and prev[n].dot(q) < 0:          # keep quaternion signs continuous between frames
                q.negate()
            prev[n] = q; d = data[n]
            d['t'] += [round(x, 5) for x in t]
            d['q'] += [round(q.x, 5), round(q.y, 5), round(q.z, 5), round(q.w, 5)]
            d['s'] += [round(x, 4) for x in s]
    return {'name': name, 'fps': 24, 'start': 0, 'end': len(poses) - 1, 'loop': True, 'description': desc,
            'source': 'u04_editor.py (tư thế thử R5, không phải clip)', 'bones': data}


ease = lambda x: x * x * (3 - 2 * x)
RAMP = [ease(i / 12) for i in range(13)] + [1.0] * 7 + [ease(1 - i / 12) for i in range(1, 13)]   # 32 frames
P = Q.POSES
acts = [clip('00_gallop_cycle', 'Phi: pha vươn <-> pha gom (2 tư thế thử nội suy, không phải clip)',
             [mix(P['gallop_reach'], P['gallop_gather'], 0.5 - 0.5 * math.cos(2 * math.pi * i / 20)) for i in range(20)])]
for i, (n, p) in enumerate((k, v) for k, v in P.items() if k != 'rest'):
    acts.append(clip(f'{i + 1:02d}_{n}', f'Tư thế thử R5 "{n}": nghỉ -> tư thế -> nghỉ', [scaled(p, s) for s in RAMP]))
Q.reset()
with open(AN, 'w', encoding='utf-8') as fh:
    json.dump({'rig': rt.name, 'actions': acts}, fh)

with open(JS, encoding='utf-8') as fh:
    d = json.load(fh)
print('EDITOR', json.dumps({'rig_json': JS, 'anims': AN, 'bones': len(d['bones']), 'meshes': [(m['name'], m['role'], len(m['verts']) // 3) for m in d['meshes']],
                            'tex_dir': d['tex_dir'], 'joints': len(d['joints']), 'actions': len(acts)}, ensure_ascii=False))

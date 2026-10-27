"""W02 G1 joint proposal (metres, frame of the scaled GLB before the pivot shift: Z up, bird faces -Y, its left = +X).

python -I w02_g1_joints.py <out.json>

Positions read from rig/_work/r1 (probe json, slab renders, close-ups); see rig_brief.md. Right side = mirror in x.
"""
import sys, json

S = 1.6028                      # 0.89 H wingspan (1.602 m) / 0.9995 m GLB width
PIVOT_Y = -0.145                # ground point between the two feet (ball of the foot); mesh shifted by -PIVOT_Y at R2

B = []                          # name, parent, head, tail, kind


def bone(name, parent, head, tail, kind):
    B.append(dict(name=name, parent=parent, head=list(head), tail=list(tail), kind=kind))


bone('root', None, (0, PIVOT_Y, 0), (0, PIVOT_Y - 0.10, 0), 'base')
bone('cog', 'root', (0, -0.075, 0.37), (0, -0.075, 0.45), 'base')
bone('pelvis', 'cog', (0, -0.035, 0.355), (0, -0.09, 0.405), 'spine')
bone('spine_01', 'pelvis', (0, -0.09, 0.405), (0, -0.14, 0.445), 'spine')
bone('chest', 'spine_01', (0, -0.14, 0.445), (0, -0.185, 0.48), 'spine')
bone('neck_01', 'chest', (0, -0.185, 0.48), (0, -0.215, 0.50), 'neck')
bone('neck_02', 'neck_01', (0, -0.215, 0.50), (0, -0.243, 0.508), 'neck')
bone('neck_03', 'neck_02', (0, -0.243, 0.508), (0, -0.27, 0.505), 'neck')
bone('head', 'neck_03', (0, -0.27, 0.505), (0, -0.355, 0.49), 'head')
bone('beak', 'head', (0, -0.35, 0.462), (0, -0.425, 0.43), 'head')
bone('tail_01', 'pelvis', (0, 0.075, 0.37), (0, 0.24, 0.27), 'tail')
bone('tail_02', 'tail_01', (0, 0.24, 0.27), (0, 0.42, 0.16), 'tail')
for sd, sx in (('L', 1), ('R', -1)):
    def m(p):
        return (sx * p[0], p[1], p[2])
    bone(f'{sd}_Thigh', 'pelvis', m((0.075, -0.035, 0.355)), m((0.10, -0.165, 0.275)), 'leg')
    bone(f'{sd}_Calf', f'{sd}_Thigh', m((0.10, -0.165, 0.275)), m((0.097, -0.08, 0.155)), 'leg')
    bone(f'{sd}_Foot', f'{sd}_Calf', m((0.097, -0.08, 0.155)), m((0.135, -0.13, 0.032)), 'leg')
    bone(f'{sd}_Toe', f'{sd}_Foot', m((0.135, -0.13, 0.032)), m((0.15, -0.265, 0.012)), 'leg')
    bone(f'{sd}_Wing_01', 'chest', m((0.09, -0.175, 0.505)), m((0.27, -0.18, 0.575)), 'wing')
    bone(f'{sd}_Wing_02', f'{sd}_Wing_01', m((0.27, -0.18, 0.575)), m((0.46, -0.18, 0.64)), 'wing')
    bone(f'{sd}_Wing_03', f'{sd}_Wing_02', m((0.46, -0.18, 0.64)), m((0.79, -0.175, 0.69)), 'wing')
    bone(f'fx_wing_{sd}', f'{sd}_Wing_03', m((0.46, -0.18, 0.64)), m((0.46, -0.18, 0.67)), 'socket')
bone('ground', 'root', (0, PIVOT_Y, 0), (0, PIVOT_Y, 0.03), 'socket')
bone('hit_origin', 'head', (0, -0.43, 0.425), (0, -0.46, 0.425), 'socket')
bone('fx_head', 'head', (0, -0.32, 0.52), (0, -0.32, 0.55), 'socket')
bone('fx_chest', 'chest', (0, -0.20, 0.40), (0, -0.23, 0.40), 'socket')

# control rig (never exported): shown as markers on the proposal sheet
CTL = [dict(name='ctl_root', at=(0, PIVOT_Y, 0), shape='ring', r=0.30),
       dict(name='ctl_cog', at=(0, -0.075, 0.37), shape='ring', r=0.17)]
for sd, sx in (('L', 1), ('R', -1)):
    CTL += [dict(name=f'ctl_{sd}_Foot_IK', at=(sx * 0.14, -0.15, 0.0), shape='box', r=0.07),
            dict(name=f'ctl_{sd}_Knee_pole', at=(sx * 0.11, -0.40, 0.29), shape='diamond', r=0.02),
            dict(name=f'ctl_{sd}_Toe', at=(sx * 0.135, -0.13, 0.032), shape='diamond', r=0.015),
            dict(name=f'ctl_{sd}_Wing_fold', at=(sx * 0.22, -0.18, 0.80), shape='slider', r=0.06)]
deform = [b['name'] for b in B if b['kind'] not in ('base', 'socket')]
out = dict(scale=S, pivot_y=PIVOT_Y, bones=B, ctl=CTL, n_bones=len(B), n_deform=len(deform), deform=deform,
           sockets=[b['name'] for b in B if b['kind'] == 'socket'])
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1)
print('bones', len(B), 'deform', len(deform), 'sockets', len(out['sockets']))

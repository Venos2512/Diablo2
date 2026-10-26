import sys, importlib.util
from pathlib import Path
p = Path('E:/Diablo2/ashlar/art/act-02/_batches/monsters/make_act2_templates.py')
spec = importlib.util.spec_from_file_location('mt', p); mt = importlib.util.module_from_spec(spec); spec.loader.exec_module(mt)
mt.OUT = Path('E:/tmp_d03c')
mt.SPEC['D03'] = dict(name='KILN-BULL', sec='4.2', pose='tpose', lines=[(1.40, 'top of horns 1.40H', False)],
    src=[mt.S('h', '1.40H (G4), hai chân — người dùng chốt 23/10/2026', 1.40, 'H')],
    w=dict(Q=1.35, L=0.95, F=2.05),
    est=['view widths: FRONT/BACK 2.05H = T-pose span of long gorilla arms (each arm ~0.75H shoulder to knuckles)'])
print(mt.build('D03_C'))

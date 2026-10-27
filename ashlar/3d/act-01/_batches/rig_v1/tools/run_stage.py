"""Run one stage of one asset:  blender -b --factory-startup -P run_stage.py -- <asset_id> <stage> [args...]

The asset module tools/assets/<asset_id>.py defines CFG (height, paths...) and functions s1(ctx), s2(ctx)...
Each stage opens the snapshot named in its STAGES entry, runs, saves the next snapshot and logs to rig/rig.log.
"""
import sys, os, importlib, traceback, time
TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS); sys.path.insert(0, os.path.join(TOOLS, 'assets'))
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
AID, STAGE, EXTRA = argv[0], argv[1], argv[2:]
ROOT = os.path.abspath(os.path.join(TOOLS, '..', '..', '..', '..', '..', '..'))
mod = importlib.import_module(AID)
generic = getattr(mod, 'GENERIC', False)
height = mod.HEIGHT_M if generic else mod.CFG['height_m']
src = getattr(mod, 'SRC_AID', AID)          # regression runs read another asset's GLB/joints but write only to tmp
ctx = dict(aid=AID, src=src, root=ROOT, tools=TOOLS,
           adir=os.path.join(ROOT, 'ashlar', '3d', 'act-01', 'monsters', src),
           work=os.path.join(ROOT, 'tmp', 'rig_v1', AID), extra=EXTRA, cfg=getattr(mod, 'CFG', {}))
ctx['rigdir'] = os.path.join(ctx['adir'], 'rig') if src == AID else os.path.join(ctx['work'], 'rig_out')
ctx['qa'] = os.path.join(ctx['rigdir'], 'qa'); ctx['log'] = os.path.join(ctx['rigdir'], 'rig.log')
os.makedirs(ctx['work'], exist_ok=True); os.makedirs(ctx['qa'], exist_ok=True)
rb.load_skill(getattr(mod, 'K_HEIGHT', height) / rb.REF_H)    # k from the body height (a cone hood is not body)
t0 = time.time()
try:
    if generic:
        import stages
        getattr(stages, STAGE)(ctx, mod)
    else:
        getattr(mod, STAGE)(ctx)
    print(f'STAGE_OK {AID} {STAGE} {time.time() - t0:.1f}s')
except Exception:
    traceback.print_exc()
    print(f'STAGE_FAIL {AID} {STAGE}')
    sys.exit(1)

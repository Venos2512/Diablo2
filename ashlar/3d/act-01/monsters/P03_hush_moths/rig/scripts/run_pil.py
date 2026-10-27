"""Run a PIL script under `python -I`: isolated mode drops the user site-packages, which is where Pillow lives on
this machine. Adds ONLY that directory back (no cwd, no script dir, no PYTHON* env) and runs the target.

python -I run_pil.py <script.py> [args...]
"""
import os, runpy, site, sys

sys.path.append(site.getusersitepackages())
target = os.path.abspath(sys.argv[1])
sys.argv = [target] + sys.argv[2:]
runpy.run_path(target, run_name='__main__')

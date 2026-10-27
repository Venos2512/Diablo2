r"""Owner G2 (driver, rigkit-env): FL phase-G dev run on the FIXTURE plan - S4 with ``--chains``, S5 with ``--chains`` (leg push),
fixture overlay weights (body weights of the I4 FL run + chain weights on the garment rows), S7 poses (rom set: garment compounds +
chain poses), the pose export of the same rig WITHOUT chain bones for the timing comparison, garment metrics, garment sheets.

    E:\tools\rigkit-env\Scripts\python.exe -I -B tests/rigkit/G2_run_fl_fixture.py [--out E:\tmp_rigkit\G2\fl] [--only s4,s5,...]
Steps: s4 s5 weights poses poses_nochains metrics render. Every call is logged to <out>/logs; summary in <out>/run.json.
Temp files of Blender go to <out>/../tmp (C: is nearly full).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
PY = sys.executable
FL = r"E:\tmp_rigkit\I4\FL_H"
FIX = os.path.join(HERE, "G2_fixtures")
ASSET = "FL_flagellant_vA"
STEPS = ("s4", "s5", "weights", "poses", "poses_nochains", "metrics", "render")


def run(name, cmd, out, env, timeout=3600):
    os.makedirs(os.path.join(out, "logs"), exist_ok=True)
    t0 = time.time()
    p = subprocess.run(cmd, cwd=SCRIPTS, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    dt = round(time.time() - t0, 2)
    with open(os.path.join(out, "logs", f"{name}.log"), "w", encoding="utf-8") as f:
        f.write(" ".join(cmd) + f"\n\nexit {p.returncode}  seconds {dt}\n\n--- stdout ---\n{p.stdout}\n--- stderr ---\n{p.stderr}")
    last = [ln for ln in p.stdout.splitlines() if ln.strip().startswith("{")]
    res = {"exit": p.returncode, "seconds": dt}
    if last:
        try:
            res["summary"] = json.loads(last[-1])
        except ValueError:
            res["summary"] = last[-1][:400]
    if p.returncode != 0:
        raise RuntimeError(f"{name} failed (exit {p.returncode}); see {out}\\logs\\{name}.log")
    return res


def blender(script, *args):
    return [BLENDER, "-b", "--factory-startup", "-P", os.path.join(SCRIPTS, script), "--", *args]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=r"E:\tmp_rigkit\G2\fl")
    ap.add_argument("--only", default=",".join(STEPS))
    ap.add_argument("--chains", default=os.path.join(FIX, "FL_chains_fixture.json"))
    ap.add_argument("--garments", default=os.path.join(FIX, "FL_garments_fixture.npz"))
    ap.add_argument("--garments-json", default=os.path.join(FIX, "FL_garments_fixture.json"))
    a = ap.parse_args(argv)
    out = a.out
    only = set(a.only.split(","))
    os.makedirs(out, exist_ok=True)
    tmp = os.path.join(os.path.dirname(out), "tmp")
    os.makedirs(tmp, exist_ok=True)
    env = dict(os.environ, TEMP=tmp, TMP=tmp)
    blend = os.path.join(out, f"{ASSET}_rig.blend")
    s7 = os.path.join(out, "s7")
    res = {}
    if "s4" in only:
        shutil.copyfile(os.path.join(FL, "_snapshots", "S2", f"{ASSET}_rig.blend"), blend)
        shutil.copyfile(os.path.join(FL, "_snapshots", "S2", "rig_recipe.json"), os.path.join(out, "rig_recipe.json"))
        res["s4"] = run("s4", blender("rigkit/skeleton.py", "--blend", blend, "--landmarks", os.path.join(FL, "landmarks.json"),
                                      "--family", "H", "--chains", a.chains, "--out-dir", out), out, env)
    if "s5" in only:
        res["s5"] = run("s5", blender("rigkit/control.py", "--blend", blend, "--out-dir", out, "--chains", a.chains), out, env)
    if "weights" in only:
        wf = os.path.join(out, "weights_fixture.npz")
        res["overlay"] = run("overlay", [PY, "-I", "-B", os.path.join(FIX, "make_fl_fixture.py"), "--mesh", os.path.join(FL, "_work", "mesh.npz"),
                                         "--overlay", os.path.join(FL, "weights.npz"), "--overlay-out", wf, "--chains", a.chains,
                                         "--garments", a.garments], out, env)
        res["weights"] = run("weights", [BLENDER, "-b", blend, "--factory-startup", "-P", os.path.join(SCRIPTS, "rigkit", "skin_io.py"),
                                         "--", "import", "--object", ASSET, "--weights", wf, "--save", blend, "--overwrite"], out, env)
    if "poses" in only:
        res["poses"] = run("poses", blender("rigkit/poses.py", "--blend", blend, "--out-dir", s7, "--set", "rom", "--skeleton",
                                            os.path.join(out, "skeleton.json"), "--H", "1.8"), out, env)
    if "poses_nochains" in only:  # the I4 FL rig (same body weights, no chain bones): the timing reference
        res["poses_nochains"] = run("poses_nochains", blender("rigkit/poses.py", "--blend", os.path.join(FL, f"{ASSET}_rig.blend"),
                                                              "--out-dir", os.path.join(out, "s7_nochains"), "--set", "rom", "--skeleton",
                                                              os.path.join(FL, "skeleton.json"), "--H", "1.8"), out, env)
    if "metrics" in only:
        res["metrics"] = run("metrics", [PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "metrics.py"), "--mesh", os.path.join(s7, "mesh.npz"),
                                         "--poses", os.path.join(s7, "poses.npz"), "--weights", os.path.join(s7, "weights.npz"),
                                         "--out-dir", os.path.join(s7, "metrics"), "--garments", a.garments, "--garments-json",
                                         a.garments_json, "--skeleton", os.path.join(out, "skeleton.json")], out, env, timeout=7200)
    if "render" in only:
        rd = os.path.join(out, "sheets")
        res["render"] = run("render", blender("rigkit/render.py", "render", "--blend", blend, "--poses", os.path.join(s7, "poses.npz"),
                                              "--out-dir", rd, "--what", "skel,garments,cloth", "--garments", a.garments,
                                              "--mesh-npz", os.path.join(s7, "mesh.npz"), "--skeleton", os.path.join(out, "skeleton.json")),
                            out, env)
        res["compose"] = run("compose", [PY, "-I", "-B", os.path.join(SCRIPTS, "rigkit", "render.py"), "compose", "--out-dir", rd,
                                         "--poses", os.path.join(s7, "poses.npz"), "--metrics", os.path.join(s7, "metrics", "metrics.json"),
                                         "--garments-json", a.garments_json], out, env)
    prev = {}
    if os.path.exists(os.path.join(out, "run.json")):
        with open(os.path.join(out, "run.json"), "rb") as f:
            prev = json.loads(f.read().decode("utf-8"))
    prev.update(res)
    with open(os.path.join(out, "run.json"), "w", encoding="utf-8") as f:
        json.dump(prev, f, indent=1)
    print(json.dumps({"ok": True, "steps": {k: v.get("seconds") for k, v in res.items()}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Unit/dry-run checks. Run:  python -m unittest E:/Diablo2/ashlar/art/textures/terrain-biomes-v1/tools/test_tools.py -v

Uses a fake codex (this file run with FAKE_CODEX=1) and tiny synthetic PNG fixtures in temp dirs;
the real Codex CLI is never started.
"""
import contextlib
import io
import json
import os
import struct
import sys
import tempfile
import threading
import time
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_textures as gt  # noqa: E402


def make_png(path: Path, w=8, h=8, shade=100):
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    raw = b"".join(b"\x00" + bytes([shade, shade, shade]) * w for _ in range(h))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gt.PNG_SIG + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


def fake_codex_main():
    argv = sys.argv[1:]
    out = argv[argv.index("-o") + 1]
    sys.stdin.read()
    mode = os.environ["FAKE_MODE"]
    root = Path(os.environ["FAKE_GEN_ROOT"])
    thread = "T-" + str(os.getpid())
    print(json.dumps({"type": "thread.started", "thread_id": thread}), flush=True)
    if mode == "hang":
        time.sleep(120)
    if mode == "scribble":
        # misbehaving session: copies its output into the workspace (cwd) and touches textures/
        cwd = Path(argv[argv.index("-C") + 1])
        make_png(cwd / "copied-output.png", shade=9)
        tex = Path(os.environ["FAKE_TEX_DIR"])
        (tex / "BIO02_sand.png").write_bytes(b"clobbered by the model")
        (tex / "ROGUE.png").write_bytes(b"x")
    # decoy: newer file in somebody else's session that must never be picked
    make_png(root / "OTHER-SESSION" / "exec-decoy.png", shade=1)
    if mode == "nogen":
        Path(out).write_text("sorry, no image", encoding="utf-8")
        return
    src = root / thread / "exec-abc.png"
    make_png(src, shade=200)
    print(json.dumps({"type": "item.completed", "item": {"type": "agent_message", "text": str(src)}}), flush=True)
    if mode == "slowgen":  # image is on disk and announced, then the session hangs
        time.sleep(120)
    Path(out).write_text(f"`{src}`", encoding="utf-8")


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.biome = self.tmp / "biomes"
        self.gen = self.tmp / "gen"
        self.biome.mkdir()
        self.gen.mkdir()
        self.manifest = self.biome / "manifest.json"
        self.jobs = [{"id": "BIO01_peat", "biome_id": "BIO01", "name_vi": "Than bun", "material": "peat",
                      "prompt": "test brief ONE"},
                     {"id": "BIO02_sand", "biome_id": "BIO02", "name_vi": "Cat", "material": "sand",
                      "prompt": "test brief TWO"}]
        self.manifest.write_text(json.dumps(self.jobs), encoding="utf-8")

    def tearDown(self):
        self._tmp.cleanup()

    def fake_env(self, mode):
        os.environ["FAKE_MODE"] = mode
        os.environ["FAKE_GEN_ROOT"] = str(self.gen)
        os.environ["FAKE_TEX_DIR"] = str(self.biome / "textures")
        os.environ["FAKE_CODEX"] = "1"

    def base_argv(self, *extra):
        return ["--manifest", str(self.manifest), "--generated-root", str(self.gen), "--codex-exe",
                str(Path(__file__).resolve()), "--min-size", "1", "--repo-root", str(self.tmp), *extra]

    def make_runner(self, *extra, mode="ok"):
        self.fake_env(mode)
        a = gt.parse_args(self.base_argv(*extra))
        return gt.Runner(a, gt.Paths(self.biome), gt.find_codex_command(a.codex_exe))

    def state_events(self):
        f = self.biome / "logs" / "state.jsonl"
        if not f.exists():
            return []
        return [json.loads(x) for x in f.read_text(encoding="utf-8").splitlines() if x.strip()]

    def run_cli(self, *extra, mode="ok"):
        self.fake_env(mode)
        argv = self.base_argv(*extra)
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = gt.main(argv)
        return rc, buf.getvalue()


class DryRun(Base):
    def test_dry_run_plans_paths_and_writes_nothing(self):
        rc, out = self.run_cli("--dry-run", "--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        plan = json.loads(out.splitlines()[0])
        self.assertEqual(plan["id"], "BIO01_peat")
        self.assertTrue(plan["texture"].endswith(os.path.join("textures", "BIO01_peat.png")))
        self.assertTrue(plan["prompt"].endswith(os.path.join("prompts", "BIO01_peat.txt")))
        self.assertTrue(plan["jsonl"].endswith(os.path.join("logs", "BIO01_peat.jsonl")))
        self.assertTrue(plan["result"].endswith(os.path.join("logs", "BIO01_peat.result.txt")))
        a = plan["argv"]
        for flag in ("--enable", "image_generation", "-m", "gpt-6-astra", "-s", "workspace-write",
                     "--skip-git-repo-check", "-C", "--json", "-o", "project_doc_max_bytes=0"):
            self.assertIn(flag, a)
        self.assertEqual(a[-1], "-")
        # codex runs in the per-attempt scratch dir under logs/work/<id>/, never the repo root
        cwd = Path(a[a.index("-C") + 1])
        self.assertEqual(cwd.parts[-4:], ("logs", "work", "BIO01_peat", "attempt-1"))
        self.assertNotEqual(cwd, self.tmp)
        self.assertEqual(sorted(p.name for p in self.biome.iterdir()), ["manifest.json"])

    def test_sandbox_option_is_passed_through(self):
        rc, out = self.run_cli("--dry-run", "--only", "BIO01_peat", "--sandbox", "read-only")
        a = json.loads(out.splitlines()[0])["argv"]
        self.assertEqual(a[a.index("-s") + 1], "read-only")
        with self.assertRaises(SystemExit):
            gt.parse_args(["--sandbox", "danger-full-access"])

    def test_unknown_only_id_is_rejected(self):
        with self.assertRaises(SystemExit):
            self.run_cli("--dry-run", "--only", "NOPE")


class Generation(Base):
    def test_generate_copies_own_session_file_and_never_overwrites(self):
        rc, _ = self.run_cli("--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        tex = self.biome / "textures" / "BIO01_peat.png"
        self.assertTrue(tex.is_file())
        self.assertEqual(gt.read_png_info(tex), (8, 8))
        prov = json.loads((self.biome / "logs" / "BIO01_peat.provenance.json").read_text(encoding="utf-8"))
        self.assertIn("exec-abc.png", prov["source_path"])
        self.assertNotIn("OTHER-SESSION", prov["source_path"])  # decoy ignored
        self.assertEqual(prov["sha256"], gt.sha256_of(tex))
        self.assertIn("test brief ONE", (self.biome / "prompts" / "BIO01_peat.txt").read_text(encoding="utf-8"))
        self.assertTrue((self.biome / "logs" / "BIO01_peat.result.txt").is_file())
        self.assertGreater(len((self.biome / "logs" / "BIO01_peat.jsonl").read_text(encoding="utf-8").splitlines()), 2)
        # second run: skipped, bytes untouched
        before = tex.read_bytes()
        rc, out = self.run_cli("--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        self.assertIn('"event": "skipped"', out)
        self.assertEqual(tex.read_bytes(), before)

    def test_install_refuses_to_overwrite(self):
        tex = self.biome / "textures" / "BIO01_peat.png"
        make_png(tex, shade=5)
        src = self.gen / "S" / "x.png"
        make_png(src, shade=250)
        job = gt.load_manifest(self.manifest, self.tmp)[0]
        a = gt.parse_args(["--manifest", str(self.manifest), "--min-size", "1"])
        r = gt.Runner(a, gt.Paths(self.biome), ["x"])
        res = r.install(job, src, "t", [], gt.Collector(), 0, time.time())
        self.assertFalse(res["ok"])
        self.assertNotEqual(gt.sha256_of(tex), gt.sha256_of(src))

    def test_no_image_fails_and_ignores_other_sessions(self):
        rc, out = self.run_cli("--only", "BIO01_peat", mode="nogen")
        self.assertEqual(rc, 1)
        self.assertFalse((self.biome / "textures" / "BIO01_peat.png").exists())
        self.assertIn('"event": "failed"', out)

    def test_timeout_kills_and_retries_are_bounded(self):
        t0 = time.time()
        rc, out = self.run_cli("--only", "BIO01_peat", "--timeout", "2", "--retries", "1", mode="hang")
        self.assertEqual(rc, 1)
        self.assertLess(time.time() - t0, 60)
        self.assertEqual(out.count('"event": "start"'), 2)
        self.assertEqual(out.count('"event": "retry"'), 1)
        self.assertIn("timeout", out)

    def test_invalid_existing_is_quarantined_not_deleted(self):
        bad = self.biome / "textures" / "BIO01_peat.png"
        bad.parent.mkdir(parents=True)
        bad.write_bytes(b"not a png")
        rc, _ = self.run_cli("--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        kept = list((self.biome / "textures").glob("BIO01_peat.invalid-*.png"))
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0].read_bytes(), b"not a png")


class Scratch(Base):
    def test_attempt_runs_in_empty_scratch_not_repo_root(self):
        rc, _ = self.run_cli("--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        work = self.biome / "logs" / "work" / "BIO01_peat"
        self.assertEqual([d.name for d in work.iterdir()], ["attempt-1"])
        self.assertEqual(list((work / "attempt-1").iterdir()), [])
        prov = json.loads((self.biome / "logs" / "BIO01_peat.provenance.json").read_text(encoding="utf-8"))
        self.assertEqual(prov["scratch_files"], [])
        self.assertEqual(prov["sandbox"], "workspace-write")
        self.assertNotIn('"warning"', "\n".join(json.dumps(e) for e in self.state_events()))

    def test_scratch_dirs_are_never_reused(self):
        r = self.make_runner()
        first = r.make_scratch("BIO01_peat", 1)
        (first / "leftover.txt").write_text("old run", encoding="utf-8")
        second = r.make_scratch("BIO01_peat", 1)
        self.assertNotEqual(first, second)
        self.assertEqual(list(second.iterdir()), [])
        self.assertTrue((first / "leftover.txt").is_file())

    def test_scratch_files_and_texture_mutation_are_flagged(self):
        other = self.biome / "textures" / "BIO02_sand.png"
        make_png(other, shade=77)
        keep = other.read_bytes()
        rc, out = self.run_cli("--only", "BIO01_peat", mode="scribble")
        self.assertEqual(rc, 2)  # job ok but anomalies detected
        self.assertTrue((self.biome / "textures" / "BIO01_peat.png").is_file())
        warns = [e for e in self.state_events() if e["event"] == "warning"]
        kinds = {(w["kind"], w.get("file"), w.get("change")) for w in warns}
        self.assertIn(("unexpected_scratch_files", None, None), kinds)
        self.assertIn(("texture_mutation_not_by_runner", "BIO02_sand.png", "modified"), kinds)
        self.assertIn(("texture_mutation_not_by_runner", "ROGUE.png", "unexpected_new"), kinds)
        scratch_warn = next(w for w in warns if w["kind"] == "unexpected_scratch_files")
        self.assertEqual(scratch_warn["files"], ["copied-output.png"])
        prov = json.loads((self.biome / "logs" / "BIO01_peat.provenance.json").read_text(encoding="utf-8"))
        self.assertEqual(prov["scratch_files"], ["copied-output.png"])
        self.assertNotEqual(other.read_bytes(), keep)  # the fake really mutated it; runner only reported
        self.assertIn('"anomalies": 3', out)
        # the runner's own install is NOT reported as a mutation of its own texture
        self.assertNotIn("BIO01_peat.png", {w.get("file") for w in warns})

    def test_runner_own_writes_are_not_anomalies(self):
        bad = self.biome / "textures" / "BIO01_peat.png"
        bad.parent.mkdir(parents=True)
        bad.write_bytes(b"not a png")  # will be quarantined by the runner
        rc, _ = self.run_cli("--only", "BIO01_peat")
        self.assertEqual(rc, 0)
        self.assertEqual([e for e in self.state_events() if e["event"] == "warning"], [])


class Interrupt(Base):
    def test_stop_flag_blocks_spawn_in_attempt_and_run_job(self):
        r = self.make_runner("--retries", "3")
        r.stop.set()
        job = gt.load_manifest(self.manifest, self.tmp)[0]
        res = r.attempt(job, "prompt", 1)
        self.assertTrue(res.get("interrupted"))
        self.assertFalse(res["ok"])
        self.assertEqual(r.active, set())
        self.assertFalse((self.biome / "logs" / "work").exists())  # nothing allocated, nothing spawned
        out = r.run_job(job)
        self.assertEqual(out["status"], "interrupted")
        events = [e["event"] for e in self.state_events()]
        self.assertNotIn("start", events)
        self.assertFalse((self.biome / "logs" / "BIO01_peat.jsonl").exists())

    def test_kill_all_mid_attempt_prevents_retry_and_next_jobs(self):
        r = self.make_runner("--retries", "3", "--timeout", "120", mode="hang")
        jobs = gt.load_manifest(self.manifest, self.tmp)
        box = {}
        t = threading.Thread(target=lambda: box.setdefault("res", r.run_job(jobs[0])))
        t0 = time.time()
        t.start()
        deadline = time.time() + 60
        while time.time() < deadline:
            with r.lock:
                if r.active:
                    break
            time.sleep(0.1)
        self.assertTrue(r.active, "fake codex never registered")
        r.kill_all()
        t.join(60)
        self.assertFalse(t.is_alive())
        self.assertLess(time.time() - t0, 100)
        self.assertEqual(box["res"]["status"], "interrupted")
        # a job picked up by another worker afterwards must not start either
        self.assertEqual(r.run_job(jobs[1])["status"], "interrupted")
        events = [e["event"] for e in self.state_events()]
        self.assertEqual(events.count("start"), 1)
        self.assertEqual(events.count("retry"), 0)
        self.assertEqual(events.count("interrupted"), 2)
        self.assertFalse((self.biome / "textures" / "BIO01_peat.png").exists())
        self.assertEqual(r.active, set())

    def test_stop_set_before_kill_closes_the_spawn_race(self):
        # kill_all() sets the flag first; an attempt that reaches the spawn gate afterwards is refused
        r = self.make_runner(mode="hang")
        job = gt.load_manifest(self.manifest, self.tmp)[0]
        r.kill_all()
        self.assertTrue(r.stop.is_set())
        self.assertTrue(r.attempt(job, "p", 1).get("interrupted"))


class Retry(Base):
    def test_small_output_uses_min_size_and_is_retryable(self):
        rc, out = self.run_cli("--only", "BIO01_peat", "--min-size", "64", "--retries", "1")
        self.assertEqual(rc, 1)
        self.assertEqual(out.count('"event": "start"'), 2)
        self.assertEqual(out.count('"event": "retry"'), 1)
        self.assertIn("too small", out)
        self.assertFalse((self.biome / "textures" / "BIO01_peat.png").exists())

    def test_install_rejects_below_min_size_without_no_retry(self):
        r = self.make_runner("--min-size", "64")
        src = self.gen / "S" / "x.png"
        make_png(src, 8, 8)
        job = gt.load_manifest(self.manifest, self.tmp)[0]
        res = r.install(job, src, "t", [], gt.Collector(), 0, time.time())
        self.assertFalse(res["ok"])
        self.assertFalse(res.get("no_retry"))

    def test_timeout_salvages_fresh_own_session_image(self):
        t0 = time.time()
        rc, out = self.run_cli("--only", "BIO01_peat", "--timeout", "10", "--retries", "2", mode="slowgen")
        self.assertEqual(rc, 0)
        self.assertEqual(out.count('"event": "start"'), 1)  # no paid retry
        self.assertEqual(out.count('"event": "retry"'), 0)
        self.assertIn('"event": "salvaged"', out)
        self.assertTrue((self.biome / "textures" / "BIO01_peat.png").is_file())
        prov = json.loads((self.biome / "logs" / "BIO01_peat.provenance.json").read_text(encoding="utf-8"))
        self.assertIn("timeout-salvage", prov["source_how"])
        self.assertNotIn("OTHER-SESSION", prov["source_path"])
        self.assertLess(time.time() - t0, 60)


class CodexExe(Base):
    def test_explicit_shell_shims_are_rejected(self):
        for name in ("codex.cmd", "codex.ps1", "codex.bat"):
            shim = self.tmp / name
            shim.write_text("echo hi", encoding="utf-8")
            with self.assertRaises(SystemExit) as cm:
                gt.find_codex_command(str(shim))
            self.assertIn("shim", str(cm.exception))
            os.environ["CODEX_EXE"] = str(shim)
            try:
                with self.assertRaises(SystemExit):
                    gt.find_codex_command(None)
            finally:
                del os.environ["CODEX_EXE"]


class Resolve(Base):
    def test_rejects_stale_and_foreign_paths(self):
        col = gt.Collector()
        col.feed_line(json.dumps({"type": "thread.started", "thread_id": "MINE"}))
        foreign = self.gen / "OTHER" / "f.png"
        make_png(foreign)
        col.feed_line(json.dumps({"msg": str(foreign)}))
        self.assertIsNone(gt.resolve_generated(col, str(foreign), self.gen, time.time() - 10)[0])
        stale = self.gen / "MINE" / "old.png"
        make_png(stale)
        os.utime(stale, (time.time() - 3600,) * 2)
        self.assertIsNone(gt.resolve_generated(col, str(stale), self.gen, time.time())[0])
        good = self.gen / "MINE" / "new.png"
        make_png(good)
        p, how, _ = gt.resolve_generated(col, f"saved at {good}", self.gen, time.time() - 10)
        self.assertEqual(p, good.resolve())


class QA(Base):
    def test_contact_sheet_and_json(self):
        import qa_contact_sheet as qa
        for j in self.jobs:
            make_png(self.biome / "textures" / f"{j['id']}.png", 32, 32, 90)
        rc = qa.main(["--manifest", str(self.manifest), "--cell", "64"])
        self.assertEqual(rc, 0)
        rep = json.loads((self.biome / "qa" / "qa.json").read_text(encoding="utf-8"))
        self.assertEqual(len(rep["textures"]), 2)
        self.assertEqual(rep["textures"][0]["metrics"]["edge_diff_lr"], 0.0)
        self.assertIn("NOT certify", rep["note"])
        self.assertTrue((self.biome / "qa" / "contact_sheet_01.png").is_file())


if __name__ == "__main__":
    if os.environ.get("FAKE_CODEX") == "1" and "exec" in sys.argv:
        fake_codex_main()
    else:
        unittest.main()

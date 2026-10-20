#!/usr/bin/env python3
"""Codex CLI runner for the ASHLAR terrain-biomes-v1 texture jobs.

Reads manifest.json (array of {id, biome_id, name_vi, material, prompt, reference?}),
runs one `codex exec` (built-in image_gen, gpt-6-astra) per job and copies the
image that *that job's* Codex session generated into textures/{id}.png.
The runner draws nothing itself and never overwrites an existing texture.

Outputs (next to manifest.json):
  prompts/{id}.txt          exact text fed to Codex on stdin
  logs/{id}.jsonl           raw Codex --json stdout (+ {"_runner": ...} marker lines)
  logs/{id}.stderr.txt      raw Codex stderr
  logs/{id}.result.txt      Codex last message (-o)
  logs/{id}.provenance.json original generated file path, sha256, thread id, ...
  logs/state.jsonl          progress events (queued/skipped/start/retry/done/failed/interrupted/warning)
  logs/work/{id}/attempt-N/ empty per-attempt scratch dir used as codex -C (never the repo root);
                            anything found in it afterwards is flagged, never copied
  textures/{id}.png         copy of the generated file

Safety notes:
  * codex runs with its working directory set to an empty scratch dir so a CLI/skill that "copies
    outputs into the workspace" can only write there; the generated original stays in generated_images.
  * textures/ is audited after every attempt and at the end; any change not made by this runner
    (modified / deleted / unexpected new file) is reported as a "warning" state event and exit code 2.
  * Ctrl+C sets a stop flag *before* killing children; no new attempt or retry is spawned afterwards.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import glob
import hashlib
import json
import os
import re
import shutil
import signal
import struct
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

BIOME_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = Path(__file__).resolve().parents[4]
ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
PNG_SIG = b"\x89PNG\r\n\x1a\n"
PNG_IEND = b"\x00\x00\x00\x00IEND\xaeB`\x82"
IMG_EXTS = (".png",)
# absolute path (either slash style) that passes through a generated_images dir
GEN_PATH_RE = re.compile(
    r"[A-Za-z]:[\\/](?:[^\"'`<>|*?\r\n]*?)generated_images[\\/][^\"'`<>|*?\r\n]+?\.(?:png|jpe?g|webp)",
    re.IGNORECASE,
)

PROMPT_PREAMBLE = (
    "Generation-only task. Call the built-in image_gen tool exactly once to generate one bitmap "
    "from the brief below. Do not create, edit, move or delete any files. Do not run shell "
    "commands or code, do not launch another CLI or agent, no API fallback, no drawing code. "
    "Do not copy, move, rename or save the generated image anywhere else; leave it where image_gen "
    "stored it (generated_images). When finished, reply with only the absolute path of the file image_gen generated.\n\nBrief:\n"
)


# ----------------------------------------------------------------------------- helpers
def utc() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def read_png_info(path: Path) -> tuple[int, int]:
    """Cheap PNG validity check: signature, IHDR dims, IEND tail. Raises ValueError."""
    with open(path, "rb") as f:
        head = f.read(24)
        if len(head) < 24 or head[:8] != PNG_SIG or head[12:16] != b"IHDR":
            raise ValueError("not a PNG")
        w, h = struct.unpack(">II", head[16:24])
        f.seek(0, os.SEEK_END)
        if f.tell() < 57:
            raise ValueError("PNG too small")
        f.seek(-12, os.SEEK_END)
        if f.read(12) != PNG_IEND:
            raise ValueError("PNG truncated (no IEND)")
    if w <= 0 or h <= 0:
        raise ValueError("bad PNG dimensions")
    return w, h


def is_valid_texture(path: Path, min_size: int) -> tuple[bool, str]:
    try:
        w, h = read_png_info(path)
    except (OSError, ValueError) as e:
        return False, str(e)
    if min(w, h) < min_size:
        return False, f"too small {w}x{h} (< {min_size})"
    return True, f"{w}x{h}"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def gen_root_default() -> Path:
    return Path(os.environ.get("CODEX_HOME") or (Path.home() / ".codex")) / "generated_images"


# ----------------------------------------------------------------------------- manifest
@dataclass
class Job:
    id: str
    prompt: str
    biome_id: str = ""
    name_vi: str = ""
    material: str = ""
    reference: Path | None = None
    raw: dict = field(default_factory=dict)


@dataclass
class Paths:
    base: Path

    @property
    def textures(self): return self.base / "textures"
    @property
    def prompts(self): return self.base / "prompts"
    @property
    def logs(self): return self.base / "logs"
    @property
    def work(self): return self.logs / "work"

    def texture(self, i): return self.textures / f"{i}.png"
    def prompt(self, i): return self.prompts / f"{i}.txt"
    def jsonl(self, i): return self.logs / f"{i}.jsonl"
    def stderr(self, i): return self.logs / f"{i}.stderr.txt"
    def result(self, i): return self.logs / f"{i}.result.txt"
    def provenance(self, i): return self.logs / f"{i}.provenance.json"
    @property
    def state(self): return self.logs / "state.jsonl"


def load_manifest(path: Path, repo_root: Path) -> list[Job]:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(data, list):
        raise SystemExit(f"{path}: expected a JSON array of jobs")
    jobs, seen = [], set()
    for n, d in enumerate(data):
        if not isinstance(d, dict):
            raise SystemExit(f"{path}[{n}]: job must be an object")
        jid, prompt = d.get("id"), d.get("prompt")
        if not isinstance(jid, str) or not ID_RE.match(jid):
            raise SystemExit(f"{path}[{n}]: bad or missing id {jid!r}")
        if jid in seen:
            raise SystemExit(f"{path}: duplicate id {jid}")
        if not isinstance(prompt, str) or not prompt.strip():
            raise SystemExit(f"{path}[{n}] {jid}: missing prompt")
        seen.add(jid)
        ref = None
        if d.get("reference"):
            rp = Path(d["reference"])
            if not rp.is_absolute():
                for cand in (path.parent / rp, repo_root / rp):
                    if cand.exists():
                        rp = cand
                        break
                else:
                    rp = path.parent / rp
            ref = rp.resolve()
        jobs.append(Job(jid, prompt, str(d.get("biome_id", "")), str(d.get("name_vi", "")),
                        str(d.get("material", "")), ref, d))
    return jobs


def build_prompt(job: Job) -> str:
    return PROMPT_PREAMBLE + job.prompt.strip() + "\n"


# ----------------------------------------------------------------------------- codex
def find_codex_command(explicit: str | None) -> list[str]:
    """Return argv prefix for a real executable (never a .ps1/.cmd shim)."""
    explicit = explicit or os.environ.get("CODEX_EXE")
    if explicit:
        p = Path(explicit)
        if not p.exists():
            raise SystemExit(f"codex executable not found: {explicit}")
        suf = p.suffix.lower()
        if suf in (".cmd", ".ps1", ".bat"):
            raise SystemExit(f"refusing shell shim {explicit}: pass codex.exe or codex.js (a shim needs a "
                             "shell and mangles stdin/arguments)")
        if suf == ".js":
            return [shutil.which("node") or "node", str(p)]
        if suf == ".py":
            return [sys.executable, str(p)]
        return [str(p)]
    hit = shutil.which("codex.exe")
    if hit:
        return [hit]
    dirs = []
    for name in ("codex.cmd", "codex.ps1", "codex"):
        w = shutil.which(name)
        if w:
            dirs.append(Path(w).parent)
    if os.environ.get("APPDATA"):
        dirs.append(Path(os.environ["APPDATA"]) / "npm")
    for d in dirs:
        pkg = d / "node_modules" / "@openai" / "codex"
        pats = glob.glob(str(pkg / "node_modules" / "@openai" / "codex-*" / "vendor" / "*" / "bin" / "codex.exe"))
        pats += glob.glob(str(pkg / "node_modules" / "@openai" / "codex-*" / "vendor" / "*" / "codex" / "codex.exe"))
        if pats:
            return [sorted(pats)[0]]
        js = pkg / "bin" / "codex.js"
        if js.exists():
            return [shutil.which("node") or "node", str(js)]
    raise SystemExit("could not locate codex.exe / codex.js; pass --codex-exe or set CODEX_EXE")


SANDBOXES = ("workspace-write", "read-only")


def build_codex_argv(prefix, model, workdir, ref, result_path, sandbox="workspace-write",
                     project_doc=False) -> list[str]:
    """workdir must be an empty scratch dir. project_doc=False passes -c project_doc_max_bytes=0 so the
    repo's AGENTS.md (found by walking up from the scratch dir) is not injected into the image session."""
    argv = list(prefix) + ["exec", "--enable", "image_generation", "-m", model,
                           "-s", sandbox, "--skip-git-repo-check", "-C", str(workdir)]
    if not project_doc:
        argv += ["-c", "project_doc_max_bytes=0"]
    if ref:
        argv += ["-i", str(ref)]
    argv += ["--json", "-o", str(result_path), "-"]
    return argv


def kill_tree(proc: subprocess.Popen) -> None:
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], shell=False,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
        else:
            os.killpg(proc.pid, signal.SIGKILL)
    except Exception:
        pass
    try:
        proc.kill()
    except Exception:
        pass


# ----------------------------------------------------------------------------- event collection
class Collector:
    """Incrementally extracts thread ids / generated-image paths from --json lines."""

    def __init__(self):
        self.thread_ids: list[str] = []
        self.explicit_paths: list[str] = []   # in emission order
        self.item_ids: list[tuple[str, str]] = []  # (thread_id, image_gen item id)
        self._cur_thread = None

    def _add_thread(self, t):
        if isinstance(t, str) and t and t not in self.thread_ids:
            self.thread_ids.append(t)
        if isinstance(t, str) and t:
            self._cur_thread = t

    def feed_line(self, line: str):
        line = line.strip()
        if not line.startswith("{"):
            return
        try:
            obj = json.loads(line)
        except ValueError:
            return
        self._walk(obj)

    def _walk(self, node):
        if isinstance(node, dict):
            for k in ("thread_id", "session_id"):
                if k in node:
                    self._add_thread(node[k])
            tag = " ".join(str(node.get(k, "")) for k in ("kind", "type", "tool", "name")).lower()
            if ("image_gen" in tag or "imagegen" in tag.replace("_", "")) and isinstance(node.get("id"), str):
                self.item_ids.append((self._cur_thread or "", node["id"]))
            for v in node.values():
                self._walk(v)
        elif isinstance(node, list):
            for v in node:
                self._walk(v)
        elif isinstance(node, str) and "generated_images" in node and len(node) < 20000:
            self.explicit_paths.extend(m.group(0) for m in GEN_PATH_RE.finditer(node))


def resolve_generated(col: Collector, result_text: str, gen_root: Path, start: float,
                      slack: float = 5.0) -> tuple[Path | None, str, list[str]]:
    """Pick the one generated file belonging to this session. Returns (path, how, others)."""
    root = gen_root.resolve()
    threads = list(col.thread_ids)
    msg_paths = [m.group(0) for m in GEN_PATH_RE.finditer(result_text or "")]
    cands: list[tuple[str, str]] = []  # (path, how) lowest priority first
    cands += [(p, "message") for p in msg_paths]
    for t, iid in col.item_ids:
        for tt in ([t] if t else threads):
            for ext in IMG_EXTS:
                cands.append((str(root / tt / f"{iid}{ext}"), "item-id"))
    cands += [(p, "event") for p in col.explicit_paths]

    ok: list[tuple[Path, str]] = []
    for p, how in cands:
        try:
            rp = Path(p).resolve()
            rel = rp.relative_to(root)
        except (ValueError, OSError):
            continue
        if len(rel.parts) < 2 or not rp.is_file() or rp.suffix.lower() not in IMG_EXTS:
            continue
        if threads and rel.parts[0] not in threads:
            continue  # belongs to a different session -> reject
        if not threads and how != "event":
            continue
        if rp.stat().st_mtime < start - slack:
            continue  # stale file
        if all(rp != q for q, _ in ok):
            ok.append((rp, how))
        else:  # keep latest/strongest ordering: move to end
            ok = [(q, h) for q, h in ok if q != rp] + [(rp, how)]
    if not ok:
        # last resort: unambiguous single fresh file inside this job's own thread dir
        fresh = []
        for t in threads:
            d = root / t
            if d.is_dir():
                fresh += [f for f in d.iterdir()
                          if f.suffix.lower() in IMG_EXTS and f.stat().st_mtime >= start - slack]
        if len(fresh) == 1:
            return fresh[0], "thread-dir", []
        return None, "ambiguous" if fresh else "none", [str(f) for f in fresh]
    best = ok[-1]
    return best[0], best[1], [str(q) for q, _ in ok[:-1]]


# ----------------------------------------------------------------------------- run one job
class Runner:
    def __init__(self, args, paths: Paths, codex_prefix):
        self.a = args
        self.p = paths
        self.codex = codex_prefix
        self.gen_root = Path(args.generated_root) if args.generated_root else gen_root_default()
        self.lock = threading.Lock()          # guards state log, active set and the stop-check-then-spawn
        self.tex_lock = threading.RLock()     # guards textures/ writes and the audit snapshot
        self.active: set[subprocess.Popen] = set()
        self.stop = threading.Event()         # set BEFORE children are killed; no spawn once set
        self.known: dict[str, tuple[int, int]] | None = None   # textures/ name -> (size, mtime_ns)
        self.anomalies: list[dict] = []

    def state(self, jid, event, **kw):
        rec = {"ts": utc(), "id": jid, "event": event, **kw}
        line = json.dumps(rec, ensure_ascii=False)
        with self.lock:
            self.p.logs.mkdir(parents=True, exist_ok=True)
            with open(self.p.state, "a", encoding="utf-8") as f:
                f.write(line + "\n")
            print(line, flush=True)

    # -- textures/ audit: detect writes to textures/ that this runner did not make
    def _scan_textures(self) -> dict[str, tuple[int, int]]:
        out = {}
        if self.p.textures.is_dir():
            for f in self.p.textures.iterdir():
                if f.is_file():
                    st = f.stat()
                    out[f.name] = (st.st_size, st.st_mtime_ns)
        return out

    def begin(self):
        """Snapshot textures/ as the trusted baseline (idempotent; call before any job starts)."""
        with self.tex_lock:
            if self.known is None:
                self.known = self._scan_textures()

    def _note_texture(self, path: Path):
        """Record a file this runner just wrote/renamed (call with tex_lock held)."""
        st = path.stat()
        self.known[path.name] = (st.st_size, st.st_mtime_ns)

    def audit(self, jid, phase):
        """Compare textures/ with the baseline + the runner's own writes; flag anything else."""
        self.begin()
        with self.tex_lock:
            cur = self._scan_textures()
            found = []
            for name, sig in self.known.items():
                if name not in cur:
                    found.append({"file": name, "change": "deleted"})
                elif cur[name] != sig:
                    found.append({"file": name, "change": "modified"})
            found += [{"file": n, "change": "unexpected_new"} for n in cur if n not in self.known]
            self.known = cur  # report each anomaly once
        for f in found:
            self.anomalies.append({"id": jid, "phase": phase, **f})
            self.state(jid, "warning", kind="texture_mutation_not_by_runner", phase=phase, **f)
        return found

    def make_scratch(self, jid, attempt) -> Path:
        """Fresh empty scratch dir for one attempt; never reuses a directory that already exists."""
        base = self.p.work / jid
        for n in range(100):
            d = base / (f"attempt-{attempt}" if n == 0 else f"attempt-{attempt}-r{n}")
            try:
                d.mkdir(parents=True, exist_ok=False)
                return d
            except FileExistsError:
                continue
        raise OSError(f"cannot allocate a fresh scratch dir under {base}")

    def existing_status(self, jid) -> str:
        """'valid' | 'missing' | 'invalid'"""
        t = self.p.texture(jid)
        if not t.exists():
            return "missing"
        return "valid" if is_valid_texture(t, self.a.min_size)[0] else "invalid"

    def run_job(self, job: Job) -> dict:
        jid = job.id
        self.begin()
        if self.stop.is_set():
            self.state(jid, "interrupted", reason="stop requested before start")
            return {"id": jid, "status": "interrupted"}
        st = self.existing_status(jid)
        if st == "valid":
            self.state(jid, "skipped", reason="valid output exists", dims=is_valid_texture(self.p.texture(jid), 0)[1])
            return {"id": jid, "status": "skipped"}
        if job.reference is not None and not job.reference.is_file():
            self.state(jid, "failed", error=f"reference missing: {job.reference}")
            return {"id": jid, "status": "failed"}
        if st == "invalid":
            bad = self.p.texture(jid).with_name(f"{jid}.invalid-{int(time.time())}.png")
            with self.tex_lock:
                os.rename(self.p.texture(jid), bad)
                self.known.pop(self.p.texture(jid).name, None)
                self._note_texture(bad)
            self.state(jid, "quarantined", moved_to=str(bad))
        for d in (self.p.textures, self.p.prompts, self.p.logs):
            d.mkdir(parents=True, exist_ok=True)
        prompt = build_prompt(job)
        self.p.prompt(jid).write_text(prompt, encoding="utf-8")
        last_err = "unknown"
        for attempt in range(1, self.a.retries + 2):
            if self.stop.is_set():
                self.state(jid, "interrupted", reason="stop requested; no new attempt", attempt=attempt)
                return {"id": jid, "status": "interrupted"}
            self.state(jid, "start", attempt=attempt, of=self.a.retries + 1)
            res = self.attempt(job, prompt, attempt)
            if res["ok"]:
                self.state(jid, "done", attempt=attempt, texture=str(self.p.texture(jid)),
                           source=res["source"], dims=res["dims"])
                return {"id": jid, "status": "done"}
            last_err = res["error"]
            if res.get("interrupted") or self.stop.is_set():
                self.state(jid, "interrupted", reason="stop requested; not retrying", error=last_err)
                return {"id": jid, "status": "interrupted", "error": last_err}
            if res.get("no_retry") or attempt > self.a.retries:
                break
            self.state(jid, "retry", attempt=attempt, error=last_err)
        self.state(jid, "failed", error=last_err)
        return {"id": jid, "status": "failed", "error": last_err}

    def attempt(self, job: Job, prompt: str, attempt: int) -> dict:
        jid = job.id
        if self.stop.is_set():
            return {"ok": False, "interrupted": True, "error": "stop requested before spawn"}
        try:
            scratch = self.make_scratch(jid, attempt)
        except OSError as e:
            return {"ok": False, "error": f"scratch dir failed: {e}"}
        argv = build_codex_argv(self.codex, self.a.model, scratch, job.reference, self.p.result(jid),
                                self.a.sandbox, self.a.project_doc)
        start = time.time()
        col = Collector()
        marker = {"_runner": "attempt_start", "attempt": attempt, "scratch": str(scratch), "ts": utc()}
        jl = open(self.p.jsonl(jid), "ab")
        er = open(self.p.stderr(jid), "ab")
        jl.write((json.dumps(marker) + "\n").encode())
        flags = {}
        if os.name == "nt":
            flags["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
        else:
            flags["start_new_session"] = True
        # stop-check, spawn and registration are one atomic step under self.lock: kill_all() sets the
        # stop flag first and then snapshots `active` under the same lock, so a child is either refused
        # here or already registered (and therefore killed) - never spawned unnoticed.
        with self.lock:
            if self.stop.is_set():
                jl.close(); er.close()
                return {"ok": False, "interrupted": True, "error": "stop requested before spawn"}
            try:
                proc = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, shell=False, **flags)
            except OSError as e:
                jl.close(); er.close()
                return {"ok": False, "error": f"spawn failed: {e}"}
            self.active.add(proc)

        def pump_out():
            for raw in iter(proc.stdout.readline, b""):
                jl.write(raw)
                col.feed_line(raw.decode("utf-8", "replace"))
            jl.flush()

        def pump_err():
            for raw in iter(proc.stderr.readline, b""):
                er.write(raw)
            er.flush()

        threads = [threading.Thread(target=pump_out, daemon=True), threading.Thread(target=pump_err, daemon=True)]
        for t in threads:
            t.start()
        timed_out = False
        try:
            try:
                proc.stdin.write(prompt.encode("utf-8"))
                proc.stdin.close()
            except OSError:
                pass
            try:
                proc.wait(timeout=self.a.timeout)
            except subprocess.TimeoutExpired:
                timed_out = True
                kill_tree(proc)
                proc.wait()
        finally:
            if proc.poll() is None:
                kill_tree(proc)
            for t in threads:
                t.join(timeout=15)
            for pipe in (proc.stdout, proc.stderr):
                try:
                    pipe.close()
                except Exception:
                    pass
            with self.lock:
                self.active.discard(proc)
            jl.write((json.dumps({"_runner": "attempt_end", "attempt": attempt, "exit": proc.returncode,
                                  "timed_out": timed_out, "ts": utc()}) + "\n").encode())
            jl.close(); er.close()
        scratch_files = self.scan_scratch(jid, scratch)
        self.audit(jid, f"after attempt {attempt}")
        try:  # only trust the -o file if this attempt wrote it (a previous attempt's file is stale)
            rp = self.p.result(jid)
            result_text = rp.read_text(encoding="utf-8", errors="replace") if rp.stat().st_mtime >= start - 1 else ""
        except OSError:
            result_text = ""
        src, how, others = resolve_generated(col, result_text, self.gen_root, start)
        if timed_out:
            # salvage: the image may already have been generated (and be fully written) before the hang
            if src is not None:
                res = self.install(job, src, f"{how}+timeout-salvage", others, col, proc.returncode, start,
                                   scratch_files, scratch)
                if res["ok"]:
                    self.state(jid, "salvaged", attempt=attempt, source=str(src))
                    return res
            return {"ok": False, "error": f"timeout after {self.a.timeout}s (process tree killed)"}
        if proc.returncode != 0 and src is None:
            return {"ok": False, "error": f"codex exit {proc.returncode}, no generated image found"}
        if src is None:
            return {"ok": False, "error": f"no generated image resolved ({how}); threads={col.thread_ids}"}
        return self.install(job, src, how, others, col, proc.returncode, start, scratch_files, scratch)

    def scan_scratch(self, jid, scratch: Path) -> list[str]:
        """The scratch dir must still be empty; anything in it was written by codex/the model. Flag only."""
        found = sorted(str(f.relative_to(scratch)) for f in scratch.rglob("*") if f.is_file())
        if found:
            self.anomalies.append({"id": jid, "phase": "scratch", "change": "scratch_files", "files": found[:20]})
            self.state(jid, "warning", kind="unexpected_scratch_files", scratch=str(scratch),
                       count=len(found), files=found[:20])
        return found

    def install(self, job, src: Path, how, others, col, exit_code, start,
                scratch_files=None, scratch=None) -> dict:
        jid = job.id
        dest = self.p.texture(jid)
        ok, info = is_valid_texture(src, self.a.min_size)
        if not ok:  # retryable: a fresh generation may be fine
            return {"ok": False, "error": f"generated file invalid: {src} ({info})"}
        self.begin()
        with self.tex_lock:
            if dest.exists():
                return {"ok": False, "no_retry": True, "error": f"refusing to overwrite {dest}"}
            digest = sha256_of(src)
            try:
                with open(src, "rb") as fi, open(dest, "xb") as fo:  # 'x' = never overwrite
                    shutil.copyfileobj(fi, fo, 1 << 20)
            except FileExistsError:
                return {"ok": False, "no_retry": True, "error": f"refusing to overwrite {dest}"}
            if sha256_of(dest) != digest:
                dest.unlink()
                return {"ok": False, "no_retry": True, "error": "copy checksum mismatch (partial copy removed)"}
            self._note_texture(dest)
        w, h = read_png_info(dest)
        prov = {
            "id": jid, "biome_id": job.biome_id, "name_vi": job.name_vi, "material": job.material,
            "source_path": str(src), "source_how": how, "other_candidates": others,
            "thread_ids": col.thread_ids, "sha256": digest, "bytes": src.stat().st_size,
            "width": w, "height": h, "model": self.a.model, "codex_exit": exit_code,
            "reference": str(job.reference) if job.reference else None,
            "copied_to": str(dest), "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(start)),
            "finished": utc(), "sandbox": self.a.sandbox,
            "scratch_dir": str(scratch) if scratch else None, "scratch_files": scratch_files or [],
        }
        pv = self.p.provenance(jid)
        if pv.exists():  # never overwrite an earlier provenance record
            pv.rename(pv.with_name(f"{jid}.provenance.prev-{int(time.time())}.json"))
        self.p.provenance(jid).write_text(json.dumps(prov, indent=2, ensure_ascii=False), encoding="utf-8")
        return {"ok": True, "source": str(src), "dims": f"{w}x{h}"}

    def kill_all(self):
        self.stop.set()  # first: nothing may spawn or retry after this point
        with self.lock:
            procs = list(self.active)
        for p in procs:
            kill_tree(p)


# ----------------------------------------------------------------------------- main
def parse_args(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--manifest", default=str(BIOME_DIR / "manifest.json"))
    ap.add_argument("--only", action="append", default=[], help="job id (repeatable or comma separated)")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--timeout", type=float, default=720.0, help="seconds per attempt (default 720 = 12 min)")
    ap.add_argument("--retries", type=int, default=0, help="extra attempts after a failure (default 0)")
    ap.add_argument("--model", default="gpt-6-astra")
    ap.add_argument("--repo-root", default=str(REPO_ROOT), help="used to resolve relative manifest references")
    ap.add_argument("--sandbox", choices=SANDBOXES, default="workspace-write",
                    help="codex -s; workspace-write is confined to the empty per-attempt scratch dir. Use "
                         "read-only only after an image_gen smoke test shows it can still generate")
    ap.add_argument("--project-doc", action="store_true",
                    help="let codex load the repo AGENTS.md (default: -c project_doc_max_bytes=0)")
    ap.add_argument("--codex-exe", default=None, help="codex.exe / codex.js (default: auto-detect)")
    ap.add_argument("--generated-root", default=None, help="default ~/.codex/generated_images")
    ap.add_argument("--min-size", type=int, default=256, help="min width/height for an output to count as valid")
    ap.add_argument("--dry-run", action="store_true", help="print plan only; no process, no files written")
    return ap.parse_args(argv)


def select_jobs(jobs, only):
    ids = [x.strip() for o in only for x in o.split(",") if x.strip()]
    if not ids:
        return jobs
    known = {j.id for j in jobs}
    missing = [i for i in ids if i not in known]
    if missing:
        raise SystemExit(f"--only: unknown ids {missing}")
    return [j for j in jobs if j.id in ids]


def main(argv=None) -> int:
    a = parse_args(argv)
    manifest = Path(a.manifest).resolve()
    paths = Paths(manifest.parent)
    jobs = select_jobs(load_manifest(manifest, Path(a.repo_root)), a.only)
    try:
        codex = find_codex_command(a.codex_exe)
    except SystemExit as e:
        if not a.dry_run:
            raise
        codex = ["<codex not found>"]
        print(f"# warning: {e}", file=sys.stderr)
    runner = Runner(a, paths, codex)
    if a.dry_run:
        for j in jobs:
            st = runner.existing_status(j.id)
            plan = {"id": j.id, "action": "skip (valid output exists)" if st == "valid" else "generate",
                    "existing": st, "texture": str(paths.texture(j.id)), "prompt": str(paths.prompt(j.id)),
                    "jsonl": str(paths.jsonl(j.id)), "result": str(paths.result(j.id)),
                    "reference": str(j.reference) if j.reference else None,
                    "reference_exists": bool(j.reference and j.reference.is_file()) if j.reference else None,
                    "scratch": str(paths.work / j.id / "attempt-1"),
                    "argv": build_codex_argv(codex, a.model, paths.work / j.id / "attempt-1", j.reference,
                                             paths.result(j.id), a.sandbox, a.project_doc)}
            print(json.dumps(plan, ensure_ascii=False))
        print(f"# dry-run: {len(jobs)} jobs, workers={a.workers}, timeout={a.timeout}s, retries={a.retries}")
        return 0

    runner.begin()
    for j in jobs:
        runner.state(j.id, "queued")
    results = []
    ex = cf.ThreadPoolExecutor(max_workers=max(1, a.workers))
    try:
        futs = [ex.submit(runner.run_job, j) for j in jobs]
        for f in cf.as_completed(futs):
            try:
                results.append(f.result())
            except Exception as e:  # keep the batch going
                results.append({"id": "?", "status": "failed", "error": repr(e)})
                print(json.dumps({"ts": utc(), "event": "crash", "error": repr(e)}), flush=True)
    except KeyboardInterrupt:
        runner.kill_all()
        ex.shutdown(wait=False, cancel_futures=True)
        print("interrupted; child process trees killed", file=sys.stderr)
        return 130
    ex.shutdown()
    runner.audit("*", "final")
    counts = {}
    for r in results:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    print(json.dumps({"summary": counts, "failed": [r["id"] for r in results if r["status"] == "failed"],
                      "anomalies": len(runner.anomalies)}))
    if counts.get("failed"):
        return 1
    return 2 if runner.anomalies else 0


if __name__ == "__main__":
    sys.exit(main())

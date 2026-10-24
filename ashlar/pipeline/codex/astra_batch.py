"""Generic one-image-per-session Codex (Astra) runner for the ASHLAR image pipeline.

Generalised from E:/map01-batch/map01_batch.py. For every job in --jobfile whose output PNG is
missing, runs one fresh `codex exec` (gpt-6-astra, built-in image_gen) with the job's reference
images attached, then copies the generated PNG from CODEX_HOME/generated_images/<session>/ to
outputPath (never overwriting). The prompt must be complete (see build_prompt.py): Astra reads nothing.
Codex runs in an empty work dir outside the repo so it cannot load the repo's AGENTS.md.
Job: {id, promptPath, outputPath, referenceImages: [{path, role?}]}. One JSON line per attempt -> --status.
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

CODEX_JS = Path(os.environ.get('APPDATA', '.')) / 'npm/node_modules/@openai/codex/bin/codex.js'
NODE = shutil.which('node')
DEFAULT_HOME = 'E:/map01-batch/home'
DEFAULT_WORKDIR = 'E:/map01-batch/work'  # empty, outside the repo: codex must not find AGENTS.md

HEADER = """Astra generation-only harness for ONE concept image.
- Use ONLY your BUILT-IN image_gen tool to create the bitmap, exactly once.
- Do NOT read any skill, doc or other file: the prompt below is complete. Do NOT create, copy, move or edit any file: the harness collects the generated image from its generated_images folder by itself.
- Do NOT launch codex or any other agent or CLI, do NOT delegate, do NOT draw with code (no PIL, SVG, canvas or HTML), do NOT use an OpenAI API key, scripts/image_gen.py or any other fallback.
- The attached images are references; their order and roles are stated in the prompt below. Keep every layout, scale, view, style, colour and text requirement of the prompt and pass its full content to image_gen.
- When the image is generated, reply in one short line with the generated file path. If image_gen is unavailable or fails, reply with the exact error message. Do not retry on your own.

PROMPT:
"""

LIMIT_RE = re.compile(r'usage limit|rate limit|too many requests|quota', re.I)
CAPACITY_RE = re.compile(r'at capacity|overloaded|try again later|stream disconnected', re.I)
EXEC_RE = re.compile(r'^exec\r?\n', re.M)  # codex logs a bare `exec` line before each shell command
TOKENS_RE = re.compile(r'tokens used\s*:?\s*([\d,]+)', re.I)
DONE = ('ok', 'skipped-exists', 'exists-after-run')
lock = threading.Lock()
stop = threading.Event()
CFG = {'status': None, 'home': None, 'workdir': None, 'base': Path('.')}
RECORDS = []  # this run's records, for the summary


def record(rec):
    rec['time'] = datetime.now().isoformat(timespec='seconds')
    with lock:
        RECORDS.append(dict(rec))
        st = CFG['status']
        st.parent.mkdir(parents=True, exist_ok=True)
        with st.open('a', encoding='utf-8') as f:
            f.write(json.dumps(rec, ensure_ascii=False) + '\n')
        # ASCII-only on stdout: a cp1252 redirect must never break the retry loop.
        print(json.dumps(rec, ensure_ascii=True), flush=True)


def resolve(p):
    """Relative job paths are relative to the jobfile's folder."""
    p = Path(p)
    return (p if p.is_absolute() else CFG['base'] / p).resolve()


def parse_tokens(text):
    """Last `tokens used` figure in a codex exec log (number may be on the next line), else None."""
    found = TOKENS_RE.findall(text)
    return int(found[-1].replace(',', '')) if found else None


def after_echo(text, task):
    """Log text after the echoed task (codex prints the prompt back); whole log if not found."""
    whole = task.rstrip()
    i = text.find(whole)
    if i >= 0:
        return text[i + len(whole):]
    last = next((l.strip() for l in reversed(task.splitlines()) if l.strip()), '')[:80]
    i = text.rfind(last) if last else -1  # echo differs (e.g. line endings): fall back to the last line
    return text[i + len(last):] if i >= 0 else text


def ran_commands(text):
    """True when the session ran shell commands, i.e. it read files against the harness rules."""
    return bool(EXEC_RE.search(text))


def read_account(home):
    """Account label from <home>/auth.json (account id / plan only, never tokens or email)."""
    try:
        data = json.loads((Path(home) / 'auth.json').read_text(encoding='utf-8'))
    except Exception as e:  # noqa: BLE001
        return f'unreadable auth.json ({type(e).__name__})'
    tok = data.get('tokens') if isinstance(data, dict) else None
    if not isinstance(tok, dict):
        return 'no account id found'
    parts = []
    if tok.get('account_id'):
        parts.append(f"account_id={tok['account_id']}")
    try:
        seg = tok['id_token'].split('.')[1]
        claims = json.loads(base64.urlsafe_b64decode(seg + '=' * (-len(seg) % 4)))
        auth = claims.get('https://api.openai.com/auth')
        auth = auth if isinstance(auth, dict) else {}
        acc = claims.get('chatgpt_account_id') or auth.get('chatgpt_account_id')
        if acc and not tok.get('account_id'):
            parts.append(f'account_id={acc}')
        if auth.get('chatgpt_plan_type'):
            parts.append(f"plan={auth['chatgpt_plan_type']}")
    except Exception:  # noqa: BLE001 - id_token is optional, any malformed shape is ignored
        pass
    return ' '.join(parts) or 'no account id found'


def image_size(path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            return f'{im.width}x{im.height}'
    except Exception as e:  # noqa: BLE001 - size is informational only
        return f'unknown ({e})'


def run_job(job, attempts, timeout):
    out = resolve(job['outputPath'])
    if out.exists():
        record({'id': job['id'], 'status': 'skipped-exists', 'out': str(out)})
        return
    if stop.is_set():
        record({'id': job['id'], 'status': 'not-started (stopped)'})
        return
    folder, stem = out.parent, out.stem
    folder.mkdir(parents=True, exist_ok=True)
    prompt_path = resolve(job['promptPath'])
    task = HEADER + prompt_path.read_text(encoding='utf-8')
    work = folder / '_work'  # sidecars (task, prompt copy, log, result) sit beside the image, not among the finals
    work.mkdir(parents=True, exist_ok=True)
    (work / f'{stem}.task.txt').write_text(task, encoding='utf-8')
    shutil.copyfile(prompt_path, work / f'{stem}.prompt.txt')
    home = CFG['home']

    for attempt in range(1, attempts + 1):
        if stop.is_set():
            record({'id': job['id'], 'status': 'not-started (stopped)'})
            return
        tag = '' if attempt == 1 else f'.attempt{attempt}'
        log_path = work / f'{stem}.generation{tag}.log'
        result_path = work / f'{stem}.result{tag}.txt'
        cmd = [NODE, str(CODEX_JS), 'exec', '--enable', 'image_generation', '-m', 'gpt-6-astra',
               '-s', 'workspace-write', '-C', str(CFG['workdir']), '--skip-git-repo-check']
        for ref in job.get('referenceImages', []):
            cmd += ['-i', str(resolve(ref['path']))]
        cmd += ['-o', str(result_path), '-']
        env = dict(os.environ, CODEX_HOME=str(home))
        record({'id': job['id'], 'attempt': attempt, 'status': 'started'})
        t0 = time.time()
        with log_path.open('wb') as log:
            try:
                rc = subprocess.run(cmd, input=task.encode('utf-8'), stdout=log,
                                    stderr=subprocess.STDOUT, env=env, timeout=timeout).returncode
            except subprocess.TimeoutExpired:
                rc = 'timeout'
        full = log_path.read_text(encoding='utf-8', errors='replace')
        text = after_echo(full, task)  # Astra's own output only; the session id header is before it
        m = re.search(r'session id:\s*([0-9a-f-]{36})', full)
        session = m.group(1) if m else None
        gen_dir = home / 'generated_images' / session if session else None
        pngs = sorted(gen_dir.glob('*.png'), key=lambda p: p.stat().st_mtime) if gen_dir and gen_dir.is_dir() else []
        rec = {'id': job['id'], 'attempt': attempt, 'rc': rc, 'sec': round(time.time() - t0),
               'session': session, 'images': len(pngs), 'tokens': parse_tokens(text)}
        if ran_commands(text):
            rec['policy'] = 'read-files'
        if pngs:
            if out.exists():
                rec.update(status='exists-after-run', out=str(out))
            else:
                shutil.copyfile(pngs[-1], out)
                rec.update(status='ok', src=str(pngs[-1]), out=str(out), size=image_size(out))
            record(rec)
            return
        tail = text[-1500:]
        if LIMIT_RE.search(tail):
            rec['status'] = 'limit'
        elif CAPACITY_RE.search(tail):
            rec['status'] = 'capacity'
        else:
            rec['status'] = 'no-image'
        rec['tail'] = tail[-500:]
        record(rec)
        if rec['status'] == 'limit':
            stop.set()
            return
        if rec['status'] == 'capacity' and attempt < attempts:
            time.sleep(90)  # transient "model is at capacity": back off, then a fresh session


def summarize(results):
    ok = sum(r.get('status') == 'ok' for r in results)
    ids = {r['id'] for r in results}
    failed = len(ids - {r['id'] for r in results if r.get('status') in DONE})
    total = sum(r.get('tokens') or 0 for r in results)
    return ok, failed, total, (total // ok if ok else 0)


def select_jobs(joblist, ids=None):
    """Jobs to run: de-duplicated ids (default all, file order); refuses shared outputPaths."""
    jobs = {j['id']: j for j in joblist}
    ids = list(dict.fromkeys(ids or [j['id'] for j in joblist]))
    unknown = [j for j in ids if j not in jobs]
    if unknown:
        raise SystemExit(f'unknown job ids: {unknown}')
    seen = {}
    for jid in ids:
        key = str(resolve(jobs[jid]['outputPath'])).lower()
        if key in seen:
            raise SystemExit(f'jobs {seen[key]} and {jid} share outputPath {jobs[jid]["outputPath"]}')
        seen[key] = jid
    return [jobs[i] for i in ids]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--jobfile', required=True, help='JSON list of jobs (id, promptPath, outputPath, referenceImages)')
    ap.add_argument('--jobs', nargs='+', help='job ids in run order (default: all, file order)')
    ap.add_argument('--status', help='status jsonl (default: <jobfile dir>/_runs/status.jsonl)')
    ap.add_argument('--codex-home', default=os.environ.get('ASTRA_CODEX_HOME', DEFAULT_HOME))
    ap.add_argument('--workdir', default=DEFAULT_WORKDIR, help='empty dir outside the repo used as codex -C')
    ap.add_argument('--parallel', type=int, default=4)
    ap.add_argument('--attempts', type=int, default=2)
    ap.add_argument('--timeout', type=int, default=1200)
    args = ap.parse_args()
    if not NODE or not CODEX_JS.is_file():
        raise SystemExit(f'node or codex.js missing (node={NODE}, codex.js={CODEX_JS})')
    jf = Path(args.jobfile).resolve()
    CFG['base'] = jf.parent  # before select_jobs: it resolves relative outputPaths
    run = select_jobs(json.loads(jf.read_text(encoding='utf-8')), args.jobs)
    CFG['status'] = Path(args.status) if args.status else jf.parent / '_runs' / 'status.jsonl'
    CFG['home'] = Path(args.codex_home)
    CFG['workdir'] = Path(args.workdir)
    CFG['workdir'].mkdir(parents=True, exist_ok=True)
    print(f'codex home: {CFG["home"]}  account: {read_account(CFG["home"])}', flush=True)

    def guarded(job):
        try:
            run_job(job, args.attempts, args.timeout)
        except Exception as e:  # noqa: BLE001 - report and keep the pool going
            record({'id': job['id'], 'status': 'runner-error', 'error': repr(e)})

    with ThreadPoolExecutor(args.parallel) as pool:
        for job in run:
            pool.submit(guarded, job)
    ok, failed, total, per = summarize(RECORDS)
    print(f'SUMMARY images ok={ok} failed={failed} total_tokens={total} tokens_per_image={per}', flush=True)
    print('BATCH DONE', flush=True)


if __name__ == '__main__':
    main()

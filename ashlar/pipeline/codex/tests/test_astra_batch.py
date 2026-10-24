import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import astra_batch as ab  # noqa: E402
import build_prompt as bp  # noqa: E402

NL = chr(10)


def test_build_prompt_stores_absolute_paths(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    Path('ref.png').write_bytes(b'x')
    Path('d.txt').write_text('desc', encoding='utf-8')
    bp.main(['--kind', 'prop', '--desc', 'd.txt', '--image', 'ref.png=guide', '--out', 'o.png',
             '--id', 'a', '--jobfile', 'jobs.json'])
    job = json.loads(Path('jobs.json').read_text(encoding='utf-8'))[0]
    for p in (job['promptPath'], job['outputPath'], job['referenceImages'][0]['path']):
        assert Path(p).is_absolute()
    assert b'\r' not in Path(job['promptPath']).read_bytes()


def test_resolve_relative_to_jobfile_folder(tmp_path, monkeypatch):
    monkeypatch.setitem(ab.CFG, 'base', tmp_path)
    assert ab.resolve('x/y.png') == (tmp_path / 'x' / 'y.png').resolve()
    assert ab.resolve(str(tmp_path / 'abs.png')) == tmp_path / 'abs.png'


def test_after_echo_ignores_limit_words_in_prompt():
    task = ab.HEADER + 'Draw a thing.' + NL + 'It must not hit a rate limit or quota.'
    log = 'session id: 0' * 1 + NL + task + NL + 'codex' + NL + 'ERROR: boom' + NL
    tail = ab.after_echo(log, task)
    assert not ab.LIMIT_RE.search(tail)
    assert 'boom' in tail
    # fails fast with a real limit message after the echo
    assert ab.LIMIT_RE.search(ab.after_echo(log + 'usage limit reached', task))
    # task not found -> whole text
    assert ab.after_echo('abc', task) == 'abc'


def test_read_account_malformed(tmp_path):
    for payload in ([], 'str', {'tokens': []}, {'tokens': 'x'}, {'tokens': {'id_token': 'a.b.c'}}):
        (tmp_path / 'auth.json').write_text(json.dumps(payload), encoding='utf-8')
        assert ab.read_account(tmp_path) == 'no account id found'
    # auth claim of wrong type must not crash; email is never printed
    import base64
    seg = base64.urlsafe_b64encode(json.dumps({'email': 'a@b.c', 'https://api.openai.com/auth': 'x'}).encode()).decode()
    (tmp_path / 'auth.json').write_text(json.dumps({'tokens': {'id_token': f'h.{seg}.s'}}), encoding='utf-8')
    assert 'a@b.c' not in ab.read_account(tmp_path)


def test_policy_marker():
    read_log = 'codex' + NL + 'exec' + NL + '"powershell.exe" -Command Get-Content Agent.md' + NL + 'tokens used' + NL + '36,631' + NL
    clean_log = 'codex' + NL + 'I will generate it.' + NL + 'tokens used' + NL + '16,108' + NL
    assert ab.ran_commands(read_log)
    assert not ab.ran_commands(clean_log)
    assert ab.parse_tokens(read_log) == 36631


def test_select_jobs_dedupe_and_shared_output(tmp_path, monkeypatch):
    monkeypatch.setitem(ab.CFG, 'base', tmp_path)
    jobs = [{'id': 'a', 'outputPath': 'a.png'}, {'id': 'b', 'outputPath': 'b.png'},
            {'id': 'c', 'outputPath': 'A.png'}]
    assert [j['id'] for j in ab.select_jobs(jobs[:2], ['b', 'a', 'b'])] == ['b', 'a']
    assert [j['id'] for j in ab.select_jobs(jobs[:2])] == ['a', 'b']
    with pytest.raises(SystemExit, match='share outputPath'):
        ab.select_jobs(jobs)
    with pytest.raises(SystemExit, match='unknown'):
        ab.select_jobs(jobs, ['zz'])


def test_summary_from_memory_records():
    recs = [{'id': 'a', 'status': 'started'}, {'id': 'a', 'status': 'ok', 'tokens': 100},
            {'id': 'b', 'status': 'no-image', 'tokens': 50}, {'id': 'b', 'status': 'no-image', 'tokens': 50}]
    assert ab.summarize(recs) == (1, 1, 200, 200)


def test_shared_output_check_independent_of_cwd(tmp_path, monkeypatch):
    other = tmp_path / 'other'
    other.mkdir()
    monkeypatch.chdir(other)
    monkeypatch.setitem(ab.CFG, 'base', tmp_path)
    jobs = [{'id': 'a', 'outputPath': str(tmp_path / 'x.png')}, {'id': 'b', 'outputPath': 'x.png'}]
    with pytest.raises(SystemExit, match='share outputPath'):
        ab.select_jobs(jobs)
    assert ab.resolve(str(tmp_path / 'sub' / '..' / 'x.png')) == (tmp_path / 'x.png').resolve()


def test_after_echo_repeat_of_last_line_later():
    task = ab.HEADER + 'Draw a thing.' + NL + 'LAST LINE OF PROMPT'
    log = 'hdr' + NL + task + NL + 'codex' + NL + 'exec' + NL + 'powershell Get-Content x' + NL \
        + 'LAST LINE OF PROMPT' + NL + 'tokens used' + NL + '9' + NL
    assert ab.ran_commands(ab.after_echo(log, task))
    # echo with different line endings -> last-line fallback still cuts after the echo
    crlf = 'hdr' + NL + task.replace(NL, chr(13) + NL) + NL + 'codex' + NL + 'ok' + NL
    assert 'Draw a thing' not in ab.after_echo(crlf, task)


def test_stopped_job_writes_no_files(tmp_path, monkeypatch):
    monkeypatch.setitem(ab.CFG, 'base', tmp_path)
    monkeypatch.setitem(ab.CFG, 'status', tmp_path / 's.jsonl')
    (tmp_path / 'p.txt').write_text('x', encoding='utf-8')
    ab.stop.set()
    try:
        ab.run_job({'id': 'a', 'promptPath': 'p.txt', 'outputPath': 'out/a.png'}, 2, 5)
    finally:
        ab.stop.clear()
    assert not (tmp_path / 'out').exists()


def test_sidecars_go_to_work_folder(tmp_path, monkeypatch):
    class Done:
        returncode = 0

    def fake_run(cmd, input=None, stdout=None, **kw):
        stdout.write(b'session id: none\nno image today\n')
        return Done()

    monkeypatch.setitem(ab.CFG, 'base', tmp_path)
    monkeypatch.setitem(ab.CFG, 'status', tmp_path / 's.jsonl')
    monkeypatch.setitem(ab.CFG, 'home', tmp_path / 'home')
    monkeypatch.setitem(ab.CFG, 'workdir', tmp_path)
    monkeypatch.setattr(ab.subprocess, 'run', fake_run)
    (tmp_path / 'p.txt').write_text('x', encoding='utf-8')
    ab.run_job({'id': 'a', 'promptPath': 'p.txt', 'outputPath': 'out/a.png'}, 1, 5)
    names = sorted(p.name for p in (tmp_path / 'out' / '_work').iterdir())
    assert names == ['a.generation.log', 'a.prompt.txt', 'a.task.txt']
    assert [p.name for p in (tmp_path / 'out').iterdir()] == ['_work']  # nothing but the _work folder beside the (missing) image

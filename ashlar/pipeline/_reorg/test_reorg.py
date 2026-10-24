import importlib.util
import json
import os

import pytest

_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reorg_2026-10-24.py')
_spec = importlib.util.spec_from_file_location('reorg', _p)
R = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R)

MOVES = [
    dict(src='docs/inner.md', dst='new/inner.md'),
    dict(src='old', dst='moved/old'),
    dict(src='old-v2', dst='moved/old-v2'),
    dict(src='big/a', dst='dst/a'),
    dict(src='big/b', dst='dst/b'),
    dict(src='top.html', dst='legacy/top.html'),
    dict(src='lone', dst='legacy/lone'),
]


def write(root, rel, text='x'):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='') as fh:
        fh.write(text)


@pytest.fixture()
def tree(tmp_path, monkeypatch):
    root = str(tmp_path / 'repo')
    for rel in ['docs/inner.md', 'docs/other.md', 'old/a.png', 'old-v2/b.png', 'big/a/x.txt', 'big/b/y.txt',
                'top.html', 'lone/z.txt', 'keep/readme.md', 'tmp/t.md']:
        write(root, rel)
    monkeypatch.setattr(R, 'processes_using_repo', lambda: [])
    monkeypatch.setattr(R, 'SELF_REL', '__none__')
    return root


def ctx_for(root, moves=MOVES):
    rules = R.init_rules(moves)
    c = R.Ctx(root, rules)
    c.vanishing = rules.vanishing = R.compute_vanishing(root, rules)
    return c


def rw(text, rel, c):
    return R.rewrite_text(text, rel, c)[0]


def test_prefix_boundary(tree):
    c = ctx_for(tree)
    assert rw('see old/a.png', 'keep/readme.md', c) == 'see moved/old/a.png'
    assert rw('see old-v2/b.png', 'keep/readme.md', c) == 'see moved/old-v2/b.png'  # not moved/old-v2 twice
    assert rw('see older/a.png and bold/a.png', 'keep/readme.md', c) == 'see older/a.png and bold/a.png'
    assert rw('x old-x/a', 'keep/readme.md', c) == 'x old-x/a'
    assert rw('the old folder', 'keep/readme.md', c) == 'the old folder'  # bare word, no separator
    assert rw('(old/)', 'keep/readme.md', c) == '(moved/old/)'


def test_longest_prefix_first(tree):
    moves = [dict(src='old', dst='moved/old'), dict(src='old/special', dst='elsewhere/special')]
    c = ctx_for(tree, moves)
    assert rw('old/special/q.png', 'keep/readme.md', c) == 'elsewhere/special/q.png'
    assert rw('old/plain/q.png', 'keep/readme.md', c) == 'moved/old/plain/q.png'


def test_four_absolute_spellings_and_mixed(tree):
    c = ctx_for(tree)
    assert rw('E:/Diablo2/old/a.png', 'keep/readme.md', c) == 'E:/Diablo2/moved/old/a.png'
    assert rw('E:\\Diablo2\\old\\a.png', 'keep/readme.md', c) == 'E:\\Diablo2\\moved\\old\\a.png'
    assert rw('E:\\\\Diablo2\\\\old\\\\a.png', 'keep/readme.md', c) == 'E:\\\\Diablo2\\\\moved\\\\old\\\\a.png'
    assert rw('/e/Diablo2/old/a.png', 'keep/readme.md', c) == '/e/Diablo2/moved/old/a.png'
    assert rw('E:/Diablo2\\old/a.png', 'keep/readme.md', c) == 'E:/Diablo2\\moved\\old/a.png'
    assert rw('"E:/Diablo2/old-v2/b.png"', 'keep/readme.md', c) == '"E:/Diablo2/moved/old-v2/b.png"'
    assert rw('E:/Diablo2/older/a', 'keep/readme.md', c) == 'E:/Diablo2/older/a'


def test_json_escaped(tree):
    c = ctx_for(tree)
    src = '{"p": "E:\\\\Diablo2\\\\big\\\\a\\\\x.txt", "q": "big/b/y.txt"}'
    out = rw(src, 'keep/readme.md', c)
    assert out == '{"p": "E:\\\\Diablo2\\\\dst\\\\a\\\\x.txt", "q": "dst/b/y.txt"}'
    json.loads(out)


def test_variable_prefix_and_gitignore(tree):
    c = ctx_for(tree)
    assert rw('cd ${ROOT}/old/a', 'keep/readme.md', c) == 'cd ${ROOT}/moved/old/a'
    out = R.rewrite_text('tmp/\n/top.html\nlone/\n', '.gitignore', c, gitignore=True)[0]
    assert out == 'tmp/\n/legacy/top.html\nlegacy/lone/\n'


def test_url_not_touched(tree):
    c = ctx_for(tree)
    assert rw('https://example.com/old/a.png', 'keep/readme.md', c) == 'https://example.com/old/a.png'


def test_relative_link_when_target_moves(tree):
    c = ctx_for(tree)
    # keep/readme.md stays, docs/inner.md -> new/inner.md
    assert rw('[x](../docs/inner.md)', 'keep/readme.md', c) == '[x](../new/inner.md)'
    assert rw('[x](../docs/other.md)', 'keep/readme.md', c) == '[x](../docs/other.md)'
    assert rw('require("../old/a.png")', 'keep/readme.md', c) == 'require("../moved/old/a.png")'


def test_relative_link_when_file_moves(tree):
    c = ctx_for(tree)
    # docs/inner.md -> new/inner.md (same depth): sibling in docs/ stays in docs/
    assert rw('[o](other.md)', 'docs/inner.md', c) == '[o](../docs/other.md)'
    assert rw('[o](./other.md)', 'docs/inner.md', c) == '[o](../docs/other.md)'
    # old/a.png -> moved/old/a.png: one level deeper, link to the repo-level keep/ must gain a ../
    write(tree, 'old/page.md', '[k](../keep/readme.md)')
    assert rw('[k](../keep/readme.md)', 'old/page.md', ctx_for(tree)) == '[k](../../keep/readme.md)'
    # both move together: untouched
    assert rw('[v](../old-v2/b.png)', 'old/page.md', ctx_for(tree)) == '[v](../old-v2/b.png)'


def test_relative_link_back_slashes_and_trailing_sep(tree):
    c = ctx_for(tree)
    assert rw('..\\docs\\inner.md', 'keep/readme.md', c) == '..\\new\\inner.md'
    assert rw('(../old/)', 'keep/readme.md', c) == '(../moved/old/)'


def test_prose_dots_ignored(tree):
    c = ctx_for(tree)
    assert rw('wait... and then. Or ..', 'old/a.png', c) == 'wait... and then. Or ..'


def test_vanishing_dir_flagged(tree):
    c = ctx_for(tree)
    assert 'big' in c.vanishing
    _, ed = R.rewrite_text('see big/', 'keep/readme.md', c)
    assert [e['kind'] for e in ed] == ['unfixable']


def test_records_skipped(tree):
    write(tree, 'keep/log.jsonl', '{"p": "old/a.png"}')
    write(tree, 'keep/run.log', 'old/a.png')
    write(tree, 'keep/x.prompt.txt', 'old/a.png')
    write(tree, 'keep/x.result1.txt', 'old/a.png')
    write(tree, 'keep/_runs/r.md', 'old/a.png')
    write(tree, 'keep/live.md', 'old/a.png')
    write(tree, 'tmp/scratch.md', 'old/a.png')
    c = ctx_for(tree)
    res = R.scan(tree, c, collect_text=True)
    assert set(res['edits']) == {'keep/live.md'}
    assert sum(res['records'].values()) == 5
    assert res['tmp']['matches'] == 1


def test_big_and_binary_skipped(tree, monkeypatch):
    write(tree, 'keep/big.md', 'old/a.png')
    monkeypatch.setattr(R, 'MAX_BYTES', 3)
    res = R.scan(tree, ctx_for(tree))
    assert 'keep/big.md' in res['big']
    assert res['edits'] == {}


def test_precheck_missing_source(tree):
    os.remove(os.path.join(tree, 'top.html'))
    errs, _ = R.precheck(tree, MOVES, R.init_rules(MOVES))
    assert any('missing source: top.html' in e for e in errs)


def test_precheck_destination_exists_and_collision(tree):
    write(tree, 'legacy/lone/z.txt')
    errs, _ = R.precheck(tree, MOVES, R.init_rules(MOVES))
    assert any('destination exists: legacy/lone' in e for e in errs)
    moves = MOVES + [dict(src='keep', dst='moved/old')]
    errs, _ = R.precheck(tree, moves, R.init_rules(moves))
    assert any('destination collision: moved/old' in e for e in errs)


def test_apply_aborts_without_moving(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    write(tree, 'moved/old/in_the_way.txt')
    rc = R.main(['--apply', '--repo', tree, '--out-dir', str(tmp_path), '--backup-dir', str(tmp_path / 'bk')])
    assert rc == 2
    assert os.path.exists(os.path.join(tree, 'old/a.png'))
    assert os.path.exists(os.path.join(tree, 'top.html'))


def test_apply_and_verify_end_to_end(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    write(tree, 'keep/readme.md', 'see old/a.png and [d](../docs/inner.md) and big/a/x.txt\n')
    write(tree, 'docs/inner.md', '[r](../keep/readme.md) E:\\Diablo2\\lone\\z.txt\n')
    write(tree, 'old/page.md', '[k](../keep/readme.md) [v](../old-v2/b.png)\n')
    out = tmp_path / 'out'
    out.mkdir()
    assert R.main(['--dry-run', '--repo', tree, '--out-dir', str(out)]) == 0
    assert os.path.exists(os.path.join(tree, 'old/a.png'))  # dry run moves nothing
    assert (out / 'dryrun_report.md').exists() and (out / 'reorg_map.json').exists()
    assert R.main(['--apply', '--repo', tree, '--out-dir', str(out), '--backup-dir', str(tmp_path / 'bk')]) == 0
    assert not os.path.exists(os.path.join(tree, 'old'))
    assert not os.path.exists(os.path.join(tree, 'big'))  # emptied dir removed
    read = lambda rel: open(os.path.join(tree, rel), encoding='utf-8', newline='').read()
    assert read('keep/readme.md') == 'see moved/old/a.png and [d](../new/inner.md) and dst/a/x.txt\n'
    assert read('new/inner.md') == '[r](../keep/readme.md) E:\\Diablo2\\legacy\\lone\\z.txt\n'
    assert read('moved/old/page.md') == '[k](../../keep/readme.md) [v](../old-v2/b.png)\n'
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 0
    write(tree, 'keep/stale.md', 'still old/a.png here\n')
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 1


def test_bare_names_only_at_repo_root_position(tree):
    moves = [dict(src='output', dst='legacy/output'), dict(src='sites', dst='legacy/sites')]
    write(tree, 'output/a.txt')
    write(tree, 'sites/a.txt')
    c = ctx_for(tree, moves)
    f = 'keep/readme.md'
    assert rw('x/output/y', f, c) == 'x/output/y'
    assert rw(r'_runs/output/y.png and foo\sites\a', f, c) == r'_runs/output/y.png and foo\sites\a'
    assert rw('"output/concepts/a.png"', f, c) == '"legacy/output/concepts/a.png"'
    assert rw("'sites/a.txt'", f, c) == "'legacy/sites/a.txt'"
    assert rw('(output/a) [sites/a] k=output/a', f, c) == '(legacy/output/a) [legacy/sites/a] k=legacy/output/a'
    assert rw('dir:output/a', f, c) == 'dir:legacy/output/a'
    assert rw('C:output/a', f, c) == 'C:output/a'  # drive colon + foreign segment
    assert rw('E:/Diablo2/output/a', f, c) == 'E:/Diablo2/legacy/output/a'
    assert rw('the output folder and output.', f, c) == 'the output folder and output.'


def test_tripo_whole_folder_longest_prefix(tree):
    moves = [dict(src='art-output/tripo-models', dst='ashlar/pipeline/tripo'), dict(src='art-output', dst='legacy/art-output')]
    write(tree, 'art-output/tripo-models/Agent.md')
    write(tree, 'art-output/tripo-models/nature/_tools/a.sh')
    write(tree, 'art-output/other/b.png')
    c = ctx_for(tree, moves)
    assert rw('art-output/tripo-models/Agent.md', 'keep/readme.md', c) == 'ashlar/pipeline/tripo/Agent.md'
    assert rw('E:/Diablo2/art-output/tripo-models/nature/_tools/', 'keep/readme.md', c) == 'E:/Diablo2/ashlar/pipeline/tripo/nature/_tools/'
    assert rw('art-output/other/b.png', 'keep/readme.md', c) == 'legacy/art-output/other/b.png'
    assert not R.precheck(tree, moves, R.init_rules(moves))[0]
    bad = list(reversed(moves))
    assert any('listed after its parent' in e for e in R.precheck(tree, bad, R.init_rules(bad))[0])


def test_split_ancestor_follows_moved_targets(tree):
    moves = [dict(src='bs', dst='legacy/bs'), dict(src='top.html', dst='legacy/top.html'),
             dict(src='old', dst='moved/old'), dict(src='old2', dst='moved/else')]
    write(tree, 'bs/scripts/build.mjs')
    write(tree, 'old2/a.png')
    c = ctx_for(tree, moves)
    c.live = True
    f = 'bs/scripts/build.mjs'
    # only legacy-bound target named: '../../' keeps pointing at the (now legacy) sibling folder
    assert rw("const o=['../../', 'top.html'];", f, c) == "const o=['../../', 'top.html'];"
    # a stay-put target on the line: base stays the repo root
    assert rw("const o=['../../', 'keep/readme.md'];", f, c) == "const o=['../../../', 'keep/readme.md'];"
    # target moved into a folder with the same tail: base follows it
    assert rw("const o=['../../', 'old/a.png'];", f, c) == "const o=['../../../moved/', 'old/a.png'];"
    # target renamed on the way: base stays the repo root and the name is rewritten
    assert rw("const o=['../../', 'old2/a.png'];", f, c) == "const o=['../../../', 'moved/else/a.png'];"
    # nothing named: repo root
    assert rw("const o='../../';", f, c) == "const o='../../../';"
    assert len(c.decisions) == 5
    # a full token with the filename is simply recomputed
    assert rw("read('../../top.html')", f, c) == "read('../../top.html')"


# ---------------------------------------------------------------- review round 3
def test_real_map_keeps_lab_html_at_root():
    srcs = {m['src'] for m in R.MOVES}
    assert 'Sanctuary_Lookdev_Lab.html' not in srcs
    assert 'Sanctuary_Lookdev_Lab_Source.zip' in srcs and 'D2RR.html' in srcs
    order = [m['src'] for m in R.MOVES]
    assert order.index('art-output/tripo-models') < order.index('art-output')


def test_escaped_slash_in_js_regex(tree):
    moves = [dict(src='art-output', dst='legacy/art-output')]
    write(tree, 'art-output/a.png')
    c = ctx_for(tree, moves)
    src = r"assert(/^art-output\/(dying-gods-act1|act1-monsters)/.test(i.origin))"
    assert rw(src, 'keep/readme.md', c) == r"assert(/^legacy\/art-output\/(dying-gods-act1|act1-monsters)/.test(i.origin))"
    assert rw(r'"E:\/Diablo2\/art-output\/a.png"', 'keep/readme.md', c) == r'"E:\/Diablo2\/legacy\/art-output\/a.png"'


def test_relative_to_ashlar_spellings(tree):
    moves = [dict(src='ashlar/art/terrain', dst='ashlar/art/textures/terrain'), dict(src='ashlar/doc.md', dst='ashlar/docs/doc.md'),
             dict(src='ashlar/art/_codex', dst='ashlar/pipeline/codex')]
    for f in ('ashlar/art/terrain/x.png', 'ashlar/doc.md', 'ashlar/art/_codex/a.py', 'ashlar/3d/README.md'):
        write(tree, f)
    c = ctx_for(tree, moves)
    f = 'ashlar/3d/README.md'
    assert rw('see `art/terrain/x.png` and `art/_codex/` and doc.md.', f, c) == \
        'see `art/textures/terrain/x.png` and `pipeline/codex/` and docs/doc.md.'
    assert rw('and ashlar/art/terrain/x.png', f, c) == 'and ashlar/art/textures/terrain/x.png'
    # not for files outside ashlar/, and not for code (the code patches handle it)
    assert rw('see `art/terrain/x.png`', 'keep/readme.md', c) == 'see `art/terrain/x.png`'
    assert rw("p = 'doc.md'", 'ashlar/3d/tool.py', c) == "p = 'doc.md'"


def test_cwd_lookdev_lab_relative_commands(tree):
    moves = [dict(src='ashlar/art/terrain', dst='ashlar/art/textures/terrain')]
    write(tree, 'ashlar/art/terrain/stylized2/a.png')
    write(tree, 'lookdev-lab/scripts/tool.py')
    c = ctx_for(tree, moves)
    line = 'python scripts/tool.py ../ashlar/art/terrain/stylized2 --x'
    assert rw(line, 'lookdev-lab/scripts/tool.py', c) == 'python scripts/tool.py ../ashlar/art/textures/terrain/stylized2 --x'
    assert rw('# run ' + line, 'ashlar/art/terrain/README.md', c) == '# run python scripts/tool.py ../ashlar/art/textures/terrain/stylized2 --x'
    # a bestiary-style code file must not be treated as cwd lookdev-lab
    write(tree, 'bs/scripts/build.mjs')
    assert rw("x=['../ashlar/art/terrain/stylized2']", 'bs/scripts/build.mjs', c) == "x=['../ashlar/art/terrain/stylized2']"


def test_records_widened(tree):
    for f in ('keep/cli-task.txt', 'keep/a.prompt.src.txt', 'keep/x_result.txt', 'keep/logs/notes.md', 'keep/a.provenance.json',
              'keep/_runs/r.json'):
        write(tree, f, 'old/a.png')
    write(tree, 'keep/tasks_plan.md', 'old/a.png')
    c = ctx_for(tree)
    res = R.scan(tree, c)
    assert set(res['edits']) == {'keep/tasks_plan.md'}
    assert sum(res['records'].values()) == 6


def test_seg_violations_and_patches(tree, monkeypatch):
    moves = [dict(src='art-output', dst='legacy/art-output'), dict(src='ashlar/artdirection.md', dst='ashlar/art-direction/artdirection.md'),
             dict(src='ashlar/art/_codex', dst='ashlar/pipeline/codex')]
    c = ctx_for(tree, moves)
    assert R.seg_violations("p = os.path.join(ROOT, 'art-output', 'x')", c.rules)
    assert not R.seg_violations("p = os.path.join(ROOT, 'legacy', 'art-output', 'x')", c.rules)
    assert R.seg_violations("AD = SKILL.parents[2] / 'ashlar' / 'artdirection.md'", c.rules)
    assert not R.seg_violations("AD = parents[2] / 'art-direction' / 'artdirection.md'", c.rules)
    assert R.seg_violations("p = Path(x) / '_codex'", c.rules)
    assert not R.seg_violations("res = {'output': 1}", ctx_for(tree, [dict(src='output', dst='legacy/output')]).rules)
    # dotdot climb from a moved file
    write(tree, 'old/tool.py', "p = os.path.join(HERE, '..', 'keep', 'readme.md')\n")
    c2 = ctx_for(tree)
    out = R.suggest_dotdot("p = os.path.join(HERE, '..', 'keep', 'readme.md')\n", 'old/tool.py', c2)
    assert out and out[0][2] == "'..', '..', 'keep', 'readme.md'"
    # static patch applies after the rewrite, exactly once
    monkeypatch.setattr(R, 'PATCHES', [dict(file='keep/readme.md', old='hello', new='bye', why='t')])
    write(tree, 'keep/readme.md', 'hello world\n')
    res = R.scan(tree, ctx_for(tree))
    assert res['new_text']['keep/readme.md'] == 'bye world\n'
    assert res['patches'][0]['status'] == 'ok'
    monkeypatch.setattr(R, 'PATCHES', [dict(file='keep/readme.md', old='nope', new='x', why='t')])
    assert R.scan(tree, ctx_for(tree))['patches'][0]['status'] == 'NOT-FOUND'


def _apply_args(tree, tmp_path, *extra):
    return ['--apply', '--repo', tree, '--out-dir', str(tmp_path), '--backup-dir', str(tmp_path / 'bk')] + list(extra)


def snapshot(root):
    out = {}
    for dp, _, fns in os.walk(root):
        for f in fns:
            p = os.path.join(dp, f)
            with open(p, 'rb') as fh:
                out[os.path.relpath(p, root).replace('\\', '/')] = fh.read()
    return out


def test_apply_aborts_on_busy_processes_unless_forced(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    monkeypatch.setattr(R, 'processes_using_repo', lambda: ['node.exe 123 vite E:\\Diablo2'])
    before = snapshot(tree)
    assert R.main(_apply_args(tree, tmp_path)) == 2
    assert snapshot(tree) == before
    assert R.main(_apply_args(tree, tmp_path, '--force')) == 0
    assert not os.path.exists(os.path.join(tree, 'old'))


def test_apply_aborts_on_unclean_patch(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    monkeypatch.setattr(R, 'PATCHES', [dict(file='keep/readme.md', old='absent', new='x', why='t')])
    before = snapshot(tree)
    assert R.main(_apply_args(tree, tmp_path)) == 2
    assert snapshot(tree) == before


def test_failed_rename_rolls_back(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    monkeypatch.setattr(R, 'probe_locks', lambda repo, moves: [])
    real = os.rename
    calls = {'n': 0}

    def flaky(a, b):
        calls['n'] += 1
        if calls['n'] == 3:
            raise PermissionError('locked')
        return real(a, b)

    before = snapshot(tree)
    monkeypatch.setattr(os, 'rename', flaky)
    rc = R.main(_apply_args(tree, tmp_path))
    monkeypatch.setattr(os, 'rename', real)
    assert rc == 3
    assert snapshot(tree) == before  # moves rolled back, nothing rewritten


def test_changed_file_is_skipped_and_reported(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    write(tree, 'old/page.md', 'see big/a/x.txt\n')
    real = R.do_moves

    def moves_then_edit(repo, moves, journal=None):
        real(repo, moves, journal)
        write(repo, 'moved/old/page.md', 'edited meanwhile big/a/x.txt\n')

    monkeypatch.setattr(R, 'do_moves', moves_then_edit)
    assert R.main(_apply_args(tree, tmp_path)) == 3
    with open(os.path.join(tree, 'moved/old/page.md')) as fh:
        assert fh.read() == 'edited meanwhile big/a/x.txt\n'  # not overwritten


def test_restore_undoes_an_apply(tree, tmp_path, monkeypatch):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    write(tree, 'keep/readme.md', 'see old/a.png and big/a/x.txt\n')
    write(tree, 'old/page.md', '[k](../keep/readme.md)\n')
    before = snapshot(tree)
    assert R.main(_apply_args(tree, tmp_path)) == 0
    assert snapshot(tree) != before
    journals = [os.path.join(dp, f) for dp, _, fns in os.walk(tmp_path / 'bk') for f in fns if f == 'journal.json']
    assert len(journals) == 1
    assert R.main(['--restore', journals[0]]) == 0
    assert snapshot(tree) == before


def test_verify_reports_leftovers(tree, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    out = tmp_path / 'out'
    out.mkdir()
    assert R.main(['--dry-run', '--repo', tree, '--out-dir', str(out)]) == 0
    assert R.main(_apply_args(tree, out)) == 0
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 0
    write(tree, 'old/ghost.txt')  # a source that came back
    write(tree, 'big/ghost.txt')  # a dir that should have vanished
    write(tree, 'keep/tool.py', "p = os.path.join(ROOT, 'old', 'a.png')\n")
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 1
    text = capsys.readouterr().out
    assert 'SOURCE STILL THERE' in text and 'DIR SHOULD HAVE VANISHED' in text and 'OLD QUOTED SEGMENT' in text


# ---------------------------------------------------------------- review round 4
AD_MOVES = [
    dict(src='ashlar/artdirection.md', dst='ashlar/art-direction/artdirection.md'),
    dict(src='ashlar/DOC_B.md', dst='ashlar/art-direction/DOC_B.md'),
    dict(src='art-direction', dst='legacy/art-direction'),
    dict(src='D2RR.html', dst='legacy/D2RR.html'),
]


def ad_tree(root):
    write(root, 'ashlar/artdirection.md', 'See [DOC_B.md](DOC_B.md) and [DOC_B.md](DOC_B.md) and `DOC_B.md`.\n')
    write(root, 'ashlar/DOC_B.md', 'back to [artdirection.md](artdirection.md); `artdirection.md`\n')
    write(root, 'ashlar/3d/README.md', 'the doc `artdirection.md` and `DOC_B.md`\n')
    write(root, 'art-direction/old.md', 'x')
    write(root, 'D2RR.html', '<html>')
    write(root, 'ashlar/tools/build_prompt.py', "AD = Path(__file__).resolve().parents[2] / 'artdirection.md'\n")
    write(root, 'bestiary/README.md', 'link opens the original file when `D2RR.html` stays at the root.\n')
    write(root, 'keep/readme.md', 'nothing here\n')


def test_bare_sibling_names_and_link_text_are_left_alone(tree):
    ad_tree(tree)
    c = ctx_for(tree, AD_MOVES)
    t = open(os.path.join(tree, 'ashlar/artdirection.md')).read()
    assert rw(t, 'ashlar/artdirection.md', c) == t  # same folder after the move: nothing to change
    t2 = open(os.path.join(tree, 'ashlar/3d/README.md')).read()
    # other folder: the short spelling would start with the old root name -> full ashlar/ spelling
    assert rw(t2, 'ashlar/3d/README.md', c) == 'the doc `ashlar/art-direction/artdirection.md` and `ashlar/art-direction/DOC_B.md`\n'
    assert rw('[DOC_B.md](../DOC_B.md)', 'ashlar/3d/README.md', c) == '[DOC_B.md](../art-direction/DOC_B.md)'  # label is a bare name


def test_history_lines_stay_as_written(tree):
    write(tree, 'ashlar/DOC_B.md', 'x')
    c = ctx_for(tree, AD_MOVES)
    c.live = True
    line = '- 10-21 Chuyển từ ashlar/DOC_B.md sang thư mục mới\n- see ashlar/DOC_B.md\n'
    out = rw(line, 'keep/readme.md', c)
    assert out == ('- 10-21 Chuyển từ ashlar/DOC_B.md sang thư mục mới'+chr(10)+'- see ashlar/art-direction/DOC_B.md'+chr(10))
    assert len(c.history) == 1


def test_verify_has_no_false_positives_after_apply(tree, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(R, 'MOVES', AD_MOVES)
    ad_tree(tree)
    monkeypatch.setattr(R, 'PATCHES', [
        dict(file='ashlar/tools/build_prompt.py', old="parents[2] / 'artdirection.md'",
             new="parents[2] / 'art-direction' / 'artdirection.md'", why='t'),
        dict(file='bestiary/README.md', old='when `legacy/D2RR.html` stays at the root',
             new='when `D2RR.html` stays in `legacy/`', why='t')])
    out = tmp_path / 'out'
    out.mkdir()
    assert R.main(_apply_args(tree, out)) == 0
    with open(os.path.join(tree, 'ashlar/tools/build_prompt.py')) as fh:
        assert "'art-direction' / 'artdirection.md'" in fh.read()
    # new short spellings written by hand in an ashlar doc resolve from ashlar/ -> fine
    write(tree, 'ashlar/note.md', 'see `art-direction/DOC_B.md`\n')
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 0
    capsys.readouterr()
    # a genuine leftover is still caught (root spelling of the moved folder, and an old quoted segment)
    write(tree, 'keep/readme.md', 'see art-direction/old.md here\n')
    write(tree, 'keep/tool.py', "p = os.path.join(ROOT, 'art-direction', 'old.md')\n")
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 1
    text = capsys.readouterr().out
    assert 'OLD PATH' in text and 'OLD QUOTED SEGMENT' in text and 'keep/readme.md' in text


def test_restore_warns_instead_of_overwriting_later_edits(tree, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    write(tree, 'keep/readme.md', 'see old/a.png\n')
    assert R.main(_apply_args(tree, tmp_path)) == 0
    write(tree, 'keep/readme.md', 'someone edited this after the apply\n')
    journal = [os.path.join(dp, f) for dp, _, fns in os.walk(tmp_path / 'bk') for f in fns if f == 'journal.json'][0]
    assert R.main(['--restore', journal]) == 4
    with open(os.path.join(tree, 'keep/readme.md')) as fh:
        assert fh.read() == 'someone edited this after the apply\n'
    assert 'WARNING' in capsys.readouterr().err
    assert R.main(['--restore', journal, '--force']) == 0
    with open(os.path.join(tree, 'keep/readme.md')) as fh:
        assert fh.read() == 'see old/a.png\n'


def test_apply_prints_and_writes_next_steps(tree, tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(R, 'MOVES', MOVES)
    assert R.main(_apply_args(tree, tmp_path)) == 0
    out = capsys.readouterr().out
    assert 'NEXT STEPS' in out and 'rebuild' in out.lower() or 'Rebuild' in out
    assert 'auto-memory' in (tmp_path / 'apply_report.md').read_text(encoding='utf-8')

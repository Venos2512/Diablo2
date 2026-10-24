"""Tests of reorg_2026-10-24b.py (round 2). Run: python -m pytest ashlar/pipeline/_reorg/test_reorg_b.py test_reorg.py"""
import importlib.util
import os

import pytest

_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reorg_2026-10-24b.py')
_spec = importlib.util.spec_from_file_location('reorg_b', _p)
B = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B)
R = B.R  # the round-1 engine with the round-2 globals

T = 'ashlar/pipeline/tripo/'
LEGACY_TOOLS = ['camp', 'early_kits', 'rock_01', '_shots', '_texcheck', '_downloads', '_tools']
FILES = {
    'ashlar/art/act-02/monsters/monsters/B06_choir_of_nails/vA/concept.png': 'x',
    'ashlar/art/act-02/monsters/monsters/W08_bell_bat/vA/concept.png': 'x',
    'ashlar/art/act-02/monsters/_brief/notes.md': 'x',
    T + 'heroes/FL_flagellant_vA_sorceress_rig/REPORT.md': 'x',
    T + 'Agent.md': 'x',
    T + 'nature/a_sheet.glb': 'x',
    T + 'nature/_shots/s.png': 'x',
    T + 'nature/_tools/target.txt': 'tab',
    T + 'nature/_tools/batch.sh': '#!/bin/bash\ncd "$(dirname "$0")"\nLOG=../tripo_batch.log\n[ -f "../$n.glb" ] && continue\n',
    T + 'nature/_tools/tripo_sheet.sh': 'OUT=/e/Diablo2/ashlar/pipeline/tripo/nature\n',
    T + 'nature/_tools/compose_rows.py': ("import os\nHERE = os.path.dirname(os.path.abspath(__file__))\n"
                                         "ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))\n"
                                         "INPUTS = os.path.join(HERE, '..', 'inputs')\n"),
    T + 'nature/inputs/row.png': 'x',
    T + '_tools/closeup.sh': 'cd "$(dirname "$0")"\nOUT=../_shots/closeup\n',
    T + '_shots/old.png': 'x',
    T + 'camp/c.glb': 'x',
    T + 'early_kits/k.glb': 'x',
    T + 'rock_01/r.glb': 'x',
    T + '_texcheck/t.png': 'x',
    T + '_downloads/d.zip': 'x',
    'ashlar/3d/monsters/B01_sextons_dog/B01_sextons_dog.glb': 'x',
    'ashlar/3d/monsters/W07_shroud_spinner/W07_shroud_spinner.glb': 'x',
    'ashlar/3d/monsters/_review/r.png': 'x',
    'ashlar/3d/heroes/FL_flagellant_vA/rig/REPORT.md': 'x',
    'keep/readme.md': 'x',
    'tmp/t.md': 'x',
}
IDS = {'B06_choir_of_nails', 'W08_bell_bat', 'B01_sextons_dog', 'W07_shroud_spinner', '_review'}


def write(root, rel, text='x'):
    p = os.path.join(root, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='') as fh:
        fh.write(text)


def read(root, rel):
    with open(os.path.join(root, rel), encoding='utf-8', newline='') as fh:
        return fh.read()


def present_moves():
    """the round-2 MOVES whose source is in the synthetic tree (the IDs of the real map are only partly there)"""
    return [m for m in B.MOVES if m['src'].split('/')[-1] in IDS or not (
        m['src'].startswith('ashlar/art/act-02/monsters/monsters/') or m['src'].startswith('ashlar/3d/monsters/'))]


@pytest.fixture()
def tree(tmp_path, monkeypatch):
    root = str(tmp_path / 'repo')
    for rel, txt in FILES.items():
        write(root, rel, txt)
    # patches whose `old` text is free of rewritable paths run on a file built from those texts
    plain = [p for p in B.PATCHES if R.rewrite_text(p['old'], p['file'], ctx_for(root, B.MOVES))[0] == p['old']]
    for f in {p['file'] for p in plain}:
        write(root, f, '\n'.join(p['old'] for p in plain if p['file'] == f) + '\n')
    monkeypatch.setattr(R, 'MOVES', present_moves())
    monkeypatch.setattr(R, 'PATCHES', plain)
    monkeypatch.setattr(R, 'processes_using_repo', lambda: [])
    monkeypatch.setattr(R, 'SELF_REL', '__none__')
    return root


def ctx_for(root, moves):
    rules = R.init_rules(moves)
    c = R.Ctx(root, rules)
    c.vanishing = rules.vanishing = R.compute_vanishing(root, rules)
    return c


def rw(text, rel, c):
    return R.rewrite_text(text, rel, c)[0]


# ---------------------------------------------------------------- the map itself
def test_map_counts_and_order():
    mv = B.MOVES
    assert len(B.ACT2_IDS) == 23 and len(B.ACT1_IDS) == 28 and len(set(B.ACT2_IDS + B.ACT1_IDS)) == 51
    assert len(mv) == 23 + 1 + 1 + 7 + 1 + 29
    srcs = [m['src'] for m in mv]
    assert len(set(srcs)) == len(srcs) and len({m['dst'] for m in mv}) == len(mv)
    pos = {s: i for i, s in enumerate(srcs)}
    assert pos[T + 'nature/_tools'] < pos[T + 'nature'] < len(srcs)  # inner entries first
    for s in srcs:
        for o in srcs:
            if s != o and s.startswith(o + '/'):
                assert pos[s] < pos[o], (s, o)
    d = {m['src']: m['dst'] for m in mv}
    assert d[T + 'nature/_tools'] == T + 'scripts'
    assert d[T + 'nature'] == 'legacy/tripo-models/nature'
    assert d['ashlar/3d/monsters/_review'] == 'ashlar/3d/monsters/act-01/_review'
    assert d['ashlar/art/act-02/monsters/monsters/F03_exhumer'] == 'ashlar/art/act-02/monsters/F03_exhumer'
    assert d[T + 'heroes/FL_flagellant_vA_sorceress_rig'] == 'ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress'


def test_wrapper_swaps_the_round1_globals():
    assert R.MOVES is B.MOVES and R.PATCHES is B.PATCHES and R.STAY == []
    assert R.BACKUP_NAME == 'tmp_reorg_backup_b' and R.ROUND1_NOTES is False
    assert not R.OVERRIDE_REPO_ROOT and not R.GENERIC_ROOTS
    assert R.default_backup_dir('E:/Diablo2').endswith('tmp_reorg_backup_b')
    assert os.path.basename(B.OUT_DIR) == 'round2'
    assert os.path.dirname(B.OUT_DIR) == B.HERE


@pytest.mark.skipif(not os.path.isdir(os.path.join(R.REPO, 'ashlar/art/act-02/monsters/monsters')), reason='round 2 already applied')
def test_real_repo_sources_match_the_frozen_lists():
    mm = os.path.join(R.REPO, 'ashlar/art/act-02/monsters/monsters')
    assert sorted(os.listdir(mm)) == sorted(B.ACT2_IDS)
    ids = sorted(d for d in os.listdir(os.path.join(R.REPO, 'ashlar/3d/monsters')) if d != 'act-01')
    assert ids == sorted(B.ACT1_IDS + ['_review'])
    assert sorted(set(os.listdir(os.path.join(R.REPO, T))) - {'Agent.md', 'nature', 'heroes'}) == sorted(LEGACY_TOOLS)
    errs, _ = R.precheck(R.REPO, B.MOVES, R.init_rules(B.MOVES))
    assert errs == []


# ---------------------------------------------------------------- rewrites
def test_token_rewrites(tree):
    c = ctx_for(tree, present_moves())
    s = 'ashlar/3d/monsters/B01_sextons_dog/B01_sextons_dog.glb'
    assert rw(s, 'keep/readme.md', c) == 'ashlar/3d/monsters/act-01/B01_sextons_dog/B01_sextons_dog.glb'
    assert rw('E:\\Diablo2\\ashlar\\3d\\monsters\\W07_shroud_spinner\\x', 'keep/readme.md', c) == \
        'E:\\Diablo2\\ashlar\\3d\\monsters\\act-01\\W07_shroud_spinner\\x'
    assert rw('E:/Diablo2/ashlar/art/act-02/monsters/monsters/W08_bell_bat/vA/', 'keep/readme.md', c) == \
        'E:/Diablo2/ashlar/art/act-02/monsters/W08_bell_bat/vA/'
    assert rw('/e/Diablo2/' + T + 'nature/_tools/step.sh', 'keep/readme.md', c) == '/e/Diablo2/' + T + 'scripts/step.sh'
    assert rw(T + 'nature/a_sheet.glb', 'keep/readme.md', c) == 'legacy/tripo-models/nature/a_sheet.glb'
    assert rw(T + '_tools/cdp.mjs and ' + T + 'camp/', 'keep/readme.md', c) == \
        'legacy/tripo-models/_tools/cdp.mjs and legacy/tripo-models/camp/'
    assert rw(T + 'heroes/FL_flagellant_vA_sorceress_rig/REPORT.md', 'keep/readme.md', c) == \
        'ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress/REPORT.md'
    # untouched: the doc that stays, a similar name, other act dirs
    assert rw(T + 'Agent.md ashlar/3d/monsters/act-01/B01_sextons_dog ashlar/3d/monsters/B01_sextons_dog_x', 'keep/readme.md', c) == \
        T + 'Agent.md ashlar/3d/monsters/act-01/B01_sextons_dog ashlar/3d/monsters/B01_sextons_dog_x'


def test_placeholders_are_not_rewritten_but_flagged_or_patched(tree):
    """the token rewrite cannot know `<ID>`: a folder mention of a split dir is 'unfixable', the PATCHES name it"""
    c = ctx_for(tree, present_moves())
    assert 'ashlar/art/act-02/monsters/monsters' in c.vanishing
    assert 'ashlar/3d/monsters' not in c.vanishing and T.rstrip('/') not in c.vanishing  # they receive act-01/ and scripts/
    t = 'folder E:/Diablo2/ashlar/art/act-02/monsters/monsters/<ID_slug>/vA|vB/'
    new, ed = R.rewrite_text(t, 'ashlar/art/act-02/monsters/_brief/x.md', c)
    assert new == t and [e['why'] for e in ed] == ['split-dir']
    olds = {p['old'] for p in B.PATCHES}
    assert B.A2_DBL[0] in olds and any(p['new'] == B.A2_DBL[1] for p in B.PATCHES)
    # every placeholder spelling that the rewrite leaves alone has a patch
    for frag in ('monsters/<asset_id>/', 'monsters/P06_poppy_mound/P06_poppy_mound.glb', 'nature/_tools/target.txt',
                 'ashlar/3d/monsters/` |', '`early_kits/`).'):
        assert any(frag in p['old'] for p in B.PATCHES), frag


def test_shell_script_climbs_are_recomputed_for_the_scripts_folder(tree):
    c = ctx_for(tree, present_moves())
    rel = T + 'nature/_tools/batch.sh'
    new = rw(read(tree, rel), rel, c)
    up = '../../../../legacy/tripo-models/nature/'  # scripts/ is 4 levels below the repo root; nature/ is a sibling of nothing now
    assert 'LOG=' + up + 'tripo_batch.log' in new and '"' + up + '$n.glb"' in new
    assert os.path.normpath(os.path.join(tree, T + 'scripts', up)) == os.path.normpath(os.path.join(tree, 'legacy/tripo-models/nature'))
    rel = T + '_tools/closeup.sh'
    assert rw(read(tree, rel), rel, c) == read(tree, rel)  # _tools and _shots move together: ../_shots stays right


def test_python_dotdot_hops_of_compose_rows(tree):
    ctx = ctx_for(tree, present_moves())
    res = R.scan(tree, ctx)
    assert all(p['status'] == 'ok' for p in res['patches']), res['patches']
    nt = res['new_text'][T + 'nature/_tools/compose_rows.py']
    assert "'..', '..', '..', '..'))" in nt and "'..', '..', '..', '..', '..'" not in nt  # ROOT: 5 -> 4 hops
    assert "os.path.join(HERE, '..', '..', '..', '..', 'legacy', 'tripo-models', 'nature', 'inputs')" in nt


# ---------------------------------------------------------------- apply / verify / restore
def snapshot(root):
    out = {}
    for dp, _, fns in os.walk(root):
        for f in fns:
            p = os.path.join(dp, f)
            with open(p, 'rb') as fh:
                out[os.path.relpath(p, root)] = fh.read()
    return out


def test_apply_verify_restore_end_to_end(tree, tmp_path):
    out, bk = tmp_path / 'out', tmp_path / 'bk'
    out.mkdir()
    write(tree, 'keep/readme.md', 'see ashlar/3d/monsters/B01_sextons_dog/ and ' + T + 'nature/a_sheet.glb and ' + T + 'camp/c.glb\n')
    before = snapshot(tree)
    assert R.main(['--dry-run', '--repo', tree, '--out-dir', str(out)]) == 0
    assert snapshot(tree) == before and (out / 'dryrun_report.md').exists()
    assert 'reorg_2026-10-24b.py' in (out / 'dryrun_report.md').read_text(encoding='utf-8')
    assert R.main(['--apply', '--repo', tree, '--out-dir', str(out), '--backup-dir', str(bk)]) == 0
    e = lambda rel: os.path.exists(os.path.join(tree, rel))
    assert e('ashlar/art/act-02/monsters/W08_bell_bat/vA/concept.png') and not e('ashlar/art/act-02/monsters/monsters')
    assert e('ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress/REPORT.md') and not e(T + 'heroes')
    assert e(T + 'scripts/batch.sh') and e(T + 'scripts/target.txt') and e(T + 'scripts/compose_rows.py')
    assert all(e('legacy/tripo-models/' + n) for n in LEGACY_TOOLS + ['nature'])
    assert e('legacy/tripo-models/nature/_shots/s.png') and e('legacy/tripo-models/nature/inputs/row.png')
    assert sorted(os.listdir(os.path.join(tree, T))) == ['Agent.md', 'scripts']
    assert e('ashlar/3d/monsters/act-01/B01_sextons_dog/B01_sextons_dog.glb') and e('ashlar/3d/monsters/act-01/_review/r.png')
    assert sorted(os.listdir(os.path.join(tree, 'ashlar/3d/monsters'))) == ['act-01']
    assert read(tree, 'keep/readme.md') == ('see ashlar/3d/monsters/act-01/B01_sextons_dog/ and legacy/tripo-models/nature/a_sheet.glb'
                                           ' and legacy/tripo-models/camp/c.glb\n')
    assert read(tree, T + 'scripts/tripo_sheet.sh') == 'OUT=/e/Diablo2/legacy/tripo-models/nature\n'
    # a patched file: the placeholder of the flattened dir is now spelled without the double nesting
    assert R.main(['--verify', '--repo', tree, '--out-dir', str(out)]) == 0
    journals = [os.path.join(dp, f) for dp, _, fns in os.walk(bk) for f in fns if f == 'journal.json']
    assert len(journals) == 1 and os.path.normpath(str(bk)) in os.path.normpath(journals[0])
    assert R.main(['--restore', journals[0]]) == 0
    assert snapshot(tree) == before


def test_apply_refuses_when_a_destination_exists(tree, tmp_path):
    write(tree, 'legacy/tripo-models/camp/in_the_way.txt')
    assert R.main(['--apply', '--repo', tree, '--out-dir', str(tmp_path), '--backup-dir', str(tmp_path / 'bk')]) == 2
    assert os.path.exists(os.path.join(tree, T + 'camp/c.glb'))

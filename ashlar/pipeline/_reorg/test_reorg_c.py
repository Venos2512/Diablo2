"""Tests of reorg_2026-10-24c.py (round 3). Run: python -m pytest ashlar/pipeline/_reorg/test_reorg_c.py test_reorg.py test_reorg_b.py"""
import hashlib
import importlib.util
import json
import os

import pytest

_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reorg_2026-10-24c.py')
_spec = importlib.util.spec_from_file_location('reorg_c', _p)
C = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(C)
R = C.R

A, D3 = 'ashlar/art/', 'ashlar/3d/'
ENV = A + 'act-01/environments/'
PNG = 'png'
FILES = {
    # 2D
    A + 'act-01/monsters/B01_dog/vA/concept.png': PNG,
    A + 'act-01/monsters/B01_dog/vA/concept.prompt.txt': 'p',
    A + 'act-01/monsters/B01_dog/vA/concept.task.txt': 't',
    A + 'act-01/monsters/B01_dog/vA/concept.generation.log': 'log ' + A + 'act-01/monsters/B01_dog/vA/concept.png',
    A + 'act-01/monsters/B01_dog/vA/concept.result.txt': 'r',
    A + 'act-01/monsters/B01_dog/vA/qa_r1.txt': 'PASS',
    A + 'act-01/monsters/B01_dog/vA/concept_r2.png': PNG,
    ENV + 'A01-A14/manifest.json': json.dumps({'projectRoot': 'E:/Diablo2/' + ENV + 'A01-A14',
                                              'out': 'E:/Diablo2/' + ENV + 'A01-A14/groups/A01_village/turnaround.png'}),
    ENV + 'A01-A14/act01_batch.py': 'HERE = 1\n',
    ENV + 'A01-A14/README_VI.md': '# batch\n\n## 1. Gồm những gì\n',
    ENV + 'A01-A14/prompts/A01_perspective.txt': 'x',
    ENV + 'A01-A14/_runs/status.jsonl': '{"out": "' + ENV + 'A01-A14/groups/A01_village/turnaround.png"}',
    ENV + 'A01-A14/groups/A01_village/turnaround.png': PNG,
    ENV + 'A01-A14/groups/A01_village/turnaround.source.txt': 's',
    ENV + 'A01-A14/groups/A02_yard/perspective.png': PNG,
    ENV + 'A01-A14/groups/A02_yard/perspective.qa.txt': 'qa',
    ENV + 'A15-A20/manifest.json': '{}',
    ENV + 'A15-A20/groups/A15_extras/perspective.png': PNG,
    ENV + 'A15-A20/groups/A15_extras/perspective_v2.prompt.txt': 'p',
    ENV + 'E01-E04_map01/E01_wet/perspective.png': PNG,
    ENV + 'E01-E04_map01/E01_wet/perspective.task.txt': 't',
    A + 'act-01/_map01/_brief/MANIFEST.json': '{}',
    A + 'act-02/monsters/_brief/templates/T.png': PNG,
    A + 'act-02/monsters/F03_x/vA/concept.png': PNG,
    A + 'act-02/monsters/F03_x/vA/qa.txt': 'qa',
    A + 'heroes/FL_flagellant/vA/concept.png': PNG,
    A + 'heroes/FL_flagellant/vA/concept.prompt.txt': 'p',
    A + 'heroes/_brief/b.md': 'keep',
    A + 'npcs/N01_a/concept_A.png': PNG,
    A + 'npcs/N01_a/QA.txt': 'qa',
    A + 'npcs/manifest.json': '{}',
    A + 'hud/M_A/mockup.png': PNG,
    A + 'hud/M_A/mockup.prompt.txt': 'untouched',
    A + 'textures/t1/tile.png': PNG,
    A + 'textures/t1/tile.log': 'untouched',
    # 3D
    D3 + 'monsters/act-01/B01_dog/B01_dog.glb': 'glb',
    D3 + 'monsters/act-01/B01_dog/concept.png': PNG,
    D3 + 'monsters/act-01/B01_dog/tripo.log': 'credit',
    D3 + 'monsters/act-01/B01_dog/tpose.log': 'x',
    D3 + 'monsters/act-01/B01_dog/brief.md': 'brief',
    D3 + 'monsters/act-01/B01_dog/design.txt': 'design',
    D3 + 'monsters/act-01/B01_dog/_tasks/jobs.json': json.dumps({'out': 'E:/Diablo2/' + D3 + 'monsters/act-01/B01_dog/_tasks/a.png'}),
    D3 + 'monsters/act-01/B01_dog/_rejected/r.png': PNG,
    D3 + 'monsters/act-01/B01_dog/views/front.png': PNG,
    D3 + 'monsters/act-01/B01_dog/_shots/variants.txt': 'keep in _shots',
    D3 + 'monsters/act-01/B01_dog/rig/rig.log': 'keep in rig',
    D3 + 'monsters/act-01/B01_dog/cart/cart.glb': 'glb',
    D3 + 'monsters/act-01/B01_dog/cart/tripo.log': 'cart log',
    D3 + 'monsters/act-01/_review/r.png': PNG,
    D3 + 'weapons/B01_dog_bone/B01_dog_bone.glb': 'glb',
    D3 + 'weapons/B01_dog_bone/tripo.log': 'l',
    D3 + 'weapons/PS_pyre_staff_vA/PS_pyre_staff_vA.glb': 'glb',
    D3 + 'weapons/PS_pyre_staff_vA/concept.prompt.txt': 'p',
    D3 + 'weapons/_review/w.png': PNG,
    D3 + 'heroes/FL_flagellant_vA/FL_flagellant_vA.glb': 'glb',
    D3 + 'heroes/FL_flagellant_vA/concept.png': PNG,
    D3 + 'heroes/FL_flagellant_vA/tripo.log': 'l',
    D3 + 'heroes/FL_flagellant_vA/_v1_flat/a.png': PNG,
    D3 + 'heroes/FL_flagellant_vA/rig/REPORT.md': 'report',
    D3 + 'heroes/PS_pyre_singer_vA/PS_pyre_singer_vA.glb': 'glb',
    D3 + 'props/act1_kit_v1/A01_1_hut/act1_kit_v1_hut.glb': 'glb',
    D3 + 'props/act1_kit_v1/A01_1_hut/concept.png': PNG,
    D3 + 'props/act1_kit_v1/A01_1_hut/tripo.log': 'l',
    D3 + 'props/act1_kit_v1/A01_1_hut/_shots/final_views.png': PNG,
    D3 + 'props/act1_kit_v1/A02_1_gate/act1_kit_v1_gate.glb': 'glb',
    D3 + 'props/act1_kit_v1/rows/R01/tripo.log': 'row log stays',
    D3 + 'props/act1_kit_v1/rows/R01/input.png': PNG,
    D3 + 'props/act1_kit_v1/manifest.json': '{}',
    D3 + 'props/act1_kit_v1/_tools/split_rows.py': 'KIT = 1\n',
    D3 + 'props/act1_extras_v1/A15_1_church/act1_extras_v1_church.glb': 'glb',
    D3 + 'props/act1_extras_v1/A15_1_church/tripo.log': 'l',
    D3 + 'props/act1_extras_v1/build_manifest.py': 'HERE = 1\n',
    D3 + 'props/dungeon_v1/bone_pile/dungeon_bone.glb': 'glb',
    D3 + 'props/dungeon_v1/bone_pile/tripo.log': 'l',
    D3 + 'props/dungeon_v1/logs/x.jsonl': '{}',
    D3 + 'props/clutter_v1/stump/clutter_stump.glb': 'glb',
    D3 + 'props/choice_hands_v1/H2/hand.glb': 'glb',
    D3 + 'README.md': '[B01](monsters/act-01/B01_dog/) [bone](weapons/B01_dog_bone/) [hut](props/act1_kit_v1/A01_1_hut/) '
                      '[dun](props/dungeon_v1/bone_pile/)\n',
    D3 + 'rig-anim/Agent.md': 'see ' + D3 + 'heroes/FL_flagellant_vA/rig/REPORT.md\n',
    # docs / code that cite things
    'lookdev-lab/scripts/prep.py': ("A = 'ashlar/3d/props/act1_kit_v1/A01_1_hut/act1_kit_v1_hut.glb'\n"
                                    "B = 'ashlar/3d/weapons/B01_dog_bone/B01_dog_bone.glb'\n"
                                    "C = 'ashlar/art/act-01/environments/A01-A14/groups/A02_yard/perspective.png'\n"),
    'lookdev-lab/scripts/notes.log': 'record keeps ashlar/3d/weapons/B01_dog_bone/B01_dog_bone.glb\n',
    'keep/readme.md': 'x',
}


def write(root, rel, text='x'):
    p = os.path.join(root, *rel.split('/'))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='') as fh:
        fh.write(text)


def read(root, rel):
    with open(os.path.join(root, *rel.split('/')), encoding='utf-8', newline='') as fh:
        return fh.read()


def snapshot(root):
    out = {}
    for dp, _, fns in os.walk(root):
        for f in fns:
            p = os.path.join(dp, f)
            with open(p, 'rb') as fh:
                out[os.path.relpath(p, root).replace('\\', '/')] = hashlib.sha256(fh.read()).hexdigest()
    return out


@pytest.fixture()
def tree(tmp_path, monkeypatch):
    root = str(tmp_path / 'repo')
    for rel, txt in FILES.items():
        write(root, rel, txt)
    monkeypatch.setattr(R, 'processes_using_repo', lambda: [])
    monkeypatch.setattr(R, 'SELF_REL', '__none__')
    monkeypatch.setattr(C, 'PATCHES', [])
    return root


def run(root, out, *args):
    return C.main(list(args) + ['--repo', root, '--out-dir', str(out)])


# ---------------------------------------------------------------- classification
@pytest.mark.parametrize('name,kind', [
    ('concept.prompt.txt', 'prompt'), ('concept_r2.prompt.src.txt', 'prompt'), ('concept.task.txt', 'task'),
    ('concept.result.txt', 'result'), ('concept.generation.log', 'log'), ('concept.generation.attempt2.log', 'log'),
    ('turnaround.source.txt', 'source'), ('cli-procedure.txt', 'cli-procedure'), ('qa.txt', 'qa'), ('QA.txt', 'qa'),
    ('qa_v2_r2.txt', 'qa'), ('perspective.qa.txt', 'qa'), ('tpose.log', 'log'), ('tripo.log', 'log'),
    ('tpose_front_back.prompt.txt', 'prompt'),
    ('design.txt', None), ('brief.md', None), ('concept.png', None), ('X.glb', None), ('glb_validation.json', None),
    ('aqua.txt', None), ('README.md', None)])
def test_sidecar_kind(name, kind):
    assert C.sidecar_kind(name) == kind


# ---------------------------------------------------------------- the move plan
def test_plan_counts_and_targets(tree):
    mv = C.build_moves(tree)
    byd = {m['src']: m for m in mv}
    # folder moves: 2D
    assert byd[ENV + 'A01-A14/groups/A02_yard']['dst'] == ENV + 'A02_yard'
    assert byd[ENV + 'E01-E04_map01/E01_wet']['dst'] == ENV + 'E01_wet'
    assert byd[ENV + 'A01-A14']['dst'] == A + 'act-01/_batches/env_A01-A14'
    assert byd[A + 'act-01/_map01']['dst'] == A + 'act-01/_batches/map01'
    assert byd[A + 'act-02/monsters/_brief']['dst'] == A + 'act-02/_batches/monsters'
    # 3D
    assert byd[D3 + 'monsters/act-01/B01_dog']['dst'] == D3 + 'act-01/monsters/B01_dog'
    assert byd[D3 + 'monsters/act-01/_review']['dst'] == D3 + 'act-01/monsters/_review'
    assert byd[D3 + 'weapons/_review']['dst'] == D3 + 'act-01/monsters/_review/weapons'
    assert byd[D3 + 'weapons/B01_dog_bone']['dst'] == D3 + 'act-01/monsters/B01_dog/weapons/bone'
    assert byd[D3 + 'weapons/PS_pyre_staff_vA']['dst'] == D3 + 'heroes/PS_pyre_singer/vA/weapons/pyre_staff'
    assert byd[D3 + 'heroes/FL_flagellant_vA']['dst'] == D3 + 'heroes/FL_flagellant/vA'
    assert byd[D3 + 'heroes/PS_pyre_singer_vA']['dst'] == D3 + 'heroes/PS_pyre_singer/vA'
    assert byd[D3 + 'props/act1_kit_v1/A01_1_hut']['dst'] == D3 + 'act-01/environments/A01_village/A01_1_hut'
    assert byd[D3 + 'props/act1_kit_v1/A02_1_gate']['dst'] == D3 + 'act-01/environments/A02_yard/A02_1_gate'
    assert byd[D3 + 'props/act1_extras_v1/A15_1_church']['dst'] == D3 + 'act-01/environments/A15_extras/A15_1_church'
    assert byd[D3 + 'props/act1_kit_v1']['dst'] == D3 + 'act-01/_batches/kit_v1'
    assert byd[D3 + 'props/act1_extras_v1']['dst'] == D3 + 'act-01/_batches/extras_v1'
    assert byd[D3 + 'props/dungeon_v1']['dst'] == D3 + 'common/dungeon_v1'
    assert byd[D3 + 'props/clutter_v1']['dst'] == D3 + 'common/clutter_v1'
    assert byd[D3 + 'props/choice_hands_v1']['dst'] == D3 + 'heroes/_hands_v1'
    # order: pieces before their batch folder, groups before the range folder, monsters before their weapons
    pos = {m['src']: i for i, m in enumerate(mv)}
    assert pos[D3 + 'props/act1_kit_v1/A01_1_hut'] < pos[D3 + 'props/act1_kit_v1']
    assert pos[ENV + 'A01-A14/groups/A02_yard'] < pos[ENV + 'A01-A14']
    assert pos[D3 + 'monsters/act-01/B01_dog'] < pos[D3 + 'weapons/B01_dog_bone']
    assert pos[D3 + 'heroes/PS_pyre_singer_vA'] < pos[D3 + 'weapons/PS_pyre_staff_vA']
    assert pos[D3 + 'monsters/act-01/_review'] < pos[D3 + 'weapons/_review']
    # the _work moves come first and are executed in place
    first_dir = min(i for i, m in enumerate(mv) if 'xdst' not in m)
    assert all('xdst' in m for m in mv[:first_dir]) and not any('xdst' in m for m in mv[first_dir:])


def test_work_split_selects_sidecars_only(tree):
    wm = {s: (d, k) for s, d, k in C.work_moves(tree)}
    v = A + 'act-01/monsters/B01_dog/vA/'
    assert {k: wm[v + k][1] for k in ('concept.prompt.txt', 'concept.task.txt', 'concept.generation.log', 'concept.result.txt', 'qa_r1.txt')} == \
        {'concept.prompt.txt': 'prompt', 'concept.task.txt': 'task', 'concept.generation.log': 'log', 'concept.result.txt': 'result', 'qa_r1.txt': 'qa'}
    assert wm[v + 'concept.prompt.txt'][0] == v + '_work/concept.prompt.txt'
    assert v + 'concept.png' not in wm and v + 'concept_r2.png' not in wm
    m3 = D3 + 'monsters/act-01/B01_dog/'
    for k in ('tripo.log', 'tpose.log'):
        assert m3 + k in wm
    assert wm[m3 + '_tasks'][1] == 'dir _tasks' and wm[m3 + '_rejected'][1] == 'dir _rejected'
    assert D3 + 'heroes/FL_flagellant_vA/_v1_flat' in wm
    for keep in ('brief.md', 'design.txt', 'B01_dog.glb', 'concept.png', 'views', '_shots', 'rig'):
        assert m3 + keep not in wm
    assert m3 + 'cart/tripo.log' in wm                                      # a nested asset folder with a GLB is split too
    assert D3 + 'weapons/B01_dog_bone/tripo.log' in wm
    assert A + 'npcs/N01_a/QA.txt' in wm and A + 'heroes/FL_flagellant/vA/concept.prompt.txt' in wm
    assert ENV + 'A01-A14/groups/A02_yard/perspective.qa.txt' in wm and ENV + 'E01-E04_map01/E01_wet/perspective.task.txt' in wm
    assert D3 + 'props/act1_extras_v1/A15_1_church/tripo.log' in wm
    assert D3 + 'props/dungeon_v1/bone_pile/tripo.log' in wm
    # never touched: batch folders, textures, hud, rig, shots, rows
    for s in wm:
        assert '/textures/' not in s and '/hud/' not in s and '/rig/' not in s and '/_shots/' not in s and '/rows/' not in s
        assert '/_batches/' not in s and '/_brief/' not in s and '/_map01/' not in s and '/logs/' not in s and '/views/' not in s


def test_piece_without_group_fails_loudly(tree):
    write(tree, D3 + 'props/act1_kit_v1/A09_1_orphan/act1_kit_v1_x.glb', 'glb')
    with pytest.raises(RuntimeError, match='A09_1_orphan'):
        C.build_moves(tree)


def test_weapon_without_owner_fails_loudly(tree):
    write(tree, D3 + 'weapons/Z99_nobody_axe/Z99.glb', 'glb')
    with pytest.raises(RuntimeError, match='Z99_nobody_axe'):
        C.build_moves(tree)


def test_two_groups_with_one_prefix_fail(tree):
    write(tree, ENV + 'A01-A14/groups/A01_twin/perspective.png', PNG)
    with pytest.raises(RuntimeError, match='A01_1_hut'):
        C.build_moves(tree)


def test_composed_rules(tree):
    rules = R.Rules(C.build_moves(tree))
    mp = rules.map_path
    assert mp(A + 'act-01/monsters/B01_dog/vA/concept.png') == A + 'act-01/monsters/B01_dog/vA/concept.png'
    assert mp(A + 'act-01/monsters/B01_dog/vA/qa_r1.txt') == A + 'act-01/monsters/B01_dog/vA/_work/qa_r1.txt'
    assert mp(ENV + 'A01-A14/groups/A02_yard/perspective.qa.txt') == ENV + 'A02_yard/_work/perspective.qa.txt'
    assert mp(ENV + 'A01-A14/prompts/A01_perspective.txt') == A + 'act-01/_batches/env_A01-A14/prompts/A01_perspective.txt'
    assert mp(D3 + 'monsters/act-01/B01_dog/_tasks/jobs.json') == D3 + 'act-01/monsters/B01_dog/_work/_tasks/jobs.json'
    assert mp(D3 + 'monsters/act-01/B01_dog/tripo.log') == D3 + 'act-01/monsters/B01_dog/_work/tripo.log'
    assert mp(D3 + 'monsters/act-01/B01_dog/cart/tripo.log') == D3 + 'act-01/monsters/B01_dog/cart/_work/tripo.log'
    assert mp(D3 + 'props/act1_kit_v1/A01_1_hut/tripo.log') == D3 + 'act-01/environments/A01_village/A01_1_hut/_work/tripo.log'
    assert mp(D3 + 'props/act1_kit_v1/rows/R01/tripo.log') == D3 + 'act-01/_batches/kit_v1/rows/R01/tripo.log'
    assert mp(D3 + 'weapons/B01_dog_bone/tripo.log') == D3 + 'act-01/monsters/B01_dog/weapons/bone/_work/tripo.log'
    assert mp(D3 + 'heroes/FL_flagellant_vA/_v1_flat/a.png') == D3 + 'heroes/FL_flagellant/vA/_work/_v1_flat/a.png'
    assert mp(A + 'hud/M_A/mockup.prompt.txt') == A + 'hud/M_A/mockup.prompt.txt'


def test_precheck_clean_and_dry_run(tree, tmp_path):
    out = tmp_path / 'out'
    before = snapshot(tree)
    assert run(tree, out) == 0
    assert snapshot(tree) == before                                       # a dry run moves nothing
    assert (out / 'dryrun_report.md').exists() and (out / 'reorg_map.json').exists() and (out / C.FROZEN).exists()
    assert (out / 'INDEX.preview.md').exists()
    report = (out / 'dryrun_report.md').read_text(encoding='utf-8')
    assert 'Bulk moves' in report and 'prompt' in report and 'dir _tasks' in report
    mp = json.loads((out / 'reorg_map.json').read_text(encoding='utf-8'))
    ex = [m for m in mp['moves'] if m['old'].endswith('B01_dog/tripo.log') and 'monsters/act-01' in m['old']][0]
    assert ex['exec'].endswith('B01_dog/_work/tripo.log') and ex['new'] == D3 + 'act-01/monsters/B01_dog/_work/tripo.log'


def test_index_preview_is_the_planned_layout(tree, tmp_path):
    out = tmp_path / 'out'
    run(tree, out)
    text = (out / 'INDEX.preview.md').read_text(encoding='utf-8')
    row = next(l for l in text.splitlines() if l.startswith('| B01_dog '))
    assert '(art/act-01/monsters/B01_dog/)' in row and '(3d/act-01/monsters/B01_dog/)' in row
    assert 'concept_r2.png' in row and '_work' not in row
    assert 'B01_dog.glb' in row and 'B01_dog_bone.glb' in row               # the weapon sits in monsters/B01_dog/weapons/bone
    hero = next(l for l in text.splitlines() if l.startswith('| FL_flagellant '))
    assert '(3d/heroes/FL_flagellant/)' in hero and 'FL_flagellant_vA.glb' in hero
    env = next(l for l in text.splitlines() if l.startswith('| A01_village '))
    assert 'turnaround.png' in env and 'act1_kit_v1_hut.glb' in env


def test_apply_verify_restore_end_to_end(tree, tmp_path):
    out = tmp_path / 'out'
    before = snapshot(tree)
    assert run(tree, out, '--apply', '--backup-dir', str(tmp_path / 'bk')) == 0
    ex = lambda rel: os.path.exists(os.path.join(tree, *rel.split('/')))
    # layout
    for rel in [A + 'act-01/monsters/B01_dog/vA/concept.png', A + 'act-01/monsters/B01_dog/vA/_work/concept.prompt.txt',
                A + 'act-01/monsters/B01_dog/vA/_work/qa_r1.txt', ENV + 'A01_village/turnaround.png', ENV + 'A01_village/_work/turnaround.source.txt',
                ENV + 'A02_yard/_work/perspective.qa.txt', ENV + 'E01_wet/perspective.png', ENV + 'E01_wet/_work/perspective.task.txt',
                A + 'act-01/_batches/env_A01-A14/manifest.json', A + 'act-01/_batches/env_A01-A14/prompts/A01_perspective.txt',
                A + 'act-01/_batches/map01/_brief/MANIFEST.json', A + 'act-02/_batches/monsters/templates/T.png',
                A + 'act-02/monsters/F03_x/vA/_work/qa.txt', A + 'heroes/FL_flagellant/vA/_work/concept.prompt.txt',
                A + 'npcs/N01_a/_work/QA.txt', A + 'npcs/manifest.json', A + 'hud/M_A/mockup.prompt.txt', A + 'textures/t1/tile.log',
                D3 + 'act-01/monsters/B01_dog/B01_dog.glb', D3 + 'act-01/monsters/B01_dog/_work/tripo.log',
                D3 + 'act-01/monsters/B01_dog/_work/_tasks/jobs.json', D3 + 'act-01/monsters/B01_dog/_work/_rejected/r.png',
                D3 + 'act-01/monsters/B01_dog/views/front.png', D3 + 'act-01/monsters/B01_dog/_shots/variants.txt',
                D3 + 'act-01/monsters/B01_dog/rig/rig.log', D3 + 'act-01/monsters/B01_dog/cart/_work/tripo.log',
                D3 + 'act-01/monsters/B01_dog/brief.md', D3 + 'act-01/monsters/B01_dog/design.txt',
                D3 + 'act-01/monsters/B01_dog/weapons/bone/B01_dog_bone.glb', D3 + 'act-01/monsters/B01_dog/weapons/bone/_work/tripo.log',
                D3 + 'act-01/monsters/_review/r.png', D3 + 'act-01/monsters/_review/weapons/w.png',
                D3 + 'heroes/FL_flagellant/vA/FL_flagellant_vA.glb', D3 + 'heroes/FL_flagellant/vA/_work/_v1_flat/a.png',
                D3 + 'heroes/FL_flagellant/vA/rig/REPORT.md', D3 + 'heroes/PS_pyre_singer/vA/PS_pyre_singer_vA.glb',
                D3 + 'heroes/PS_pyre_singer/vA/weapons/pyre_staff/PS_pyre_staff_vA.glb',
                D3 + 'heroes/PS_pyre_singer/vA/weapons/pyre_staff/_work/concept.prompt.txt',
                D3 + 'act-01/environments/A01_village/A01_1_hut/act1_kit_v1_hut.glb',
                D3 + 'act-01/environments/A01_village/A01_1_hut/_work/tripo.log',
                D3 + 'act-01/environments/A01_village/A01_1_hut/_shots/final_views.png',
                D3 + 'act-01/environments/A02_yard/A02_1_gate/act1_kit_v1_gate.glb',
                D3 + 'act-01/environments/A15_extras/A15_1_church/_work/tripo.log',
                D3 + 'act-01/_batches/kit_v1/rows/R01/tripo.log', D3 + 'act-01/_batches/kit_v1/_tools/split_rows.py',
                D3 + 'act-01/_batches/extras_v1/build_manifest.py', D3 + 'common/dungeon_v1/bone_pile/dungeon_bone.glb',
                D3 + 'common/dungeon_v1/bone_pile/_work/tripo.log', D3 + 'common/dungeon_v1/logs/x.jsonl',
                D3 + 'common/clutter_v1/stump/clutter_stump.glb', D3 + 'heroes/_hands_v1/H2/hand.glb']:
        assert ex(rel), rel
    for gone in [D3 + 'props', D3 + 'weapons', D3 + 'monsters', ENV + 'A01-A14', ENV + 'A15-A20', ENV + 'E01-E04_map01',
                 A + 'act-01/_map01', A + 'act-02/monsters/_brief', D3 + 'heroes/FL_flagellant_vA',
                 A + 'act-01/monsters/B01_dog/vA/concept.prompt.txt']:
        assert not ex(gone), gone
    # rewrites in live files; records keep old paths
    assert read(tree, 'lookdev-lab/scripts/prep.py') == (
        "A = 'ashlar/3d/act-01/environments/A01_village/A01_1_hut/act1_kit_v1_hut.glb'\n"
        "B = 'ashlar/3d/act-01/monsters/B01_dog/weapons/bone/B01_dog_bone.glb'\n"
        "C = 'ashlar/art/act-01/environments/A02_yard/perspective.png'\n")
    assert 'ashlar/3d/weapons/B01_dog_bone' in read(tree, 'lookdev-lab/scripts/notes.log')
    assert read(tree, D3 + 'README.md') == ('[B01](act-01/monsters/B01_dog/) [bone](act-01/monsters/B01_dog/weapons/bone/) '
                                           '[hut](act-01/environments/A01_village/A01_1_hut/) [dun](common/dungeon_v1/bone_pile/)\n')
    man = json.loads(read(tree, A + 'act-01/_batches/env_A01-A14/manifest.json'))
    assert man['projectRoot'] == 'E:/Diablo2/' + A + 'act-01/_batches/env_A01-A14'
    assert man['out'] == 'E:/Diablo2/' + ENV + 'A01_village/turnaround.png'
    assert json.loads(read(tree, D3 + 'act-01/monsters/B01_dog/_work/_tasks/jobs.json'))['out'] == \
        'E:/Diablo2/' + D3 + 'act-01/monsters/B01_dog/_work/_tasks/a.png'
    assert read(tree, D3 + 'act-01/monsters/B01_dog/_work/tripo.log') == 'credit'
    # verify: clean; a stale reference is found; a second dry run does not forget the frozen list
    assert run(tree, out, '--verify') == 0
    assert run(tree, out) == 0 and json.load(open(out / C.FROZEN, encoding='utf-8'))
    write(tree, 'keep/stale.md', 'old ashlar/3d/weapons/B01_dog_bone/x.glb here\n')
    assert run(tree, out, '--verify') == 1
    os.remove(os.path.join(tree, 'keep', 'stale.md'))
    # restore: byte for byte
    journal = next((tmp_path / 'bk').glob('*/journal.json'))
    assert R.restore(str(journal)) == 0
    assert snapshot(tree) == before


def test_second_run_after_apply_is_harmless(tree, tmp_path):
    out = tmp_path / 'out'
    assert run(tree, out, '--apply', '--backup-dir', str(tmp_path / 'bk')) == 0
    frozen = (out / C.FROZEN).read_bytes()
    assert run(tree, out) == 0
    assert (out / C.FROZEN).read_bytes() == frozen


# ---------------------------------------------------------------- engine generalisations used by round 3
def test_find_is_longest_prefix_and_file_rule_wins():
    rules = R.Rules([dict(src='a/b/c.txt', dst='x/b/_work/c.txt', xdst='a/b/_work/c.txt'), dict(src='a/b', dst='y/b')])
    assert rules.map_path('a/b/c.txt') == 'x/b/_work/c.txt'
    assert rules.map_path('a/b/d.txt') == 'y/b/d.txt'
    assert rules.map_path('a/bb/c.txt') == 'a/bb/c.txt'


def test_precheck_nesting_order(tree):
    os.makedirs(os.path.join(tree, 'o/inner'))
    write(tree, 'o/inner/f.txt')
    write(tree, 'p/w/g.txt')
    good = [dict(src='o', dst='n/o'), dict(src='p/w', dst='n/o/weapons/w')]
    errs, _ = R.precheck(tree, good, R.Rules(good))
    assert errs == []
    bad = [good[1], good[0]]                                              # inner destination created before its outer folder arrives
    errs, _ = R.precheck(tree, bad, R.Rules(bad))
    assert any('nested in destination' in e for e in errs)
    late = [dict(src='o', dst='n/o'), dict(src='o/inner', dst='n/i')]      # inner source listed after its parent
    errs, _ = R.precheck(tree, late, R.Rules(late))
    assert any('listed after its parent' in e for e in errs)
    inplace = [dict(src='o/inner/f.txt', dst='n/o/inner/_work/f.txt', xdst='o/inner/_work/f.txt'), dict(src='o', dst='n/o')]
    errs, _ = R.precheck(tree, inplace, R.Rules(inplace))
    assert errs == []                                                      # in-place _work move first, folder move later
    errs, _ = R.precheck(tree, inplace[::-1], R.Rules(inplace[::-1]))
    assert any('lies inside source' in e for e in errs)                    # ... but not the other way round


def test_crlf_patch_and_auto_edit_follows_moved_line():
    text = 'a = 1\r\nSRC = join("x", "old")\r\nb = 2\r\n'
    res = dict(patches=[])
    static = [dict(old='a = 1\nSRC', new='import glob\na = 1\nSRC', why='t')]
    # the static patch inserts a line, so the auto edit (line 2 of the original) moves to line 3
    out = R.apply_patches(text, 'f.py', [(2, '"x", "old"', '"x", "new"', 'quoted path segments')], static, res)
    assert out == 'import glob\r\na = 1\r\nSRC = join("x", "new")\r\nb = 2\r\n'
    assert [p['status'] for p in res['patches']] == ['ok', 'ok']
    res = dict(patches=[])
    R.apply_patches('a\r\nb\r\n', 'f', [], [dict(old='a\nb', new='c', why='t'), dict(old='zzz', new='y', why='t')], res)
    assert [p['status'] for p in res['patches']] == ['ok', 'NOT-FOUND']


def test_seg_violation_needs_new_parent_next_to_new_name():
    rules = R.Rules([dict(src='ashlar/3d/monsters/act-01/D01_hodling', dst='ashlar/3d/act-01/monsters/D01_hodling')])
    old_line = "p = os.path.join(R, 'ashlar', '3d', 'monsters', 'act-01', 'D01_hodling')"
    new_line = "p = os.path.join(R, 'ashlar', '3d', 'act-01', 'monsters', 'D01_hodling')"
    assert R.seg_violations(old_line, rules) == ['ashlar/3d/monsters/act-01/D01_hodling']
    assert R.seg_violations(new_line, rules) == []
    assert R.suggest_segments(old_line, rules)[0][1] == "'ashlar', '3d', 'act-01', 'monsters', 'D01_hodling'"


# ---------------------------------------------------------------- the static patch list
def test_patch_list_is_well_formed():
    ps = C.PATCHES
    assert len(ps) > 60
    keys = [(p['file'], p['old']) for p in ps]
    assert len(set(keys)) == len(keys)                                    # a second patch on the same text would never match twice
    for p in ps:
        assert p['old'] != p['new'] and p['why'] and p['file'].count('\\') == 0
    runtime = {p['file'] for p in ps if 'RUNTIME' in p['why']}
    for must in ['ashlar/pipeline/codex/astra_batch.py', 'ashlar/pipeline/codex/build_prompt.py',
                 'ashlar/pipeline/tripo/scripts/tripo_multiview.sh', 'ashlar/pipeline/tripo/scripts/tripo_asset_finish.sh',
                 '.agents/skills/generate-tpose-for-tripo/scripts/run_session.sh', 'lookdev-lab/scripts/prepare-act1-kit.py',
                 'lookdev-lab/scripts/prepare-act1-extras.py', 'ashlar/3d/props/act1_kit_v1/_tools/split_rows.py',
                 'ashlar/3d/props/act1_extras_v1/build_manifest.py', 'ashlar/art/act-01/environments/A01-A14/act01_batch.py']:
        assert must in runtime, must


def test_real_repo_plan_is_complete():
    """on the real repo (before the apply): every group, piece and weapon is mapped; skipped after the apply"""
    repo = R.REPO
    if not os.path.isdir(os.path.join(repo, 'ashlar', '3d', 'props', 'act1_kit_v1')):
        pytest.skip('layout already applied')
    mv = C.build_moves(repo)
    dirs = {m['src']: m['dst'] for m in mv if 'xdst' not in m}
    pieces = [s for s in dirs if '/props/act1_kit_v1/A' in s or '/props/act1_extras_v1/A' in s]
    assert len(pieces) == 122
    assert all(dirs[s].startswith(D3 + 'act-01/environments/A') for s in pieces)
    assert sum(1 for s in dirs if s.startswith(D3 + 'weapons/') and not s.endswith('_review') and '/monsters/' in dirs[s]) == 9
    assert len({m['dst'] for m in mv}) == len(mv)

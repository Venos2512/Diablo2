"""Run: python -m pytest ashlar/pipeline/index/test_build_index.py"""
import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('build_index', os.path.join(HERE, 'build_index.py'))
BI = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(BI)


def touch(root, rel, mtime=None):
    p = os.path.join(root, *rel.split('/'))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'wb') as fh:
        fh.write(b'x')
    if mtime:
        os.utime(p, (mtime, mtime))


def make(tmp_path):
    r = str(tmp_path)
    touch(r, 'art/act-01/monsters/B01_dog/vA/concept.png', 1000)
    touch(r, 'art/act-01/monsters/B01_dog/vA/concept_r2.png', 2000)
    touch(r, 'art/act-01/monsters/B01_dog/vB/concept.png', 1500)
    touch(r, 'art/act-01/monsters/B01_dog/vA/_work/concept_r3.png', 9000)   # sidecar folder: never the newest
    touch(r, 'art/act-01/monsters/B01_dog/vA/concept.prompt.txt')
    touch(r, 'art/act-01/monsters/Z09_only2d/vA/concept.png', 10)
    touch(r, 'art/act-01/_batches/map01/x.png', 5)
    touch(r, 'art/act-01/environments/A01_village/turnaround.png', 50)
    touch(r, 'art/heroes/FL_flagellant/vA/concept_v2.png', 70)
    touch(r, 'art/heroes/_brief/x.png', 5)
    touch(r, 'art/npcs/N01_gennet/concept_A.png', 80)
    touch(r, '3d/act-01/monsters/B01_dog/B01_dog.glb')
    touch(r, '3d/act-01/monsters/B01_dog/views/front.png')
    touch(r, '3d/act-01/monsters/B01_dog/weapons/bone/B01_dog_bone.glb')
    touch(r, '3d/act-01/monsters/B01_dog/rig/B01_dog_rig.glb')               # rig folder: not listed
    touch(r, '3d/act-01/monsters/Y08_only3d/Y08_only3d.glb')
    touch(r, '3d/act-01/monsters/_review/r.png')
    touch(r, '3d/act-01/environments/A01_village/A01_1_hut/act1_kit_v1_hut.glb')
    touch(r, '3d/heroes/FL_flagellant/vA/FL_flagellant_vA.glb')
    touch(r, '3d/heroes/FL_flagellant/vA/weapons/whip/FL_whip.glb')
    touch(r, '3d/common/dungeon_v1/bone_pile/dungeon_bone_pile.glb')
    return r


def test_rows_per_id_and_links(tmp_path):
    text = BI.render(BI.collect(make(tmp_path)))
    assert '## Act 01: Monsters' in text and '## Act 01: Environments (asset groups)' in text
    assert '## Heroes' in text and '## NPCs' in text and '## Common 3D props' in text
    row = next(l for l in text.splitlines() if l.startswith('| B01_dog '))
    assert '(art/act-01/monsters/B01_dog/)' in row                      # concept folder link
    assert '[vA/concept_r2.png](art/act-01/monsters/B01_dog/vA/concept_r2.png)' in row  # newest by mtime, not _work/, not the older ones
    assert '(3d/act-01/monsters/B01_dog/)' in row
    assert '[B01_dog.glb](3d/act-01/monsters/B01_dog/B01_dog.glb)' in row
    assert 'B01_dog_bone.glb' in row and 'B01_dog_rig.glb' not in row
    assert '_work' not in row and 'concept_r3' not in row


def test_missing_sides_are_dashes(tmp_path):
    text = BI.render(BI.collect(make(tmp_path)))
    only2d = next(l for l in text.splitlines() if l.startswith('| Z09_only2d '))
    assert only2d.endswith('| — | — |') and 'art/act-01/monsters/Z09_only2d/' in only2d
    only3d = next(l for l in text.splitlines() if l.startswith('| Y08_only3d '))
    assert only3d.startswith('| Y08_only3d | — | — |') and 'Y08_only3d.glb' in only3d


def test_batches_review_and_brief_are_not_assets(tmp_path):
    text = BI.render(BI.collect(make(tmp_path)))
    for bad in ('_batches', '_review', '_brief', 'map01'):
        assert bad not in text


def test_hero_npc_environment_and_common_rows(tmp_path):
    text = BI.render(BI.collect(make(tmp_path)))
    hero = next(l for l in text.splitlines() if l.startswith('| FL_flagellant '))
    assert '(art/heroes/FL_flagellant/)' in hero and '(3d/heroes/FL_flagellant/)' in hero
    assert 'concept_v2.png' in hero and 'FL_flagellant_vA.glb' in hero and 'FL_whip.glb' in hero
    npc = next(l for l in text.splitlines() if l.startswith('| N01_gennet '))
    assert 'concept_A.png' in npc and npc.endswith('| — | — |')
    env = next(l for l in text.splitlines() if l.startswith('| A01_village '))
    assert 'turnaround.png' in env and 'act1_kit_v1_hut.glb' in env
    com = next(l for l in text.splitlines() if l.startswith('| dungeon_v1 '))
    assert 'dungeon_bone_pile.glb' in com and com.startswith('| dungeon_v1 | — | — |')


def test_section_order(tmp_path):
    text = BI.render(BI.collect(make(tmp_path)))
    heads = [l for l in text.splitlines() if l.startswith('## ')]
    assert heads == ['## Act 01: Monsters', '## Act 01: Environments (asset groups)', '## Heroes', '## NPCs', '## Common 3D props (not act-bound)']


def test_cli_writes_index(tmp_path):
    r = make(tmp_path)
    assert BI.main(['--root', r]) == 0
    assert os.path.exists(os.path.join(r, 'INDEX.md'))
    assert open(os.path.join(r, 'INDEX.md'), encoding='utf-8', newline='').read().count('\r') == 0

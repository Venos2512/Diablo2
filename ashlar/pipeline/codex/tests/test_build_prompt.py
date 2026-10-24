import base64
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import astra_batch  # noqa: E402
import build_prompt as bp  # noqa: E402

REAL = bp.AD.read_text(encoding='utf-8')


def test_real_doc_has_every_block_once():
    blocks = bp.load_blocks()
    assert set(blocks) == set(bp.BLOCKS)


@pytest.mark.parametrize('kind', sorted(bp.PRESETS))
def test_preset_blocks_verbatim(kind):
    blocks = bp.load_blocks()
    text = bp.build(blocks, bp.PRESETS[kind], 'DESC here')
    pos = 0
    for k in bp.PRESETS[kind]:
        assert blocks[k] in text
        i = text.index(blocks[k], pos)  # order preserved
        pos = i + len(blocks[k])
    assert text.rstrip().endswith('DESC here')


def test_blocks_equal_fenced_text_byte_for_byte():
    # independent re-read: the doc lines between the fences, de-indented
    lines = REAL.split('\n')
    for key, prefix in bp.BLOCKS.items():
        for i, l in enumerate(lines):
            if l.strip() == '```text' and lines[i + 1].lstrip().startswith(prefix):
                ind = l[:len(l) - len(l.lstrip())]
                j = i + 1
                body = []
                while lines[j].strip() != '```':
                    body.append(lines[j][len(ind):])
                    j += 1
                assert bp.load_blocks()[key] == '\n'.join(body)


def doc(*extra):
    return '\n'.join(f'```text\n{t}\n```\n' for t in extra)


def test_missing_block(tmp_path):
    p = tmp_path / 'ad.md'
    p.write_text(doc(*[v + ' x' for k, v in bp.BLOCKS.items() if k != 'HERO']), encoding='utf-8')
    with pytest.raises(SystemExit, match='HERO'):
        bp.load_blocks(p)


def test_duplicate_block(tmp_path):
    p = tmp_path / 'ad.md'
    p.write_text(doc(*[v + ' x' for v in bp.BLOCKS.values()], 'STYLE CORE again'), encoding='utf-8')
    with pytest.raises(SystemExit, match='found 2'):
        bp.load_blocks(p)


def test_indented_fence(tmp_path):
    p = tmp_path / 'ad.md'
    body = '\n'.join(f'- item\n\n  ```text\n  {v} x\n    keep\n  ```' for v in bp.BLOCKS.values())
    p.write_text(body, encoding='utf-8')
    assert bp.load_blocks(p)['SIX'] == 'SIX numbered cells x\n  keep'


def test_images_fixes_and_jobfile_replace(tmp_path):
    ref = tmp_path / 'ref.png'
    ref.write_bytes(b'x')
    desc = tmp_path / 'd.txt'
    desc.write_text('A big ghoul.', encoding='utf-8')
    fx = tmp_path / 'f.txt'
    fx.write_text('- shorter arms\n\nmore teeth\n', encoding='utf-8')
    jf = tmp_path / 'jobs.json'
    for out_name in ('a.png', 'b.png'):
        bp.main(['--kind', 'monster', '--desc', str(desc), '--fixes', str(fx), '--image', f'{ref}=guide',
                 '--out', str(tmp_path / out_name), '--id', 'job1', '--jobfile', str(jf)])
    bp.main(['--kind', 'prop', '--desc', str(desc), '--out', str(tmp_path / 'c.png'), '--id', 'job2',
             '--jobfile', str(jf)])
    jobs = json.loads(jf.read_text(encoding='utf-8'))
    assert [j['id'] for j in jobs] == ['job1', 'job2']
    assert jobs[0]['outputPath'].endswith('b.png') and jobs[0]['referenceImages'] == [{'path': str(ref), 'role': 'guide'}]
    text = Path(jobs[0]['promptPath']).read_text(encoding='utf-8')
    assert Path(jobs[0]['promptPath']).parent == tmp_path / '_work'  # prompt.src.txt is a sidecar: <out dir>/_work/
    assert Path(jobs[0]['promptPath']).name == 'b.prompt.src.txt' and not (tmp_path / 'b.prompt.src.txt').exists()
    assert 'INPUT IMAGES' in text and 'image 1 = guide' in text
    assert text.endswith('FIXES:\n- shorter arms\n- more teeth\n')
    assert text.index('INPUT IMAGES') < text.index('A big ghoul.') < text.index('FIXES:')


def test_existing_output_refused(tmp_path):
    desc = tmp_path / 'd.txt'
    desc.write_text('x', encoding='utf-8')
    (tmp_path / 'o.png').write_bytes(b'x')
    with pytest.raises(SystemExit, match='exists'):
        bp.main(['--kind', 'prop', '--desc', str(desc), '--out', str(tmp_path / 'o.png'), '--id', 'a',
                 '--jobfile', str(tmp_path / 'j.json')])


def test_parse_tokens_real_log_snippet():
    log = 'codex\nE:\\x\\y.png\ntokens used\n16,370\nE:\\x\\y.png\n'
    assert astra_batch.parse_tokens(log) == 16370
    assert astra_batch.parse_tokens('tokens used: 1,234,567') == 1234567
    assert astra_batch.parse_tokens('no figure') is None


def test_read_account(tmp_path):
    claims = {'email': 'a@b.c', 'https://api.openai.com/auth': {'chatgpt_account_id': 'acc-123'}}
    seg = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=')
    (tmp_path / 'auth.json').write_text(json.dumps(
        {'tokens': {'id_token': f'h.{seg}.s', 'access_token': 'SECRET'}}), encoding='utf-8')
    label = astra_batch.read_account(tmp_path)
    assert 'acc-123' in label and 'a@b.c' not in label and 'SECRET' not in label
    (tmp_path / 'auth.json').write_text(json.dumps({'tokens': {'account_id': 'direct-1', 'access_token': 'SECRET'}}))
    assert astra_batch.read_account(tmp_path) == 'account_id=direct-1'
    assert 'unreadable' in astra_batch.read_account(tmp_path / 'nope')

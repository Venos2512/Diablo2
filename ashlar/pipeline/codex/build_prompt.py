"""Assemble one complete Astra prompt from ashlar/art-direction/artdirection.md section 3 and register the job.

Blocks are parsed out of the ```text fences of artdirection.md at run time (never hardcoded) and
pasted verbatim, then INPUT IMAGES, the asset description and FIXES.
Usage: build_prompt.py --kind monster --desc d.txt --image ref.png=guide --out X.png --id X --jobfile jobs.json
"""
import argparse
import json
import re
import sys
from pathlib import Path

AD = Path(__file__).resolve().parents[2] / 'art-direction' / 'artdirection.md'

# block key -> prefix the fenced text starts with (checked for exactly one match)
BLOCKS = {
    'STYLE': 'STYLE CORE',
    'SHEET': 'SHEET RULES',
    'HERO': 'HERO RULES',
    'MONSTER': 'MONSTER RULES',
    'TERRAIN': 'TERRAIN TILE RULES',
    'TPOSE': 'T-POSE RULES',
    'HUMANOID': 'HUMANOID T-POSE RULES',
    'QUADRUPED': 'QUADRUPED NEUTRAL-POSE RULES',
    'ENV': 'ENVIRONMENT RULES',
    'SIX': 'SIX numbered cells',
    'SCENE': 'In dark scenes compose',
    'TRIPO': 'TRIPO ROW INPUT',
    'CONTENT': 'CONTENT',
}
PRESETS = {
    'monster': ['STYLE', 'SHEET', 'MONSTER', 'CONTENT'],
    'hero': ['STYLE', 'SHEET', 'HERO', 'CONTENT'],
    'prop': ['STYLE', 'SHEET', 'CONTENT'],
    'terrain': ['STYLE', 'TERRAIN', 'CONTENT'],
    'tpose-humanoid': ['STYLE', 'TPOSE', 'HUMANOID', 'CONTENT'],
    'tpose-quadruped': ['STYLE', 'TPOSE', 'QUADRUPED', 'CONTENT'],
    'env-sheet': ['STYLE', 'SHEET', 'ENV', 'SIX', 'CONTENT'],
    'scene': ['STYLE', 'ENV', 'SCENE', 'CONTENT'],
    'tripo-row': ['STYLE', 'ENV', 'TRIPO', 'CONTENT'],
}
FENCE_OPEN = re.compile(r'^(\s*)```text\s*$')


def fenced_texts(md):
    """All ```text blocks, exact inner text (list-indentation of the fence removed from each line)."""
    out, lines, i = [], md.split('\n'), 0
    while i < len(lines):
        m = FENCE_OPEN.match(lines[i])
        if not m:
            i += 1
            continue
        indent, body = m.group(1), []
        i += 1
        while i < len(lines) and lines[i].strip() != '```':
            body.append(lines[i][len(indent):] if lines[i].startswith(indent) else lines[i])
            i += 1
        out.append('\n'.join(body))
        i += 1
    return out


def load_blocks(path=AD):
    texts = fenced_texts(Path(path).read_text(encoding='utf-8'))
    found = {}
    for key, prefix in BLOCKS.items():
        hits = [t for t in texts if t.startswith(prefix)]
        if len(hits) != 1:
            raise SystemExit(f'artdirection block {key!r} ({prefix!r}): found {len(hits)}, expected exactly 1')
        found[key] = hits[0]
    return found


def build(blocks, keys, desc, fixes=None, images=()):
    parts = [blocks[k] for k in keys]
    if images:
        listing = '; '.join(f'image {n} = {role or Path(p).name}' for n, (p, role) in enumerate(images, 1))
        parts.append(f'INPUT IMAGES (attached in this order): {listing}.')
    parts.append(desc.strip())
    fx = [l.strip().lstrip('-* ').strip() for l in (fixes or '').splitlines() if l.strip()]
    if fx:
        parts.append('FIXES:\n' + '\n'.join(f'- {l}' for l in fx))
    return '\n\n'.join(parts) + '\n'


def upsert_job(jobfile, job):
    jf = Path(jobfile).resolve()
    jobs = json.loads(jf.read_text(encoding='utf-8')) if jf.exists() else []
    jobs = [j for j in jobs if j['id'] != job['id']] + [job]
    jf.parent.mkdir(parents=True, exist_ok=True)
    jf.write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def parse_image(spec):
    p, _, role = spec.partition('=')
    return p, role or None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--kind', choices=sorted(PRESETS))
    ap.add_argument('--blocks', nargs='+', choices=sorted(BLOCKS), help='explicit block keys instead of --kind')
    ap.add_argument('--desc', required=True, help='file with the asset-specific English description')
    ap.add_argument('--fixes', help='file; each line becomes an item of FIXES:')
    ap.add_argument('--image', action='append', default=[], help='PATH[=role], repeatable, order = image 1, 2...')
    ap.add_argument('--out', required=True, help='target PNG (must not exist)')
    ap.add_argument('--id', required=True)
    ap.add_argument('--jobfile', required=True)
    ap.add_argument('--artdirection', default=str(AD))
    a = ap.parse_args(argv)
    if bool(a.kind) == bool(a.blocks):
        raise SystemExit('give exactly one of --kind or --blocks')
    out = Path(a.out).resolve()
    if out.exists():
        raise SystemExit(f'output already exists: {out}')
    images = [(str(Path(p).resolve()), r) for p, r in map(parse_image, a.image)]
    for p, _ in images:
        if not Path(p).exists():
            raise SystemExit(f'missing input image: {p}')
    keys = a.blocks or PRESETS[a.kind]
    text = build(load_blocks(a.artdirection), keys, Path(a.desc).read_text(encoding='utf-8'),
                 Path(a.fixes).read_text(encoding='utf-8') if a.fixes else None, images)
    src = out.parent / '_work' / f'{out.stem}.prompt.src.txt'  # sidecars live in <out dir>/_work/
    src.parent.mkdir(parents=True, exist_ok=True)
    src.write_text(text, encoding='utf-8', newline='\n')
    upsert_job(a.jobfile, {'id': a.id, 'promptPath': str(src), 'outputPath': str(out),
                           'referenceImages': [{'path': p, **({'role': r} if r else {})} for p, r in images]})
    print(f'{src}: {len(text)} chars, ~{len(text) // 4} tokens, blocks={",".join(keys)}')


if __name__ == '__main__':
    sys.exit(main())

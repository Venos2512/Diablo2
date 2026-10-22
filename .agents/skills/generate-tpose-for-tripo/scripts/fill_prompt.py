"""Fill a prompt template of the generate-tpose-for-tripo skill (text only).

  python -I fill_prompt.py <template.md> <asset_dir> --out <prompt.txt>
         [--pose-file templates/creature_pose.blocks.md --pose-section "Q front_back"]
         [--humanoid-section "For front_back.prompt.md"] [--fig-pct 45] [--retry "The previous attempt had X; fix X."]

Placeholders it fills ({{...}}; any other one left in the result is an error):
  {{DESIGN}} {{ASYMMETRY}} {{REMOVE}} {{PROPORTIONS}} {{VIEWS}}   sections of <asset_dir>/design.txt (KEY: at the start of a line)
  {{STYLE_CORE}} {{SHEET_RULES}} {{TPOSE_RULES}} {{CONTENT}}   the fenced text blocks of ashlar/artdirection.md
                                                        3.1, 3.2, 3.6 and 3.8, pasted VERBATIM (art direction rule 0.2)
  {{POSE}}        the "## <pose-section>" part of the pose blocks file, with {{PROPORTIONS}} filled
  {{HUMANOID}}    the "## <humanoid-section>" part of templates/humanoid.block.md (PROPORTIONS filled); removed if not given
  {{FIG_PCT}}     --fig-pct
  {{IF_RETRY: ...}}  kept (without the wrapper) when --retry is given, otherwise removed; --retry's sentence
                     (the failure named first) is also put at the very top of the prompt
"""
import argparse
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ART = SKILL.parents[2] / 'ashlar' / 'artdirection.md'  # repo root = .agents/skills/<skill> three levels up
KEYS = ('HUMANOID', 'FAMILY', 'DESIGN', 'ASYMMETRY', 'REMOVE', 'PROPORTIONS', 'VIEWS')
IGNORED_KEYS = ('NOTES',)
AD_BLOCKS = {'STYLE_CORE': '### 3.1 ', 'SHEET_RULES': '### 3.2 ', 'TPOSE_RULES': '### 3.6 ', 'CONTENT': '### 3.8 '}


def design_sections(path):
    """KEY: sections of design.txt (utf-8-sig tolerates a byte-order mark). Only the known KEYS (and an ignored NOTES:)
    start a section. Any other ALL-CAPS word + colon at the start of a line is an error that names it, because
    silently gluing it on or dropping it would change the prompt without a word: write such sub-headings inside
    the paragraph instead."""
    out, key = {}, None
    for line in Path(path).read_text(encoding='utf-8-sig').splitlines():
        m = re.match(r'^([A-Z][A-Z_]{2,}):\s*(.*)$', line)
        if m:
            word = m.group(1)
            if word not in KEYS and word not in IGNORED_KEYS:
                sys.exit(f'{path}: "{word}:" starts a line but is not a design.txt section ({", ".join(KEYS)}; '
                         f'NOTES: is ignored). Move it inside its paragraph, or rename it.')
            if word in out:
                sys.exit(f'{path}: "{word}:" appears twice')
            key = word
            out[key] = m.group(2).strip()
        elif key and line.strip():
            out[key] += ' ' + line.strip()
    return out


def art_block(heading):
    lines = ART.read_text(encoding='utf-8-sig').splitlines()
    start = next((i for i, ln in enumerate(lines) if ln.startswith(heading)), None)
    if start is None:
        sys.exit(f'heading "{heading}" not found in {ART}')
    nxt = next((i for i in range(start + 1, len(lines)) if lines[i].startswith('### ') or lines[i].startswith('## ')), len(lines))
    fence = [i for i in range(start, nxt) if lines[i].strip().startswith('```')]
    if len(fence) < 2:
        sys.exit(f'no fenced block after "{heading}" in {ART}')
    return '\n'.join(lines[fence[0] + 1:fence[1]]).strip()


def blocks_section(path, title):
    text = Path(path).read_text(encoding='utf-8-sig')
    parts = re.split(r'(?m)^## ', text)
    for p in parts[1:]:
        head, _, body = p.partition('\n')
        if head.strip() == title:
            return body.strip()
    sys.exit(f'section "{title}" not found in {path}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('template')
    ap.add_argument('asset_dir')
    ap.add_argument('--out', required=True)
    ap.add_argument('--pose-file')
    ap.add_argument('--pose-section')
    ap.add_argument('--humanoid-section')
    ap.add_argument('--fig-pct')
    ap.add_argument('--retry')
    args = ap.parse_args()

    sec = design_sections(Path(args.asset_dir) / 'design.txt')
    text = Path(args.template).read_text(encoding='utf-8-sig')
    if args.pose_section:
        if not args.pose_file:
            sys.exit('--pose-section needs --pose-file')
        text = text.replace('{{POSE}}', blocks_section(args.pose_file, args.pose_section))
    if args.humanoid_section:
        text = text.replace('{{HUMANOID}}', blocks_section(SKILL / 'templates/humanoid.block.md', args.humanoid_section))
    else:
        text = re.sub(r'(?m)^\{\{HUMANOID\}\}\n?', '', text)
    for key, heading in AD_BLOCKS.items():
        if '{{' + key + '}}' in text:
            text = text.replace('{{' + key + '}}', art_block(heading))
    for key in ('DESIGN', 'ASYMMETRY', 'REMOVE', 'PROPORTIONS', 'VIEWS'):
        if '{{' + key + '}}' in text:
            if not sec.get(key):
                sys.exit(f'design.txt has no {key}: section but the template needs it ({args.asset_dir})')
            text = text.replace('{{' + key + '}}', sec[key])
    if args.fig_pct:
        text = text.replace('{{FIG_PCT}}', args.fig_pct)
    text = re.sub(r'\{\{IF_RETRY:\s*(.*?)\}\}', (lambda m: m.group(1)) if args.retry else '', text, flags=re.S)
    if args.retry:
        text = args.retry.strip() + '\n' + text
    left = re.findall(r'\{\{[^}]*\}\}', text)
    if left:
        sys.exit(f'unfilled placeholders: {left}')
    Path(args.out).write_text(text.strip() + '\n', encoding='utf-8')
    print(f'wrote {args.out} ({len(text)} chars)')


if __name__ == '__main__':
    main()

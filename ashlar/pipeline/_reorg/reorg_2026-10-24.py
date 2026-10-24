#!/usr/bin/env python
"""Repo reorganisation of 2026-10-24 (ASHLAR under ashlar/, old projects under legacy/, notes under research/).

Modes
  --dry-run (default)  read-only: pre-checks, plan, dryrun_report.md, reorg_map.json
  --apply              pre-checks (+ lock probe) -> compute all rewrites -> move -> write rewritten text
  --verify             after apply: remaining old-prefix references + Markdown links that do not resolve
  --probe-locks        (with --dry-run) also rename every source to a temp name and back to detect locks

No git commands are run; git sees the moves as renames when the user commits.
Only the standard library is used.
"""
import argparse
import bisect
import hashlib
import datetime
import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SELF_REL = 'ashlar/pipeline/_reorg'
BACKUP_NAME = 'tmp_reorg_backup'  # folder in the drive root; a later round sets its own
REPORT_TITLE = 'reorg_2026-10-24.py'
ROUND1_NOTES = True  # the bestiary section of the report is round-1 specific

# ------------------------------------------------------------------ the map (ordered; inner entries first)
A = 'ashlar/art/'
MOVES = [
    # ashlar root
    dict(src='ashlar/artdirection.md', dst='ashlar/art-direction/artdirection.md'),
    dict(src='ashlar/ASHLAR_ART_DIRECTION_VI.md', dst='ashlar/art-direction/ASHLAR_ART_DIRECTION_VI.md'),
    dict(src='ashlar/ASHLAR_ART_DIRECTION_BOARD.html', dst='ashlar/art-direction/ASHLAR_ART_DIRECTION_BOARD.html'),
    dict(src='ashlar/ASHLAR_BIOME_VA_KHU_VUC_VI.md', dst='ashlar/docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md'),
    dict(src='ashlar/ASHLAR_HERO_CONCEPT_VI.md', dst='ashlar/docs/ASHLAR_HERO_CONCEPT_VI.md'),
    dict(src='ashlar/ASHLAR_MONSTER_CHECKLIST_VI.md', dst='ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md'),
    dict(src='ashlar/ASHLAR_QUY_CHUAN_QUAI_VI.md', dst='ashlar/docs/ASHLAR_QUY_CHUAN_QUAI_VI.md'),
    dict(src=A + '_codex', dst='ashlar/pipeline/codex'),
    # whole tripo-models folder (Agent.md + _tools + nature/_tools keep their relative layout); must run before art-output
    dict(src='art-output/tripo-models', dst='ashlar/pipeline/tripo'),
    # ashlar/art
    dict(src=A + 'map-01-concepts/monsters', dst=A + 'act-01/monsters'),
    dict(src=A + 'map-01-concepts/environments', dst=A + 'act-01/environments/E01-E04_map01'),
    dict(src=A + 'map-01-concepts/_brief', dst=A + 'act-01/_map01/_brief'),
    dict(src=A + 'map-01-concepts/_runs', dst=A + 'act-01/_map01/_runs'),
    dict(src=A + 'map-01-concepts/REVISION_2_VI.md', dst=A + 'act-01/_map01/REVISION_2_VI.md'),
    dict(src=A + 'act-01-environments', dst=A + 'act-01/environments/A01-A14'),
    dict(src=A + 'act-01-environments-v2', dst=A + 'act-01/environments/A15-A20'),
    dict(src=A + 'act-01-environments-v3', dst=A + 'act-01/environments/A21-A25'),
    dict(src=A + 'act-02-monsters', dst=A + 'act-02/monsters'),
    dict(src=A + 'prologue-concepts-v1', dst=A + 'prologue/concepts-v1'),
    dict(src=A + 'terrain-biomes-v1', dst=A + 'textures/terrain-biomes-v1'),
    dict(src=A + 'terrain-biomes-v2-stylized', dst=A + 'textures/terrain-biomes-v2-stylized'),
    dict(src=A + 'terrain-dark-wood', dst=A + 'textures/terrain-dark-wood'),
    dict(src=A + 'terrain-dungeon-v1', dst=A + 'textures/terrain-dungeon-v1'),
    dict(src=A + 'wall-ossuary-v1', dst=A + 'textures/wall-ossuary-v1'),
    # root -> legacy/
    dict(src='art-direction', dst='legacy/art-direction'),
    dict(src='art-output', dst='legacy/art-output'),
    dict(src='bestiary', dst='legacy/bestiary'),
    dict(src='sites', dst='legacy/sites'),
    dict(src='output', dst='legacy/output'),
] + [dict(src=f, dst='legacy/' + f) for f in [
    'ACT1_MONSTER_ANIMATION_VI.md', 'DIABLO_II_ART_CHECKLIST_VI.md', 'D2RR.html', 'Diablo_II_Act1_Bestiary.html',
    'Diablo_II_Act1_Source.zip', 'Sanctuary_Databook.html', 'Sanctuary_Databook_Source.zip',
    'Sanctuary_Lookdev_Lab_Source.zip', 'book-of-cain-site.tar.gz', 'site-package-v5.tar']
] + [
    dict(src='research_notes', dst='research/notes'),
    dict(src='reports', dst='research/reports'),
]
# Code edits no token rewrite can make. file = OLD path; old/new are applied to the text AFTER the path rewrites.
PATCHES = [
    dict(file='ashlar/art/_codex/build_prompt.py', old="parents[2] / 'artdirection.md'",
         new="parents[2] / 'art-direction' / 'artdirection.md'",
         why="ashlar/pipeline/codex/build_prompt.py: parents[2] is still ashlar/, the doc moved into art-direction/"),
    dict(file='.agents/skills/generate-tpose-for-tripo/scripts/fill_prompt.py', old="/ 'ashlar' / 'artdirection.md'",
         new="/ 'ashlar' / 'art-direction' / 'artdirection.md'", why='doc moved into ashlar/art-direction/'),
    dict(file='ashlar/art/map-01-concepts/_brief/MANIFEST.json',
         old='"projectRoot": "E:/Diablo2/ashlar/art/map-01-concepts"',
         new='"projectRoot": "E:/Diablo2/ashlar/art/act-01"', why='map-01-concepts no longer exists (split dir)'),
    dict(file='bestiary/scripts/build.mjs', old="['../D2RR.html','']", new="['../D2RR.html','../']",
         why='D2RR.html now sits in legacy/: its origin root is one level up'),
    dict(file='bestiary/scripts/check.mjs', old='<meta name="origin-root" content="">',
         new='<meta name="origin-root" content="../">', why='matches the D2RR origin root above'),
    dict(file='bestiary/scripts/import_concepts.py', old='REPO = BESTIARY.parent',
         new='REPO = BESTIARY.parent.parent  # bestiary is in legacy/ now: the repo root is two levels up',
         why='REPO is the repo root that the repo-relative `origin` values hang on'),
    dict(file='bestiary/README.md', old='when `legacy/D2RR.html` stays at the repository root',
         new='when `D2RR.html` stays in `legacy/` (its links climb to the repository root with `../`)',
         why='prose: D2RR.html moved to legacy/'),
    dict(file='lookdev-lab/scripts/prepare-act1-kit.py',
         old='ashlar/art/act-01/environments/E01-E04_map01/E01-E04 for',
         new='ashlar/art/act-01/environments/E01-E04_map01 (E01-E04) for',
         why='the rewrite appended the old range label E01-E04 as a sub-folder'),
    dict(file='ashlar/3d/rig-anim/Agent.md', old='Theo `tripo-models/Agent.md`', new='Theo `../../pipeline/tripo/Agent.md`',
         why='stale name: the tripo doc is ashlar/pipeline/tripo/Agent.md'),
    dict(file='ashlar/art/act-01-environments/README_VI.md', old='`map-01-concepts/_brief/MANIFEST.json`',
         new='`../../_map01/_brief/MANIFEST.json`', why='relative to A01-A14/: act-01/_map01/_brief/MANIFEST.json'),
    dict(file='lookdev-lab/scripts/prepare-nature-kits.py', old='tripo-models/nature/_tools/compose_rows.py',
         new='ashlar/pipeline/tripo/nature/_tools/compose_rows.py', why='comment names the old tripo-models folder'),
    dict(file='art-output/tripo-models/_tools/tripo_sheet.sh', old='writes tripo-models/camp/<name>.glb',
         new='writes ashlar/pipeline/tripo/camp/<name>.glb', why='usage comment'),
    dict(file='art-output/tripo-models/nature/_tools/tripo_sheet.sh', old='writes tripo-models/nature/<name>.glb',
         new='writes ashlar/pipeline/tripo/nature/<name>.glb', why='usage comment'),
    dict(file='art-output/tripo-models/nature/_tools/tripo_finish.sh', old='Export GLB to tripo-models/nature/<name>.glb',
         new='Export GLB to ashlar/pipeline/tripo/nature/<name>.glb', why='usage comment'),
    dict(file='lookdev-lab/src/env/act1/maps/fens.js', old='A17 (act-01-environments-v2,',
         new='A17 (ashlar/art/act-01/environments/A15-A20,', why='comment names the renamed v2 folder'),
    dict(file='lookdev-lab/src/env/act1/maps/poppyReach.js', old='A18 (act-01-environments-v2,',
         new='A18 (ashlar/art/act-01/environments/A15-A20,', why='comment names the renamed v2 folder'),
]
STAY = ['AGENTS.md', 'Agent.md', '.gitignore', '.mcp.json', '.agents', '.claude', 'lookdev-lab', 'tmp',
        'Sanctuary_Lookdev_Lab.html']  # the last one is the live lab build output (lookdev-lab/scripts/build.mjs, serve.mjs)

# ------------------------------------------------------------------ file classification
LIVE_EXT = {'.md', '.js', '.mjs', '.ts', '.py', '.json', '.html', '.css', '.txt', '.bat', '.sh', '.toml', '.yml', '.yaml'}
LIVE_NAMES = {'.gitignore'}
RECORD_EXT = {'.log', '.jsonl', '.out'}
RECORD_RX = re.compile(r'(^|[-_.])(task|result|prompt)[^/\\]*\.txt$')
MAX_BYTES = 5 * 1024 * 1024
PRUNE_DIRS = {'.git', 'node_modules', '__pycache__'}
PRUNE_PATHS = {'lookdev-lab/dist'}
UNTOUCHED_TOP = {'tmp'}
CODE_EXT = {'.js', '.mjs', '.ts', '.py', '.sh', '.bat'}
RUNTIME_AREAS = ['lookdev-lab/src/', 'lookdev-lab/scripts/', 'ashlar/gametest/', 'ashlar/pipeline/', 'ashlar/art/_codex/',
                 'art-output/tripo-models/', '.agents/', '.claude/', 'bestiary/']


def is_runtime_area(rel):
    """scanned at the OLD location: every code file is code that may load files; json only in the data areas"""
    ext = os.path.splitext(rel)[1].lower()
    if rel.split('/')[0] == 'tmp':
        return False
    if ext in CODE_EXT:
        return True
    return ext == '.json' and any(rel.startswith(a) for a in RUNTIME_AREAS)


def classify(rel, size):
    """live | record | None (not text we look at). 'big' handled by caller."""
    name = posixpath.basename(rel)
    ext = os.path.splitext(name)[1].lower()
    if not (ext in LIVE_EXT or ext in RECORD_EXT or name in LIVE_NAMES):
        return None
    p = '/' + rel
    if '/_runs/' in p or '/logs/' in p or name.endswith('.provenance.json'):
        return 'record'
    if ext in RECORD_EXT or RECORD_RX.search(name):
        return 'record'
    return 'live'


# ------------------------------------------------------------------ rules
class Rules:
    def __init__(self, moves):
        self.moves = [m for m in moves if not m.get('blocked')]
        self.rules = []
        for m in self.moves:
            self.rules.append(dict(src=m['src'], dst=m['dst'], ss=m['src'].split('/'), ds=m['dst'].split('/'),
                                   isdir=m.get('isdir'), bulk=bool(m.get('quiet'))))
        self.rules.sort(key=lambda r: -len(r['ss']))  # longest first
        self.by_src = {r['src']: r for r in self.rules}
        self.by_ss = {tuple(r['ss']): r for r in self.rules}  # prefix lookup (thousands of file-level rules in round 3)
        self.maxlen = max([len(r['ss']) for r in self.rules] or [0])
        self.by_last = defaultdict(list)  # last source segment -> rules (seg_violations)
        for r in self.rules:
            self.by_last[r['ss'][-1]].append(r)
        self.vanishing = set()
        self.root_names = {r['ss'][0] for r in self.rules if len(r['ss']) == 1}  # old top-level names ('art-direction', ...)
        self.under = defaultdict(list)  # proper ancestor dir ('' = repo root) -> sources below it
        for r in self.rules:
            ss = r['ss']
            for i in range(len(ss)):
                self.under['/'.join(ss[:i])].append(r['src'])

    def find(self, segs):
        """longest rule whose source segments are a prefix of segs -> (rule, k)"""
        for k in range(min(len(segs), self.maxlen), 0, -1):
            r = self.by_ss.get(tuple(segs[:k]))
            if r:
                return r, k
        return None, 0

    def map_path(self, rel):
        if rel in ('', '.'):
            return ''
        segs = rel.split('/')
        r, k = self.find(segs)
        if not r:
            return rel
        return '/'.join(r['ds'] + segs[k:])


SEP = r'(?:\\\\|\\/|\\|/)'
SEG = r'[\w.\-]+'
TOKEN = re.compile(
    r'(?P<abs>(?<![\w])(?:[Ee]:|/[Ee])' + SEP + r'+Diablo2(?![\w\-]))(?P<atail>(?:' + SEP + SEG + r')*' + SEP + r'?)'
    r'|(?<![\w.\-/\\$%}~])(?<!(?<!\w)[A-Za-z]:)(?P<var>(?:\$\{[^}\s]*\}|\$[A-Za-z_]\w*|%\w+%)' + SEP + r')?'
    r'(?P<rtail>' + SEG + r'(?:' + SEP + SEG + r')*' + SEP + r'?)')
SEP_SPLIT = re.compile('(' + SEP + ')')
SEP_RX = re.compile(SEP)
LINK_RX = re.compile(r'''\]\(\s*<?([^)\s>]+)|(?:href|src)\s*=\s*["']([^"']+)|^\s*\[[^\]]+\]:\s*(\S+)''', re.M)
GENERIC_ROOTS = {'output', 'sites', 'reports', 'bestiary', 'art-output', 'art-direction', 'research_notes'}
SEG_SOFT_OK = set()  # OLD paths of code files whose hits on bulk (sidecar-name) rules are explained and ignored
OVERRIDE_REPO_ROOT = {('bestiary/scripts/build.mjs', 17), ('bestiary/scripts/check.mjs', 73),
                      ('bestiary/scripts/check.mjs', 79)}


class Ctx:
    def __init__(self, repo, rules):
        self.repo = repo
        self.rules = rules
        self.vanishing = set()
        self._ex = {}
        self.decisions = []
        self.history = []
        self.live = False

    def exists(self, rel):
        v = self._ex.get(rel)
        if v is None:
            v = os.path.exists(os.path.join(self.repo, rel)) if rel else True
            self._ex[rel] = v
        return v


def _ancestors(rel):
    p = posixpath.dirname(rel)
    while p:
        yield p
        p = posixpath.dirname(p)


def compute_vanishing(repo, rules):
    """directories that are not moved themselves but would be left empty (everything below is moved away)."""
    srcs = {r['src'] for r in rules.rules}
    anc = set()
    for s in srcs:
        p = posixpath.dirname(s)
        while p:
            anc.add(p)
            p = posixpath.dirname(p)
    anc -= srcs
    anc -= {d for r in rules.rules for d in _ancestors(r['dst'])}  # a dir that receives moved things stays (monsters/ -> monsters/act-01/)
    van = set()
    for a in sorted(anc, key=lambda x: -x.count('/')):
        full = os.path.join(repo, a)
        if not os.path.isdir(full) or rules.find(a.split('/'))[0]:
            continue
        ok = True
        for c in os.listdir(full):
            cr = a + '/' + c
            if cr in srcs or cr in van:
                continue
            ok = False
            break
        if ok:
            van.add(a)
    return van


def _style_join(parts, style):
    return style.join(parts)


def rewrite_text(text, rel, ctx, gitignore=False):
    """-> (new_text, edits). edits: dict(kind, before, after, pos, rule, flag)"""
    if gitignore:
        out, edits, off = [], [], 0
        for ln in text.splitlines(keepends=True):
            body = ln.rstrip('\r\n')
            tail = ln[len(body):]
            lead = ''
            for pre in ('!/', '/'):
                if body.startswith(pre):
                    lead, body = pre, body[len(pre):]
                    break
            nb, ed = _rewrite(body, rel, ctx, link_starts=set())
            for e in ed:
                e['pos'] += off + len(lead)
            edits += ed
            out.append(lead + nb + tail)
            off += len(ln)
        return ''.join(out), edits
    link_starts = set()
    ext = os.path.splitext(rel)[1].lower()
    if ext in ('.md', '.html'):
        for m in LINK_RX.finditer(text):
            g = next((i for i in (1, 2, 3) if m.group(i)), None)
            if g:
                link_starts.add(m.start(g))
    return _rewrite(text, rel, ctx, link_starts)


HIST_RX = re.compile(r'(Chuyển từ|chuyển từ|đổi tên từ|[Mm]oved from|[Rr]enamed from)')
DATE_RX = re.compile(r'(?<![\w.])(?:20\d\d-\d\d-\d\d|\d{1,2}-\d{1,2}|\d{1,2}/\d{1,2}(?:/\d{2,4})?)(?![\w.])')


def is_history_line(text, pos):
    """a changelog line ("10-21 ... Chuyển từ X"): keep it as it was written"""
    ls = text.rfind('\n', 0, pos) + 1
    le = text.find('\n', pos)
    line = text[ls:le if le >= 0 else len(text)]
    return len(line) <= 800 and bool(HIST_RX.search(line) and DATE_RX.search(line))


def _rewrite(text, rel, ctx, link_starts):
    rules = ctx.rules
    file_dir = posixpath.dirname(rel)
    file_new = rules.map_path(rel)
    new_dir = posixpath.dirname(file_new)
    edits = []
    pieces = []
    last = 0
    results = []
    hist_ok = os.path.splitext(rel)[1].lower() in ('.md', '.txt')  # changelog lines only in prose files
    for m in TOKEN.finditer(text):
        tok = m.group(0)
        res = None
        if m.group('abs'):
            res = _abs_or_rel(m, tok, rules, 'abs')
        else:
            first = re.split(SEP, m.group('rtail'), maxsplit=1)[0]
            relative = first in ('.', '..') and not m.group('var')  # $VAR/../x cannot be resolved
            if not relative and m.start('rtail') in link_starts and not m.group('var'):
                cand = posixpath.normpath(posixpath.join(file_dir, *[s for s in SEP_SPLIT.split(m.group('rtail'))[0::2] if s]))
                if ctx.exists(cand):
                    relative = True
            if relative:
                res = _relative(m, tok, rel, file_dir, new_dir, ctx, text)
            else:
                res = _abs_or_rel(m, tok, rules, 'rel')
                if (res is None and rel.startswith('ashlar/') and not m.group('var')
                        and os.path.splitext(rel)[1].lower() not in CODE_EXT):
                    res = _abs_or_rel(m, tok, rules, 'rel', prefix=('ashlar',))
                    if res is not None and not SEP_RX.search(m.group('rtail')):
                        # a bare file name: leave it when file and target end up in one folder, and in link text
                        tgt = rules.map_path('ashlar/' + m.group('rtail').rstrip('.'))
                        if posixpath.dirname(tgt) == new_dir or (text[max(0, m.start() - 1):m.start()] == '['
                                                                  and text.startswith('](', m.end())):
                            res = None
        if res:
            results.append((m, res))
    # a line whose '../../' base follows its moved targets must not also get the bare names prefixed again
    follow_lines = {text.rfind('\n', 0, m.start()) for m, res in results if res.get('follows')}
    for m, res in results:
        if res.get('flag') == 'bare-root' and text.rfind('\n', 0, m.start()) in follow_lines:
            continue
        if hist_ok and res['after'] != res['before'] and res['kind'] != 'unfixable' and is_history_line(text, m.start()):
            if ctx.live:
                ctx.history.append((rel, text.count('\n', 0, m.start()) + 1, m.group(0)))
            continue
        if res['after'] != res['before'] or res['kind'] == 'unfixable':
            res['pos'] = m.start()
            edits.append(res)
            pieces.append(text[last:m.start()])
            pieces.append(res['after'])
            last = m.end()
    pieces.append(text[last:])
    return ''.join(pieces), edits


def _abs_or_rel(m, tok, rules, mode, prefix=()):
    """prefix=('ashlar',): the token is spelled relative to ashlar/ (docs inside ashlar/ write `art/terrain-dark-wood/...`)"""
    if mode == 'abs':
        tail = m.group('atail')
        if not tail:
            return None
        root = m.group('abs')
        sep0 = SEP_RX.match(tail).group(0)
        rest = tail[len(sep0):]
        head = root + sep0
        style = sep0
    else:
        rest = m.group('rtail')
        head = m.group('var') or ''
        style = None
    parts = SEP_SPLIT.split(rest)
    segs = parts[0::2]
    seps = parts[1::2]
    trail_sep = bool(segs) and segs[-1] == ''
    eff = segs[:-1] if trail_sep else list(segs)
    if not eff:
        return None
    if style is None:
        style = seps[0] if seps else '/'
    dots = ''
    last = eff[-1]
    core = last.rstrip('.')
    probe = list(eff)
    if core and core != last and not trail_sep:
        dots = last[len(core):]
        probe[-1] = core
    pre = list(prefix)
    r, k = rules.find(pre + probe)
    if r and pre and k <= len(pre):
        r = None
    if not r:
        if not pre and '/'.join(probe) in rules.vanishing:
            return dict(kind='unfixable', why='split-dir', before=tok, after=tok, rule=None)
        return None
    ds = r['ds']
    nss = len(r['ss'])
    if pre:
        if ds[:len(pre)] != pre:
            return None  # moved out of ashlar/: cannot be spelled relative to it
        ds = ds[len(pre):]
        if ds and ds[0] in rules.root_names:
            ds = pre + ds  # `art-direction/x` would read as the old root folder: keep `ashlar/art-direction/x`
        k -= len(pre)
        nss -= len(pre)
    n = len(eff)
    flag = None
    if mode == 'rel' and k == n and not trail_sep and nss == 1 and r['src'] not in FILE_ROOTS and not pre:
        return None  # a bare word like "output" in prose
    if mode == 'rel' and pre:
        flag = 'ashlar-rel'
    elif mode == 'rel' and len(r['ss']) == 1:
        flag = 'bare-root'
    remainder = ''.join(parts[2 * k - 1:]) if k < n or trail_sep else ''
    if k == n and dots:
        remainder = dots + remainder
    new_head = style.join(ds)
    after = head + new_head + remainder
    return dict(kind='abs' if mode == 'abs' else 'rel', before=tok, after=after, rule=r['src'], flag=flag)


FILE_ROOTS = set()  # filled in main (single-segment sources that are files)


def split_ancestor_target(ctx, rel, r_abs, text, pos):
    """A relative token that names a directory with moved things below it (repo root, ashlar/, ...): decide from the
    statement what it is used for. -> (target_dir or None, reason, lineno)."""
    srcs = ctx.rules.under.get(r_abs)
    lineno = text.count('\n', 0, pos) + 1
    if not srcs:
        return None, None, lineno
    if (rel, lineno) in OVERRIDE_REPO_ROOT:
        return r_abs, 'override: base for repo-relative data paths (mixed ashlar/ + legacy targets) -> stays the repo root', lineno
    ls = text.rfind('\n', 0, pos) + 1
    le = text.find('\n', pos)
    line = text[ls:le if le >= 0 else len(text)]
    pref = r_abs + '/' if r_abs else ''
    firsts = {S[len(pref):].split('/')[0] for S in srcs}
    mentioned = [S for S in srcs if re.search(r"(?<=['\"/])" + re.escape(S[len(pref):].split('/')[0]) + r"(?![\w-])", line)]
    full = os.path.join(ctx.repo, r_abs) if r_abs else ctx.repo
    stays = []
    if os.path.isdir(full):
        for ch in os.listdir(full):
            if ch not in firsts and len(ch) > 3 and re.search(r"(?<=['\"/])" + re.escape(ch) + r"(?![\w-])", line):
                stays.append(ch)
    if not mentioned:
        return None, 'no moved target named on the line -> recomputed to the repo root', lineno
    if stays:
        return None, 'targets mixed (stay: %s) -> recomputed to the repo root' % ','.join(stays), lineno
    bases = set()
    for S in mentioned:
        T = ctx.rules.map_path(S)
        R = S[len(pref):]
        if T == R:
            bases.add('')
        elif T.endswith('/' + R):
            bases.add(T[:-len(R) - 1])
        else:
            return None, 'target %s moved elsewhere (%s) -> recomputed to the repo root' % (S, T), lineno
    if len(bases) != 1:
        return None, 'targets moved to different places -> recomputed to the repo root', lineno
    b = bases.pop()
    return b, 'targets %s all sit under %s/ now -> base is that folder' % (','.join(sorted(mentioned)), b or '.'), lineno


def _relative(m, tok, rel, file_dir, new_dir, ctx, text=''):
    rules = ctx.rules
    rest = m.group('rtail')
    parts = SEP_SPLIT.split(rest)
    segs = parts[0::2]
    seps = parts[1::2]
    trail_sep = segs[-1] == ''
    eff = segs[:-1] if trail_sep else list(segs)
    if not eff or (len(eff) == 1 and eff[0] in ('.', '..') and not trail_sep):
        return None  # lone '.' / '..': prose, not a path
    dots = ''
    last = eff[-1]
    if last not in ('.', '..'):
        core = last.rstrip('.')
        if core and core != last:
            dots = last[len(core):]
            eff[-1] = core
    style = seps[0] if seps else '/'
    r_abs = posixpath.normpath(posixpath.join(file_dir, *eff)) if file_dir else posixpath.normpath(posixpath.join(*eff))
    if r_abs == '.':
        r_abs = ''
    if eff[0] == '..' and not ctx.exists(r_abs) and r_abs not in ctx.vanishing:
        alt = posixpath.normpath(posixpath.join('lookdev-lab', *eff))
        if not alt.startswith('..'):
            alt_new = rules.map_path(alt)
            if alt_new != alt and ctx.exists(alt) and (rel.startswith('lookdev-lab/') or rel.endswith(('.md', '.txt'))):
                newrel = posixpath.relpath(alt_new, 'lookdev-lab')
                if trail_sep and not newrel.endswith('/'):
                    newrel += '/'
                if style != '/':
                    newrel = newrel.replace('/', style)
                rr, _ = rules.find(alt.split('/'))
                return dict(kind='relative', before=tok, after=newrel + dots, rule=rr['src'] if rr else '(cwd lookdev-lab)',
                            flag='cwd-lab', follows=False)
    if r_abs.startswith('..'):
        return dict(kind='unfixable', why='outside-repo', before=tok, after=tok, rule=None)
    target_new = rules.map_path(r_abs)
    if target_new == r_abs and new_dir == file_dir:
        return None
    if r_abs in ctx.vanishing:
        return dict(kind='unfixable', why='split-dir', before=tok, after=tok, rule=None)
    if target_new == r_abs and not ctx.exists(r_abs):
        return dict(kind='unfixable', why='already-broken', before=tok, after=tok, rule=None)
    follows = False
    if posixpath.splitext(rel)[1].lower() in CODE_EXT and r_abs in ctx.rules.under and new_dir != file_dir:
        base, why, lineno = split_ancestor_target(ctx, rel, r_abs, text, m.start())
        if base is not None:
            target_new = base
            follows = base != r_abs
        if ctx.live:
            ctx.decisions.append(dict(file=rel, line=lineno, token=tok, base=target_new or '.', reason=why))
    newrel = posixpath.relpath(target_new or '.', new_dir or '.')
    if newrel == '.':
        newrel = './'
    if eff[0] == '.' and not newrel.startswith('.'):
        newrel = './' + newrel
    elif eff[0] == '..' and not newrel.startswith('.'):
        newrel = './' + newrel
    if trail_sep and not newrel.endswith('/'):
        newrel += '/'
    if style != '/':
        newrel = newrel.replace('/', style)
    after = newrel + dots
    rr, _ = rules.find(r_abs.split('/')) if r_abs else (None, 0)
    return dict(kind='relative', before=tok, after=after, rule=rr['src'] if rr else '(file moved)', flag=None,
                follows=bool(follows))


# ------------------------------------------------------------------ scanning
def walk_files(repo):
    for dp, dns, fns in os.walk(repo):
        rel_dir = os.path.relpath(dp, repo).replace('\\', '/')
        rel_dir = '' if rel_dir == '.' else rel_dir
        keep = []
        for d in dns:
            rd = (rel_dir + '/' + d) if rel_dir else d
            if d in PRUNE_DIRS or rd in PRUNE_PATHS or rd == SELF_REL:
                continue
            keep.append(d)
        dns[:] = keep
        for f in fns:
            yield (rel_dir + '/' + f) if rel_dir else f


def line_of(starts, pos):
    return bisect.bisect_right(starts, pos)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


DOT_RX = re.compile(r"""join\(\s*(?:HERE|here|HERE_DIR|os\.path\.dirname\(os\.path\.abspath\(__file__\)\))\s*,\s*"""
                    r"""((?:['"]\.\.['"]\s*,\s*)*['"]\.\.['"])((?:\s*,\s*['"][^'"\n]+['"])*)""")


def suggest_dotdot(text, rel, ctx):
    """`os.path.join(HERE, '..', '..', 'lookdev-lab', ...)` in a moved file: climb count changes with the depth"""
    out = []
    old_dir = posixpath.dirname(rel)
    new_dir = posixpath.dirname(ctx.rules.map_path(rel))
    for m in DOT_RX.finditer(text):
        ups = re.findall(r"""['"]\.\.['"]""", m.group(1))
        rest = re.findall(r"""['"]([^'"\n]+)['"]""", m.group(2))
        segs = []
        for t in rest:
            segs += t.split('/')
        r_old = posixpath.normpath(posixpath.join(old_dir or '.', *(['..'] * len(ups) + segs)))
        if r_old == '.':
            r_old = ''
        if r_old.startswith('..') or not ctx.exists(r_old):
            continue
        r_new = ctx.rules.map_path(r_old)
        newrel = posixpath.relpath(r_new or '.', new_dir or '.')
        parts = newrel.split('/') if newrel != '.' else []
        if parts == ['..'] * len(ups) + segs:
            continue
        q = m.group(1)[0]
        old = text[m.start(1):m.end(2)]
        out.append((text.count('\n', 0, m.start(1)) + 1, old, ', '.join(q + x + q for x in parts)))
    return out


def eol_for(text, s):
    """a patch is written with \n; in a CRLF file it has to match with \r\n"""
    return s.replace('\r\n', '\n').replace('\n', '\r\n') if '\r\n' in text else s


def apply_patches(text, rel, auto, static, res):
    """static: whole-file replacements that must match exactly once; auto: (line, old, new, why) on one line.
    An auto edit whose line a static patch already rewrote is reported as superseded (clean)."""
    done_new = []
    for p in static:
        o, n = eol_for(text, p['old']), eol_for(text, p['new'])
        c = text.count(o)
        line = text.count('\n', 0, text.find(o)) + 1 if c else None
        if c == 1:
            text = text.replace(o, n)
            st = 'ok'
            done_new.append(n)
        else:
            st = 'NOT-FOUND' if c == 0 else 'AMBIGUOUS x%d' % c
        res['patches'].append(dict(file=rel, line=line, old=p['old'], new=p['new'], why='static: ' + p['why'], status=st))
    if auto:
        lines = text.split('\n')
        seen = set()
        for ln, old, new, why in auto:
            if (ln, old, new) in seen:
                continue
            seen.add((ln, old, new))
            st = 'ok'
            why2 = why
            if ln - 1 < len(lines) and old in lines[ln - 1]:
                lines[ln - 1] = lines[ln - 1].replace(old, new, 1)
            elif [i for i, l in enumerate(lines) if old in l] and len([i for i, l in enumerate(lines) if old in l]) == 1:
                i = [i for i, l in enumerate(lines) if old in l][0]  # a static patch added or removed lines above: follow the text
                lines[i] = lines[i].replace(old, new, 1)
                why2 = why + ' (line moved by a static patch)'
            elif ln - 1 < len(lines) and any(n.replace('\r\n', '\n').split('\n')[0].strip() and
                                             n.replace('\r\n', '\n').split('\n')[0] in lines[ln - 1] for n in done_new):
                why2 = why + ' (superseded by a static patch on this line)'
            else:
                st = 'NOT-FOUND'
            res['patches'].append(dict(file=rel, line=ln, old=old, new=new, why='auto: ' + why2, status=st))
        text = '\n'.join(lines)
    return text


def scan(repo, ctx, collect_text=True):
    res = dict(edits={}, new_text={}, orig_hash={}, records=Counter(), record_files=Counter(), big=[], undecodable=[],
               tmp=Counter(), tmp_files=0, unfixable=[], live_files=0, runtime=[], segsplit=[], locrel=[], broken_md=[],
               total_files=0, json_meta=Counter(), decisions=[], hops=[], patches=[])
    static = defaultdict(list)
    for pt in PATCHES:
        static[pt['file']].append(pt)
    for rel in walk_files(repo):
        res['total_files'] += 1
        top = rel.split('/')[0]
        try:
            size = os.path.getsize(os.path.join(repo, rel))
        except OSError:
            continue
        kind = classify(rel, size)
        if kind is None:
            continue
        if size > MAX_BYTES:
            res['big'].append(rel)
            continue
        try:
            with open(os.path.join(repo, rel), 'rb') as fh:
                raw = fh.read()
            text = raw.decode('utf-8')
        except (UnicodeDecodeError, OSError):
            res['undecodable'].append(rel)
            continue
        if '\x00' in text:
            continue
        gi = posixpath.basename(rel) == '.gitignore'
        if top in UNTOUCHED_TOP:
            _, ed = rewrite_text(text, rel, ctx, gi)
            n = sum(1 for e in ed if e['kind'] in ('abs', 'rel', 'relative'))
            if n:
                res['tmp']['files'] += 1
                res['tmp']['matches'] += n
            res['tmp_files'] += 1
            continue
        if kind == 'record':
            _, ed = rewrite_text(text, rel, ctx, gi)
            n = sum(1 for e in ed if e['kind'] in ('abs', 'rel', 'relative'))
            if n:
                cat = record_category(rel)
                res['records'][cat] += n
                res['record_files'][cat] += 1
            continue
        res['live_files'] += 1
        ctx.live = True
        new_text, ed = rewrite_text(text, rel, ctx, gi)
        ctx.live = False
        ext = posixpath.splitext(rel)[1]
        if ext == '.md':
            for b in broken_md_links(text, rel, ctx):
                res['broken_md'].append((rel, b))
        starts = None
        good = []
        for e in ed:
            if starts is None:
                starts = [0] + [mm.end() for mm in re.finditer('\n', text)]
            e['file'] = rel
            e['line'] = line_of(starts, e['pos'])
            if e['kind'] == 'unfixable':
                res['unfixable'].append(e)
                continue
            good.append(e)
        if good:
            res['edits'][rel] = good
            if is_runtime_area(rel) and ext == '.json':
                res['json_meta'][rel] += len(good)
            elif is_runtime_area(rel) and ext in CODE_EXT:
                lines = text.split('\n')
                for e in good:
                    ln = lines[e['line'] - 1]
                    col = e['pos'] - starts[e['line'] - 1]
                    if not is_comment(rel, ln, col):
                        res['runtime'].append((rel, e['line'], ln.strip()[:200], e['before'], e['after']))
        auto = []
        moves_file = rules_moves_file(ctx.rules, rel)
        if is_runtime_area(rel) and ext in CODE_EXT:
            for i, ln in enumerate(text.split('\n'), 1):
                if seg_violations(ln, ctx.rules, soft_ok=rel in SEG_SOFT_OK):
                    res['segsplit'].append((rel, i, ln.strip()[:200]))
                    for old, new in suggest_segments(ln, ctx.rules):
                        auto.append((i, old, new, 'quoted path segments'))
        if moves_file and ext == '.py':
            for h in ancestor_hops(text, rel, ctx.rules):
                res['hops'].append(h)
                _, line, expr, n, n2 = h[:5]
                if n2 is not None and ('parents[%d]' % n) in expr:
                    auto.append((line, expr, expr.replace('parents[%d]' % n, 'parents[%d]' % n2), 'ancestor hop'))
        if moves_file and ext in CODE_EXT:
            for ln, old, new in suggest_dotdot(text, rel, ctx):
                auto.append((ln, old, new, "'..' climb from the file's own folder"))
            if re.search(r'__file__|import\.meta\.url|__dirname|parents\[|\.parent\b|dirname\(|BASH_SOURCE|\$0\b', text):
                res['locrel'].append(rel)
        if auto or static.get(rel):
            new_text = apply_patches(new_text, rel, auto, static.get(rel, []), res)
        if new_text != text:
            res['new_text'][rel] = new_text
            res['orig_hash'][rel] = sha(raw)
    res['decisions'] = ctx.decisions
    res['history'] = ctx.history
    return res


HOP_RX = re.compile(r"Path\(__file__\)(?:\.resolve\(\)|\.absolute\(\))?(?:\.parents\[(?P<n>\d+)\]|(?P<chain>(?:\.parent)+))")


def ancestor_hops(text, rel, rules):
    """`Path(__file__)...parents[N]` / `.parent.parent`: ancestor index that is right in the new location."""
    out = []
    old_dir = posixpath.dirname(rel)
    new_dir = posixpath.dirname(rules.map_path(rel))
    for m in HOP_RX.finditer(text):
        n = int(m.group('n')) if m.group('n') is not None else m.group('chain').count('.parent') - 1
        segs = old_dir.split('/') if old_dir else []
        if n > len(segs):
            continue
        anc_old = '/'.join(segs[:len(segs) - n])
        anc_new = rules.map_path(anc_old) if anc_old else ''
        nsegs = new_dir.split('/') if new_dir else []
        if anc_new == '' or new_dir == anc_new or new_dir.startswith(anc_new + '/'):
            n2 = len(nsegs) - (len(anc_new.split('/')) if anc_new else 0)
        else:
            n2 = None
        if n2 == n:
            continue
        line = text.count('\n', 0, m.start()) + 1
        out.append((rel, line, m.group(0), n, n2, anc_old or '(repo root)', anc_new or '(repo root)'))
    return out


SEG_CONTEXT = re.compile(r"""\bjoin\(|\bresolve\(|\bPath\(|\bpath\.|\bos\.|['"]\.\.['"]|/\s*['"]""")


def _adjacent(line, a, b):
    """a and b are neighbouring path segments on the line: 'a', 'b'  or  .../a/b/..."""
    pat = r"""['"/]""" + re.escape(a) + r"""(?:['"]\s*,\s*['"]|/)""" + re.escape(b) + r"""['"/]"""
    return bool(re.search(pat, line))


QUOTED_RX = re.compile(r"""['"]([^'"\n]+)['"]""")


def seg_violations(line, rules, soft_ok=False):
    """quoted old path segments on a line of code: a moved/renamed name without its new parent next to it"""
    hits = []
    if not SEG_CONTEXT.search(line):
        return hits
    quoted = set(QUOTED_RX.findall(line))
    seen = set()
    for nm in quoted:
        for r in rules.by_last.get(nm, ()):
            if nm in seen:
                break
            if soft_ok and r.get('bulk'):
                continue
            if len(r['ss']) == 1 and re.search(r"""['"]ashlar['"]\s*[,/]\s*['"]""" + re.escape(nm) + r"""['"]""", line):
                continue  # 'ashlar', 'art-direction': the NEW folder that happens to share an old root name
            if len(r['ss']) > 1 and not ('-' in nm or '.' in nm or nm == '_codex'):
                op = r['ss'][-2]  # a common word ('monsters', '_runs'): only meaningful next to its old parent
                if op not in quoted:
                    continue
            if r['ds'][-1] == nm and len(r['ds']) > 1:
                par = r['ds'][-2]
                if _adjacent(line, par, nm):
                    continue  # already spelled with its new parent right before it
                if len(r['ss']) > 1 and r['ss'][-2] != par and _adjacent(line, r['ss'][-2], nm):
                    pass  # the old parent right before it: old spelling
                elif par in quoted and (len(r['ss']) < 2 or r['ss'][-2] not in quoted or r['ss'][-2] == par):
                    continue
            seen.add(nm)
            hits.append(r['src'])
    return hits


def rules_moves_file(rules, rel):
    return rules.map_path(rel) != rel


def seg_names(rules):
    s = set()
    for r in rules.rules:
        s.add(r['ss'][-1])
    s |= {'art-output', 'bestiary', 'sites', 'art-direction', 'research_notes', 'reports', 'output', 'map-01-concepts'}
    return sorted(s)


def record_category(rel):
    n = posixpath.basename(rel)
    if '/_runs/' in '/' + rel:
        return '_runs/ folders'
    if n.endswith('.jsonl'):
        return '*.jsonl'
    if n.endswith('.log'):
        return '*.log'
    if n.endswith('.out'):
        return '*.out'
    return 'task/result/prompt *.txt'


def is_comment(rel, line, col):
    s = line.strip()
    if rel.endswith('.json'):
        return False
    if s.startswith(('//', '#', '*', '/*', '<!--')):
        return True
    pre = line[:col]
    if rel.endswith('.py'):
        return '#' in pre
    return bool(re.search(r'(?<!:)//', pre))


def broken_md_links(text, rel, ctx):
    out = []
    d = posixpath.dirname(rel)
    for m in LINK_RX.finditer(text):
        t = next((m.group(i) for i in (1, 2, 3) if m.group(i)), None)
        if not t or re.match(r'^[a-zA-Z][a-zA-Z0-9+.\-]*:|^#|^/|^\$|^\{', t):
            continue
        t0 = re.split(r'[#?]', t)[0].replace('%20', ' ')
        if not t0:
            continue
        p = posixpath.normpath(posixpath.join(d, t0))
        if not os.path.exists(os.path.join(ctx.repo, p)):
            out.append(t)
    return out


# ------------------------------------------------------------------ pre-checks
def count_files(path):
    if os.path.isfile(path):
        return 1
    n = 0
    for _, _, fns in os.walk(path):
        n += len(fns)
    return n


def check_blocked(repo):
    """report scripts under nature/_tools that depend on their location"""
    base = os.path.join(repo, 'art-output/tripo-models/nature/_tools')
    out = []
    if not os.path.isdir(base):
        return out
    for f in sorted(os.listdir(base)):
        p = os.path.join(base, f)
        if not os.path.isfile(p):
            continue
        with open(p, encoding='utf-8', errors='replace') as fh:
            for i, ln in enumerate(fh, 1):
                if re.search(r'\.\./|dirname "?\$0|__file__', ln):
                    out.append((f, i, ln.strip()[:140]))
                    break
    return out


def xd(m):
    """where the entry lands when it is executed (a round may split a move: file into _work/ in place first, folder later)"""
    return m.get('xdst', m['dst'])


def precheck(repo, moves, rules):
    errs, warns = [], []
    act = [m for m in moves if not m.get('blocked')]
    dsts, xdsts = {}, {}
    src_idx = {m['src']: i for i, m in enumerate(act)}
    dst_idx = {xd(m): i for i, m in enumerate(act)}
    for i, m in enumerate(act):
        src, dst, x = m['src'], m['dst'], xd(m)
        sp = os.path.join(repo, src)
        if not os.path.exists(sp):
            errs.append('missing source: ' + src)
        for d in sorted({dst, x}):
            if os.path.exists(os.path.join(repo, d)):
                errs.append('destination exists: ' + d)
        if dst in dsts:
            errs.append('destination collision: %s (from %s and %s)' % (dst, dsts[dst], src))
        dsts[dst] = src
        if x != dst:
            if x in xdsts:
                errs.append('destination collision: %s (from %s and %s)' % (x, xdsts[x], src))
            xdsts[x] = src
        # parent of the destination must not be an existing file
        p = posixpath.dirname(x)
        while p:
            if os.path.isfile(os.path.join(repo, p)):
                errs.append('destination parent is a file: ' + p)
            p = posixpath.dirname(p)
        if x in src_idx and src_idx[x] != i:
            errs.append('destination %s lies inside source %s' % (x, x))
        for p in _ancestors(x):
            if p in src_idx and src_idx[p] < i:  # inside a source that was already moved away
                errs.append('destination %s lies inside source %s' % (x, p))
            if p in dst_idx and dst_idx[p] > i:  # inner destination created before its outer folder arrives
                errs.append('destination %s is nested in destination %s' % (x, p))
        for p in _ancestors(src):
            if p in src_idx and src_idx[p] < i:
                errs.append('inner source %s is listed after its parent %s' % (src, p))
    # split directories: all expected children
    for s in sorted({posixpath.dirname(m['src']) for m in act}):
        full = os.path.join(repo, s)
        if s and os.path.isdir(full) and not rules.find(s.split('/'))[0]:
            kids = os.listdir(full)
            rest = [k for k in kids if (s + '/' + k) not in rules.by_src]
            if rest and s in ('ashlar/art/map-01-concepts',):
                warns.append('%s keeps unmapped children after the move: %s' % (s, rest))
    return errs, warns


def probe_locks(repo, moves):
    bad = []
    for m in moves:
        if m.get('blocked'):
            continue
        p = os.path.join(repo, m['src'])
        if not os.path.exists(p):
            continue
        tmp = p + '.__reorg_probe'
        try:
            os.rename(p, tmp)
        except OSError as e:
            bad.append((m['src'], str(e)))
            continue
        try:
            os.rename(tmp, p)
        except OSError as e:  # must never happen; tell loudly
            bad.append((m['src'], 'RENAME-BACK FAILED, restore %s manually: %s' % (tmp, e)))
    return bad


def processes_using_repo():
    try:
        cmd = ["powershell", "-NoProfile", "-Command",
               "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'Diablo2' -and $_.Name -match "
               "'node|python|chrome|vite|blender|codex' } | ForEach-Object { '{0} {1} {2}' -f $_.Name,$_.ProcessId,"
               "($_.CommandLine.Substring(0,[Math]::Min(150,$_.CommandLine.Length))) }"]
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=60).stdout
        return [l for l in out.splitlines() if l.strip() and 'reorg_2026' not in l]
    except Exception as e:  # noqa
        return ['(could not list processes: %s)' % e]


# ------------------------------------------------------------------ apply
def default_backup_dir(repo):
    drive = os.path.splitdrive(os.path.abspath(repo))[0]
    return os.path.join(drive + os.sep if drive else os.sep, BACKUP_NAME)


def save_journal(j):
    path = j['journal_path']
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(j, fh, indent=1, ensure_ascii=False)
    os.replace(tmp, path)


def do_moves(repo, moves, journal=None):
    """plain os.rename only (same volume, atomic per entry); any failure rolls the finished moves back"""
    done = []
    try:
        for m in moves:
            if m.get('blocked'):
                continue
            s, d = os.path.join(repo, m['src']), os.path.join(repo, xd(m))
            os.makedirs(os.path.dirname(d), exist_ok=True)
            os.rename(s, d)
            done.append(m)
            if journal is not None:
                for jm in journal['moves']:
                    if jm['src'] == m['src']:
                        jm['done'] = True
                save_journal(journal)
            print('moved', m['src'], '->', xd(m))
    except Exception as e:
        print('FAILED:', e, '- rolling back', file=sys.stderr)
        for m in reversed(done):
            try:
                os.rename(os.path.join(repo, xd(m)), os.path.join(repo, m['src']))
                if journal is not None:
                    for jm in journal['moves']:
                        if jm['src'] == m['src']:
                            jm['done'] = False
            except OSError as e2:
                print('ROLLBACK FAILED for', m, e2, file=sys.stderr)
        if journal is not None:
            save_journal(journal)
        raise
    # remove directories left empty
    for s in sorted({posixpath.dirname(m['src']) for m in done}, key=lambda x: -x.count('/')):
        while s:  # the emptied folder and then its parents, as long as they are empty too (3d/monsters/act-01 -> 3d/monsters)
            p = os.path.join(repo, s)
            if not (os.path.isdir(p) and not os.listdir(p)):
                break
            os.rmdir(p)
            print('removed empty', s)
            s = posixpath.dirname(s)


NEXT_STEPS = [
    "Run `python ashlar/pipeline/_reorg/reorg_2026-10-24.py --verify` (must exit 0).",
    "Rebuild legacy/bestiary: `cd legacy/bestiary && node scripts/build.mjs && node scripts/check.mjs`. Its build and check now expect "
    "origin-root `../` for D2RR.html; `legacy/D2RR.html`, `legacy/bestiary/dist/index.html` and `src/data/multiverse-images.json` "
    "(all > 5 MB) keep the old paths until rebuilt.",
    "Rebuild the lab if needed (`cd lookdev-lab && npm run build`), start it and open the scenes; run each `lookdev-lab/scripts/prepare-*.py` "
    "once in dry mode or with its usual arguments, and `node lookdev-lab/scripts/biome-layout.test.mjs`.",
    "Run the moved tools' own tests: `python -m pytest ashlar/pipeline/codex/tests`, `ashlar/art/textures/terrain-biomes-v1/tools/test_*.py`.",
    "Check the tripo pipeline (`ashlar/pipeline/tripo/`): `_tools/*.sh`, `nature/_tools/compose_rows.py`, `tripo_batch.log` stay beside `nature/`.",
    "Update the auto-memory files outside the repo (C:\\Users\\HLC_2021\\.claude\\projects\\E--Diablo2\\memory\\*.md): they name the old "
    "paths (ashlar/art/_codex, art-output/..., bestiary/, map-01-concepts, ...).",
    "tmp/ was not touched on purpose: scripts there that point at old paths need a manual look when they are used again.",
    "`git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.",
]


def write_map(out_dir, moves, rules, ctx, res):
    """old->new map, vanished dirs and the links that were already broken (the baseline --verify subtracts)"""
    with open(os.path.join(out_dir, 'reorg_map.json'), 'w', encoding='utf-8') as fh:
        json.dump(dict(moves=[dict(old=m['src'], new=m['dst'], blocked=bool(m.get('blocked')),
                                   **({'exec': xd(m)} if xd(m) != m['dst'] else {})) for m in moves],
                       vanishing=sorted(ctx.vanishing),
                       baseline_broken_links=[[rules.map_path(f), t] for f, t in res['broken_md']]), fh, indent=1, ensure_ascii=False)


def apply_all(repo, moves, rules, ctx, a):
    """-> exit code. Order: pre-checks -> scan (hashes) -> backup -> lock re-probe -> moves -> atomic writes."""
    errs, warns = precheck(repo, moves, rules)
    procs = processes_using_repo()
    if procs and not a.force:
        errs.append('processes hold the repo in their command line (close them or use --force): ' + ' | '.join(procs))
    if errs:
        print('ABORT, nothing moved:\n  ' + '\n  '.join(errs), file=sys.stderr)
        return 2
    res = scan(repo, ctx)
    write_map(a.out_dir, moves, rules, ctx, res)
    badp = [p for p in res['patches'] if p['status'] != 'ok']
    if badp and not a.force:
        print('ABORT, nothing moved: patches that do not apply cleanly:', file=sys.stderr)
        for p in badp:
            print('  %s:%s %s [%s]' % (p['file'], p['line'], p['old'], p['status']), file=sys.stderr)
        return 2
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join(a.backup_dir or default_backup_dir(repo), stamp)
    os.makedirs(os.path.join(bdir, 'files'), exist_ok=True)
    journal = dict(journal_path=os.path.join(bdir, 'journal.json'), repo=os.path.abspath(repo), created=stamp, phase='backup',
                   moves=[dict(src=m['src'], dst=xd(m), done=False) for m in moves if not m.get('blocked')], files=[])
    skipped_changed, todo = [], []
    for rel in sorted(res['new_text']):
        try:
            with open(os.path.join(repo, rel), 'rb') as fh:
                raw = fh.read()
        except OSError as e:
            skipped_changed.append((rel, 'unreadable: %s' % e))
            continue
        if sha(raw) != res['orig_hash'][rel]:
            skipped_changed.append((rel, 'changed since the scan'))
            continue
        bk = os.path.join(bdir, 'files', *rel.split('/'))
        os.makedirs(os.path.dirname(bk), exist_ok=True)
        shutil.copy2(os.path.join(repo, rel), bk)
        journal['files'].append(dict(old=rel, new=rules.map_path(rel), sha_before=res['orig_hash'][rel],
                                     sha_after=sha(res['new_text'][rel].encode('utf-8')), backup=bk, status='pending'))
        todo.append(rel)
    save_journal(journal)
    print('backup of %d files in %s' % (len(todo), bdir))
    locks = probe_locks(repo, moves)
    if locks:
        print('ABORT, nothing moved (lock re-probe): ' + '; '.join('%s (%s)' % x for x in locks), file=sys.stderr)
        return 2
    journal['phase'] = 'moving'
    save_journal(journal)
    try:
        do_moves(repo, moves, journal)
    except Exception:
        print('moves failed and were rolled back; nothing was rewritten. journal: ' + journal['journal_path'], file=sys.stderr)
        return 3
    journal['phase'] = 'writing'
    save_journal(journal)
    written, failures = 0, []
    for ent in journal['files']:
        rel = ent['old']
        dst = os.path.join(repo, ent['new'])
        try:
            with open(dst, 'rb') as fh:
                raw = fh.read()
            if sha(raw) != ent['sha_before']:
                skipped_changed.append((rel, 'changed between the check and the write'))
                ent['status'] = 'skipped-changed'
                continue
            tmp = dst + '.reorg_tmp'
            with open(tmp, 'wb') as fh:
                fh.write(res['new_text'][rel].encode('utf-8'))
            os.replace(tmp, dst)
            ent['status'] = 'written'
            written += 1
        except OSError as e:
            ent['status'] = 'error: %s' % e
            failures.append((rel, str(e)))
            try:
                os.remove(dst + '.reorg_tmp')
            except OSError:
                pass
    journal['phase'] = 'done' if not failures else 'done-with-errors'
    save_journal(journal)
    print('rewrote %d files' % written)
    for rel, why in skipped_changed:
        print('SKIPPED %s: %s (moved untouched; fix by hand)' % (rel, why), file=sys.stderr)
    for rel, why in failures:
        print('WRITE FAILED %s: %s' % (rel, why), file=sys.stderr)
    print('journal: %s  (undo everything with --restore "%s")' % (journal['journal_path'], journal['journal_path']))
    lines = ['# Reorg apply report (%s)' % stamp, '', '- rewrote %d files; %d skipped (changed meanwhile); %d write failures' % (
        written, len(skipped_changed), len(failures)), '- journal: `%s`' % journal['journal_path'], '']
    lines += ['- skipped: `%s` (%s)' % x for x in skipped_changed] + ['- write failed: `%s` (%s)' % x for x in failures]
    lines += ['', '## Next steps', ''] + ['%d. %s' % (i, t) for i, t in enumerate(NEXT_STEPS, 1)]
    try:
        with open(os.path.join(a.out_dir, 'apply_report.md'), 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(lines) + '\n')
    except OSError as e:
        print('could not write apply_report.md: %s' % e, file=sys.stderr)
    print('\nNEXT STEPS')
    for i, t in enumerate(NEXT_STEPS, 1):
        print('%d. %s' % (i, t))
    return 3 if (failures or skipped_changed) else 0


def restore(journal_path, force=False):
    """undo an apply (also after a crash): moves back in reverse, then the original file contents from the backup"""
    with open(journal_path, encoding='utf-8') as fh:
        j = json.load(fh)
    repo = j['repo']
    n_mv = n_fl = 0
    for m in reversed(j['moves']):
        s, d = os.path.join(repo, m['src']), os.path.join(repo, m['dst'])
        if os.path.exists(d) and not os.path.exists(s):
            os.makedirs(os.path.dirname(s), exist_ok=True)
            os.rename(d, s)
            n_mv += 1
            print('moved back', m['dst'], '->', m['src'])
        elif os.path.exists(d) and os.path.exists(s):
            print('CONFLICT: both exist, left alone:', m['src'], m['dst'], file=sys.stderr)
    warned = 0
    for ent in j['files']:
        if ent.get('status') == 'skipped-changed':
            continue  # never rewritten: it holds somebody's newer edit
        if not os.path.exists(ent['backup']):
            print('backup missing:', ent['backup'], file=sys.stderr)
            continue
        target = os.path.join(repo, ent['old'])
        if os.path.exists(target):
            with open(target, 'rb') as fh:
                cur = sha(fh.read())
            if cur == ent['sha_before']:
                continue  # already the original
            if cur != ent.get('sha_after') and not force:
                print('WARNING: %s changed after the apply, not overwritten (--force restores the backup anyway)' % ent['old'],
                      file=sys.stderr)
                warned += 1
                continue
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy2(ent['backup'], target)
        n_fl += 1
    for m in j['moves']:  # parents created for the destinations, if empty now
        p = posixpath.dirname(m['dst'])
        while p:
            full = os.path.join(repo, p)
            if os.path.isdir(full) and not os.listdir(full):
                os.rmdir(full)
            p = posixpath.dirname(p)
    print('restored: %d moves, %d files, %d warnings' % (n_mv, n_fl, warned))
    return 4 if warned else 0


# ------------------------------------------------------------------ report
def group_of(rel):
    s = rel.split('/')
    return '/'.join(s[:2]) if s[0] in ('ashlar', 'lookdev-lab', '.claude', '.agents') and len(s) > 2 else s[0]


def write_report(path, repo, moves, rules, res, errs, warns, blocked_info, procs, locks):
    L = []
    w = L.append
    w('# Reorg dry-run report (generated by %s)' % REPORT_TITLE + '\n')
    if errs:
        w('## PRE-CHECK ERRORS (apply would abort)\n')
        L.extend('- ' + e for e in errs)
        w('')
    if warns:
        w('## Pre-check warnings\n')
        L.extend('- ' + e for e in warns)
        w('')
    w('## Next steps after --apply\n')
    for i, t in enumerate(NEXT_STEPS, 1):
        w('%d. %s' % (i, t))
    w('')
    w('## Moves (%d active)\n' % sum(1 for m in moves if not m.get('blocked')))
    qk = Counter(m.get('kind', '?') for m in moves if m.get('quiet'))
    if qk:
        w('Bulk moves (all listed in reorg_map.json, not one by one): ' + ', '.join('%s %d' % kv for kv in sorted(qk.items())) + '\n')
    w('| # | from | to | files |')
    w('|---|---|---|---|')
    for i, m in enumerate(moves, 1):
        if m.get('quiet'):
            continue
        if m.get('blocked'):
            w('| %d | `%s` | `%s` | BLOCKED, stays inside art-output |' % (i, m['src'], m['dst']))
        else:
            w('| %d | `%s` | `%s` | %d |' % (i, m['src'], m['dst'], count_files(os.path.join(repo, m['src']))))
    w('')
    if blocked_info:
        w('Blocked entries:')
        for f, i, ln in blocked_info:
            w('- `%s:%d` `%s`' % (f, i, ln))
        w('')
    w('Lock check: %s' % ('not run (use --probe-locks)' if locks is None else ('OK, every source could be renamed and back' if not locks else 'LOCKED: ' + '; '.join('%s (%s)' % x for x in locks))))
    w('Processes with Diablo2 in their command line (node/python/chrome/vite/blender/codex):')
    L.extend('- ' + p for p in (procs or ['(none)']))
    w('')
    w('## Scan\n')
    w('- files walked: %d, live text files scanned: %d, files with rewrites: %d' % (res['total_files'], res['live_files'], len(res['edits'])))
    w('- total rewrites: %d' % sum(len(v) for v in res['edits'].values()))
    w('- skipped >5 MB: %d, undecodable: %d' % (len(res['big']), len(res['undecodable'])))
    for f in res['big']:
        w('  - >5 MB: `%s`' % f)
    for f in res['undecodable']:
        w('  - not UTF-8: `%s`' % f)
    w('')
    w('- dated history lines kept as written (a line with a date and "Chuyển từ"/"moved from"): %d' % len(res['history']))
    for f, ln, tok in res['history'][:15]:
        w('  - `%s:%d` `%s`' % (f, ln, tok))
    w('')
    w('### Skipped matches (records and untouched areas, NOT rewritten)\n')
    for k in sorted(res['records']):
        w('- %s: %d matches in %d files' % (k, res['records'][k], res['record_files'][k]))
    w('- tmp/ (user: do not touch): %d matches in %d of %d text files' % (res['tmp']['matches'], res['tmp']['files'], res['tmp_files']))
    w('- pruned: .git, node_modules, __pycache__, lookdev-lab/dist, %s' % SELF_REL)
    w('')
    # per prefix
    per = defaultdict(lambda: dict(files=set(), n=0, groups=defaultdict(int)))
    for rel, eds in res['edits'].items():
        for e in eds:
            p = per[e['rule']]
            p['files'].add(rel)
            p['n'] += 1
            p['groups'][group_of(rel)] += 1
    w('## Rewrites per moved prefix (live files / occurrences; by top folder)\n')
    for k in sorted(per, key=lambda x: -per[x]['n']):
        p = per[k]
        grp = ', '.join('%s %d' % (g, c) for g, c in sorted(p['groups'].items(), key=lambda x: -x[1])[:8])
        w('- `%s`: %d files, %d occurrences  (%s)' % (k, len(p['files']), p['n'], grp))
    w('')
    # kinds
    kc = Counter(e['kind'] for v in res['edits'].values() for e in v)
    w('By kind: ' + ', '.join('%s %d' % kv for kv in sorted(kc.items())))
    bare = Counter()
    baref = defaultdict(set)
    bare_code = []
    for rel, eds in sorted(res['edits'].items()):
        for e in eds:
            if e.get('flag') == 'bare-root':
                bare[e['rule']] += 1
                baref[e['rule']].add(rel)
                if posixpath.splitext(rel)[1] in CODE_EXT:
                    bare_code.append((rel, e))
    w('')
    w('### Bare top-level names rewritten (repo-root spelling: start/quote/space/`(`/`[`/`=`/`:`/`${VAR}/`; never after another path segment): %d occurrences in %d files\n'
      % (sum(bare.values()), len(set().union(*baref.values())) if baref else 0))
    for k, n in bare.most_common():
        w('- `%s`: %d occurrences in %d files' % (k, n, len(baref[k])))
    w('')
    w('10 sample bare-name rewrites inside code files (%d such occurrences in total):\n' % len(bare_code))
    seen_f, k = set(), 0
    for rel, e in bare_code:
        if rel in seen_f:
            continue
        seen_f.add(rel)
        w('- `%s:%d` `%s` => `%s`' % (rel, e['line'], e['before'], e['after']))
        k += 1
        if k >= 10:
            break
    w('')
    # samples
    w('## Sample rewrites (30)\n')
    picks = pick_samples(res)
    for rel, e in picks:
        w('- `%s:%d` [%s]\n  - before: `%s`\n  - after:  `%s`' % (rel, e['line'], e['kind'], e['before'], e['after']))
    w('')
    # unfixable
    uf = defaultdict(list)
    for e in res['unfixable']:
        uf[e['why']].append(e)
    w('## Relative links NOT auto-fixable\n')
    for why in ('split-dir', 'outside-repo'):
        w('### %s: %d' % (why, len(uf[why])))
        for e in uf[why][:40]:
            w('- `%s:%d` `%s`' % (e['file'], e['line'], e['before']))
    w('### all recomputed relative links (kind=relative): %d' % kc.get('relative', 0))
    for rel, v in sorted(res['edits'].items()):
        for e in v:
            if e['kind'] == 'relative':
                w('- `%s:%d` `%s` => `%s`' % (rel, e['line'], e['before'], e['after']))
    w('### already broken before the move (left as is): %d relative tokens in %d files' % (len(uf['already-broken']), len({e['file'] for e in uf['already-broken']})))
    bm = Counter(r for r, _ in res['broken_md'])
    w('Markdown links that do not resolve today (baseline, saved to reorg_map.json): %d in %d files' % (len(res['broken_md']), len(bm)))
    w('')
    w('## References from code that LOADS files at runtime (need a functional check after apply)\n')
    byf = defaultdict(list)
    for r in res['runtime']:
        byf[r[0]].append(r)
    w('Likely-runtime (non-comment) rewritten references: %d lines in %d files\n' % (len(res['runtime']), len(byf)))
    prio = tuple(RUNTIME_AREAS) + ('ashlar/3d/', 'ashlar/art/terrain', 'ashlar/art/act-')
    for f in sorted(byf):
        if f.startswith(prio):
            w('- `%s` (%d)' % (f, len(byf[f])))
            for r in byf[f][:3]:
                w('  - L%d `%s`  =>  `%s`' % (r[1], r[3], r[4]))
    rest = sorted(f for f in byf if not f.startswith(prio))
    w('- other code files (self-contained legacy/art tooling), count only: %d files, %d lines' % (len(rest), sum(len(byf[f]) for f in rest)))
    w('')
    w('JSON data in runtime areas (check whether the strings are loaded or only metadata): ' + ', '.join('%s (%d)' % kv for kv in res['json_meta'].items()))
    w('')
    w('### Decisions for relative tokens that name a directory with moved things below it (repo root, ashlar/, ...) in moved code\n')
    w('Rule: if the statement names only targets that all moved to the same new folder (e.g. D2RR.html, art-output/ into legacy/), the base follows them; if it names stay-put things or mixed targets, or none, the base stays the old directory (recomputed). Forced exceptions are listed in OVERRIDE_REPO_ROOT.\n')
    for d in res['decisions']:
        if d['file'].startswith('bestiary/'):
            w('- `%s:%d` `%s` (base now `%s`): %s' % (d['file'], d['line'], d['token'], d['base'], d['reason']))
    other = [d for d in res['decisions'] if not d['file'].startswith('bestiary/')]
    w('Other files with such tokens: %d' % len(other))
    for d in other[:25]:
        w('- `%s:%d` `%s` (base now `%s`): %s' % (d['file'], d['line'], d['token'], d['base'], d['reason']))
    w('')
    if ROUND1_NOTES:
        w('### Bestiary path decisions (all paths inside bestiary/ stay valid because it moves whole)\n')
        w('- `scripts/build.mjs:17` `../../` (origin root of dist/index.html): repo-relative `origin` data values now mix `ashlar/...` and `legacy/art-output/...`, so the base stays the repo root: auto-rewritten `../../` => `../../../`.')
        w('- `scripts/build.mjs:17` `../D2RR.html` is a legacy sibling: unchanged. PATCH (applied by --apply): the D2RR page now lives in legacy/, so its origin root `\'\'` must become `\'../\'`.')
        w('- `scripts/check.mjs:73` / `:79`: `../../` + image.origin and the expected meta content: repo root => `../../../` (auto). `:80` `../../D2RR.html` and `\'../../\'.length` unchanged (legacy sibling; the length difference between dist page and D2RR page stays 6). PATCH: `content=""` in the D2RR meta assert becomes `content="../"`.')
        w('- `scripts/import_concepts.py:21` `REPO = BESTIARY.parent` is the repo root; it reads `origin` values (repo-root paths): PATCH `BESTIARY.parent.parent`.')
        w('- `scripts/wiki_pass_grim_a*.py:4` absolute `E:/Diablo2/bestiary` => `E:/Diablo2/legacy/bestiary` (auto). All other bestiary scripts use `Path(__file__).parents[1]` / `import.meta.url` + `..` inside bestiary: no change.')
        w('')
    w('### Code lines with quoted OLD path segments (old name without its new parent): %d lines\n' % len(res['segsplit']))
    sf = defaultdict(list)
    for r in res['segsplit']:
        sf[r[0]].append(r)
    for f in sorted(sf):
        w('- `%s`: lines %s' % (f, ', '.join(str(r[1]) for r in sf[f])))
    w('')
    w('## Code patches applied by --apply (%d; %d not clean)\n' % (len(res['patches']), sum(1 for p in res['patches'] if p['status'] != 'ok')))
    w('These are the former "hand edits": explicit, listed, applied after the path rewrites; a patch that does not match makes --apply abort (unless --force).\n')
    for pt in sorted(res['patches'], key=lambda x: (x['file'], x['line'] or 0)):
        w('- `%s:%s` [%s] %s' % (pt['file'], pt['line'], pt['status'], pt['why']))
        w('  - `%s`' % pt['old'])
        w('  - => `%s`' % pt['new'])
    w('')
    w('### Python `Path(__file__)...parents[N]` / `.parent` hops whose ancestor index changes in the new location: %d\n' % len(res['hops']))
    w('(only hops that leave the moved folder or land on a moved ancestor; a hop that stays inside the moved source is unchanged and not listed)\n')
    for rel, line, expr, n, n2, a_old, a_new in res['hops']:
        w('- `%s:%d` `%s` (N=%d, ancestor `%s` now `%s`) => %s' % (rel, line, expr, n, a_old, a_new,
          ('parents[%d]' % (n2) if n2 is not None else 'ancestor is not above the new location any more; edit by hand')))
    w('')
    w('### Moved code files that compute paths from their own location (`__file__`, `__dirname`, `import.meta.url`, `dirname`): %d\n' % len(res['locrel']))
    g = Counter(group_of(f) for f in res['locrel'])
    w('By area: ' + ', '.join('%s %d' % kv for kv in g.most_common()))
    for f in sorted(res['locrel'])[:80]:
        w('- `%s`' % f)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(L) + '\n')


QSEQ = re.compile(r"""(?:(['"])[^'"\n]+\1\s*,\s*)*(['"])[^'"\n]+\2""")


def suggest_segments(line, rules):
    outs = []
    for m in QSEQ.finditer(line):
        items = re.findall(r"""(['"])([^'"\n]+)\1""", m.group(0))
        q = items[0][0]
        segs = []
        for _, t in items:
            segs += t.split('/')
        i = 0
        while i < len(segs) and segs[i] == '..':
            i += 1
        if len(segs) - i < 2 and i == 0:
            continue
        for j in range(i, len(segs)):
            r, k = rules.find(segs[j:])
            if r:
                new = segs[:j] + r['ds'] + segs[j + k:]
                if new != segs:
                    outs.append((m.group(0), ', '.join(q + x + q for x in new)))
                break
    return outs


def pick_samples(res, n=30):
    allp = [(rel, e) for rel, v in sorted(res['edits'].items()) for e in v]
    chosen, seen = [], set()

    def take(pred):
        for rel, e in allp:
            if (rel, e['pos']) not in seen and pred(rel, e):
                seen.add((rel, e['pos']))
                chosen.append((rel, e))
                return

    take(lambda r, e: e['kind'] == 'relative' and r.endswith('.md'))
    take(lambda r, e: e['kind'] == 'relative' and r.endswith(('.js', '.mjs', '.py')))
    take(lambda r, e: '\\\\' in e['before'])
    take(lambda r, e: r.startswith('lookdev-lab/src/env/act1/maps/'))
    take(lambda r, e: r == '.claude/skills/concept-art/SKILL.md')
    take(lambda r, e: r == 'AGENTS.md')
    take(lambda r, e: r == '.gitignore')
    take(lambda r, e: e['before'].startswith('art-output/tripo-models'))
    take(lambda r, e: e['kind'] == 'abs' and e['before'].startswith('/e/'))
    take(lambda r, e: e['kind'] == 'abs' and e['before'].startswith('E:\\'))
    take(lambda r, e: e['kind'] == 'abs' and e['before'].startswith('E:/'))
    rules_seen = Counter()
    for rel, e in allp:
        if len(chosen) >= n:
            break
        if rules_seen[e['rule']] < 1 and (rel, e['pos']) not in seen:
            rules_seen[e['rule']] += 1
            seen.add((rel, e['pos']))
            chosen.append((rel, e))
    step = max(1, len(allp) // max(1, n - len(chosen)))
    for i in range(0, len(allp), step):
        if len(chosen) >= n:
            break
        rel, e = allp[i]
        if (rel, e['pos']) not in seen:
            seen.add((rel, e['pos']))
            chosen.append((rel, e))
    return chosen[:n]


# ------------------------------------------------------------------ verify
def verify(repo, moves, rules, out_dir=HERE):
    """after apply: sources gone, destinations there, vanished dirs gone, no old-prefix reference (absolute, repo-relative,
    relative-to-ashlar/), no Markdown link that stopped resolving, no old quoted segments in code, patches in place."""
    ctx = Ctx(repo, rules)
    base, vanishing = set(), []
    mp = os.path.join(out_dir, 'reorg_map.json')
    if os.path.exists(mp):
        with open(mp, encoding='utf-8') as fh:
            j = json.load(fh)
        for f, t in j.get('baseline_broken_links', []):
            base.add((f, t))
        vanishing = j.get('vanishing', [])
    problems = []
    for m in moves:
        if m.get('blocked'):
            continue
        if os.path.exists(os.path.join(repo, m['src'])):
            problems.append(('SOURCE STILL THERE', m['src'], ''))
        if not os.path.exists(os.path.join(repo, m['dst'])):
            problems.append(('DESTINATION MISSING', m['dst'], ''))
    for v in vanishing:
        if os.path.exists(os.path.join(repo, v)):
            problems.append(('DIR SHOULD HAVE VANISHED', v, ''))
    static = defaultdict(list)
    for pt in PATCHES:
        static[rules.map_path(pt['file'])].append(pt)
    for rel in walk_files(repo):
        if rel.split('/')[0] in UNTOUCHED_TOP:
            continue
        try:
            size = os.path.getsize(os.path.join(repo, rel))
        except OSError:
            continue
        if classify(rel, size) != 'live' or size > MAX_BYTES:
            continue
        try:
            with open(os.path.join(repo, rel), 'rb') as fh:
                text = fh.read().decode('utf-8')
        except (UnicodeDecodeError, OSError):
            continue
        gi = posixpath.basename(rel) == '.gitignore'
        for pt in static.get(rel, []):
            pn = eol_for(text, pt['new'])
            if pn not in text:
                problems.append(('PATCH MISSING', rel, pt['new'][:100]))
            else:
                text = text.replace(pn, ' ' * len(pn))  # a patch's new text is right by definition
        _, ed = _rewrite_old_only(text, rel, ctx, gi)
        for e in ed:
            problems.append(('OLD PATH', rel, e['before']))
        if rel.endswith('.md'):
            for t in broken_md_links(text, rel, ctx):
                if (rel, t) not in base:
                    problems.append(('LINK', rel, t))
        if is_runtime_area(rel) and posixpath.splitext(rel)[1] in CODE_EXT:
            for i, ln in enumerate(text.split('\n'), 1):
                for src in seg_violations(ln, rules, soft_ok=rel in {rules.map_path(x) for x in SEG_SOFT_OK}):
                    problems.append(('OLD QUOTED SEGMENT (%s)' % src, '%s:%d' % (rel, i), ln.strip()[:120]))
    by = Counter(p[0].split(' (')[0] for p in problems)
    print('verify: %d problems %s' % (len(problems), dict(by)))
    for kind, a_, b_ in problems[:400]:
        print('  %-22s %s  %s' % (kind, a_, b_))
    return 1 if problems else 0


def _resolves_now(ctx, rel, m):
    """the token names something that exists today (from the file's folder, from ashlar/ for ashlar docs, or from the root)"""
    parts = [x for x in SEP_SPLIT.split(m.group('rtail'))[0::2] if x]
    if not parts:
        return False
    parts[-1] = parts[-1].rstrip('.') or parts[-1]
    tail = '/'.join(parts)
    bases = [posixpath.dirname(rel)]
    if rel.startswith('ashlar/'):
        bases.append('ashlar')
    bases.append('')
    return any(ctx.exists(posixpath.normpath(posixpath.join(b, tail)) if b else tail) for b in bases)


def _rewrite_old_only(text, rel, ctx, gi):
    # only absolute / repo-relative / ashlar-relative tokens; relative tokens are checked through the markdown link check
    if gi:
        return rewrite_text(text, rel, ctx, True)
    out = []
    ashlar_doc = rel.startswith('ashlar/') and posixpath.splitext(rel)[1].lower() not in CODE_EXT
    for m in TOKEN.finditer(text):
        if m.group('abs'):
            r = _abs_or_rel(m, m.group(0), ctx.rules, 'abs')
        else:
            first = re.split(SEP, m.group('rtail'), maxsplit=1)[0]
            if first in ('.', '..'):
                continue
            r = _abs_or_rel(m, m.group(0), ctx.rules, 'rel')
            if r is None and ashlar_doc and not m.group('var'):
                r = _abs_or_rel(m, m.group(0), ctx.rules, 'rel', prefix=('ashlar',))
            if r is not None and _resolves_now(ctx, rel, m):
                continue
            if r is not None and rel.endswith(('.md', '.txt')) and is_history_line(text, m.start()):
                continue
        if r and r['after'] != r['before'] and r['kind'] != 'unfixable':
            out.append(r)
    return text, out


# ------------------------------------------------------------------ main
def init_rules(moves):
    rules = Rules(moves)
    FILE_ROOTS.clear()
    FILE_ROOTS.update(r['src'] for r in rules.rules if '.' in r['ss'][-1])
    return rules


def main(argv=None):
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group()
    g.add_argument('--dry-run', action='store_true')
    g.add_argument('--apply', action='store_true')
    g.add_argument('--verify', action='store_true')
    g.add_argument('--restore', metavar='JOURNAL')
    ap.add_argument('--probe-locks', action='store_true')
    ap.add_argument('--force', action='store_true', help='apply even though processes hold the repo / a patch does not apply')
    ap.add_argument('--backup-dir', default=None)
    ap.add_argument('--repo', default=REPO)
    ap.add_argument('--out-dir', default=HERE)
    a = ap.parse_args(argv)
    repo = a.repo
    if a.restore:
        return restore(a.restore, a.force)
    rules = init_rules(MOVES)
    if a.verify:
        return verify(repo, MOVES, rules, a.out_dir)

    ctx = Ctx(repo, rules)
    ctx.vanishing = rules.vanishing = compute_vanishing(repo, rules)
    if a.apply:
        rc = apply_all(repo, MOVES, rules, ctx, a)
        return rc

    errs, warns = precheck(repo, MOVES, rules)
    locks = None
    if a.probe_locks:
        locks = probe_locks(repo, MOVES)
        if locks:
            errs += ['locked: %s (%s)' % x for x in locks]
    procs = processes_using_repo()
    res = scan(repo, ctx)
    write_map(a.out_dir, MOVES, rules, ctx, res)
    write_report(os.path.join(a.out_dir, 'dryrun_report.md'), repo, MOVES, rules, res, errs, warns, [], procs, locks)
    print('dry run: %d moves, %d files with rewrites (%d occurrences), %d patches (%d not clean), %d precheck errors; report: dryrun_report.md'
          % (sum(1 for m in MOVES if not m.get('blocked')), len(res['edits']), sum(len(v) for v in res['edits'].values()),
             len(res['patches']), sum(1 for p in res['patches'] if p['status'] != 'ok'), len(errs)))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python
"""Repo reorganisation, round 3 (2026-10-24, after rounds 1 and 2): thin wrapper around reorg_2026-10-24.py.

One asset gets the SAME relative path in the 2D tree and the 3D tree:
    ashlar/art/<act>/<kind>/<ID>/...   <->   ashlar/3d/<act>/<kind>/<ID>/...
and the final images / GLBs sit at the top of each asset folder while the sidecar files go to <asset>/_work/.

  A. _work/ split (in place, done first): in every asset or variant folder that directly holds a final image / GLB,
     prompt/task/result/source/qa texts, *.log, cli-procedure.txt and the dirs _tasks, _rejected, _v* move to <folder>/_work/.
  B. 2D: env range folders A01-A14 / A15-A20 / A21-A25: groups/<g> -> act-01/environments/<g>, E01-E04_map01/<E0x_name> ->
     act-01/environments/<E0x_name>, the rest of the range folder -> act-01/_batches/env_<range>/; _map01 -> _batches/map01;
     act-02/monsters/_brief -> act-02/_batches/monsters.
  C. 3D: monsters/act-01/<ID> -> act-01/monsters/<ID>; weapons/<owner>_<item> -> <owner>/weapons/<item>; heroes/XX_name_vA ->
     heroes/XX_name/vA; props/act1_kit_v1 + act1_extras_v1 pieces -> act-01/environments/<group>/<piece> (batch infra ->
     act-01/_batches/{kit_v1,extras_v1}); props/{dungeon_v1,clutter_v1} -> common/; props/choice_hands_v1 -> heroes/_hands_v1.

The move list is computed from the disk at dry-run / apply time (thousands of sidecar moves) and frozen into
round3/moves_frozen.json, which --verify and --restore read. Same modes and options as the engine (--dry-run default, --apply,
--verify, --restore JOURNAL, --probe-locks, --force); reports go to ashlar/pipeline/_reorg/round3/, the default backup folder
is <drive>:\\tmp_reorg_backup_c.
"""
import argparse
import importlib.util
import json
import os
import posixpath
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('reorg_round1', os.path.join(HERE, 'reorg_2026-10-24.py'))
R = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R)

OUT_DIR = os.path.join(HERE, 'round3')
FROZEN = 'moves_frozen.json'
A = 'ashlar/art/'
D3 = 'ashlar/3d/'
RANGES = ['A01-A14', 'A15-A20', 'A21-A25']
ENV = A + 'act-01/environments/'

# ------------------------------------------------------------------ _work/ split
IMG_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.glb', '.blend'}
SIDECAR_SUFFIXES = (('.prompt.src.txt', 'prompt'), ('.prompt.txt', 'prompt'), ('.task.txt', 'task'), ('.result.txt', 'result'),
                    ('.source.txt', 'source'))
QA_RX = re.compile(r'(^|[_.\-])qa([_.\-]|\.txt$)', re.I)
VDIR_RX = re.compile(r'^_v\d')
WORK_DIRS = ('_tasks', '_rejected')
WALK_STOP = {'views', 'textures', 'rows', 'logs', 'prompts', 'templates', 'hud', 'prologue', '_work'}
PIECE_RX = re.compile(r'^A(\d\d)_\d+_')


def sidecar_kind(name):
    """file name -> category or None (kept at the top of the asset folder)"""
    low = name.lower()
    for suf, kind in SIDECAR_SUFFIXES:
        if low.endswith(suf):
            return kind
    if low == 'cli-procedure.txt':
        return 'cli-procedure'
    if low.endswith('.log'):
        return 'log'
    if low.endswith('.txt') and QA_RX.search(low):
        return 'qa'
    return None


def work_roots(repo):
    """(root, first-level filter) in OLD coordinates; the roots themselves are batch folders, never asset folders"""
    roots = [A + 'act-01/monsters', A + 'act-02/monsters', A + 'heroes', A + 'npcs', ENV + 'E01-E04_map01']
    roots += [ENV + r + '/groups' for r in RANGES]
    roots += [D3 + 'heroes', D3 + 'monsters/act-01', D3 + 'weapons']
    for kit in ('act1_kit_v1', 'act1_extras_v1', 'dungeon_v1', 'clutter_v1', 'choice_hands_v1'):
        roots.append(D3 + 'props/' + kit)
    return [(r, PIECE_RX if r.endswith(('act1_kit_v1', 'act1_extras_v1')) else None) for r in roots]


def work_moves(repo):
    """sidecar moves in old coordinates: [(src, in-place dst, kind)]"""
    out = []
    for root, flt in work_roots(repo):
        base = os.path.join(repo, root)
        if not os.path.isdir(base):
            continue
        for dp, dns, fns in os.walk(base):
            first = os.path.normpath(dp) == os.path.normpath(base)
            keep = []
            for d in sorted(dns):
                if d.startswith('_') or d.startswith('rig') or d in WALK_STOP:
                    continue
                if first and flt is not None and not flt.match(d):
                    continue
                keep.append(d)
            allowed = set(keep)
            dns[:] = [d for d in dns if d in allowed]
            if first:
                continue
            rel = os.path.relpath(dp, repo).replace('\\', '/')
            if not any(os.path.splitext(f)[1].lower() in IMG_EXT for f in fns):
                continue
            for f in sorted(fns):
                k = sidecar_kind(f)
                if k:
                    out.append((rel + '/' + f, rel + '/_work/' + f, k))
            for d in sorted(os.listdir(dp)):
                if os.path.isdir(os.path.join(dp, d)) and (d in WORK_DIRS or VDIR_RX.match(d)):
                    out.append((rel + '/' + d, rel + '/_work/' + d, 'dir ' + ('_v*' if VDIR_RX.match(d) else d)))
    return out


# ------------------------------------------------------------------ folder moves
def subdirs(repo, rel):
    p = os.path.join(repo, rel)
    return sorted(d for d in os.listdir(p) if os.path.isdir(os.path.join(p, d))) if os.path.isdir(p) else []


HERO_WEAPONS = {'PS_pyre_staff_vA': ('PS_pyre_singer', 'vA', 'pyre_staff')}
HERO_DIR_RX = re.compile(r'^([A-Z]{2}_[a-z0-9_]+)_(v[A-Z])$')


def env_groups(repo):
    """2D group dirs from the three range folders: {group: range}"""
    g = {}
    for r in RANGES:
        for d in subdirs(repo, ENV + r + '/groups'):
            g[d] = r
    return g


def group_for_piece(groups, piece):
    pre = PIECE_RX.match(piece).group(0)[:3]  # 'A01'
    hit = [g for g in groups if g.startswith(pre + '_')]
    if len(hit) != 1:
        raise RuntimeError('piece %s: prefix %s matches groups %s' % (piece, pre, hit))
    return hit[0]


def owner_of_weapon(name, monster_ids):
    if name in HERO_WEAPONS:
        h, v, item = HERO_WEAPONS[name]
        return D3 + 'heroes/%s/%s/weapons/%s' % (h, v, item)
    hit = [i for i in monster_ids if name.startswith(i + '_')]
    if not hit:
        raise RuntimeError('weapon %s has no owner monster dir' % name)
    owner = max(hit, key=len)
    return D3 + 'act-01/monsters/%s/weapons/%s' % (owner, name[len(owner) + 1:])


def dir_moves(repo):
    mv = []

    def add(src, dst, **kw):
        mv.append(dict(src=src, dst=dst, **kw))

    groups = env_groups(repo)
    # --- 2D
    for g, r in groups.items():
        add(ENV + r + '/groups/' + g, ENV + g)
    for d in subdirs(repo, ENV + 'E01-E04_map01'):
        add(ENV + 'E01-E04_map01/' + d, ENV + d)
    for r in RANGES:
        if os.path.isdir(os.path.join(repo, ENV + r)):
            add(ENV + r, A + 'act-01/_batches/env_' + r)
    add(A + 'act-01/_map01', A + 'act-01/_batches/map01')
    add(A + 'act-02/monsters/_brief', A + 'act-02/_batches/monsters')
    # --- 3D: heroes, monsters, weapons
    for d in subdirs(repo, D3 + 'heroes'):
        m = HERO_DIR_RX.match(d)
        if m:
            add(D3 + 'heroes/' + d, D3 + 'heroes/%s/%s' % (m.group(1), m.group(2)))
    mon = subdirs(repo, D3 + 'monsters/act-01')
    for d in mon:
        add(D3 + 'monsters/act-01/' + d, D3 + 'act-01/monsters/' + d)
    ids = [d for d in mon if not d.startswith('_')]
    for w in subdirs(repo, D3 + 'weapons'):
        if w == '_review':
            add(D3 + 'weapons/_review', D3 + 'act-01/monsters/_review/weapons')
        else:
            add(D3 + 'weapons/' + w, owner_of_weapon(w, ids))
    # --- 3D props
    for kit, tag in (('act1_kit_v1', 'kit_v1'), ('act1_extras_v1', 'extras_v1')):
        for d in subdirs(repo, D3 + 'props/' + kit):
            if PIECE_RX.match(d):
                add(D3 + 'props/%s/%s' % (kit, d), D3 + 'act-01/environments/%s/%s' % (group_for_piece(groups, d), d),
                    quiet=True, kind='3D piece -> group folder')
        if os.path.isdir(os.path.join(repo, D3 + 'props/' + kit)):
            add(D3 + 'props/' + kit, D3 + 'act-01/_batches/' + tag)
    add(D3 + 'props/dungeon_v1', D3 + 'common/dungeon_v1')
    add(D3 + 'props/clutter_v1', D3 + 'common/clutter_v1')
    add(D3 + 'props/choice_hands_v1', D3 + 'heroes/_hands_v1')
    return [m for m in mv if os.path.exists(os.path.join(repo, m['src']))]


def build_moves(repo):
    """-> list of move dicts in execution order: first the in-place _work moves, then the folder moves"""
    dirs = dir_moves(repo)
    dr = R.Rules(dirs)
    moves = []
    for src, xdst, kind in work_moves(repo):
        old_dir, name = posixpath.split(src)
        parent = posixpath.dirname(xdst)  # old_dir/_work
        final = posixpath.join(dr.map_path(old_dir), '_work', name)
        moves.append(dict(src=src, dst=final, xdst=xdst, quiet=True, kind=kind))
    return moves + dirs


def load_or_build(repo, out_dir, mode):
    fp = os.path.join(out_dir, FROZEN)
    if mode in ('verify', 'restore') and os.path.exists(fp):
        with open(fp, encoding='utf-8') as fh:
            return json.load(fh)
    return build_moves(repo)


_pspec = importlib.util.spec_from_file_location('reorg_c_patches', os.path.join(HERE, 'reorg_c_patches.py'))
_pm = importlib.util.module_from_spec(_pspec)
_pspec.loader.exec_module(_pm)
PATCHES = _pm.PATCHES
STAY = []
RUNTIME_AREAS = list(R.RUNTIME_AREAS)
GENERIC_ROOTS = set()
OVERRIDE_REPO_ROOT = set()
# split_rows.py reads rows/<row>/tripo.log: the row folders stay in the batch folder (never split), so its 'tripo.log' is not a moved sidecar
SEG_SOFT_OK = {'ashlar/3d/props/act1_kit_v1/_tools/split_rows.py'}
NEXT_STEPS = [
    "Run `python ashlar/pipeline/_reorg/reorg_2026-10-24c.py --verify` (must exit 0).",
    "Run `python ashlar/pipeline/index/build_index.py` to write `ashlar/INDEX.md` (one row per asset: concept folder, newest concept, 3D folder, GLBs). "
    "It is not run by the reorg: it reads the NEW layout, so it only makes sense after the apply.",
    "Regenerate the NPC review page (it names `<npc>/QA.txt` and `<npc>/*.prompt.txt`, now in `_work/`): "
    "`python ashlar/art/npcs/_brief/build_npc_review_index.py` (rewrites ashlar/art/npcs/index.html and manifest.json).",
    "Run the tests: `python -m pytest ashlar/pipeline/codex/tests ashlar/pipeline/index ashlar/pipeline/_reorg`.",
    "Lab: `python lookdev-lab/scripts/prepare-act1-extras.py --only A15.1,P06 --no-register` and "
    "`python lookdev-lab/scripts/prepare-act1-kit.py --only A01.1,A21.1 --no-register` once (pieces are found by glob in `ashlar/3d/act-01/environments/*/`); "
    "`python ashlar/art/act-01/_batches/env_A01-A14/act01_batch.py --check` (and the same for env_A15-A20 / env_A21-A25 via their manifest).",
    "Rig tools / tests: `python -m pytest .agents/skills/blender-mcp-rigging/scripts/tests/rigkit -k 'not blender' -q` (they join `act-01/monsters/D01_hodling` now).",
    "Tripo flow: new assets go to `ashlar/3d/<act>/<kind>/<ID>/` (same path as `ashlar/art/...`), sidecars to `<asset>/_work/` (scripts and skill patched).",
    "Records keep their old paths on purpose: *.log, *.jsonl, _runs/, task/result/prompt texts, brief.md mentions of `_tasks/` and `_rejected/`.",
    "Update the auto-memory files outside the repo: they name `ashlar/3d/monsters/<ID>`, `3d/weapons`, `3d/props/act1_kit_v1`, `art/act-01/environments/A01-A14/groups`, `_map01`.",
    "`git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.",
]


def install(moves):
    for _k, _v in dict(MOVES=moves, PATCHES=PATCHES, STAY=STAY, RUNTIME_AREAS=RUNTIME_AREAS, GENERIC_ROOTS=GENERIC_ROOTS,
                       OVERRIDE_REPO_ROOT=OVERRIDE_REPO_ROOT, SEG_SOFT_OK=SEG_SOFT_OK, NEXT_STEPS=NEXT_STEPS, BACKUP_NAME='tmp_reorg_backup_c',
                       REPORT_TITLE='reorg_2026-10-24c.py', ROUND1_NOTES=False).items():
        setattr(R, _k, _v)


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument('--repo', default=R.REPO)
    ap.add_argument('--out-dir', default=OUT_DIR)
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--restore')
    known, _ = ap.parse_known_args(argv)
    if not any(a == '--out-dir' or a.startswith('--out-dir=') for a in argv):
        argv += ['--out-dir', known.out_dir]
    os.makedirs(known.out_dir, exist_ok=True)
    mode = 'verify' if known.verify else 'restore' if known.restore else 'plan'
    if mode == 'restore':
        return R.main(argv)
    moves = load_or_build(known.repo, known.out_dir, mode)
    install(moves)
    if mode == 'plan':
        if moves:
            with open(os.path.join(known.out_dir, FROZEN), 'w', encoding='utf-8') as fh:
                json.dump(moves, fh, indent=0, ensure_ascii=False)
        else:
            print('nothing to move (already applied?): %s left as it is' % FROZEN)
    rc = R.main(argv)
    if mode == 'plan' and moves and '--apply' not in argv:
        try:
            n = write_index_preview(known.repo, moves, known.out_dir)
            print('INDEX.preview.md: %d lines (planned layout; run build_index.py after the apply)' % n)
        except Exception as e:  # noqa: BLE001 - the preview is a convenience
            print('INDEX.preview.md skipped: %r' % (e,))
    return rc


def write_index_preview(repo, moves, out_dir):
    """INDEX.md as it will look after the apply: the current files of ashlar/art and ashlar/3d mapped through the move rules"""
    bspec = importlib.util.spec_from_file_location('build_index', os.path.join(HERE, '..', 'index', 'build_index.py'))
    BI = importlib.util.module_from_spec(bspec)
    bspec.loader.exec_module(BI)
    rules = R.Rules(moves)
    root = os.path.join(repo, 'ashlar')
    files = [(rules.map_path('ashlar/' + rel)[len('ashlar/'):], mtime) for rel, mtime in BI.collect(root)]
    text = BI.render(files)
    with open(os.path.join(out_dir, 'INDEX.preview.md'), 'w', encoding='utf-8', newline=chr(10)) as fh:
        fh.write(text)
    return text.count(chr(10))


if __name__ == '__main__':
    sys.exit(main())

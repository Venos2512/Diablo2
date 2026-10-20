#!/usr/bin/env python
"""Unpack src/Unhallowed.html (a Vite/rolldown single-file bundle) into an editable source tree.

    python -I tools/unpack.py [--src src/Unhallowed.html] [--out source] [--force]

Refuses to overwrite an existing output directory unless --force is given (it would destroy hand edits).
The unpack is purely mechanical and reversible: nothing is renamed or rewritten, only re-formatted (esbuild, no minify).

Output:
  index.html                   shell (head, host styles, body markup); links css/style.css and js/bundle.js
  css/style.css                the app CSS, formatted
  js/vendor-three.js           rolldown runtime + three.js r184 (do not edit)
  js/game/NN-*.js              game code, split at top-level statement boundaries, in execution order
  js/manifest.json             ordered list of the JS files that make up the ONE module (dev server + build concatenate it)
  fonts/*.woff2                the 11 fonts that were base64 string constants in the JS (now referenced by relative URL)

Vendor and game must stay in a single module scope: the game uses three.js's minified top-level names directly.
"""
import argparse
import base64
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def find_repo_root():
    """Walk up from ROOT to the first ancestor that contains lookdev-lab (the project may sit at any depth)."""
    for p in ROOT.parents:
        if (p / 'lookdev-lab').is_dir():
            return p
    return None

# Where the vendor code ends and the game code starts, then the split of the game code.
# Each anchor is an exact piece of the (esbuild-formatted) code that begins at the start of a line and occurs exactly once.
# Parts are named by what they mostly contain; boundaries are only at top-level statements, never inside one.
GAME_START = 'var kd = 1 / 25, Ad = class {'
GAME_PARTS = [
    ('01-core-loop-rng-pathfinding', GAME_START),
    ('02-items-affixes-stats', 'function Hd(e4 = 7) {'),
    ('03-areas-level-generation', 'var Ep = { town: { id: `town`'),
    ('04-monsters-ai-combat', 'var Up = 1;\nfunction Wp() {'),
    ('05-game-world-simulation-quests', 'var Jm = { normal: { life: 1, dmg: 1, xp: 1 }'),
    ('06-camera-lighting-presets-postfx', 'var sh, ch, lh, uh = t(('),
    ('07-terrain-grass-materials', 'Ed(), Ld(), dm();\nvar Bh = 16;'),
    ('08-area-props-vfx-world-renderers', 'var hg = new N(0, 1, 0), gg = class {'),
    ('09-game-shell-ui-controller', 'Ed(), Od(), Ld();\nvar Bg = [`character`'),
    ('10-character-and-monster-models', 'var Zg = `modulepreload`'),
    ('11-ui-fonts-icons-panels', 'var lw, uw, dw = t(('),
    ('12-materials-props-structures', 'var J, NO, PO, FO, IO, LO, RO, zO, BO, VO, HO, UO = t(('),
    ('13-audio-engine', 'var PN, FN = t(('),
    ('14-boot', 'var tz, nz, rz = t(('),
]


def die(msg):
    print('unpack: ' + msg, file=sys.stderr)
    sys.exit(1)


def esbuild(text, loader):
    """Format with esbuild, no minify. Returns the formatted text."""
    repo = find_repo_root()
    if repo is None:
        die(f'no ancestor of {ROOT} contains a lookdev-lab folder (needed for node_modules/.bin/esbuild)')
    exe = None
    for cand in [repo / 'lookdev-lab' / 'node_modules' / '.bin' / 'esbuild.cmd',
                 repo / 'lookdev-lab' / 'node_modules' / '.bin' / 'esbuild']:
        if cand.exists():
            exe = str(cand)
            break
    if exe is None:
        exe = shutil.which('esbuild') or die('esbuild not found (expected in lookdev-lab/node_modules/.bin)')
    args = [exe, f'--loader={loader}', '--charset=utf8', '--log-level=warning']
    if loader == 'js':
        args += ['--format=esm', '--target=esnext']
    p = subprocess.run(args, input=text.encode('utf-8'), capture_output=True)
    if p.returncode:
        die('esbuild failed: ' + p.stderr.decode('utf-8', 'replace')[:2000])
    return p.stdout.decode('utf-8')


def one(rx, s, what, flags=re.S):
    ms = list(re.finditer(rx, s, flags))
    if len(ms) != 1:
        die(f'expected exactly one {what}, found {len(ms)}')
    return ms[0]


def find_anchor(text, anchor):
    """Index of the (line-start) anchor in text; it must occur exactly once."""
    hits = [m.start() for m in re.finditer(re.escape(anchor), text)]
    hits = [h for h in hits if h == 0 or text[h - 1] == '\n']
    if len(hits) != 1:
        die(f'anchor must match once at a line start, matched {len(hits)}: {anchor[:60]!r}')
    return hits[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(ROOT / 'src' / 'Unhallowed.html'))
    ap.add_argument('--out', default=str(ROOT / 'source'))
    ap.add_argument('--force', action='store_true', help='overwrite an existing output directory')
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out)
    if out.exists() and any(out.iterdir()):
        if not a.force:
            die(f'{out} already exists (it may hold hand edits). Use --force to replace it.')
        shutil.rmtree(out)
    html = src.read_text(encoding='utf-8')

    # ---- split the HTML shell
    styles = [m for m in re.finditer(r'<style([^>]*)>(.*?)</style>', html, re.S)]
    if len(styles) != 3 or 'crossorigin' not in styles[2].group(1):
        die('expected 3 <style> blocks, the last being the app CSS')
    title = one(r'<title>(.*?)</title>', html, '<title>').group(1)
    desc = one(r'<meta name="description" content="(.*?)" />', html, 'description meta').group(1)
    theme = one(r'<meta name="theme-color" content="(.*?)" />', html, 'theme-color meta').group(1)
    icon = one(r'<link rel="icon" href="(.*?)" />', html, 'icon link').group(1)
    viewport = one(r'<meta name=viewport content="(.*?)">', html, 'viewport meta').group(1)
    main = one(r'(<main id="app">.*?</main>)', html, '<main>').group(1)
    script = one(r'<script type="module">(.*?)</script>', html, 'module script').group(1)
    if '<script' in html[:html.index('<script type="module">')]:
        die('unexpected extra <script>')

    # ---- CSS
    css = esbuild(styles[2].group(2), 'css')

    # ---- JS: format, take the fonts out, split
    js = esbuild(script, 'js')
    font_vars = {}
    for m in re.finditer(r'^(\s*)([\w$]+) = `data:font/woff2;base64,([A-Za-z0-9+/=]+)`', js, re.M):
        font_vars[m.group(2)] = m.group(3)
    table = re.findall(r'\[`([^`]+)`, ([\w$]+), `(\d+)`, `(\w+)`\]', js)
    names = {}
    for family, var, weight, style in table:
        if var in font_vars:
            names[var] = f"{re.sub(r'[^a-z0-9]+', '-', family.lower()).strip('-')}-{weight}-{style}.woff2"
    if len(font_vars) != 11 or set(names) != set(font_vars) or len(set(names.values())) != len(names):
        die(f'font extraction mismatch: {len(font_vars)} fonts, {len(names)} named')
    fonts = {}
    for var, b64 in font_vars.items():
        fonts[names[var]] = base64.b64decode(b64)
        js = js.replace(f'{var} = `data:font/woff2;base64,{b64}`', f'{var} = `fonts/{names[var]}`', 1)
    if 'data:font/woff2' in js:
        die('a font data URI is left in the JS')

    cut = find_anchor(js, GAME_PARTS[0][1])
    vendor = js[:cut]
    bounds = [find_anchor(js, anc) for _, anc in GAME_PARTS] + [len(js)]
    if bounds != sorted(bounds) or len(set(bounds)) != len(bounds):
        die('game part anchors are not in increasing order')
    parts = [(name, js[bounds[i]:bounds[i + 1]]) for i, (name, _) in enumerate(GAME_PARTS)]
    if vendor + ''.join(p for _, p in parts) != js:
        die('internal error: split does not reassemble')

    # ---- write
    (out / 'css').mkdir(parents=True)
    (out / 'js' / 'game').mkdir(parents=True)
    (out / 'fonts').mkdir()
    (out / 'css' / 'style.css').write_text(css, encoding='utf-8')
    (out / 'js' / 'vendor-three.js').write_text(
        '// ===== rolldown runtime + three.js r184 (vendor, minified top-level names) =====\n'
        '// DO NOT EDIT. The game code (js/game/*.js) uses these names directly and both are ONE module scope:\n'
        '// the files listed in js/manifest.json are concatenated in order.\n' + vendor, encoding='utf-8')
    manifest = ['js/vendor-three.js']
    for name, body in parts:
        rel = f'js/game/{name}.js'
        (out / rel).write_text(f'// ===== game part {name} (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====\n' + body, encoding='utf-8')
        manifest.append(rel)
    (out / 'js' / 'manifest.json').write_text(json.dumps({'files': manifest}, indent=2) + '\n', encoding='utf-8')
    for fname, raw in fonts.items():
        (out / 'fonts' / fname).write_bytes(raw)

    host1, host2 = styles[0].group(2), styles[1].group(2)
    shell = f'''<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="{viewport}">
<style>{host1}</style>
<title>{title}</title>
<meta name="description" content="{desc}" />
<meta name="theme-color" content="{theme}" />
<link rel="icon" href="{icon}" />
<style>{host2}</style>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
{main}
<!-- js/bundle.js does not exist as a file: the dev server (tools/serve.mjs) builds it from js/manifest.json, tools/build.py inlines it -->
<script type="module" src="js/bundle.js"></script>
</body>
</html>
'''
    (out / 'index.html').write_text(shell, encoding='utf-8')
    print(f'unpacked {src.name} -> {out}')
    print(f'  css {len(css) / 1e3:.0f} KB, vendor {vendor.count(chr(10))} lines, game {len(parts)} parts '
          f'{sum(p.count(chr(10)) for _, p in parts)} lines, {len(fonts)} fonts ({sum(map(len, fonts.values())) / 1e3:.0f} KB)')


if __name__ == '__main__':
    main()

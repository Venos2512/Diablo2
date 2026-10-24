"""
Gameplay HUD sprites: picks the pieces the Play HUD uses from the sliced HUD sheets
(legacy/art-output/ui-hud-assets/<sheet>_v2/<name>.png, transparent PNGs cut by that folder's slice.py),
trims them to their alpha, resizes them to about 2x their on-screen size and writes WebP files
to src/gameplay/hud/ (embedded into the bundle as data URLs by esbuild).

  python -I scripts/prepare-hud.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '..', 'legacy', 'art-output', 'ui-hud-assets')
OUT = os.path.join(ROOT, 'src', 'gameplay', 'hud')

# (sheet folder, sprite name, output width px)
PICK = [
    ('h1_orbs_v2', 'orb_frame_life', 400), ('h1_orbs_v2', 'orb_frame_mana', 400),
    ('h1_orbs_v2', 'orb_life', 256), ('h1_orbs_v2', 'orb_mana', 256), ('h1_orbs_v2', 'orb_empty', 256), ('h1_orbs_v2', 'orb_glass', 256),
    ('h2_bottom_bar_v2', 'bar_panel', 1400), ('h2_bottom_bar_v2', 'xp_trough', 1300), ('h2_bottom_bar_v2', 'xp_fill', 1300),
    ('h3_slots_buttons_v2', 'slot_mouse', 112), ('h3_slots_buttons_v2', 'slot_skill', 80), ('h3_slots_buttons_v2', 'slot_potion', 80),
    ('h3_slots_buttons_v2', 'slot_selected', 80),
    *[('h3_slots_buttons_v2', f'btn_{b}{s}', 64) for b in ('character', 'inventory', 'skills', 'quests', 'map', 'system') for s in ('', '_hover')],
    ('h4_frames_bars_v2', 'nameplate', 720), ('h4_frames_bars_v2', 'fill_life', 400), ('h4_frames_bars_v2', 'fill_champion', 400),
    *[('h5_panels_icons_v2', n, 96) for n in ('skill_slash', 'skill_bash', 'skill_charge', 'skill_holy_fire', 'skill_war_cry', 'skill_heal',
                                             'skill_whirl', 'skill_aura', 'status_poison', 'status_burn', 'status_freeze', 'status_bleed')],
    *[('h5_panels_icons_v2', n, 72) for n in ('potion_life', 'potion_mana', 'potion_rejuv', 'scroll_portal')],
]

os.makedirs(OUT, exist_ok=True)
total = 0
for sheet, name, width in PICK:
    img = Image.open(os.path.join(SRC, sheet, name + '.png')).convert('RGBA')
    a = np.asarray(img)[..., 3] > 8
    ys, xs = np.nonzero(a)
    img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    img = img.resize((width, max(1, round(img.height * width / img.width))), Image.LANCZOS)
    path = os.path.join(OUT, name + '.webp')
    img.save(path, 'WEBP', quality=86, method=6)
    total += os.path.getsize(path)
    print(f'{name:22s} {img.width}x{img.height}')
print(f'{len(PICK)} sprites, {total / 1024:.0f} KB')

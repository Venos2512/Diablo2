"""Add the not-yet-approved ASHLAR concept art to the Book of Cain manifest.

Regenerates the `ashlar-*` groups below (everything except the 28 approved `ashlar-chot` sheets) from the art tree
under ashlar/art/ and from the project docs, and writes them into assets/CONCEPT_SOURCES.json:

  ashlar-act1-open      W05 and D03, the two Act I monsters with no approved sheet
  ashlar-act2-monsters  23 Act II monsters (v5 redo, none approved)
  ashlar-act3-monsters  23 Act III monsters (first pass, none approved)
  ashlar-heroes         six hero classes (A/B) plus the shared sheets (hands, line-up, top-down, overview)
  ashlar-npcs           51 NPCs, two costume proposals each (ashlar/art/npcs/manifest.json)
  ashlar-items          19 inventory icon sheets
  ashlar-hud            8 HUD kits and mockups
  ashlar-act1-env       Act I environment sheets A01-A25 (E01-E04 are legacy copies of A01-A04, see below)
  ashlar-prologue       4 Prologue environment sheets

Idempotent: the new groups go right after `ashlar-chot` in `groups`, their records are (re)appended at the END of
`records`, and every other group and record is left untouched (record ids, numbers, notes and favourites stay valid).

Image picks: the newest top-level PNG of a folder by mtime (the rule of ashlar/pipeline/index/build_index.py), never
anything under _work, _runs, _brief, _batches, nor a file with REJECTED in its name. Exceptions, each a documented
override below: the QA notes of the monster folders name an older pass as the best one (MONSTER_PICK_OVERRIDES), the
hero picks follow ashlar/art/heroes/_review/v5/README_VI.md, and A19 keeps its selected turnaround.

    python scripts/add_ashlar_unapproved.py          # then: python scripts/import_concepts.py
"""
import json
import re
from pathlib import Path

BESTIARY = Path(__file__).resolve().parents[1]
REPO = BESTIARY.parent.parent
ART = REPO / 'ashlar' / 'art'
MANIFEST = BESTIARY / 'assets' / 'CONCEPT_SOURCES.json'
METHOD = 'AI image generation (Codex gpt-6-astra, built-in image_gen)'
NEW_GROUPS = ['ashlar-act1-open', 'ashlar-act2-monsters', 'ashlar-act3-monsters', 'ashlar-heroes', 'ashlar-npcs',
              'ashlar-items', 'ashlar-hud', 'ashlar-act1-env', 'ashlar-prologue']
SKIP_DIRS = {'_work', '_runs', '_brief', '_batches'}

# Monster folders whose QA notes name an older pass as the best of the passes (the newest pass is worse).
MONSTER_PICK_OVERRIDES = {
    ('act-02', 'F05', 'A'): 'concept_v5_r2.png',  # bell 1.05H in v5_r3, "best of the three remains v5_r2"
    ('act-02', 'L01', 'A'): 'concept_v5.png',     # "Best stays concept_v5.png" (v5_r2 edit changed nothing useful)
    ('act-02', 'L01', 'B'): 'concept_v5.png',
    ('act-02', 'U06', 'A'): 'concept_v5_r2.png',  # 1.28H vs 1.41H in v5_r3
    ('act-03', 'B08', 'B'): 'concept_r2.png',     # best of 3 = r2 (1.57H vs 1.47H, design identical)
    ('act-03', 'U14', 'A'): 'concept_r2.png',     # best of 3 = r2 (1.29H vs 1.31H)
}
ENV_PICK_OVERRIDES = {('A19', 'turnaround'): 'turnaround_v2.png'}  # v2e was the failed 4th try; v2 is the selected sheet

FAMILY = {'U': 'Unlaid', 'D': 'Discarded', 'W': 'Warped', 'F': 'Faithful', 'P': 'Perfection-born', 'L': "Lodge's servants", 'B': 'Boss'}
MONSTER_LAYOUT = ('16:9 sheet: 1 H human silhouette for scale, one 3/4 view with weapon, a separate weapon/prop panel where the '
                  'creature has one, and four neutral-pose views (left, right, front, back). Variant A and variant B are two '
                  'different designs of the same monster.')
NOT_APPROVED = 'chua chot'


# ---------------------------------------------------------------------------------------------------------------------
# helpers

def rel(path):
    return Path(path).resolve().relative_to(REPO).as_posix()


def real_png(name):
    low = name.lower()
    return low.endswith('.png') and 'reject' not in low


def newest_png(folder, prefix=None):
    """Newest top-level PNG of `folder` by mtime (None when there is none)."""
    folder = Path(folder)
    if not folder.is_dir():
        return None
    files = [p for p in folder.iterdir() if p.is_file() and real_png(p.name) and (prefix is None or p.name.startswith(prefix))]
    return max(files, key=lambda p: p.stat().st_mtime) if files else None


def pass_label(stem):
    """concept_v5_r3 -> 'v5 r3'; concept -> 'first pass'; sheet_d2_v1 -> 'd2 v1'."""
    s = re.sub(r'^(concept|sheet|turnaround|perspective|showcase)_?', '', stem)
    s = re.sub(r'^[A-Z]{2}_?', '', s)
    return s.replace('_', ' ').strip() or 'first pass'


def title_case(text):
    t = text.title()
    t = re.sub(r"'S\b", "'s", t)
    t = re.sub(r'\b(Ii|Iii|Iv)\b', lambda m: m.group(1).upper(), t)
    return re.sub(r'\b(And|Of|To|The|In|A)\b', lambda m: m.group(1).lower(), t)


def tags(*items):
    out = ['ashlar', NOT_APPROVED, 'chưa chốt']
    for i in items:
        if i and i not in out:
            out.append(i)
    return out


def record(rid, name, group, role, act, location, description, art, tag_list, images, base=None, palette=None, layout=None,
           status='progress'):
    r = {'id': rid, 'name': name, 'group': group, 'role': role, 'act': act, 'location': location}
    if base:
        r['base'] = base
    if palette:
        r['palette'] = palette
    r['method'] = METHOD
    if layout:
        r['layout'] = layout
    r.update({'status': status, 'description': description, 'art': art, 'tags': tag_list, 'images': images})
    return r


def image(path, label):
    if path is None or not Path(path).is_file():
        raise SystemExit(f'Missing image for {label}: {path}')
    parts = Path(path).resolve().relative_to(REPO).parts
    if any(p in SKIP_DIRS for p in parts) or not real_png(parts[-1]):
        raise SystemExit(f'Forbidden source {path}')
    return {'origin': rel(path), 'label': label}


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower().replace("'", '')).strip('-')


# ---------------------------------------------------------------------------------------------------------------------
# monsters: id -> (name, location, base, description)   (translated from ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md)

MONSTERS = {
    'D03': ('Kiln-Bull', 'ASHLAR · Act I · Flint Delvings (also Act IV: siege, ramming gates)', 'D1 Horned Demon',
            'Giant horned brute of fired clay with glowing nostrils, built as a walking battering ram. Charges out of the dark; its hooves are heard before it is seen.'),
    'W05': ('Corpse-Candle', "ASHLAR · Act I · Night Fens, Rook's Weir, Willow Mere (also Act V: Wrack-Woods)", 'D2 Gloams, wisps',
            "Pale flame hanging over the water with a faint face inside each flame. Drifts and lures; casts lightning and drains the hero's resource. "
            'Not an animal (checklist note); level design wants the light still and beautiful, because it is bait.'),
    'B06': ('The Choir of Nails', 'ASHLAR · Act II · Bell Catacombs', 'Motif near the D2 High Council, very different design',
            'Twelve Kneeler choristers fused into a singing organ of flesh, pipes and iron nails; it must be silenced one voice at a time. Line: "HOLD… FAST… HOLD… FAST…"'),
    'B07': ('Brother Cassian, the Kneeling Saint', 'ASHLAR · Act II · Kneeling Vault', 'Original',
            'Gaunt old man whose legs have become stone roots, crowned with the iron-thorn halo of Latreus; tears himself out of the floor. The "KNEEL" command locks movement and is broken with the Doubt skill. Line: "Doubt is the only sin!"'),
    'D05': ('Hornclan — Cinder-Clan', 'ASHLAR · Act II · Pilgrim Road', 'D1 goat-demon clans; D2 Goatmen; D3/D4 Khazra',
            'Human-sized Discarded with goat heads and goat legs, in soot-black clay with coal-red cracks. Hooked horns for hauling stone, masonry picks as weapons, hod troughs as shields, clan marks painted in ash. '
            'Fights in squads: Raiders in melee, Slingers throwing hot stones, Chanters with fire magic; more aggressive near fire. Tier names run Raider → … → Breaker. They chant counts instead of war cries.'),
    'F03': ('Exhumer (hostile patrol)', 'ASHLAR · Act II · Pilgrim Road', 'Original (being hunted by a guild recalls the D2 Corrupt Rogues)',
            'Grey oilcloth coat, wide-brimmed hat, hooded lantern, long-bladed spade and crossbow. Flashes the lantern to blind, then closes in; uses the crossbow at range. Shares its name with the Exhumer class and with Ignatia’s guild.'),
    'F04': ('Kneeler', 'ASHLAR · Act II · Stair of Penitence, burning Cathedral', 'D2 Zakarum Zealots (fanatic swarm); the silhouette is new',
            'Penitent in sackcloth whose knees have fused into the stone slab they drag, an iron halo riveted into the scalp. Crawls alarmingly fast, in packs; turns slowly. '
            'Shares its name with P08; level design flags the self-harm imagery.'),
    'F05': ('Bell-Head', 'ASHLAR · Act II · Stair of Penitence, burning Cathedral', 'D1 Horned Demons (charge style); the silhouette is new',
            'Fanatic with a church bell clamped over the whole head, eye slits cut in the bronze. Charges in ranks with the bell ringing; stunned when hit. The Bible lists it as a Latreus spawn.'),
    'F06': ('Censer-Bearer', 'ASHLAR · Act II · Stair of Penitence, burning Cathedral, Kneeling Vault', 'D2 Zakarum Priests',
            'Monk in a black vestment swinging an iron censer that burns animal fat. Heals nearby Kneelers and marks the hero as a "doubter" so the hero takes extra damage. The Bible lists it as a Latreus spawn.'),
    'F07': ('Turned Exhumer', 'ASHLAR · Act II · Stair of Penitence', 'D2 Corrupt Rogues',
            'An Exhumer who has gone over to the Kneelers, an iron halo clamped onto the hat. Fights like an Exhumer but fanatical, and never retreats.'),
    'F08': ('Halo Knight', 'ASHLAR · Act II · Chancery, burning Cathedral, Kneeling Vault', 'D1 Black/Blood Knights; D4 Knights Penitent (the inward-pointing halo is the ASHLAR-only mark)',
            'Plate knight with chains wound under a white mantle, wearing a spiked iron halo whose thorns point inward at the scalp. Melee elite; its slams spread holy fire; never flinches.'),
    'F09': ('Chancery Guard', 'ASHLAR · Act II · Chancery', 'Original',
            'Polearm guard with a chained ledger at the belt. A standard soldier.'),
    'L01': ('Saint-Statue', 'ASHLAR · Every church in every act; first met as a monster in the Chancery (Act II)', 'Original',
            'Faceless Nameless Saint statue 10–15% taller than a person, its hands holding up an arch. Moves only when nobody is looking. After the ending every statue needs a variant with the hero’s face.'),
    'L02': ('Plumb-Hound', 'ASHLAR · From Act II (Chancery) onward, follows the hero in every act', 'Original',
            'Hound of grey stone hung on a plumb line that pulls straight up into the void, swinging toward the hero. Never lets go, cannot be shaken off, and calls other servants.'),
    'L03': ('Gargoyle Mortarer', 'ASHLAR · From Act II onward · rooftops', 'Original; silhouette overlaps D10 Gutter-Wing',
            'Stone gargoyle crouching on a roof. Spits fast-setting mortar that roots the hero.'),
    'P08': ('Kneeler (the kneeling dead)', 'ASHLAR · Act II · Kneeling Vault', 'D2 Zealots (behaviour)',
            'A dead worshipper who rises stiffly from the pews while still kneeling. Behaves like the street Kneeler (F04). Shares its name with F04; the checklist proposes renaming it "the Kneeling Dead". The generation of this sheet’s earlier A/B r2 pass failed (connection error) and was redone as v5.'),
    'P09': ('Chain-Hung', 'ASHLAR · Act II · Kneeling Vault', 'Original',
            'Penitent hanging from the vault’s chains by hooks through the back. Drops and swings along the chains to strike the hero. Level design flags the self-harm imagery.'),
    'U06': ('Pall-Wight', 'ASHLAR · Act II · Pilgrim Road', 'D1 Black Knight',
            'Dead Pallbearer knight in black armour studded with silver nails, still carrying a coffin on the back. Slow, heavily armoured, shield bashes. At half health the coffin lid bursts open and releases bats or corpses.'),
    'U07': ('Pyre-Risen', 'ASHLAR · Act II · Stair of Penitence, burning Cathedral', 'D2 Burning Dead',
            'Charred skeleton wrapped in flame, the chain from the stake still dangling. Burns the ground and explodes in fire on death; water and salt put it out.'),
    'U08': ('Charnel Chanter', 'ASHLAR · Act II · Bell Catacombs, Scriptorium', 'D2 skeleton mages',
            'Skeleton in a rotted robe, still muttering the Rite of Laying. Casts frost and grave-fire from the back line. Level design proposal: ringing bells wake them.'),
    'U09': ('Ossuary-Glutton', 'ASHLAR · Act II · Bell Catacombs (also Act V: the Course)', 'D2 Regurgitators, Corpse Spitters',
            'Bloated corpse fused to a heap of bones, with a second mouth in the belly. Eats corpses and spits bone shards.'),
    'U10': ('Wallshade', 'ASHLAR · Act II · Bell Catacombs (also Act IV: Archive of Faces; Act V: Sunken Chapel, the Course)', 'D2 ghosts, wraiths',
            'Spirit half out of the Wall, translucent and dripping mortar, its face stretched as if pressed against glass. Passes through walls, drains the hero’s resource, phases in and out.'),
    'U11': ('Scribe-Shade', 'ASHLAR · Act II · Scriptorium', 'D2 ghosts (variant)',
            'Wallshade of a scribe of old, ink-black, still holding a quill. Throws ink to blind; "rewrites" the floor under the hero into traps.'),
    'U12': ('The Pressed', 'ASHLAR · Act II · Kneeling Vault, after the boss (also Act V: the Course)', 'D3 Unburied; name close to P17 the Preserved',
            'Human shape assembled from many bodies pressed like bricks, faces and hands showing on the flanks. A slow, heavy mass that crawls out of broken Wall; destroying it releases Wallshades.'),
    'W08': ('Bell-Bat', 'ASHLAR · Act II · Bell Catacombs', 'D2 bats; D1 Hellfire’s Crypt bats',
            'Large bat roosting in bell towers, its screech ringing like a cracked bell. Flies in swarms; the screech briefly stuns.'),
    'B08': ('The Pillar-Maker', 'ASHLAR · Act III · Garden of Pillars', 'Original',
            'Tall faceless figure in a salt-crusted vestment; touching it turns you to salt. Each pillar it makes becomes a trap, so the arena fills up. Line: "Hold still."'),
    'B09': ('The Chisel', 'ASHLAR · Act III · Old Salt Mine', 'Not in the seven families; level design proposal: a chalk line snaps across the floor before each cut as the telegraph',
            'Stone giant whose wings are flying buttresses and whose blade is a mason’s chisel; cuts away everything "out of true", including patches of the arena. On breaking it speaks Rule 6. Line: "A forced stone does not hold."'),
    'B10': ('Kathara, the White Fire', 'ASHLAR · Act III · Salt Cell', 'Original; level design: the shadow of Arsham is always visible at the centre',
            'Perfectly symmetric giant of salt-glass and colourless fire with Arsham at its heart. Blemish: hero hits leave cracks and the perfection shatters along them; it must be broken without killing the person inside. Line: "This is the part where you become beautiful."'),
    'D06': ('Hornclan — Salt-Clan', 'ASHLAR · Act III · Old Salt Mine', 'Goatmen, Khazra (D1–D4)',
            'Goat-headed miners with bone-white glaze and horns worn down by salt picks. Raiders and Slingers as D05; Chanters throw salt dust to blind.'),
    'F10': ('Salt Reaver', 'ASHLAR · Act III · White Road', 'D2 Sand Raiders',
            'Desert raider wrapped in salt-stiffened white cloth, face behind a glass mask. Hit and run with brine-poisoned knives.'),
    'F11': ('Salt-Dervish', 'ASHLAR · Act III · White Road', 'D3 Dune Dervishes',
            'Dancer of the Salt Synod, spinning with curved blades in a salt storm. Wide spinning attacks; hard to see inside the storm.'),
    'F12': ('White Watch soldier (+ elite)', 'ASHLAR · Act III · Undercity, Lye Baths; elite at the White Spire', 'Original',
            'Soldier in white lacquered armour with no bare skin and a glass face-plate. Disciplined spear ranks; raids the Undercity. The elite version has finer armour (not drawn yet).'),
    'F13': ('Lye Priest', 'ASHLAR · Act III · Undercity, Lye Baths, White Spire', 'Role of the dark cultist casters (D3)',
            'Robed priest with lye-burned hands and a white porcelain mask. Acid caster; "purifies" the hero by stripping buffs. The Bible lists it as a Kathara spawn.'),
    'P10': ('The Blanched', 'ASHLAR · Act III · Lye Baths, Garden of Pillars, Salt Cell', 'D4 Cannibals (behaviour only)',
            'Person scrubbed until no skin, hair or features remain: pinkish-white and wet-shiny. Fast, fragile, relentless; pounces; no ranged attacks.'),
    'P11': ('Brine Leech', 'ASHLAR · Act III · Lye Baths', 'Original',
            'Transparent leech living in the baths. Clings to the hero and dissolves armour.'),
    'P12': ('Salt Pillar (+ brine-wraith)', 'ASHLAR · Act III · Garden of Pillars, Salt Cell', 'Original; the wraith recalls D2 wraiths',
            'A sinner turned into a salt pillar. When the pillar cracks, a translucent brine figure weeps and spills out. The pillar is a trap that bursts when the hero passes; the wraith chases and chills. Level design: a pillar about to crack shows a glowing teal crack.'),
    'P13': ('Halcyon Glass-Folk', 'ASHLAR · Act III · Ship’s Heart', 'Original',
            'Smiling salt-glass statues of the people of Halcyon. Move in perfect sync and shatter into sharp pieces. A portent of the Perfect (X01).'),
    'P14': ('Halcyon Sentinel', 'ASHLAR · Act III · Ship’s Heart', 'Slightly like D4 Constructs',
            'Crystal guardian standing at an ancient altar. Slow, very heavy armour, attacks with beams.'),
    'P15': ('Crystal-Sworn', 'ASHLAR · Act III · White Spire, Salt Cell', 'Original',
            'Knight made of mirror-bright salt crystal. Reflects projectiles; must be cracked with heavy hits.'),
    'U13': ('Salted Dead', 'ASHLAR · Act III · Wreck Fields', 'D2 mummies',
            'Sailors of the dead sea wrapped in sailcloth and salt crust, with glassy salt eyes. Slow; exhale brine that suffocates.'),
    'U14': ('Brine-Embalmer', 'ASHLAR · Act III · Wreck Fields', 'D2 Greater Mummies',
            'Tall salt-embalming priest wrapped in cracked, stiff sailcloth. Raises fallen Salted Dead; sprays brine.'),
    'W09': ('Brine-Worm', 'ASHLAR · Act III · White Road', 'D2 Sand Maggots, Maggot Queens',
            'Giant pale salt worm with a round mouth of rings of glassy teeth. The mother lays a clutch in the salt, which hatches into small worms. Burrows and ambushes; spits brine. Two forms: mother and young.'),
    'W10': ('Salt-Kite', 'ASHLAR · Act III · White Road', 'D2 Carrion Birds; D3 Vultures',
            'Bleached vulture with salt crusted on its wings. Circles, then dives on wounded prey.'),
    'W11': ('Pillar-Crab', 'ASHLAR · Act III · White Road, Garden of Pillars', 'D2 Sand Leapers (ambush style; new silhouette)',
            'Giant hermit crab using a salted human figure as its shell. Leaps out to ambush; when the salt shell breaks, a brine-wraith (P12) escapes. Level design: no children in the salt pillars.'),
    'W12': ('Glass Wasp', 'ASHLAR · Act III · White Road, Old Salt Mine', 'D3 Sand Wasps',
            'Wasp of transparent salt-glass nesting in the hulls of stranded ships. Flies in stinging swarms.'),
    'W13': ('Coilborn (+ Coil-Seer)', 'ASHLAR · Act III · Wreck Fields, Ship’s Heart', 'D2 Claw Vipers, Serpent Magi; slightly like D4 Nangari (avoid the limbs-on-a-snake look)',
            'Eel-people left over when the sea died: smooth scales, fins, lidless eyes, hiding in ship holds. The Coil-Seer carries a coral staff. They constrict and bite; the Coil-Seer casts brine magic.'),
    'W14': ('Static Scarab', 'ASHLAR · Act III · Wreck Fields, Ship’s Heart', 'D2 Dung Soldiers, Scarab Demons',
            'Crystal-shelled beetle storing static charge. Discharges lightning when hit.'),
    'W15': ('Salt-Burrower', 'ASHLAR · Act III · Old Salt Mine', 'D3 Scavengers',
            'Blind burrowing beast with a shovel-shaped snout. Erupts from under the hero’s feet.'),
}
BOSS_KIND = {'B06': 'Mid-boss · Perfection-born (Devotion)', 'B07': 'Act boss · Perfection-born (Devotion)',
             'B08': 'Mid-boss · Perfection-born (Purity)', 'B09': 'Boss · Mason', 'B10': 'Act boss · Perfection-born (Purity)'}

# Notes per (id, variant) from the QA files of the picked passes (project notes, 2026-10-24).
QA_NOTES = {
    ('act-02', 'U06', 'A'): 'Size FAIL: helm top 1.28H vs the canon 1.10–1.20H. QA calls this pass (v5_r2) the best of three; the newest, v5_r3, is worse at 1.41H.',
    ('act-02', 'B06', 'B'): 'Size/view FAIL: the bottom-row H silhouette is drawn smaller than the top row, so the figures need rescaling (to about 182 px) before use; the right view is half profile.',
    ('act-02', 'B06', 'A'): 'QA PASS on scale (2.18–2.21H against 2.00–2.40H); the right view is half profile, half 3/4.',
    ('act-02', 'F04', 'B'): 'Size FAIL: kneeling top about 0.81H vs 0.65–0.78H (best of three passes).',
    ('act-02', 'F05', 'A'): 'Size FAIL: bell top about 1.05–1.07H and a squat body. QA calls this pass (v5_r2) the best of three; the newest, v5_r3, is no better.',
    ('act-02', 'F08', 'B'): 'Size FAIL: halo top about 1.05H vs 1.10–1.20H; an orange tab sits on the left in FRONT but on the right in BACK/RIGHT.',
    ('act-02', 'F07', 'B'): 'Minor FAIL: hat top about 1.00H; the lantern shows in LEFT but is hidden in RIGHT (side views swapped).',
    ('act-02', 'L01', 'A'): 'Near-pass: QA keeps concept_v5.png as the best; the 3/4 arch still reads as an L-shaped piece unlike the pointed arch of the prop cell.',
    ('act-02', 'L01', 'B'): 'Near-pass: QA keeps concept_v5.png as the best; the 3/4 arch still reads as an L-shaped piece unlike the pointed arch of the prop cell.',
    ('act-02', 'L02', 'A'): 'Near-pass: the body is still too short (about 0.95H long vs the 1.35H target).',
    ('act-02', 'W08', 'A'): 'Near-pass: the bat is still big (side body about 0.43H vs 0.27H) with long bird-like legs.',
    ('act-03', 'U14', 'A'): 'Size FAIL: hood tip about 1.29H vs 1.10–1.20H. QA calls this pass (r2) the best of three; the newest, r3, is 1.31H.',
    ('act-03', 'B08', 'B'): 'Size FAIL: about 1.57H vs the 2.00H target. QA calls this pass (r2) the best of three; the newest, r3, is 1.47H.',
    ('act-03', 'P11', 'A'): 'This pass (r3) was made by shrinking every figure to 0.48 by code (cut, scale and paste), not by redrawing; whether that is allowed under the "no drawing by code" rule is still open.',
    ('act-03', 'P11', 'B'): 'This pass (r3) was made by shrinking every figure to 0.48 by code (cut, scale and paste), not by redrawing; whether that is allowed under the "no drawing by code" rule is still open.',
    ('act-03', 'W14', 'B'): 'This pass (r4) was made by scaling every figure to 0.75 by code and erasing the model’s dashed guide lines, not by redrawing; whether that is allowed under the "no drawing by code" rule is still open.',
    ('act-03', 'W14', 'A'): 'Size caveat: about 0.69H long and 0.48H tall vs the 0.60H x 0.30H target; extra guide-line text drawn by the model.',
    ('act-03', 'D06', 'A'): 'Open canon question: drawn without the Discarded kiln glow, because Act III allows no red except blood.',
    ('act-03', 'D06', 'B'): 'Open canon question: drawn without the Discarded kiln glow (Act III allows no red except blood); the salt basket is an invented prop.',
    ('act-03', 'B09', 'A'): 'Invented props: the chisel-blade arm; the 3/4 grips the blade like a held sword.',
    ('act-03', 'B09', 'B'): 'Open canon question (project notes): the circle-and-cross mason mark against the no-crosses rule. The held chisel is an invented prop. Hood about 3.0H vs 2.50–2.80H.',
    ('act-03', 'B10', 'A'): 'Arsham is not visible from the BACK view; the level design asks for the shadow of Arsham at the centre.',
    ('act-03', 'P10', 'A'): 'Open canon question: "waxen, not gory" (level design) vs "pink-white and glistening" (Cast); drawn waxen with a soft sheen.',
    ('act-03', 'P10', 'B'): 'Open canon question: "waxen, not gory" (level design) vs "pink-white and glistening" (Cast).',
    ('act-03', 'F12', 'A'): 'The elite version is not drawn; crest top about 1.08H vs 1.025H.',
    ('act-03', 'F12', 'B'): 'The elite version is not drawn.',
    ('act-03', 'F13', 'A'): 'Invented prop: the cracked lye ewer on a chain.',
    ('act-03', 'W09', 'A'): 'Size caveat: the mother is drawn about 4.0H long vs the 5.5H target (long bodies keep coming out short).',
    ('act-03', 'W09', 'B'): 'Size caveat: about 3.75H long vs the 5.5H target.',
    ('act-03', 'W10', 'B'): 'Size caveat: standing height estimated (about 0.77H).',
    ('act-03', 'W11', 'A'): 'Length caveat: about 1.4H vs the 1.80H target.',
    ('act-03', 'W13', 'B'): 'Reads as eel-people standing on legs, tail footprint about 2.3H.',
    ('act-03', 'W15', 'A'): 'Length caveat: body about 1.2H vs the 1.60H target.',
    ('act-03', 'W15', 'B'): 'Length caveat: body about 1.0H plus tail vs the 1.60H target.',
}
ACT_NOTE = {
    'act-02': ('Act II', 'Redo of 2026-10-24 (v5: fresh generations with the Act I recipe; the older v1–v2 sheets failed the style check). '
               'Nothing in the Act II set is approved. Known size fails after three passes: U06 A, B06 B, F04 B, F05 A, F08 B, F07 B.'),
    'act-03': ('Act III', 'First pass of 2026-10-24 with the Act I recipe. Nothing in the Act III set is approved. Size fails after three passes: U14 A, B08 B. '
               'Open canon questions: D06 kiln glow, B09 cross-like mason mark, and P11 and W14 B rescaled by code.'),
}


def monster_variant_pick(act, mid, folder, variant):
    vdir = folder / f'v{variant}'
    override = MONSTER_PICK_OVERRIDES.get((act, mid, variant))
    if override:
        return vdir / override, True
    return newest_png(vdir), False


def monster_records(act, group, act_label, ids=None):
    out = []
    root = ART / act / 'monsters'
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith('_')):
        mid = folder.name.split('_')[0]
        if ids is not None and mid not in ids:
            continue
        name, location, base, desc = MONSTERS[mid]
        family = BOSS_KIND.get(mid) or FAMILY[mid[0]]
        images, picks, notes = [], [], []
        for variant in ('A', 'B'):
            path, overridden = monster_variant_pick(act, mid, folder, variant)
            if path is None:
                continue
            label = f'v{variant} · {pass_label(path.stem)}'
            if overridden:
                label += ' (QA best)'
            images.append(image(path, label))
            picks.append(rel(path))
            note = QA_NOTES.get((act, mid, variant))
            if note:
                notes.append(f'Variant {variant}: {note}')
        if not images:
            raise SystemExit(f'No concept images for {folder}')
        if act == 'act-01':
            art = ('Not approved: the project has no approved sheet for this monster yet (the 28 approved Act I sheets are in the first set). '
                   'Images are the newest pass of variant A and of variant B; earlier passes and the biped r3 passes are not shown. '
                   f'Source: {"; ".join(picks)}.')
            if mid == 'D03':
                art += ' The newest variant A pass (r4_1p4H) was drawn with a 1.4H size rule.'
        else:
            art = (f'Not approved: pending user review. {ACT_NOTE[act][1]} Images are the newest pass of variant A and of variant B '
                   f'(a pass is shown only when the QA notes do not name an older one as the best). Source: {"; ".join(picks)}.')
        if notes:
            art += ' QA: ' + ' '.join(notes)
        out.append(record(
            f'concept-ashlar-{mid.lower()}-{slug(name)}', name, group, 'Monster sheet', act_label, location,
            f'{desc} ({family}.)', art,
            tags(mid, act_label, 'monster', FAMILY[mid[0]], 'v5' if act == 'act-02' else None),
            images, base=f'{FAMILY[mid[0]]} family · {base}', layout=MONSTER_LAYOUT))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# heroes

HEROES = {  # code: (name, stranger, role, question, weapons, class item, armour, key colours, invariant, direction A, direction B)
    'PB': ('Pallbearer', 'Ser Aldwin Rook (~700 AL)', 'Heavy melee, defence', 'How long can you carry?',
           'Mace, hammer, axe, sword + shield; shouldering strike (two-handed)', 'Coffin lid (shield)', 'Heavy',
           'Pewter, pale weathered oak, mortar grey', 'Low heavy mass + narrow coffin-frame carrier behind the back + a readable coffin-lid shield',
           'Coffin-lid Knight', 'Bier-Bearer'),
    'FL': ('Flagellant', 'Sister Agathe of the Nails (880 AL)', 'Melee fighter, risk and recovery', 'How much of yourself do you give up?',
           'Chain whip (chain mace, chain); dagger', 'Hot iron', 'Light to medium',
           'Dark red-brown, linen', 'Narrow fast body + chain ring + sealed coal box at the left waist + ten-knot cord',
           'Penitent of the Long Road', 'Chain-Bearer'),
    'OS': ('Ossuarist', 'Mother Grist (360 AL)', 'Summoner and curses', 'How much do you borrow from the dead?',
           'Bone wand, sickle, dagger', 'Reliquary chest', 'Light',
           'Deep indigo, ink grey, light apron or felt', 'Dark mass at shoulders/head + one light mass + a reliquary chest in the left hand',
           "Wall's Midwife", 'Keeper of Debts'),
    'BR': ('Brinecaller', 'Hasmik of the Brine (840 AL)', 'Elemental caster, crowd control', 'What do you ask of the salt?',
           'Staff, wand', 'Sea-water vessel (flask)', 'Light',
           'Seaweed, grey-blue salt, sea grey', 'Grey-blue salt offset to the right on a dark seaweed ground',
           'Dead-sea Witch', 'Tide-flat Wader'),
    'EX': ('Exhumer', 'Ezra Mott (960 AL)', 'Ranged hunter, traps, light', 'How much do you reveal?',
           'Crossbow, grave spade', 'Hooded lantern', 'Medium: oilcloth coat, wide-brimmed hat',
           'Dark brown oilcloth, felt hat, linen scarf', 'Wide-brimmed hat + hooded lantern on the left + a long-bladed spade',
           'Hook-Lantern Hunter', 'Hip-Lantern Gravedigger'),
    'PS': ('Pyre-Singer', 'Velimira of the Last Fire (980 AL)', 'Song caster, support, smoke-shape', 'Who do you sing for?',
           'Pyre staff, staff', 'Ash veil (hat)', 'Light to medium: fur, wool',
           'Ash veil, soot, brown fur', 'Ash veil thrown back + a pyre staff',
           'Pyre Songstress', 'Singer of the Long Farewell'),
}
HERO_LAYOUT = ('v5 hero sheet (fewer textures): one large 3/4 view, four neutral views (FRONT, LEFT, RIGHT, BACK) and the weapon drawn '
               'separately; two design directions, A and B, per class.')


def hero_picks():
    """{ 'PB_A': Path } from the v5 selection table in ashlar/art/heroes/_review/v5/README_VI.md."""
    text = (ART / 'heroes' / '_review' / 'v5' / 'README_VI.md').read_text(encoding='utf-8')
    picks = {}
    for m in re.finditer(r'^\|\s*([A-Z]{2}_[AB])\s*\|\s*(v5b?)\s*\|\s*`([^`]+)`', text, re.M):
        picks[m.group(1)] = (REPO / 'ashlar' / m.group(3), m.group(2))
    if len(picks) != 12:
        raise SystemExit('Hero selection table not parsed: %d picks' % len(picks))
    return picks


def hero_records(group):
    out = []
    picks = hero_picks()
    heroes = ART / 'heroes'
    for code, (name, stranger, role, question, weapons, item, armour, colours, inv, dir_a, dir_b) in HEROES.items():
        folder = next(p for p in heroes.iterdir() if p.name.startswith(code + '_'))
        images = []
        for d, dname in (('A', dir_a), ('B', dir_b)):
            path, ver = picks[f'{code}_{d}']
            images.append(image(path, f'{d} · {dname} · {ver}'))
        out.append(record(
            f'concept-ashlar-hero-{code.lower()}-{slug(name)}', f'{code} {name}', group, 'Hero class sheet', 'Heroes',
            'ASHLAR · Heroes · six Vocations',
            f'{name} ({code}): {role}. Class question: "{question}" Stranger: {stranger}. Weapons: {weapons}. Class item: {item}. Armour: {armour}. '
            f'Direction A: {dir_a}. Direction B: {dir_b}.',
            'Not approved: two design directions per class (A and B), neither chosen yet. Images are the v5 selection (fewer textures) listed in '
            f'ashlar/art/heroes/_review/v5/README_VI.md, which equals the newest pass of each variant. Invariant across A and B: {inv}. '
            'Names of the stranger, directions and colours come from ashlar/docs/ASHLAR_HERO_CONCEPT_VI.md and are proposals there.',
            tags(code, 'hero', 'heroes', name, 'v5'), images, base=f'Hero class · stranger {stranger}', palette=f'{colours} (proposal)', layout=HERO_LAYOUT))
    # shared sheets
    shared = heroes / '_shared'
    out.append(record(
        'concept-ashlar-hero-choice-hands-keyart', 'Class-select key art: six hands', group, 'Key art', 'Heroes',
        'ASHLAR · Heroes · class select',
        'Six outstretched hands, one per class, reaching from a wall of skulls and bones toward a single candle. Used as the class-select key art.',
        'Not approved. Source: ' + rel(shared / 'choice_hands' / 'keyart.png') + '. The lab scene choiceHands is matched to this image.',
        tags('hero', 'heroes', 'class select', 'key art', 'hands'),
        [image(shared / 'choice_hands' / 'keyart.png', 'Key art')], layout='16:9 key art, no text.'))
    show_imgs, show_src = [], []
    for code in HEROES:
        files = [p for p in (shared / 'choice_hands').glob(f'showcase_{code}*.png') if real_png(p.name)]
        newest = max(files, key=lambda p: p.stat().st_mtime)
        show_imgs.append(image(newest, f'{code} · ' + (newest.stem.split('_')[-1] if newest.stem != f'showcase_{code}' else 'v1')))
        show_src.append(rel(newest))
    out.append(record(
        'concept-ashlar-hero-hand-showcase', 'Class-select hand showcase', group, 'Hero hands', 'Heroes',
        'ASHLAR · Heroes · class select',
        'The hand of each class turned palm up and lit by the candle, one image per class (BR, EX, FL, OS, PB, PS), shown when a class is picked.',
        'Not approved. The newest showcase pass per class: BR v2, EX v1, FL v3, OS v3, PB v3, PS v3. Earlier passes are not shown. Source: ' + '; '.join(show_src) + '.',
        tags('hero', 'heroes', 'class select', 'hands', 'showcase'), show_imgs, layout='16:9 close-up of one hand per image.'))
    out.append(record(
        'concept-ashlar-hero-prologue-lineup', 'Prologue line-up', group, 'Hero line-up', 'Prologue',
        'ASHLAR · Prologue · six strangers',
        'The six Prologue strangers in the shared starting stance next to the neutral H silhouette: PB, FL, OS, BR, EX, PS in brown hooded robes, each carrying a hint of the class item (coffin lid, chain, crook, jar, lantern and spade, torch).',
        'Not approved. Source: ' + rel(shared / 'prologue_lineup' / 'concept.png') + '.',
        tags('hero', 'heroes', 'prologue', 'line-up'),
        [image(shared / 'prologue_lineup' / 'concept.png', 'Line-up · first pass')], layout='Wide strip: H silhouette + six heroes with labels.'))
    td = newest_png(shared / 'topdown_B')
    td_imgs = [image(td, 'Direction B · ' + pass_label(td.stem))]
    td_a = newest_png(shared / 'topdown_A')
    if td_a:
        td_imgs.insert(0, image(td_a, 'Direction A · ' + pass_label(td_a.stem)))
    out.append(record(
        'concept-ashlar-hero-topdown-camera', 'Heroes as seen by the game camera', group, 'Hero line-up', 'Heroes',
        'ASHLAR · Heroes · game camera',
        'The six class designs of direction B drawn from the high game camera, each above its flat black silhouette, to test how the three identifying marks read from above.',
        'Not approved. Only direction B has an image (concept_v3.png); the direction A top-down sheet has no PNG yet. Source: ' + '; '.join(i['origin'] for i in td_imgs) + '.',
        tags('hero', 'heroes', 'top-down', 'silhouette'), td_imgs, layout='Wide strip: six heroes on top, six silhouettes below.'))
    ov = heroes / '_review' / 'v5' / 'overview_3q.png'
    out.append(record(
        'concept-ashlar-hero-v5-overview', 'Hero v5 overview (12 three-quarter views)', group, 'Hero overview', 'Heroes',
        'ASHLAR · Heroes · review',
        'The twelve 3/4 views cropped from the v5 hero sheets: direction A on the top row, direction B on the bottom row, for a side-by-side choice.',
        'Not approved. Source: ' + rel(ov) + '.',
        tags('hero', 'heroes', 'overview', 'v5'), [image(ov, 'Overview · 3/4 views')], layout='Two rows of six 3/4 views.'))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# NPCs

def npc_records(group):
    manifest = json.loads((ART / 'npcs' / 'manifest.json').read_text(encoding='utf-8'))
    out = []
    for n in manifest['npcs']:
        images = []
        for key in ('A', 'B'):
            path = ART / 'npcs' / n[key]
            images.append(image(path, f'{key} · ' + (pass_label(Path(n[key]).stem.replace(f'concept_{key}', 'concept')) or 'first pass')))
        caveats = ' '.join(n.get('caveats') or [])
        art = ('Not chosen: two costume proposals (A and B) selected for user review; neither is an approved game model or canon costume. '
               f'Source: {n["A"]}; {n["B"]} under ashlar/art/npcs/. ')
        if caveats:
            art += 'Notes: ' + caveats
        out.append(record(
            f'concept-ashlar-npc-{n["id"].lower()}-{slug(n["name"])}', f'{n["id"]} {n["name"]}', group, 'NPC costume proposals',
            f'Act {n["act"]}' if n['act'] in ('I', 'II', 'III', 'IV', 'V') else n['act'],
            f'ASHLAR · {n["group"]} · acts {n["acts"]}',
            f'{n["name"]}: {n["role"]}. Appears in acts {n["acts"]}. Two costume proposals, A and B.',
            art, tags(n['id'], 'npc', n['group']), images, base=f'NPC · {n["group"]}',
            layout='Character sheet with two proposals (A and B) of the same NPC.'))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# items

def item_records(group):
    out = []
    root = ART / 'items'
    templates = {}
    for f in (root / '_batches').glob('batch*/IT-*.template.json'):
        templates[f.name.split('_')[0]] = json.loads(f.read_text(encoding='utf-8'))
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and p.name.startswith('IT-')):
        iid = folder.name.split('_')[0]
        tpl = templates[iid]
        title = re.sub(r'^ASHLAR ITEMS — IT-\d+\s*', '', tpl['title']).strip()
        title = title_case(title)
        d2 = [p for p in folder.glob('sheet_d2*.png') if real_png(p.name)]
        old = [p for p in folder.glob('sheet_*.png') if real_png(p.name) and not p.name.startswith('sheet_d2')]
        if not d2:
            raise SystemExit(f'No D2 sheet in {folder}')
        d2n = max(d2, key=lambda p: p.stat().st_mtime)
        images = [image(d2n, f'D2 inventory view · {pass_label(d2n.stem)}')]
        if old:
            oldn = max(old, key=lambda p: p.stat().st_mtime)
            images.append(image(oldn, f'Older 3/4 view · {pass_label(oldn.stem)} (superseded)'))
        qa_files = sorted((folder / '_work').glob('qa_d2*.txt'), key=lambda p: p.stat().st_mtime)
        qa = qa_files[-1].read_text(encoding='utf-8').strip().replace('\n', ' ') if qa_files else ''
        qa = re.sub(r'\s+', ' ', qa)
        if len(qa) > 420:
            qa = qa[:417].rsplit(' ', 1)[0] + '…'
        items = '; '.join(f'{title_case(i["label"])} ({i["w"]}×{i["h"]})' for i in tpl['items'])
        art = (f'Not approved: pending user review. The first image is the chosen D2-style inventory view (grid footprints W×H); the second is the older diagonal 3/4 view '
               f'from before the grid was fixed. Source: {rel(d2n)}.')
        if qa:
            art += ' QA: ' + qa
        out.append(record(
            f'concept-ashlar-item-{iid.lower()}-{slug(title)}', f'{iid} · {title}', group, 'Item icon sheet', 'Items',
            'ASHLAR · Items · inventory and shop',
            f'Inventory icon sheet with {len(tpl["items"])} items on the Diablo II style grid (footprint in cells): {items}.',
            art, tags(iid, 'item', 'inventory', 'icons'), images, base='Item catalogue ashlar/docs/ASHLAR_ITEMS_VI.md',
            layout='Flat grey backdrop, numbered footprint boxes on a faint cell grid, each item drawn once, almost straight-on, light from the upper left.'))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# HUD

HUD = {
    'PC_A_footing_course': ('PC-A Footing Course', 'PC 16:9 mockup', 'Footing Course: a full-width stone wall at the bottom of the screen, inheriting the classic ARPG layout.', 'Pallbearer', 'Lychgate churchyard, drizzle', 'Act I red'),
    'PC_B_keystone_arch': ('PC-B Keystone Arch', 'PC 16:9 mockup', 'Keystone Arch: one stone arch at bottom centre; globe and vessel are its two feet, skills are the voussoirs, Doubt sits at the keystone.', 'Exhumer', 'The Night Fens at night, with light radius', 'Act I red'),
    'PC_C_quiet_stones': ('PC-C Quiet Stones', 'PC 16:9 mockup', 'Quiet Stones: minimal, small separate stone slabs hugging the corners, no bars; tested on the brightest background in the game.', 'Brinecaller', 'The White Road (Act III), noon sun', 'Act III–V red with white-gold threads'),
    'M_A_thumb_arch': ('M-A Thumb Arch', 'Mobile 19.5:9 mockup', 'Thumb Arch: the common mobile ARPG layout (joystick left, attack button and skill ring right) built as a stone arch around the thumb.', 'Pyre-Singer', "Rook's Weir, drizzle", 'Act I red'),
    'M_B_crest': ('M-B Crest', 'Mobile 19.5:9 mockup', 'Crest: globe and vessel gathered in a crest at the top left so both thumbs only operate; a contextual Rite of Laying button.', 'Flagellant', 'Lower slope of the Lychgate churchyard', 'Act I red + Wound'),
    'M_C_low_profile': ('M-C Low Profile', 'Mobile 19.5:9 mockup', 'Low Profile: 20% smaller and semi-transparent, for dark dungeons; a minimap without markers.', 'Ossuarist', 'Ossuary crypt under the Lychgate church', 'Act I red'),
    'KIT_1_globe_vessels': ('KIT-1 Globe and vessels', 'HUD kit sheet', 'Blood globe in four story states, the six class resource vessels and a grayscale check row.', 'All six classes', 'Flat backdrop', 'All four globe states'),
    'KIT_2_sockets_rarity': ('KIT-2 Sockets and rarity', 'HUD kit sheet', 'PC skill-slot states, mobile buttons, rarity frames drawn as masonry courses, and nameplates for normal, elite and boss.', '—', 'Flat backdrop', '—'),
}


def hud_records(group):
    out = []
    root = ART / 'hud'
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith('_')):
        name, role, idea, cls, scene, globe = HUD[folder.name]
        path = newest_png(folder)
        mockup = role.endswith('mockup')
        desc = idea + (f' Hero shown: {cls}. Scene: {scene}. Globe: {globe}.' if mockup else f' Classes: {cls}.')
        out.append(record(
            f'concept-ashlar-hud-{slug(name)}', name, group, role, 'HUD', 'ASHLAR · HUD · PC and mobile', desc,
            'Proposed under art direction v1, not approved (the QA section of ashlar/art/hud/README_VI.md was never filled in). '
            'Background scenes only illustrate the HUD in play; they are not the built Map 1, and the monsters shown use the Map 1 direction A that was never chosen. '
            f'Source: {rel(path)}.',
            tags(folder.name.split('_')[0], 'hud', 'ui', 'mobile' if role.startswith('Mobile') else 'pc' if role.startswith('PC') else 'kit'),
            [image(path, 'Mockup' if mockup else 'Sheet')], layout='Full-frame ' + role.lower() + '.'))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# Act I environments

BIO = {'01': 'Wetland and water village (Dolmoor)', '02': 'Poppy fields (Dolmoor)', '03': 'Flint village and churchyard (Lychgate)',
       '04': 'Ossuary and earth garden (Garden of Hush)', '05': 'Whitewashed hospice (Gentle House)', '06': 'Mine and spoil (Flint Delvings; chalk-and-flint variant)',
       '26': "Edda's dream (dream space)", '27': 'Cell Perfection (Mercy cell)'}


def biome_text(text):
    seen = []
    for code in re.findall(r'BIO-(\d+)', text):
        if code in BIO and BIO[code] not in seen:
            seen.append(BIO[code])
    return ' / '.join(seen) or 'cross-area'


def env_records(group):
    out = []
    batches = ART / 'act-01' / '_batches'
    groups, jobs = {}, {}
    for b in ('env_A01-A14', 'env_A15-A20', 'env_A21-A25'):
        m = json.loads((batches / b / 'manifest.json').read_text(encoding='utf-8'))
        for g in m['groups']:
            groups[g['id']] = g
        for j in m['jobs']:
            jobs[j['id']] = j
    env_root = ART / 'act-01' / 'environments'
    for folder in sorted(p for p in env_root.iterdir() if p.is_dir() and p.name.startswith('A')):
        gid = folder.name.split('_')[0]
        g = groups[gid]
        name = re.sub(r'^A\d+\s+', '', g['name'])
        name = title_case(name)
        picked = ENV_PICK_OVERRIDES.get((gid, 'turnaround'))
        turn = folder / picked if picked else newest_png(folder, 'turnaround')
        pers = newest_png(folder, 'perspective')
        pers_note = ''
        if pers is None:  # A01-A04: the perspective sheet lives in the legacy E0x folder named by the batch manifest
            pj = jobs[f'{gid}_perspective']['outputPath'].replace('E:/Diablo2/', '')
            pers = REPO / pj
            pers_note = f' The perspective sheet sits in the legacy folder {Path(pj).parent.name} (E-folders are the original names of A01–A04; their turnarounds are identical copies).'
        images = [image(pers, 'Perspective · ' + pass_label(pers.stem)), image(turn, 'Turnaround · ' + pass_label(turn.stem))]
        assets = [a['name'] for a in jobs[f'{gid}_perspective']['sizeSpec']['assets']]
        glbs = list((REPO / 'ashlar' / '3d' / 'act-01' / 'environments' / folder.name).rglob('*.glb')) if (REPO / 'ashlar' / '3d' / 'act-01' / 'environments' / folder.name).is_dir() else []
        built = f'Built into {len(glbs)} 3D kit GLB(s) (ashlar/3d/act-01/environments/{folder.name}).' if glbs else 'No 3D kit has been built from this group yet (ashlar/INDEX.md).'
        qa = ''
        for kind in ('perspective', 'turnaround'):
            q = (jobs[f'{gid}_{kind}'].get('qa') or {}).get('summary')
            if q:
                qa += f' QA {kind}: ' + (q if len(q) < 420 else q[:417].rsplit(' ', 1)[0] + '…')
        locations = '; '.join(g.get('baseMaps') or []) if g.get('baseMaps') else ''
        out.append(record(
            f'concept-ashlar-env-{gid.lower()}-{slug(name)}', f'{gid} · {name}', group, 'Environment sheets', 'Act I',
            f'ASHLAR · Act I · {biome_text(g["biome"])}' + (f' · base maps: {locations}' if locations else ''),
            f'Environment sheet pair for six assets: {", ".join(assets)}. Perspective sheet first, then the turnaround.',
            'Not formally approved in the book. ' + built + pers_note +
            ' Asset list, sizes and designs are proposals (art direction), not the final Act I layout. Images are the newest turnaround and perspective sheets of the folder'
            + ('; the turnaround is the selected v2 (the later v2e edit was the failed fourth try).' if gid == 'A19' else '.') + qa,
            tags(gid, 'act 1', 'environment', 'kit'), images, base=f'Biome {biome_text(g["biome"])}',
            layout='1536×1024 sheet: six numbered cells, an H human silhouette for scale in each; perspective view and four-view turnaround.'))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# Prologue

PROLOGUE = {
    '01-old-face': ('Old Face (Bone Alcove)', 'Six-cell perspective sheet of the Old Face: bone alcove, skull and bone wall modules and the two clasped hands of the Wall, with the legend BE KIND TO THEM.'),
    '02-lychgate': ('Lychgate', 'Six-cell perspective sheet of the Prologue Lychgate: gate block, trees, graves and the faceless saint statue.'),
    '03-vigil-draft': ('Vigil props (draft)', 'Draft sheet of the story props of the Prologue vigil: chair, coat with a large patch, ring and pipe.'),
    '04-ground-draft': ('Ground modules (draft)', 'Draft sheet of terrain modules: a Grave Mound before it opens and the open grave after. A module idea sheet, not a seamless texture.'),
}


def prologue_records(group):
    root = ART / 'prologue' / 'concepts-v1'
    qa = (root / 'QA-2026-10-21.txt').read_text(encoding='utf-8')
    fails = {
        '01-old-face': 'Skull and bone far too large against the H silhouette; the Bone Alcove, marked 2H, is almost 3H; the hands do not clasp; white and amber light spills onto the materials; too many angular facets.',
        '02-lychgate': 'Crosses on the church roof and a gravestone (forbidden); flint, tiles and leaves too detailed; mortsafe intact instead of bent from inside; numbered 07–12 instead of 1–6; the statue does not read as holding the arch.',
        '03-vigil-draft': 'Realistic cloth, wood and metal texture; chair and coat several times larger than the H silhouette; a 0.10H label on the ring that the brief does not ask for; numbered 13–18; inset views mixed in.',
        '04-ground-draft': 'A cross on the Grave Mound headstone; crumbs, gravel and moss add noise; the H silhouette carries a weapon and clothes; numbered 19–24.',
    }
    out = []
    for stem, (name, desc) in PROLOGUE.items():
        path = root / f'{stem}.png'
        out.append(record(
            f'concept-ashlar-prologue-{slug(stem)}', name, group, 'Environment perspective sheet', 'Prologue',
            'ASHLAR · Prologue · environments', desc,
            'Failed the 2026-10-21 re-check against art direction v2.0 (QA-2026-10-21.txt): all four sheets are marked NOT PASSED and must not be used as a style or scale reference for 3D. '
            f'Problems found: {fails[stem]} Redraw not done yet. Source: {rel(path)}.',
            tags('prologue', 'environment', 'qa failed'), [image(path, 'Perspective sheet · v1')],
            layout='Six-cell perspective sheet (numbering should be 1–6).', status='todo'))
    assert 'CẢ BỐN SHEET CHƯA ĐẠT' in qa
    return out


# ---------------------------------------------------------------------------------------------------------------------

GROUP_DEFS = [
    ('ashlar-act1-open', 'ashlar-act1-open', 'ASHLAR · Act I monsters (not approved)',
     'The two Act I monsters that have no approved sheet yet, W05 Corpse-Candle and D03 Kiln-Bull. Newest pass of variant A and of variant B.', {}),
    ('ashlar-act2-monsters', 'ashlar-act2-monsters', 'ASHLAR · Act II monsters (v5, not approved)',
     'All 23 Act II monsters, redone on 2026-10-24 with the Act I recipe (v5). Variant A and variant B each; nothing here is approved, and six sheets still fail the size check.', {}),
    ('ashlar-act3-monsters', 'ashlar-act3-monsters', 'ASHLAR · Act III monsters (first pass, not approved)',
     'All 23 Act III monsters, first pass of 2026-10-24. Variant A and variant B each; nothing here is approved. Open questions: kiln glow on D06, the mason mark of B09, code-rescaled P11 and W14 B.', {}),
    ('ashlar-heroes', 'ashlar-heroes', 'ASHLAR · Heroes (not approved)',
     'The six hero classes in two design directions each (v5), plus the shared sheets: class-select hands, Prologue line-up, game-camera view and the 3/4 overview.', {}),
    ('ashlar-npcs', 'ashlar-npcs', 'ASHLAR · NPCs (costume proposals, not chosen)',
     '51 NPCs with two costume proposals each (A and B), selected for user review. None is an approved model or canon costume.', {}),
    ('ashlar-items', 'ashlar-items', 'ASHLAR · Items & inventory icons',
     '19 inventory icon sheets on the Diablo II style grid (93 items in the catalogue), with the older 3/4 view where it exists. Pending user review.', {}),
    ('ashlar-hud', 'ashlar-hud', 'ASHLAR · HUD kits & mockups',
     'Eight HUD concepts (three PC and three mobile mockups, two kit sheets) from 2026-10-20. Proposed, not approved.', {}),
    ('ashlar-act1-env', 'ashlar-act1-env', 'ASHLAR · Act I environment sheets',
     'Perspective and turnaround sheets for the Act I environment groups A01–A25 (six assets each). Most were built into 3D kits but the sheets were never formally approved.', {}),
    ('ashlar-prologue', 'ashlar-prologue', 'ASHLAR · Prologue concepts',
     'Four Prologue environment sheets from the first pass; all four failed the 2026-10-21 QA and are not usable as references yet.', {}),
]


def build():
    groups = {
        'ashlar-act1-open': monster_records('act-01', 'ashlar-act1-open', 'Act I', ids={'W05', 'D03'}),
    }
    groups['ashlar-act1-open'].sort(key=lambda r: r['id'] != 'concept-ashlar-w05-corpse-candle')
    groups['ashlar-act2-monsters'] = monster_records('act-02', 'ashlar-act2-monsters', 'Act II')
    groups['ashlar-act3-monsters'] = monster_records('act-03', 'ashlar-act3-monsters', 'Act III')
    groups['ashlar-heroes'] = hero_records('ashlar-heroes')
    groups['ashlar-npcs'] = npc_records('ashlar-npcs')
    groups['ashlar-items'] = item_records('ashlar-items')
    groups['ashlar-hud'] = hud_records('ashlar-hud')
    groups['ashlar-act1-env'] = env_records('ashlar-act1-env')
    groups['ashlar-prologue'] = prologue_records('ashlar-prologue')
    return groups


def main():
    with open(MANIFEST, encoding='utf-8', newline='') as fh:
        data = json.load(fh)
    new = build()
    # groups: drop the old copies, insert right after ashlar-chot
    data['groups'] = [g for g in data['groups'] if g['id'] not in NEW_GROUPS]
    at = next(i for i, g in enumerate(data['groups']) if g['id'] == 'ashlar-chot') + 1
    defs = []
    for gid, dirname, name, desc, extra in GROUP_DEFS:
        g = {'id': gid, 'dir': dirname, 'world': 'ashlar', 'name': name, 'description': desc}
        g.update(extra)
        defs.append(g)
    data['groups'][at:at] = defs
    # records: drop the old copies, append at the end in group order
    data['records'] = [r for r in data['records'] if r['group'] not in NEW_GROUPS]
    ids = {r['id'] for r in data['records']}
    for gid in NEW_GROUPS:
        for r in new[gid]:
            assert r['id'] not in ids, r['id']
            ids.add(r['id'])
            data['records'].append(r)
    data['worlds'][0]['scope'] = 'Concept chốt (28 approved) + unapproved concepts'
    data['note'] = ("Curated list of the project 2D concept art shown in the Book of Cain: the ASHLAR 'Concept chốt' approved monsters (world ashlar), "
                    "the ASHLAR concepts not yet approved (world ashlar; generated by scripts/add_ashlar_unapproved.py) and the remaining D2RR-era concepts (world d2rr). "
                    "Paths are relative to the repository root. Run `python scripts/import_concepts.py` after editing; it writes assets/concepts/ and src/data/concepts.json.")
    out = json.dumps(data, ensure_ascii=False, indent=1).replace('\n', '\r\n') + '\r\n'
    with open(MANIFEST, 'w', encoding='utf-8', newline='') as fh:
        fh.write(out)
    for gid in NEW_GROUPS:
        print(f'{gid:22s} {len(new[gid]):3d} records {sum(len(r["images"]) for r in new[gid]):3d} images')
    print(f'{len(data["records"])} records in total')


if __name__ == '__main__':
    main()

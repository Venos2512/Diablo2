# Multiverse enemy inventory

Reviewed 16 October 2026. The library has 215 creature records (34 Diablo II + 181 cross-game), 157 Diablo II item references and 8 NPC records: 380 records overall.

| Game | Scope | Previous | Current | Added |
| --- | --- | ---: | ---: | ---: |
| Grim Dawn | Act I, including optional areas | 12 | 90 | 78 |
| Titan Quest | Greece / Act I; difficulty conditions labeled | 12 | 33 | 21 |
| Torchlight | 7 Orden Mines entries + 27 game-wide category entries | 34 | 34 | 0 |
| Dungeon Siege | Chapter I index; campaign uncertainty noted for Phrak Ballista | 18 | 24 | 6 |

These are research records, not a count of distinct meshes, rigs or animation sets. Family-level references, named variants and bosses coexist. Difficulty-dependent spawns have not been exhaustively audited. The Torchlight category remains game-wide.

## Sources and boundaries

- **Grim Dawn:** area lists from [Burrwitch Village](https://grimdawn.fandom.com/wiki/Burrwitch_Village), [Burrwitch Outskirts](https://grimdawn.fandom.com/wiki/Burrwitch_Outskirts), [Lower Crossing](https://grimdawn.fandom.com/wiki/Lower_Crossing), [River Passage](https://grimdawn.fandom.com/wiki/River_Passage), [The Flooded Passage](https://grimdawn.fandom.com/wiki/The_Flooded_Passage), [Hidden Laboratory](https://grimdawn.fandom.com/wiki/Hidden_Laboratory), [Ominous Lair](https://grimdawn.fandom.com/wiki/Ominous_Lair) and [Depraved Sanctuary](https://grimdawn.fandom.com/wiki/Depraved_Sanctuary). Named encounters follow the [Act I boss index](https://grimdawn.fandom.com/wiki/Creatures). Optional zones can have access or level requirements; their inclusion does not imply an early-level encounter. Region lists can include variants from multiple difficulties.
- **Titan Quest:** the [Greece category](https://titanquest.fandom.com/wiki/Category:Monster_(Greece)) adds missing family references. [Boss locations](https://titanquest.fandom.com/wiki/Majestic_Chest) support Arachne, Alastor, Talos and Lernean Hydra. Talos requires Epic or Legendary; Hydra is Legendary only. [Helos Woods](https://titanquest.fandom.com/wiki/Helos_Woods) supports the Dark Satyr Shaman. Anniversary Edition-exclusive Boar Snatcher is not mixed into the original-game set.
- **Dungeon Siege:** the [chapter table](https://dungeonsiege.fandom.com/wiki/Enemies_(Dungeon_Siege)) combines Ehb and Utraean locations. Named Ehb encounters were checked against [Klandank](https://dungeonsiege.fandom.com/wiki/Klandank_the_Krug), [unique drops](https://dungeonsiege.fandom.com/wiki/Unique_drop), [the walkthrough](https://www.walkthroughking.com/text/dungeonsiege.aspx) and [the tower encounter](https://fliphtml5.com/gjox/bovx/Dungeon_Siege_1_-_CustomWalkthrough/). Phrak Ballista remains explicitly marked as a chapter-index entry with unconfirmed Ehb placement; the independently documented location is [Iliarth Divide](https://dungeonsiege.fandom.com/wiki/Iliarth_Divide), on the Utraean Peninsula.
- **Torchlight:** [Orden Mines](https://torchlight.fandom.com/wiki/Orden_Mines) and [Monsters (T1)](https://torchlight.fandom.com/wiki/Category:Monsters_(T1)). Category umbrellas and files are not distinct enemy records.

## Image coverage

179 of 181 cross-game records have embedded image references: 144 exact-name/category wiki references, 4 official-manual crops and 31 labeled family references. The latest image pass resolves 111 of the 113 previously missing records: 94 exact and 17 family references. Each imported source was visually checked. Overall the databook has 374 illustrated records.

The remaining two are Torchlight I Cursed Sword and Dungeon Siege Bear. The Cursed Sword page offers an image in its Torchlight II section, which was rejected for this Torchlight I catalog. The Dungeon Siege Bear page requests a missing character image. These gaps are kept visible instead of filling them with another game's creature.

Family references identify the depicted monster and do not confirm the exact variant, clan equipment, color or effects. The six Snake Clan entries share the wiki's Groble genus illustration; it is not an exact Snake Clan or caster portrait. Titan Quest category entries can use wiki montages of variants.

Image sources and filenames are in `assets/MULTIVERSE_IMAGE_SOURCES.json`. Source images belong to their respective rights holders. Missing references stay empty rather than using unrelated art. No extracted model, verified animation or numeric combat-stat inventory is supplied.

## Art production notes and corrections

All cross-game records now have editorial art checklists and suggested motion states. These are planning prompts, not evidence of shipped clips. The two Warden stages are documented as an encounter note. Dungeon Siege's Krug Apprentice is corrected to a caster/resurrection role; Krug Scout is melee; Phrak Piercer is ranged; Alpha Wolf and Ruby Gargoyle are marked as unique encounters. The research-source link is shown independently of the image source, including on records without an image.

## Modules

- `src/data/research-additions.json`: 105 additions with game, family, location, source, encounter condition and review date.
- `src/data/enemy-art-profiles.js`: editorial art and motion prompts by family.
- `src/data/multiverse.js`: stable IDs, merging and existing records.
- `scripts/expand_opening_enemies.py`: regenerates the researched additions only.
- `scripts/research_wiki_images.py`: collects image candidates for review; it does not automatically publish candidates.

The pre-existing `complete_wiki_images.py` is a legacy one-time import. Do not rerun it over the current image map: it predates the new provenance classifications.


## Reproducible image import

`assets/WIKI_IMAGE_PASS_REPORT.json` records the starting 113 gaps, 111 resolutions and two unresolved records. `assets/wiki-pass-*/approved.json` and the Grim Dawn `approved-extra.json` preserve reviewed manifests; candidate files are not automatically promoted. Run `scripts/import_reviewed_wiki_images.py` with those manifest paths to embed approved files. The importer validates file paths and image decoding and preserves existing illustrated records. Review notes and source URLs remain in `assets/MULTIVERSE_IMAGE_SOURCES.json`.

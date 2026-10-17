# Act I item art inventory

The databook has 157 item records in seven browsing groups: Quest & special (3), Potions (18), Weapons (61), Armor & equipment (38), Gems & runes (28), Scrolls & supplies (7), and Jewelry (2). The 99 weapon and armor records use Blizzard's Normal base-item tables and an editorial Quality Level cutoff of 18. That cutoff makes the art list manageable; it does not establish where an item drops or is sold. Drop eligibility depends on area, difficulty, character level, edition and other game rules. This is an art inventory, not a complete loot table.

The 18 potion references include healing, mana, rejuvenation, utility and early throwing potions. Socketables cover 21 Chipped/Flawed/standard gems and El through Tal runes. The rune system and some class-specific bases are Lord of Destruction-era content; those records carry edition labels. The accessory records show one representative ring and amulet icon each, not every appearance or affix. Unique, set, magical, rare and crafted rolls are outside the current catalog.

153 item records have embedded source images. Wirt's Leg, Key, Arrows and Bolts have no verified linked icon. Tree of Inifuss Bark and Horadric Malus use quest-page illustrations rather than verified inventory icons. Every item has a source link in the record; image file and origin metadata are in `assets/ITEM_SOURCES.json`.

Sources: [Blizzard normal gear](https://classic.battle.net/diablo2exp/items/weaponsandarmor.shtml), [gems](https://classic.battle.net/diablo2exp/items/gems.shtml), [runes](https://classic.battle.net/diablo2exp/items/runes.shtml), [potions](https://classic.battle.net/diablo2exp/items/potions.shtml), [rings and amulets](https://classic.battle.net/diablo2exp/items/ringsnamulets.shtml), [Act I quests](https://classic.battle.net/diablo2exp/quests/act1.shtml).

Regenerate the Normal base set and miscellaneous references with `scripts/fetch_early_gear.py` and `scripts/fetch_misc_items.py`, then run the build and checks. The resulting JSON is committed for reproducibility; network retrieval is only required when deliberately refreshing references.

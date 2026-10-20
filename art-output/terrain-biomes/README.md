# Act I biome terrain tiles (Codex image generation)

Generated 2026-10-19 with `codex exec --enable image_generation`, style refs `art-direction/reference/terrain-moor/grass_a.png` + `dirt_dry.png`.
Palettes follow the Act I colour script (art-direction Ch.11 §10). Each biome has three tiles matching the lab's splat layers:
`dirt` = base ground, `mud` = wet ground (puddles), `grass` = cover.

| Biome | dirt (base) | mud (wet) | grass (cover) |
|---|---|---|---|
| cold_plains | cold packed soil, pebbles | cold mud, blue-grey puddles | short frost-dried grass |
| burial_grounds | dark grave soil, dead leaves | black waterlogged mud | dead blue-grey grass |
| stony_field | gravel + flat stones | wet muddy gravel | dry grass between stones |
| tristram | ash + charcoal | sooty ash mud | scorched grass |
| dark_wood | loam, needles, roots | mossy forest mud | moss + shade grass |
| black_marsh | peat, dead reeds | sludge + standing water | wet marsh grass, reeds |
| tamoe_highland | stony soil, slate, lichen | wet slate scree | wiry grass + heather |
| monastery_courtyard | flagstone paving | wet paving, puddles | overgrown paving |
| cave | packed earth + rock | wet clay, puddles | gravel scree, fungus |
| catacombs | stone tile floor | blood-stained floor | rubble, dust, bone bits |

- Prompts: `make_tasks.py` (run `run_all.sh` to regenerate; `run_one.sh <biome>` retries once in a fresh session).
- `process.py` → `<biome>/seamless/<layer>.png` + `-h.png` (1024 px): seam fix by periodic + smooth decomposition (not the half-shift cross-fade, which printed a square ring into every repeat), light flattened on a wrapped copy; `biomes_contact.png` (2 × 2 repeats).
- Lab anti-tiling: the biome sets turn on `rotate` (quarter-turn variants) and `variationScale: 0.3` in TERRAIN_SETS (terrain.glsl + its TSL twin; other sets keep the old behaviour).
- In the lab: `lookdev-lab/scripts/prepare-terrain-biomes.py` → `assets/samples/biome-*.webp`; Terrain scene → Texture set → "Act I · …".
- `biomes_ingame.png` / `_ingame/`: the 10 sets on the Moor terrain scene (WebGL2).

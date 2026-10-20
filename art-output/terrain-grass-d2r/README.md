# D2R lush grass tiles (Codex image generation)

Generated 2026-10-19 with `codex exec --enable image_generation`, reference `_refs/ref_d2r_grass.png` (D2R gameplay screenshot from the user).
Prompts in `make_tasks.py` (3 sessions × 3 tiles, `run_one.sh partN` retries once in a fresh session).

| File | Use |
|---|---|
| grass_lush / grass_deep / grass_sunlit / grass_short / grass_wild / grass_mossy | grass patterns, mixed into one tile |
| grass_dirt + soil | dirt layer (sparse tufts + bare soil) |
| damp | mud layer (wet ground, small puddles) |

In the lab: `lookdev-lab/scripts/prepare-terrain-meadow.py` → `assets/samples/terrain4-*.webp`; Terrain scene → Texture set →
"D2R lush grass (natural mix)". Grass = six patterns × four quarter turns, mixed by sharp tileable-noise patches into a 7 m tile,
colours pulled 70 % toward a common mean (large light/dark variation comes from the shader's non-repeating macro noise).
`grass_mix_tile.png` = the mixed tile, `_grass_mix_3x3.png` = it repeated 3 × 3, `grass_compare.png` = in-game vs the reference.

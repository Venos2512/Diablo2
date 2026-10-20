#!/bin/bash
# Generate one biome's three ground tiles with Codex CLI; retry once in a fresh session if a tile is missing.
b="$1"
T=/e/Diablo2/art-output/terrain-biomes
R=/e/Diablo2/art-direction/reference/terrain-moor
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' -i "$R/grass_a.png" -i "$R/dirt_dry.png" \
		-o "$T/$b.result$attempt.txt" - < "$T/$b.task.txt" > "$T/$b.log$attempt" 2>&1
	[ -f "$T/$b/dirt.png" ] && [ -f "$T/$b/mud.png" ] && [ -f "$T/$b/grass.png" ] && break
done
echo "$b attempt=$attempt png=$(ls "$T/$b/"*.png 2>/dev/null | wc -l)"

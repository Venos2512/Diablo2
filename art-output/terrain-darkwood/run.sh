#!/bin/bash
# Run one Codex CLI image task; retry once in a fresh session if an expected PNG is missing.
# usage: run.sh <task> <expected png...>
t="$1"; shift
D=/e/Diablo2/art-output/terrain-darkwood
R=/e/Diablo2/art-direction/reference/terrain-moor
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' \
		-i "$D/ref/darkwood_ground.png" -i "$D/ref/darkwood_roots_grass.png" -i "$R/grass_a.png" -i "$R/dirt_dry.png" \
		-o "$D/$t.result$attempt.txt" - < "$D/$t.task.txt" > "$D/$t.log$attempt" 2>&1
	ok=1; for f in "$@"; do [ -f "$D/$f" ] || ok=0; done
	[ $ok = 1 ] && break
done
echo "$t attempt=$attempt ok=$ok"

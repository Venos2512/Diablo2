#!/bin/bash
# Generate one task's three grass tiles with Codex CLI; retry once in a fresh session if its tiles are missing.
n="$1"
T=/e/Diablo2/legacy/art-output/terrain-grass-d2r
cd /e/Diablo2
want=$(grep -o "save as [^ ]*\.png" "$T/$n.task.txt" | sed 's/save as //; s#E:/Diablo2#/e/Diablo2#')
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' -i "$T/_refs/ref_d2r_grass.png" \
		-o "$T/$n.result$attempt.txt" - < "$T/$n.task.txt" > "$T/$n.log$attempt" 2>&1
	ok=1; for f in $want; do [ -f "$f" ] || ok=0; done
	[ $ok = 1 ] && break
done
echo "$n attempt=$attempt ok=$ok"

#!/bin/bash
# Stylized repaint: one Codex task with mood refs + the previous realistic images; retry once in a fresh session.
# usage: run_sty.sh <task> "<extra -i refs>" <expected png...>
t="$1"; refs="$2"; shift 2
D=/e/Diablo2/ashlar/art/terrain-dark-wood
cd /e/Diablo2
for attempt in 1 2; do
	codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' \
		-i "$D/ref/darkwood_ground.png" -i "$D/ref/darkwood_roots_grass.png" $refs \
		-o "$D/$t.result$attempt.txt" - < "$D/$t.task.txt" > "$D/$t.log$attempt" 2>&1
	ok=1; for f in "$@"; do [ -f "$D/$f" ] || ok=0; done
	[ $ok = 1 ] && break
done
echo "$t attempt=$attempt ok=$ok"

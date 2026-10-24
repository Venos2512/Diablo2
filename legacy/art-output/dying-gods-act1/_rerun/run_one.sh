#!/bin/bash
# Re-run one monster after the 01:55 Codex auth failure: pipe its own task file into codex exec.
d="$1"; root=/e/Diablo2/legacy/art-output/dying-gods-act1
task="$root/$d/rerun-task.txt"
cd /e/Diablo2
codex exec --enable image_generation -s workspace-write -C 'E:\Diablo2' -o "$root/$d/cli-result-rerun.txt" - < "$task" > "$root/_rerun/$d.log" 2>&1
echo "$d exit=$? png=$(ls $root/$d/*.png 2>/dev/null | wc -l)"

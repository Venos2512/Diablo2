#!/bin/bash
# usage: gen.sh <stem> <ref.png> [<ref2.png> ...]   (reads _tasks/<stem>.task.txt, logs _tasks/<stem>.log)
# Fresh `codex exec` image session like E:\map01-batch\map01_batch.py (CODEX_HOME on E: because C: is full).
cd "$(dirname "$0")"
stem="$1"; shift
args=()
for r in "$@"; do args+=(-i "$r"); done
CODEX_HOME='E:/map01-batch/home' node "$APPDATA/npm/node_modules/@openai/codex/bin/codex.js" exec --enable image_generation \
  -m gpt-6-astra -s workspace-write -C 'E:\Diablo2' "${args[@]}" -o "$stem.result.txt" - < "$stem.task.txt" > "$stem.log" 2>&1
echo "rc=$?" >> "$stem.log"

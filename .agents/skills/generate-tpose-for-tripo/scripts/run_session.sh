#!/bin/bash
# Launch ONE fresh Codex (Astra) session that runs the generate-tpose-for-tripo skill on an asset folder.
# Usage: run_session.sh <asset_dir>      e.g. 'E:\Diablo2\art-output\tripo-models\monsters\D01_hodling'
# Needs <asset_dir>\concept.png. CODEX_HOME is on E: because C: is full (every image session writes ~8 MB).
# Log: <asset_dir>\_tasks\skill_session.log ; Astra's final reply: <asset_dir>\_tasks\skill_session.result.txt
ASSET="$1"
[ -n "$ASSET" ] || { echo "usage: run_session.sh <asset_dir>"; exit 2; }
A=$(cygpath -u "$ASSET")
[ -f "$A/concept.png" ] || { echo "missing $ASSET\\concept.png"; exit 2; }
mkdir -p "$A/_tasks"
SK='E:\Diablo2\.agents\skills\generate-tpose-for-tripo'
PROMPT="Use the generate-tpose-for-tripo skill. Read $SK\\SKILL.md first and follow it exactly. Asset folder: $ASSET (concept: $ASSET\\concept.png). Do all steps 1-5 in this one session: write design.txt, generate and QA sheet 1 and sheet 2 with your built-in image_gen, split into views/front.png back.png left.png right.png, write tpose.log, then reply with the report."
CODEX_HOME="${CODEX_HOME:-E:/map01-batch/home}" node "$APPDATA/npm/node_modules/@openai/codex/bin/codex.js" exec \
  --enable image_generation -m gpt-6-astra -s workspace-write -C 'E:\Diablo2' \
  -i "$ASSET\\concept.png" -o "$A/_tasks/skill_session.result.txt" - <<<"$PROMPT" > "$A/_tasks/skill_session.log" 2>&1
echo "rc=$?" >> "$A/_tasks/skill_session.log"

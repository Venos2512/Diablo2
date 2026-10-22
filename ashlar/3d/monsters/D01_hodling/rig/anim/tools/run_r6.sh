#!/usr/bin/env bash
# Reproduce R6 build + R7 numerical QA (no rig rebuild; the G2 source is only read).  Usage: bash run_r6.sh <out.blend> [qa.json]
# All temp files stay on E: (C: may be full on this machine).
set -e
cd "$(dirname "$0")/.."
ANIM="$(pwd -W 2>/dev/null || pwd)"
RIG="$ANIM/.."
BL="${BLENDER_EXE:-E:/SteamLibrary/steamapps/common/Blender/blender.exe}"
OUT="${1:-$ANIM/_work/test_all.blend}"
QA="${2:-$ANIM/_work/qa_test.json}"
mkdir -p "$ANIM/_work/tmp"
export TEMP="$ANIM/_work/tmp" TMP="$ANIM/_work/tmp"
G2="$RIG/_snapshots/g2_approved/D01_hodling_rig_g2.blend"
"$BL" -b --factory-startup "$G2" -P "$ANIM/tools/r6_run.py" -- --out "$OUT" > "$ANIM/_work/run_all.log" 2>&1
grep "\[r6\]\|Error\|Traceback" "$ANIM/_work/run_all.log" | tail -30
"$BL" -b --factory-startup "$OUT" -P "$ANIM/tools/r7_qa.py" -- --out "$QA" --g2 "$G2" --loin "${LOIN:-0}" > "$ANIM/_work/qa.log" 2>&1
grep "\[r7\]\|Error\|Traceback" "$ANIM/_work/qa.log" | tail -20

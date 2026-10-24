#!/usr/bin/env bash
# Evidence for the CURRENT rig/D01_hodling_rig_anim.blend: reopened-file probe, real GUI Play session, strips, GIFs, review GLB, hashes.
# Usage: bash run_evidence.sh            (after run_r6.sh produced the .blend and qa/r7_metrics.json)
set -e
cd "$(dirname "$0")/.."
ANIM="$(pwd -W 2>/dev/null || pwd)"
RIG="$ANIM/.."
BL="${BLENDER_EXE:-E:/SteamLibrary/steamapps/common/Blender/blender.exe}"
SRC="$RIG/D01_hodling_rig_anim.blend"
mkdir -p "$ANIM/_work/tmp" "$ANIM/qa/gui" "$ANIM/qa/previews" "$ANIM/checks"
export TEMP="$ANIM/_work/tmp" TMP="$ANIM/_work/tmp"
rm -rf "$ANIM/_work/fr_strip" "$ANIM/_work/fr_all"
"$BL" -b --factory-startup "$SRC" -P "$ANIM/tools/viewport_probe.py" -- --out "$ANIM/qa/viewport_probe_reopened.json" > "$ANIM/_work/probe.log" 2>&1
timeout 150 "$BL" --factory-startup --window-geometry 4200 200 1100 760 "$SRC" --python "$ANIM/tools/gui_play_test.py" -- --out "$ANIM/qa/gui" > "$ANIM/_work/gui.log" 2>&1 || true
"$BL" -b --factory-startup "$SRC" -P "$ANIM/tools/qa_render.py" -- --out "$ANIM/_work/fr_strip" --views game,side --mode strip --n 10 --res 360 > "$ANIM/_work/qr1.log" 2>&1
"$BL" -b --factory-startup "$SRC" -P "$ANIM/tools/qa_render.py" -- --out "$ANIM/_work/fr_all" --views game,side --mode all --res 300 > "$ANIM/_work/qr2.log" 2>&1
"$BL" -b --factory-startup "$SRC" -P "$ANIM/tools/bake_review_glb.py" -- --out "$ANIM/checks/D01_hodling_anim_review_UNAPPROVED.glb" > "$ANIM/_work/bake.log" 2>&1
for c in idle walk run attack hit death; do
  python -I "$ANIM/tools/qa_compose.py" strip "$ANIM/_work/fr_strip" "$RIG/qa" $c 24 - game,side > /dev/null
  python -I "$ANIM/tools/qa_compose.py" gifpair "$ANIM/_work/fr_all" "$ANIM/qa/previews/R7_${c}_preview.gif" $c 24 > /dev/null
done
python -I "$ANIM/tools/glb_anims.py" "$ANIM/checks/D01_hodling_anim_review_UNAPPROVED.glb"
sha256sum "$SRC" "$ANIM/checks/D01_hodling_anim_review_UNAPPROVED.glb"
grep "\[gui\] done" "$ANIM/_work/gui.log" || echo "GUI session did not finish"

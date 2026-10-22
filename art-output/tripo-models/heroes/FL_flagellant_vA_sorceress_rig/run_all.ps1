# Reproduce the whole rig transfer + validation + QA renders (Windows / PowerShell). Inputs are only read.
param(
  [switch]$KeepRaw,
  [string]$Blender = 'E:\SteamLibrary\steamapps\common\Blender\blender.exe',
  [string]$Out = $PSScriptRoot
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$qa = Join-Path $Out 'qa'
New-Item -ItemType Directory -Force $qa | Out-Null
$glb = Join-Path $Out 'FL_flagellant_vA_sorceress_rig.glb'
$blend = Join-Path $Out 'FL_flagellant_vA_sorceress_rig.blend'
& $Blender -b --factory-startup -P "$here\build_rig.py" -- --out $Out
& $Blender -b --factory-startup -P "$here\validate_rig.py" -- --out $Out
$raw = Join-Path $qa '_raw'
New-Item -ItemType Directory -Force $raw | Out-Null
& $Blender -b --factory-startup -P "$here\qa_overlay.py" -- $glb "$raw\skeleton" front side back
$env:QA_VIEWS = 'front,side,q34'
& $Blender -b --factory-startup -P "$here\qa_poses.py" -- $glb "$raw\poses"
$env:QA_VIEWS = 'upperfront,upper34,legs34,legsfront'
& $Blender -b --factory-startup -P "$here\qa_poses.py" -- $glb "$raw\poses"
Remove-Item Env:QA_VIEWS
& $Blender -b --factory-startup -P "$here\qa_weights.py" -- $glb "$raw\weights"
& $Blender -b --factory-startup -P "$here\qa_clip_strip.py" -- $blend "$raw\clips"
python -I "$here\make_sheets.py" $qa
if (-not $KeepRaw) { Remove-Item -Recurse -Force $raw }

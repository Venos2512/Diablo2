# Reproduce the whole rig transfer + validation + QA renders (Windows / PowerShell). Inputs (-Src, -Tgt) are only read.
# Defaults resolve inside the asset package:  <asset>/rig/scripts/run_all.ps1
#   -Src    <asset>/rig/refs/d2r-sorceress.glb   (internal lookdev reference, Blizzard asset, not for release)
#   -Tgt    <asset>/FL_flagellant_vA.glb         (original Tripo GLB, never modified)
#   -RigDir <asset>/rig                          (blend, validation.json, mapping_and_validation.json, qa/)
#   -Glb    <asset>/FL_flagellant_vA_rig.glb     (rigged GLB)
# For a scratch rebuild that leaves the package untouched: -RigDir E:\scratch\rig -Glb E:\scratch\FL_flagellant_vA_rig.glb
param(
  [switch]$KeepRaw,
  [string]$Blender = 'E:\SteamLibrary\steamapps\common\Blender\blender.exe',
  [string]$RigDir = (Split-Path -Parent $PSScriptRoot),
  [string]$Src = '',
  [string]$Tgt = '',
  [string]$Glb = ''
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$pkgRig = Split-Path -Parent $PSScriptRoot
$asset = Split-Path -Parent $pkgRig
if (-not $Src) { $Src = Join-Path $pkgRig 'refs\d2r-sorceress.glb' }
if (-not $Tgt) { $Tgt = Join-Path $asset 'FL_flagellant_vA.glb' }
if (-not $Glb) { $Glb = Join-Path (Split-Path -Parent $RigDir) 'FL_flagellant_vA_rig.glb' }
foreach ($p in @($Src, $Tgt, $Blender)) { if (-not (Test-Path -LiteralPath $p)) { throw "missing input: $p" } }
New-Item -ItemType Directory -Force $RigDir | Out-Null
$qa = Join-Path $RigDir 'qa'
New-Item -ItemType Directory -Force $qa | Out-Null
$blend = Join-Path $RigDir 'FL_flagellant_vA_rig.blend'
& $Blender -b --factory-startup -P "$here\build_rig.py" -- --out $RigDir --src $Src --tgt $Tgt --glb $Glb
if ($LASTEXITCODE) { throw "build_rig failed" }
& $Blender -b --factory-startup -P "$here\validate_rig.py" -- --out $RigDir --src $Src --tgt $Tgt --glb $Glb
if ($LASTEXITCODE) { throw "validate_rig failed" }
$raw = Join-Path $qa '_raw'
New-Item -ItemType Directory -Force $raw | Out-Null
& $Blender -b --factory-startup -P "$here\qa_overlay.py" -- $Glb "$raw\skeleton" front side back
$env:QA_VIEWS = 'front,side,q34'
& $Blender -b --factory-startup -P "$here\qa_poses.py" -- $Glb "$raw\poses"
$env:QA_VIEWS = 'upperfront,upper34,legs34,legsfront'
& $Blender -b --factory-startup -P "$here\qa_poses.py" -- $Glb "$raw\poses"
Remove-Item Env:QA_VIEWS
& $Blender -b --factory-startup -P "$here\qa_weights.py" -- $Glb "$raw\weights"
& $Blender -b --factory-startup -P "$here\qa_clip_strip.py" -- $blend "$raw\clips"
python -I "$here\make_sheets.py" $qa
if (-not $KeepRaw) { Remove-Item -Recurse -Force $raw }

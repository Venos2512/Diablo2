# Chay toan bo chuoi R2-R5 cho D01_hodling (dung lai tu GLB goc). Dung:  powershell -File run_all.ps1 [-Tag v3] [-SkipQA]
# Can: Blender 5.2.x (mac dinh E:\SteamLibrary\steamapps\common\Blender\blender.exe), python 3.10 co numpy + Pillow (chi buoc ghep anh).
param(
  [string]$Blender = "E:\SteamLibrary\steamapps\common\Blender\blender.exe",
  [string]$Tag = "v3",
  [switch]$SkipQA
)
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$rig = Split-Path -Parent $here
function Step($name, $script, $extra) {
  Write-Host "== $name"
  & $Blender -b --factory-startup -P (Join-Path $here $script) -- @extra
  if ($LASTEXITCODE -ne 0) { throw "$name failed" }
}
Step "R2/R3 build rig + skin -> D01_hodling_rig.blend" "b1_build_rig.py" @()
Step "chuc nang rig tren file da luu (IK, control, cuc tri)" "v2_rig_function.py" @()
Step "xuat GLB runtime tam (chi de kiem A1)" "c1_export_runtime.py" @()
Step "R4 validation.json (A1.1-A1.14)" "v1_validate.py" @()
Step "trang thai viewport da luu" "v3_viewport_shot.py" @()
if (-not $SkipQA) {
  Step "R5 render anh that" "q1_render.py" @($Tag)
  Step "R5 socket vu khi theo ban tay" "q4_sockets.py" @($Tag)
  Write-Host "== R5 ghep nhan (python)"
  python -I (Join-Path $here "q2_compose.py") $Tag
  if ($LASTEXITCODE -ne 0) { throw "q2_compose failed" }
  Step "R5 Action tu the QA (file QA rieng)" "q3_qa_pose_actions.py" @()
  python -I (Join-Path $here "qa_cleanup.py") $Tag
}
Write-Host "done"

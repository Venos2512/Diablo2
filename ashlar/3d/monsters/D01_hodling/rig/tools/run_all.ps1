# Chay toan bo chuoi R2-R5 cho D01_hodling (dung lai tu GLB goc).
#   powershell -NoProfile -File run_all.ps1 -Tag v4 [-SkipQA] [-Overwrite]
# -Tag BAT BUOC (khong co mac dinh): tag la ten bo anh QA. Neu qa/A2_*_<Tag>.* hoac qa/_superseded/<Tag>/ da ton tai thi DUNG, tru khi them -Overwrite
#   (chong ghi de bang chung cu). Ban .blend nguon bi GHI DE moi lan chay (ban truoc chep vao _work/prev/; ban v3 giu o _snapshots/v3/).
# Can: Blender 5.2.x (mac dinh E:\SteamLibrary\steamapps\common\Blender\blender.exe), python 3.10 co numpy + Pillow (chi buoc ghep anh).
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^v[0-9]+[a-z0-9_]*$')][string]$Tag,
  [string]$Blender = "E:\SteamLibrary\steamapps\common\Blender\blender.exe",
  [switch]$SkipQA,
  [switch]$Overwrite
)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$rig = Split-Path -Parent $here
if (-not (Test-Path (Join-Path $rig "tools\d01_common.py"))) { throw "khong phai thu muc rig D01 hop le: $rig" }
if (-not (Test-Path $Blender)) { throw "khong thay Blender: $Blender" }
$existing = @(Get-ChildItem -Path (Join-Path $rig "qa") -Filter "A2_*_$Tag.*" -ErrorAction SilentlyContinue) + @(Get-Item -Path (Join-Path $rig "qa\_superseded\$Tag") -ErrorAction SilentlyContinue)
if ($existing.Count -gt 0 -and -not $Overwrite) { throw "tag '$Tag' da co bang chung ($($existing.Count) muc trong qa/). Chon tag moi hoac them -Overwrite." }
function Step($name, $script, $extra) {
  Write-Host "== $name"
  & $Blender -b --factory-startup -P (Join-Path $here $script) -- @extra
  if ($LASTEXITCODE -ne 0) { throw "$name failed (exit $LASTEXITCODE)" }
}
function PyStep($name, $script, $extra) {
  Write-Host "== $name"
  & python -I (Join-Path $here $script) @extra
  if ($LASTEXITCODE -ne 0) { throw "$name failed (exit $LASTEXITCODE)" }
}
Step "R2/R3 build rig + skin -> D01_hodling_rig.blend (GHI DE ban nguon)" "b1_build_rig.py" @()
Step "chuc nang rig tren file da luu (IK, control, cuc tri, vai tui doc lap dau)" "v2_rig_function.py" @()
Step "do vai tui + kho truoc <-> dui (checks/sack_flap.json, loin_sweep.json)" "v5_sack_flap.py" @("--sweep")
Step "xuat GLB runtime tam (chi de kiem A1)" "c1_export_runtime.py" @()
Step "R4 validation.json (A1.1-A1.14 + fix_checks_v4)" "v1_validate.py" @()
Step "trang thai viewport da luu" "v3_viewport_shot.py" @()
if (-not $SkipQA) {
  Step "R5 render anh that" "q1_render.py" @($Tag)
  Step "R5 socket vu khi theo ban tay" "q4_sockets.py" @($Tag)
  Step "R5 doi chieu vai tui v3 vs hien hanh" "q5_sack_compare.py" @($Tag)
  PyStep "R5 ghep nhan (python)" "q2_compose.py" @($Tag)
  Step "R5 Action tu the QA (file QA rieng)" "q3_qa_pose_actions.py" @()
  PyStep "R5 don dep (chuyen anh tag cu vao _superseded, xoa raw)" "qa_cleanup.py" @($Tag)
}
Write-Host "done"

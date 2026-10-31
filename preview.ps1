# Build the emulator preview rpk.
#
# Measured fact: the vela 4.0 emulator image hardcodes a 466x466 quickapp canvas,
# independent of the 192x490 display size in the VVD. With designWidth=192 the
# emulator scales the UI by 466/192 = 2.43 and crops it - it looks broken there
# but is correct on the real band. For previewing we temporarily set
# designWidth=466 so 1 design px == 1 physical px, which matches the device 1:1.
#
# Steps:
#   1) designWidth -> 466, build, copy rpk to preview-rpk\com.band.focusbuzz.preview.rpk
#   2) designWidth -> 192, rebuild so dist\ always holds the flashable device package
#
# Usage: powershell -File .\preview.ps1
#        then: node tools\run-emulator.js   (uses VVD Vela_Preview)
#        then: powershell -File .\tools\shot.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root 'dist'
$previewDir = Join-Path $root 'preview-rpk'

function Get-LatestRpk {
  Get-ChildItem $dist -Filter '*.rpk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

Push-Location $root
try {
  Write-Host '[1/3] designWidth -> 466 (preview canvas)' -ForegroundColor Cyan
  node tools\set-manifest.js 466 pages/index | Out-Null
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'build.ps1')

  $rpk = Get-LatestRpk
  if (-not $rpk) { throw 'build.ps1 produced no rpk' }
  New-Item -ItemType Directory -Force $previewDir | Out-Null
  $target = Join-Path $previewDir 'com.band.focusbuzz.preview.rpk'
  Copy-Item $rpk.FullName $target -Force
  Write-Host "[2/3] preview rpk -> $target" -ForegroundColor Green

  Write-Host '[3/3] designWidth -> 192 (device build)' -ForegroundColor Cyan
  node tools\set-manifest.js 192 pages/index | Out-Null
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'build.ps1')
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Next: node tools\run-emulator.js  then  powershell -File .\tools\shot.ps1'
Write-Host 'Flash dist\*.rpk (designWidth=192) to the band; preview-rpk\*.rpk is emulator-only.'

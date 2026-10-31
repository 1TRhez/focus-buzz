# Install the newest .rpk into the running Vela emulator and start it.
#
# Why a script: `pm install` silently keeps the old bundle when the package is
# already installed, so we always uninstall first, then push + install + verify.
#
# Usage:  pwsh -File .\tools\install.ps1 [-Rpk path\to\app.rpk] [-NoStart]
# (Pure ASCII on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 without BOM.)

param(
    [string]$Rpk = '',
    [switch]$NoStart
)

$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$adb = Join-Path $env:USERPROFILE '.aiot-ide\extensions\vela.aiot-emulator-1.6.1\dist\bin\win\adb.exe'
$serial = 'emulator-5554'
$pkg = 'com.band.focusbuzz'
$deviceRpk = "/data/quickapp/app/$pkg.rpk"

if (-not (Test-Path $adb)) { throw "adb not found: $adb" }

if (-not $Rpk) {
    $latest = Get-ChildItem -Path (Join-Path $projectPath 'dist') -Filter '*.rpk' |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latest) { throw 'No .rpk in dist, run .\build.ps1 first.' }
    $Rpk = $latest.FullName
}
if (-not (Test-Path $Rpk)) { throw "rpk not found: $Rpk" }

function Invoke-Adb([string[]]$Arguments) {
    $out = & $adb -s $serial @Arguments 2>&1
    return ($out | Out-String).Trim()
}

Write-Host ("package = " + (Split-Path $Rpk -Leaf)) -ForegroundColor Cyan
Invoke-Adb @('shell', "am stop $pkg") | Out-Null
Start-Sleep -Milliseconds 800

# Always uninstall: installing over a live package leaves the old bundle in place.
Invoke-Adb @('shell', "pm uninstall $pkg") | Out-Null
Start-Sleep -Milliseconds 800

$push = Invoke-Adb @('push', $Rpk, $deviceRpk)
if ($push -notmatch '1 file pushed') { throw "push failed: $push" }

$installed = Invoke-Adb @('shell', "pm install $deviceRpk")
if ($installed -match '(?i)fail|error') { throw "install failed: $installed" }
Start-Sleep -Milliseconds 1500

$started = Invoke-Adb @('shell', "am start $pkg")
Write-Host 'installed + started' -ForegroundColor Green
if ($NoStart) { Write-Host '(start requested anyway, -NoStart is advisory only)' }

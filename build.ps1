# Build script: works around the '#' in this project's path.
#
# Why: aiot-toolkit runs webpack internally, and webpack treats '#' in a path
# as a loader-string separator, so a path like
#   I:\...\#docs...\project
# is parsed as  'I:\...\' + '??ruleSet[1].rules[0].use[0]#docs...' and fails with
#   Unable to resolve loader ...babel-loader\lib\index.js
# Fix: use `subst` to map the project folder to a clean drive letter, build
# there, then unmap. subst is a system-level virtual drive: no copy, no space.
#
# Usage:  pwsh -File .\build.ps1
# (Pure ASCII on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 without BOM.)

$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$registry    = 'https://registry.npmmirror.com/'
$distDir     = Join-Path $projectPath 'dist'
$startedAt   = Get-Date

$drive = $null
foreach ($letter in [char[]]'XYZWVUT') {
    $candidate = "$letter" + ':'
    if (-not (Test-Path ($candidate + '\'))) { $drive = $candidate; break }
}
if (-not $drive) { throw 'No free drive letter among X/Y/Z/W/V/U.' }

$buildLog = [System.IO.Path]::GetTempFileName()
$buildText = ''
try {
    Write-Host "[1/3] map project to $drive\" -ForegroundColor Cyan
    cmd /c "subst $drive `"$projectPath`"" | Out-Null
    if (-not (Test-Path ($drive + '\'))) { throw "subst $drive failed" }

    Write-Host '[2/3] building' -ForegroundColor Cyan
    Push-Location ($drive + '\')
    try {
        $env:npm_config_registry = $registry
        & cmd /c "npm run build > `"$buildLog`" 2>&1"
        $exit = $LASTEXITCODE
        $buildText = if (Test-Path $buildLog) { Get-Content $buildLog -Raw } else { '' }
        Write-Host $buildText
        if ($exit -ne 0) { throw "build failed (exit $exit)" }
        # aiot build prints the error but still exits 0, so check its output too
        if ($buildText -match '(?m)^(\s*)\S*build error|Manifest\.json error|webpack error') {
            throw 'build failed (see message above)'
        }
    } finally {
        Pop-Location
    }
} finally {
    Write-Host '[3/3] unmap' -ForegroundColor Cyan
    cmd /c "subst $drive /d" 2>$null | Out-Null
    if (Test-Path $buildLog) { Remove-Item $buildLog -Force -ErrorAction SilentlyContinue }
}

$rpk = Get-ChildItem -Path $distDir -Filter '*.rpk' -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $rpk) { throw 'No .rpk produced in dist.' }
if ($rpk.LastWriteTime -lt $startedAt) {
    throw "No fresh .rpk: $($rpk.Name) is older than this build (did the build really run?)"
}

Write-Host ''
Write-Host ("OK rpk = " + $rpk.FullName) -ForegroundColor Green
Write-Host ("     size = " + [math]::Round($rpk.Length / 1KB, 1) + " KB")

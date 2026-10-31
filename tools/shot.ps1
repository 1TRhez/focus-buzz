# Grab a real framebuffer screenshot from the Vela emulator and crop the
# middle 192x490 app area.
#
# Why not a window screenshot: the Qt window is affected by Windows DPI scaling
# and only shows the visible part. `screenrecord screenshot` exports the actual
# framebuffer.
#
# Usage: powershell -File .\tools\shot.ps1 [-OutFile shot.png]
# Output: tools\<OutFile> (192x490 = exactly the band screen)

param(
  [string]$OutFile = 'shot.png'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$exportDir = 'C:\Users\saa\.export'
$tokenFile = 'C:\Users\saa\.emulator_console_auth_token'

if (-not (Test-Path $tokenFile)) { throw "missing console token: $tokenFile" }
$token = (Get-Content $tokenFile -Raw).Trim()

Get-ChildItem $exportDir -Filter 'Screenshot_*.png' -ErrorAction SilentlyContinue | Remove-Item -Force

$client = New-Object System.Net.Sockets.TcpClient
try {
  $client.Connect('127.0.0.1', 5554)
  $stream = $client.GetStream()
  $stream.ReadTimeout = 3000
  Start-Sleep -Milliseconds 400
  try { $buf = New-Object byte[] 4096; $null = $stream.Read($buf, 0, 4096) } catch {}

  foreach ($cmd in @("auth $token", "screenrecord screenshot C:/Users/saa/.export")) {
    $bytes = [Text.Encoding]::ASCII.GetBytes($cmd + "`r`n")
    $stream.Write($bytes, 0, $bytes.Length)
    Start-Sleep -Milliseconds 1600
    try { $b2 = New-Object byte[] 4096; $null = $stream.Read($b2, 0, 4096) } catch {}
  }
} finally {
  $client.Close()
}

Start-Sleep -Milliseconds 800
$shot = Get-ChildItem $exportDir -Filter 'Screenshot_*.png' | Sort-Object LastWriteTime | Select-Object -Last 1
if (-not $shot) { throw 'emulator exported no screenshot; is the VVD running and console auth ok?' }

$dest = Join-Path $root "tools\$OutFile"
$py = 'C:\Users\saa\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path $py)) {
  Copy-Item $shot.FullName $dest -Force
  Write-Host "python not found; saved raw screenshot: $dest"
  exit 0
}

$script = Join-Path $root 'tools\clean-shot.py'

& $py $script $shot.FullName $dest
Write-Host "saved: $dest"

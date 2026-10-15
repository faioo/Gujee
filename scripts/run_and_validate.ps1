# Run generator then validate its stdout (Windows PowerShell).
#
# Usage:
#   .\scripts\run_and_validate.ps1 10
#   .\scripts\run_and_validate.ps1 -N 9 -TimeoutSec 90

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [int]$N,
  [int]$TimeoutSec = 60
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Gen = Join-Path $Root "scripts\generate_region_map.py"
$Val = Join-Path $Root "scripts\validate_region_map.py"

$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pyCmd) { $pyCmd = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $pyCmd) {
  Write-Error "python not found"
  exit 1
}
$Py = $pyCmd.Source
$outFile = Join-Path $env:TEMP ("region_map_{0}.txt" -f [guid]::NewGuid().ToString("N"))

try {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Py
  $psi.Arguments = "`"$Gen`" $N"
  $psi.WorkingDirectory = $Root
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $psi.StandardOutputEncoding = New-Object System.Text.UTF8Encoding $false

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  $stdoutTask = $p.StandardOutput.ReadToEndAsync()
  $stderrTask = $p.StandardError.ReadToEndAsync()
  if (-not $p.WaitForExit($TimeoutSec * 1000)) {
    try { $p.Kill() } catch {}
    Write-Output "FAIL"
    Write-Output "- generator timed out after ${TimeoutSec}s"
    exit 124
  }
  $text = $stdoutTask.GetAwaiter().GetResult()
  [void]$stderrTask.GetAwaiter().GetResult()

  if ($p.ExitCode -ne 0) {
    Write-Output "FAIL"
    Write-Output "- generator exited with code $($p.ExitCode)"
    exit 1
  }
  if ([string]::IsNullOrWhiteSpace($text)) {
    Write-Output "FAIL"
    Write-Output "- empty output"
    exit 1
  }

  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($outFile, $text.Trim() + "`n", $utf8)
  & $Py $Val $N $outFile
  exit $LASTEXITCODE
}
finally {
  Remove-Item -Force $outFile -ErrorAction SilentlyContinue
}

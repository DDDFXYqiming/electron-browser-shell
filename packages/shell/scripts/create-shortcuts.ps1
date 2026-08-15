param(
  [Parameter(Mandatory = $true)][string]$TargetPath,
  [Parameter(Mandatory = $true)][string]$WorkingDirectory,
  [string]$AppName = 'Luma Browser'
)

$ErrorActionPreference = 'Stop'

$ws = New-Object -ComObject WScript.Shell

$desktop = [Environment]::GetFolderPath('Desktop')
$desktopLnk = Join-Path $desktop "$AppName.lnk"
$s = $ws.CreateShortcut($desktopLnk)
$s.TargetPath = $TargetPath
$s.WorkingDirectory = $WorkingDirectory
$s.IconLocation = "$TargetPath,0"
$s.Save()

$programs = [Environment]::GetFolderPath('Programs')
$dir = Join-Path $programs $AppName
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$startLnk = Join-Path $dir "$AppName.lnk"
$s2 = $ws.CreateShortcut($startLnk)
$s2.TargetPath = $TargetPath
$s2.WorkingDirectory = $WorkingDirectory
$s2.IconLocation = "$TargetPath,0"
$s2.Save()

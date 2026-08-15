param(
  [string]$AppName = 'Luma Browser'
)

$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$desktopLnk = Join-Path $desktop "$AppName.lnk"
if (Test-Path -LiteralPath $desktopLnk) { Remove-Item -LiteralPath $desktopLnk -Force }

$programs = [Environment]::GetFolderPath('Programs')
$dir = Join-Path $programs $AppName
$startLnk = Join-Path $dir "$AppName.lnk"
if (Test-Path -LiteralPath $startLnk) { Remove-Item -LiteralPath $startLnk -Force }

if ((Test-Path -LiteralPath $dir) -and -not (Get-ChildItem -LiteralPath $dir -Force)) {
  Remove-Item -LiteralPath $dir -Force
}

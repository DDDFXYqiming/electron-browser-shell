# Luma Browser - Windows one-shot build script
# Outputs: portable zip + Squirrel installer (Setup.exe)
#
# Note: Node 26 has an extract-zip compatibility issue (silent extract
# failure), so this script prefers the Codex bundled Node (v24) and
# falls back to the system node if unavailable.

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$BundledNode = 'C:\Users\39795\AppData\Local\OpenAI\Codex\runtimes\cua_node\f1bf3cd3a5929acd\bin\node.exe'
$Node = if (Test-Path $BundledNode) { $BundledNode } else { 'node' }

$env:NODE_OPTIONS = '--use-system-ca'

Write-Host "==> 1/3 packaging app (node=$Node)" -ForegroundColor Cyan
& $Node "$Root\node_modules\@electron-forge\cli\dist\electron-forge-package.js" --platform=win32
if ($LASTEXITCODE -ne 0) { throw 'electron-forge package failed' }

$AppDir = Join-Path $Root 'out\Luma Browser-win32-x64'
if (-not (Test-Path $AppDir)) { throw "找不到打包产物: $AppDir" }

Write-Host '==> 2/3 building portable zip' -ForegroundColor Cyan
$ZipDir = Join-Path $Root 'out\make\zip\win32\x64'
New-Item -ItemType Directory -Force -Path $ZipDir | Out-Null
$Zip = Join-Path $ZipDir 'Luma-Browser-2.2.0-win32-x64.zip'
$SevenZip = 'C:\Program Files\7-Zip\7z.exe'
if (Test-Path $SevenZip) {
  & $SevenZip a -tzip -mx5 $Zip "$AppDir\*" | Out-Null
} else {
  Compress-Archive -Path "$AppDir\*" -DestinationPath $Zip -CompressionLevel Optimal -Force
}
Write-Host "portable: $Zip" -ForegroundColor Green

Write-Host '==> 3/3 building Squirrel installer' -ForegroundColor Cyan
$InstallerScript = Join-Path $env:TEMP 'luma-make-installer.cjs'
$RootFwd = $Root.Replace('\', '/')
$AppDirFwd = $AppDir.Replace('\', '/')
$IconFwd = (Join-Path $Root 'build\icon.ico').Replace('\', '/')
@"
const { createWindowsInstaller } = require('$RootFwd/node_modules/electron-winstaller');
createWindowsInstaller({
  appDirectory: '$AppDirFwd',
  outputDirectory: '$RootFwd/out/make/squirrel.windows/x64',
  authors: 'Luma Browser',
  owners: 'Luma Browser',
  exe: 'LumaBrowser.exe',
  setupExe: 'Luma Browser Setup.exe',
  setupIcon: '$IconFwd',
  noMsi: true,
}).then(() => console.log('INSTALLER_OK')).catch((e) => { console.error(e); process.exit(1); });
"@ | Set-Content -LiteralPath $InstallerScript -Encoding utf8
& $Node $InstallerScript
if ($LASTEXITCODE -ne 0) { throw 'Squirrel installer failed' }

Write-Host 'Build complete!' -ForegroundColor Green
Write-Host "  - portable: $Zip"
Write-Host "  - installer: $Root\out\make\squirrel.windows\x64\Luma Browser Setup.exe"

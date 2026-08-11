const { spawnSync } = require('child_process')
const path = require('path')

const APP_NAME = 'Luma Browser'

/**
 * Handle Squirrel.Windows install/update/uninstall events so the app
 * gets Start Menu + Desktop shortcuts and cleans them up on uninstall.
 * Returns true when the process was launched for a Squirrel event and
 * should exit immediately.
 */
function handleSquirrelEvents() {
  if (process.platform !== 'win32') return false

  const squirrelArg = process.argv.find((arg) => arg.startsWith('--squirrel-'))
  if (!squirrelArg) return false

  const exePath = process.execPath
  const exeDir = path.dirname(exePath)
  const updateExe = path.join(exeDir, 'Update.exe')

  if (squirrelArg === '--squirrel-install' || squirrelArg === '--squirrel-updated') {
    spawnSync(updateExe, ['--create-shortcut', exePath], { windowsHide: true })
    createDesktopShortcut(exePath, exeDir)
    createStartMenuShortcut(exePath, exeDir)
  } else if (squirrelArg === '--squirrel-uninstall') {
    spawnSync(updateExe, ['--remove-shortcut', exePath], { windowsHide: true })
    removeDesktopShortcut()
    removeStartMenuShortcut()
  }

  return true
}

function runPowerShell(script) {
  spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script],
    { windowsHide: true },
  )
}

function createDesktopShortcut(exePath, exeDir) {
  const safeExe = exePath.replace(/'/g, "''")
  const safeDir = exeDir.replace(/'/g, "''")
  const script = `
$ws = New-Object -ComObject WScript.Shell
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) '${APP_NAME}.lnk'
$s = $ws.CreateShortcut($lnk)
$s.TargetPath = '${safeExe}'
$s.WorkingDirectory = '${safeDir}'
$s.IconLocation = '${safeExe},0'
$s.Save()
`
  runPowerShell(script)
}

function removeDesktopShortcut() {
  const script = `
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) '${APP_NAME}.lnk'
if (Test-Path -LiteralPath $lnk) { Remove-Item -LiteralPath $lnk -Force }
`
  runPowerShell(script)
}

function createStartMenuShortcut(exePath, exeDir) {
  const safeExe = exePath.replace(/'/g, "''")
  const safeDir = exeDir.replace(/'/g, "''")
  const script = `
$ws = New-Object -ComObject WScript.Shell
$dir = Join-Path ([Environment]::GetFolderPath('Programs')) 'Luma Browser'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$lnk = Join-Path $dir 'Luma Browser.lnk'
$s = $ws.CreateShortcut($lnk)
$s.TargetPath = '${safeExe}'
$s.WorkingDirectory = '${safeDir}'
$s.IconLocation = '${safeExe},0'
$s.Save()
`
  runPowerShell(script)
}

function removeStartMenuShortcut() {
  const script = `
$dir = Join-Path ([Environment]::GetFolderPath('Programs')) 'Luma Browser'
$lnk = Join-Path $dir 'Luma Browser.lnk'
if (Test-Path -LiteralPath $lnk) { Remove-Item -LiteralPath $lnk -Force }
if ((Test-Path -LiteralPath $dir) -and -not (Get-ChildItem -LiteralPath $dir -Force)) {
  Remove-Item -LiteralPath $dir -Force
}
`
  runPowerShell(script)
}

module.exports = {
  handleSquirrelEvents,
}

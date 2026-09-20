const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const APP_NAME = 'Luma Browser'

// Shortcut scripts must stay outside the app.asar archive: PowerShell is an
// external process and cannot read files packed inside it. Packaged builds
// ship them via packagerConfig.extraResource under the resources directory;
// source runs keep them next to the package root.
function resolveScriptsDir() {
  const candidates = []
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'scripts'))
  }
  candidates.push(path.join(__dirname, '..', 'scripts'))
  const hit = candidates.find((dir) =>
    fs.existsSync(path.join(dir, 'create-shortcuts.ps1')),
  )
  return hit ?? candidates[candidates.length - 1]
}

const SCRIPTS_DIR = resolveScriptsDir()

function runPowerShell(scriptPath, args) {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-File',
      scriptPath,
      ...args,
    ],
    { windowsHide: true, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || `exit code ${result.status}`
    console.error(`[squirrel] ${scriptPath} failed (scripts dir: ${SCRIPTS_DIR}):`, detail)
  }
  return result
}

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
    runPowerShell(path.join(SCRIPTS_DIR, 'create-shortcuts.ps1'), [
      '-TargetPath',
      exePath,
      '-WorkingDirectory',
      exeDir,
      '-AppName',
      APP_NAME,
    ])
  } else if (squirrelArg === '--squirrel-uninstall') {
    spawnSync(updateExe, ['--remove-shortcut', exePath], { windowsHide: true })
    runPowerShell(path.join(SCRIPTS_DIR, 'remove-shortcuts.ps1'), ['-AppName', APP_NAME])
  }

  return true
}

module.exports = {
  handleSquirrelEvents,
  resolveScriptsDir,
}

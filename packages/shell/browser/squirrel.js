const { spawnSync } = require('child_process')
const path = require('path')

const APP_NAME = 'Luma Browser'
const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts')

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
    console.error(`[squirrel] ${scriptPath} failed:`, result.stderr || result.stdout)
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
}

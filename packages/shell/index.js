const { handleSquirrelEvents } = require('./browser/squirrel')

// Squirrel.Windows install/update/uninstall shortcut handling (Windows only).
if (handleSquirrelEvents()) {
  process.exit(0)
}

const Browser = require('./browser/main')
new Browser()

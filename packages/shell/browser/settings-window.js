const { BrowserWindow } = require('electron')

class SettingsWindow {
  constructor() {
    this.window = null
  }

  isOpen() {
    return Boolean(this.window && !this.window.isDestroyed())
  }

  position(parent) {
    if (!this.isOpen() || !parent || parent.isDestroyed()) return
    const pb = parent.getBounds()
    const wb = this.window.getBounds()
    const x = pb.x + pb.width - wb.width - 12
    const y = pb.y + 72
    this.window.setPosition(Math.round(x), Math.round(y))
  }

  open(parent, getWebuiId, backgroundColor) {
    if (this.isOpen()) {
      this.position(parent)
      this.window.show()
      this.window.focus()
      return
    }

    const webuiId = getWebuiId?.()
    if (!webuiId) return

    this.window = new BrowserWindow({
      width: 322,
      height: 288,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      show: false,
      hasShadow: true,
      backgroundColor,
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        enableRemoteModule: false,
        contextIsolation: true,
        worldSafeExecuteJavaScript: true,
      },
    })
    this.window.__lumaSettingsWindow = true
    this.window.setMenuBarVisibility(false)
    this.window.loadURL(`chrome-extension://${webuiId}/settings.html`)
    this.window.once('ready-to-show', () => {
      this.position(parent)
      this.window?.show()
      this.window?.focus()
    })
    this.window.on('blur', () => {
      this.close()
    })
    this.window.on('closed', () => {
      this.window = null
    })
  }

  close() {
    if (this.isOpen()) this.window.close()
  }
}

module.exports = { SettingsWindow }

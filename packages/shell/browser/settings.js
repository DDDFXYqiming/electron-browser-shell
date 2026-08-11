const fs = require('fs')
const os = require('os')
const path = require('path')
const { app, ipcMain, nativeTheme, BrowserWindow } = require('electron')

const DEFAULTS = {
  theme: 'system',
  accent: 'indigo',
  effects: 'on',
}

const ACCENTS = {
  indigo: '#5b5bd6',
  blue: '#2f7cf6',
  teal: '#0e9488',
  green: '#22a06b',
  orange: '#e8790f',
  rose: '#d6336c',
}

const WIN11_MICA_BUILD = 22621

let settings = { ...DEFAULTS }
let settingsPath = ''
let browser = null
let getWebuiExtensionId = null
let settingsWindow = null

function sanitize(patch = {}) {
  const next = { ...settings }
  if (['system', 'light', 'dark'].includes(patch.theme)) next.theme = patch.theme
  if (ACCENTS[patch.accent]) next.accent = patch.accent
  if (['on', 'off'].includes(patch.effects)) next.effects = patch.effects
  return next
}

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    settings = sanitize(raw)
  } catch {
    settings = { ...DEFAULTS }
  }
  // Glass material is always on — no user toggle.
  settings.effects = 'on'
}

function save() {
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

function isDark() {
  if (settings.theme === 'dark') return true
  if (settings.theme === 'light') return false
  return nativeTheme.shouldUseDarkColors
}

function canUseMica() {
  if (process.platform !== 'win32' || settings.effects !== 'on') return false
  const build = Number(os.release().split('.')[2] || 0)
  return build >= WIN11_MICA_BUILD
}

function material() {
  return canUseMica() ? 'mica' : 'none'
}

function backgroundColor() {
  return isDark() ? '#17191f' : '#f4f5f9'
}

function applyToWindow(win) {
  if (!win || win.isDestroyed()) return
  if (win === settingsWindow) return

  try {
    win.setBackgroundMaterial(material())
  } catch {
    // Unsupported platform / version — visual effects handled by CSS fallback.
  }
}

function applyAll() {
  for (const win of BrowserWindow.getAllWindows()) {
    applyToWindow(win)
  }
}

function broadcast() {
  const state = {
    theme: isDark() ? 'dark' : 'light',
    accent: settings.accent,
    effects: settings.effects,
  }
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.webContents.isDestroyed()) {
      win.webContents.send('shell:theme-updated', state)
    }
  }
  // Tab pages are separate WebContentsViews and need the theme forwarded too.
  for (const win of browser?.windows || []) {
    for (const tab of win.tabs.tabList) {
      if (tab.webContents && !tab.webContents.isDestroyed()) {
        tab.webContents.send('shell:theme-updated', state)
      }
    }
  }
}

function getWindowOptions() {
  return {
    backgroundColor: backgroundColor(),
    ...(canUseMica() ? { backgroundMaterial: 'mica' } : {}),
  }
}

function findTab(tabId) {
  if (!browser) return null
  for (const win of browser.windows) {
    const tab = win.tabs.tabList.find((t) => t.webContents && t.webContents.id === tabId)
    if (tab && !tab.webContents.isDestroyed()) return tab
  }
  return null
}

function getNavigationState(tabId) {
  const tab = findTab(tabId)
  if (!tab) return { canGoBack: false, canGoForward: false }
  const history = tab.webContents.navigationHistory
  return { canGoBack: history.canGoBack(), canGoForward: history.canGoForward() }
}

function stopNavigation(tabId) {
  const tab = findTab(tabId)
  tab?.webContents.stop()
}

function positionSettingsWindow(parent) {
  if (!settingsWindow || settingsWindow.isDestroyed() || !parent || parent.isDestroyed()) return
  const pb = parent.getBounds()
  const wb = settingsWindow.getBounds()
  const x = pb.x + pb.width - wb.width - 12
  const y = pb.y + 72
  settingsWindow.setPosition(Math.round(x), Math.round(y))
}

function openSettingsPanel(owner) {
  const parent =
    owner && !owner.isDestroyed()
      ? owner
      : BrowserWindow.getAllWindows().find((win) => !win.isDestroyed())

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    positionSettingsWindow(parent)
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  const webuiId = getWebuiExtensionId?.()
  if (!webuiId) return

  settingsWindow = new BrowserWindow({
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
    backgroundColor: backgroundColor(),
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
    },
  })

  settingsWindow.setMenuBarVisibility(false)
  settingsWindow.loadURL(`chrome-extension://${webuiId}/settings.html`)
  settingsWindow.once('ready-to-show', () => {
    positionSettingsWindow(parent)
    settingsWindow?.show()
    settingsWindow?.focus()
  })
  settingsWindow.on('blur', () => {
    settingsWindow?.close()
  })
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function setup(browserRef, getWebuiId) {
  browser = browserRef
  getWebuiExtensionId = getWebuiId
  settingsPath = path.join(app.getPath('userData'), 'settings.json')

  load()
  nativeTheme.themeSource = settings.theme

  ipcMain.handle('shell:get-settings', () => settings)

  ipcMain.handle('shell:set-settings', (_event, patch) => {
    settings = sanitize(patch)
    save()
    nativeTheme.themeSource = settings.theme
    applyAll()
    broadcast()
    return settings
  })

  ipcMain.handle('shell:get-nav-state', (_event, tabId) => getNavigationState(tabId))
  ipcMain.handle('shell:stop-navigation', (_event, tabId) => stopNavigation(tabId))
  ipcMain.handle('shell:open-settings', (event) => {
    openSettingsPanel(BrowserWindow.fromWebContents(event.sender))
  })
  ipcMain.handle('shell:close-settings', () => {
    settingsWindow?.close()
  })

  ipcMain.on('shell:renderer-error', (_event, message) => {
    console.error('[webui]', message)
  })

  nativeTheme.on('updated', () => {
    applyAll()
    broadcast()
  })
}

module.exports = {
  setup,
  getWindowOptions,
  applyToWindow,
  get settings() {
    return settings
  },
  ACCENTS,
}

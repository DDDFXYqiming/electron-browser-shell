const path = require('path')
const { app, ipcMain, nativeTheme, BrowserWindow } = require('electron')
const { SettingsStore } = require('./settings-store')
const themeManager = require('./theme-manager')
const { SettingsWindow } = require('./settings-window')
const ACCENTS = require('./ui/accents.js')

let browser = null
let getWebuiExtensionId = null
let store = null
let settingsWindow = null
let ready = false

function findTab(tabId, ownerWindow) {
  if (!browser || !ownerWindow || ownerWindow.isDestroyed()) return null
  const tab = ownerWindow.tabs?.tabList?.find(
    (t) => t.webContents && t.webContents.id === tabId,
  )
  return tab && !tab.webContents.isDestroyed() ? tab : null
}

function getNavigationState(tabId, ownerWindow) {
  const tab = findTab(tabId, ownerWindow)
  if (!tab) return { canGoBack: false, canGoForward: false }
  const history = tab.webContents.navigationHistory
  return { canGoBack: history.canGoBack(), canGoForward: history.canGoForward() }
}

function stopNavigation(tabId, ownerWindow) {
  const tab = findTab(tabId, ownerWindow)
  tab?.webContents.stop()
}

function openSettingsPanel(owner) {
  const parent =
    owner && !owner.isDestroyed()
      ? owner
      : BrowserWindow.getAllWindows().find((win) => !win.isDestroyed())

  settingsWindow.open(parent, getWebuiExtensionId, themeManager.backgroundColor(store.get()))
}

function setup(browserRef, getWebuiId) {
  browser = browserRef
  getWebuiExtensionId = getWebuiId
  settingsWindow = new SettingsWindow()

  store = new SettingsStore(path.join(app.getPath('userData'), 'settings.json'))
  store.load()
  nativeTheme.themeSource = store.get().theme

  ipcMain.handle('shell:get-settings', () => store.get())

  ipcMain.handle('shell:set-settings', (_event, patch) => {
    const next = store.set(patch)
    nativeTheme.themeSource = next.theme
    themeManager.applyAll(next)
    themeManager.broadcast(next, browser)
    return next
  })

  ipcMain.handle('shell:get-nav-state', (event, tabId) =>
    getNavigationState(tabId, BrowserWindow.fromWebContents(event.sender)),
  )
  ipcMain.handle('shell:stop-navigation', (event, tabId) =>
    stopNavigation(tabId, BrowserWindow.fromWebContents(event.sender)),
  )
  ipcMain.handle('shell:open-settings', (event) => {
    openSettingsPanel(BrowserWindow.fromWebContents(event.sender))
  })
  ipcMain.handle('shell:close-settings', () => {
    settingsWindow.close()
  })

  ipcMain.on('shell:renderer-error', (_event, message) => {
    console.error('[webui]', message)
  })

  nativeTheme.on('updated', () => {
    themeManager.applyAll(store.get())
    themeManager.broadcast(store.get(), browser)
  })

  ready = true
}

function getWindowOptions() {
  if (!ready) throw new Error('settings.setup() must be called before creating windows')
  return themeManager.getWindowOptions(store.get())
}

function applyToWindow(win) {
  if (!ready) throw new Error('settings.setup() must be called before applying window settings')
  themeManager.applyToWindow(win, store.get())
}

module.exports = {
  setup,
  getWindowOptions,
  applyToWindow,
  get settings() {
    return store ? store.get() : {}
  },
  ACCENTS,
}

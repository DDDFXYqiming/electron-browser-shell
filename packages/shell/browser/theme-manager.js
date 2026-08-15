const os = require('os')
const { BrowserWindow, nativeTheme } = require('electron')

const WIN11_MICA_BUILD = 22621

function isDark(settings) {
  if (settings.theme === 'dark') return true
  if (settings.theme === 'light') return false
  return nativeTheme.shouldUseDarkColors
}

function canUseMica() {
  if (process.platform !== 'win32') return false
  const build = Number(os.release().split('.')[2] || 0)
  return build >= WIN11_MICA_BUILD
}

function material() {
  return canUseMica() ? 'mica' : 'none'
}

function backgroundColor(settings) {
  return isDark(settings) ? '#17191f' : '#f4f5f9'
}

function applyToWindow(win, settings) {
  if (!win || win.isDestroyed() || win.__lumaSettingsWindow) return
  try {
    win.setBackgroundMaterial(material())
  } catch {
    // Unsupported platform / version — visual effects handled by CSS fallback.
  }
}

function applyAll(settings) {
  for (const win of BrowserWindow.getAllWindows()) {
    applyToWindow(win, settings)
  }
}

function broadcast(settings, browser) {
  const state = {
    theme: isDark(settings) ? 'dark' : 'light',
    accent: settings.accent,
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

function getWindowOptions(settings) {
  return {
    backgroundColor: backgroundColor(settings),
    ...(canUseMica() ? { backgroundMaterial: 'mica' } : {}),
  }
}

module.exports = {
  isDark,
  canUseMica,
  material,
  backgroundColor,
  applyToWindow,
  applyAll,
  broadcast,
  getWindowOptions,
}

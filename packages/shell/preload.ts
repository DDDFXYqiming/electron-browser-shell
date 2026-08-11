import { contextBridge, ipcRenderer } from 'electron'
import { injectBrowserAction } from 'electron-chrome-extensions/browser-action'

const isWebUI = location.protocol === 'chrome-extension:' && location.pathname === '/webui.html'
const isNewTab = location.protocol === 'chrome-extension:' && location.pathname === '/new-tab.html'
const isSettings =
  location.protocol === 'chrome-extension:' && location.pathname === '/settings.html'

// Inject <browser-action-list> element into WebUI
if (isWebUI) {
  injectBrowserAction()
  window.addEventListener('error', (event) => {
    ipcRenderer.send('shell:renderer-error', String(event.error?.stack || event.message))
  })
}

// Expose a small, safe bridge to the browser shell (settings + navigation).
if (isWebUI || isNewTab || isSettings) {
  contextBridge.exposeInMainWorld('shell', {
    getSettings: () => ipcRenderer.invoke('shell:get-settings'),
    setSettings: (patch) => ipcRenderer.invoke('shell:set-settings', patch),
    getNavigationState: (tabId) => ipcRenderer.invoke('shell:get-nav-state', tabId),
    stopNavigation: (tabId) => ipcRenderer.invoke('shell:stop-navigation', tabId),
    openSettings: () => ipcRenderer.invoke('shell:open-settings'),
    closeSettings: () => ipcRenderer.invoke('shell:close-settings'),
    onThemeUpdated: (callback) => {
      const listener = (_event, state) => callback(state)
      ipcRenderer.on('shell:theme-updated', listener)
      return () => ipcRenderer.removeListener('shell:theme-updated', listener)
    },
  })
}

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

// Expose a small, safe bridge to the browser shell.
// Only expose capabilities a given page actually needs, and let the main
// process enforce tab ownership (see settings.js IPC handlers).
const bridge: Record<string, unknown> = {
  getSettings: () => ipcRenderer.invoke('shell:get-settings'),
  setSettings: (patch: unknown) => ipcRenderer.invoke('shell:set-settings', patch),
  onThemeUpdated: (callback: (state: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state)
    ipcRenderer.on('shell:theme-updated', listener)
    return () => ipcRenderer.removeListener('shell:theme-updated', listener)
  },
}

if (isWebUI) {
  bridge.getNavigationState = (tabId: number) => ipcRenderer.invoke('shell:get-nav-state', tabId)
  bridge.stopNavigation = (tabId: number) => ipcRenderer.invoke('shell:stop-navigation', tabId)
  bridge.openSettings = () => ipcRenderer.invoke('shell:open-settings')
}

if (isSettings) {
  bridge.closeSettings = () => ipcRenderer.invoke('shell:close-settings')
}

if (isWebUI || isNewTab || isSettings) {
  contextBridge.exposeInMainWorld('shell', bridge)
}

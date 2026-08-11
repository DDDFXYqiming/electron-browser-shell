const ACCENTS = {
  indigo: '#5b5bd6',
  blue: '#2f7cf6',
  teal: '#0e9488',
  green: '#22a06b',
  orange: '#e8790f',
  rose: '#d6336c',
}

const SEARCH_URL = 'https://www.bing.com/search?q='

class WebUI {
  windowId = -1
  activeTabId = -1
  /** @type {chrome.tabs.Tab[]} */
  tabList = []
  settings = { theme: 'system', accent: 'indigo', effects: 'on' }
  systemDark = false

  constructor() {
    try {
      const $ = document.querySelector.bind(document)

      this.$ = {
        tabList: $('#tabstrip .tab-list'),
        tabTemplate: $('#tabtemplate'),
        createTabButton: $('#createtab'),
        goBackButton: $('#goback'),
        goForwardButton: $('#goforward'),
        reloadButton: $('#reload'),
        addressUrl: $('#addressurl'),
        addressGo: $('.address-go'),
        siteStatus: $('.site-status'),
        siteStatusIcon: $('.site-status use'),

        browserActions: $('#actions'),

        minimizeButton: $('#minimize'),
        maximizeButton: $('#maximize'),
        closeButton: $('#close'),

        settingsButton: $('#settings-btn'),
      }

      this.$.createTabButton.addEventListener('click', () => chrome.tabs.create())
      this.$.goBackButton.addEventListener('click', () => chrome.tabs.goBack())
      this.$.goForwardButton.addEventListener('click', () => chrome.tabs.goForward())
      this.$.reloadButton.addEventListener('click', this.onReloadClick.bind(this))
      this.$.addressUrl.addEventListener('keydown', this.onAddressUrlKeyPress.bind(this))
      this.$.addressGo.addEventListener('click', this.submitAddress.bind(this))

      this.$.minimizeButton.addEventListener('click', () =>
        chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
          chrome.windows.update(win.id, {
            state: win.state === 'minimized' ? 'normal' : 'minimized',
          })
        }),
      )
      this.$.maximizeButton.addEventListener('click', () => this.toggleMaximize())
      this.$.closeButton.addEventListener('click', () => chrome.windows.remove())

      this.setupSettingsPanel()

      const platform = navigator.userAgentData?.platform?.toLowerCase() || 'win32'
      const platformClass = `platform-${platform}`
      document.body.classList.add(platformClass)

      this.init()
    } catch (error) {
      console.error('WebUI constructor failed:', error)
      throw error
    }
  }

  async init() {
    if (window.shell) {
      try {
        this.settings = (await window.shell.getSettings()) || this.settings
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
      window.shell.onThemeUpdated((state) => this.applySettings(state))
    }
    this.applySettings(this.settings)
    this.initTabs()
    this.syncWindowState()
    chrome.windows?.onBoundsChanged?.addListener(() => this.syncWindowState())
  }

  async toggleMaximize() {
    const win = await new Promise((resolve) =>
      chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, resolve),
    )
    if (!win) return
    await chrome.windows.update(win.id, {
      state: win.state === 'maximized' ? 'normal' : 'maximized',
    })
    this.syncWindowState()
  }

  async syncWindowState() {
    const win = await new Promise((resolve) =>
      chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, resolve),
    )
    if (!win) return
    const maximized = win.state === 'maximized'
    const icon = this.$.maximizeButton.querySelector('use')
    icon.setAttribute('href', maximized ? '#i-restore' : '#i-maximize')
    this.$.maximizeButton.title = maximized ? 'Restore' : 'Maximize'
  }

  /* ---------------- Settings ---------------- */

  setupSettingsPanel() {
    this.$.settingsButton.addEventListener('click', () => window.shell?.openSettings())
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'Comma') {
        event.preventDefault()
        window.shell?.openSettings()
      }
    })
  }

  applySettings(settings) {
    if (!settings) return
    this.settings = { ...this.settings, ...settings }

    const theme =
      this.settings.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : this.settings.theme

    document.documentElement.dataset.theme = theme
    document.body.dataset.effects = this.settings.effects
    document.documentElement.style.setProperty(
      '--accent',
      ACCENTS[this.settings.accent] || ACCENTS.indigo,
    )
  }

  /* ---------------- Tabs ---------------- */

  async initTabs() {
    // Tabs may not be registered yet right after the page loads; retry briefly.
    let tabs = []
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        tabs = await new Promise((resolve) => chrome.tabs.query({ windowId: -2 }, resolve))
      } catch (error) {
        console.error('chrome.tabs.query failed:', error)
        tabs = []
      }
      if (tabs && tabs.length > 0) break
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    this.tabList = [...tabs]
    this.renderTabs()

    const activeTab = this.tabList.find((tab) => tab.active)
    if (activeTab) {
      this.setActiveTab(activeTab)
    }

    // Wait to setup tabs and windowId prior to listening for updates.
    this.setupBrowserListeners()
  }

  setupBrowserListeners() {
    if (!chrome.tabs.onCreated) {
      throw new Error(`chrome global not setup. Did the extension preload not get run?`)
    }

    const findTab = (tabId) => {
      const existingTab = this.tabList.find((tab) => tab.id === tabId)
      return existingTab
    }

    const findOrCreateTab = (tabId) => {
      const existingTab = findTab(tabId)
      if (existingTab) return existingTab

      const newTab = { id: tabId }
      this.tabList.push(newTab)
      return newTab
    }

    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.windowId !== this.windowId) return
      const newTab = findOrCreateTab(tab.id)
      Object.assign(newTab, tab)
      this.renderTabs()
    })

    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (activeInfo.windowId !== this.windowId) return
      this.setActiveTab(activeInfo)
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, details) => {
      const tab = findTab(tabId)
      if (!tab) return
      Object.assign(tab, details)
      this.renderTabs()
      if (tabId === this.activeTabId) this.renderToolbar(tab)
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
      const tabIndex = this.tabList.findIndex((tab) => tab.id === tabId)
      if (tabIndex > -1) {
        this.tabList.splice(tabIndex, 1)
        const node = this.$.tabList.querySelector(`[data-tab-id="${tabId}"]`)
        if (node) node.remove()
      }
    })
  }

  setActiveTab(activeTab) {
    this.activeTabId = activeTab.id || activeTab.tabId
    this.windowId = activeTab.windowId

    for (const tab of this.tabList) {
      if (tab.id === this.activeTabId) {
        tab.active = true
        this.renderTab(tab)
        this.renderToolbar(tab)
      } else {
        if (tab.active) {
          tab.active = false
          this.renderTab(tab)
        }
      }
    }

    this.scrollActiveTabIntoView()
  }

  scrollActiveTabIntoView() {
    const activeNode = this.$.tabList.querySelector(`[data-tab-id="${this.activeTabId}"]`)
    activeNode?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  createTabNode(tab) {
    const tabElem = this.$.tabTemplate.content.cloneNode(true).firstElementChild
    tabElem.dataset.tabId = tab.id

    const activate = () => {
      chrome.tabs.update(tab.id, { active: true })
    }
    tabElem.addEventListener('click', activate)
    tabElem.addEventListener('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') activate()
    })
    tabElem.querySelector('.close').addEventListener('click', () => {
      chrome.tabs.remove(tab.id)
    })
    const faviconElem = tabElem.querySelector('.favicon')
    faviconElem?.addEventListener('load', () => {
      faviconElem.classList.toggle('loaded', true)
    })
    faviconElem?.addEventListener('error', () => {
      faviconElem.classList.toggle('loaded', false)
    })

    this.$.tabList.appendChild(tabElem)
    return tabElem
  }

  renderTab(tab) {
    let tabElem = this.$.tabList.querySelector(`[data-tab-id="${tab.id}"]`)
    if (!tabElem) tabElem = this.createTabNode(tab)

    if (tab.active) {
      tabElem.dataset.active = ''
    } else {
      delete tabElem.dataset.active
    }

    const favicon = tabElem.querySelector('.favicon')
    if (tab.favIconUrl) {
      favicon.src = tab.favIconUrl
    } else {
      delete favicon.src
    }

    tabElem.querySelector('.title').textContent = tab.title || 'New Tab'
    tabElem.querySelector('.audio').disabled = !tab.audible
  }

  renderTabs() {
    this.tabList.forEach((tab) => {
      this.renderTab(tab)
    })
  }

  /* ---------------- Toolbar ---------------- */

  renderToolbar(tab) {
    if (!tab) return
    const isNewTab = /^chrome-extension:\/\/[^/]+\/new-tab\.html/.test(tab.url || '')
    this.$.addressUrl.value = isNewTab ? '' : tab.url || ''
    this.renderSiteStatus(tab.url)
    this.renderLoadingState(tab)
    this.renderNavigationState(tab.id)
  }

  renderSiteStatus(url = '') {
    const isSecure = /^https:/.test(url)
    const icon = this.$.siteStatusIcon
    icon.setAttribute('href', isSecure ? '#i-lock' : '#i-globe')
    this.$.siteStatus.toggleAttribute('data-secure', isSecure)
    this.$.siteStatus.title = isSecure
      ? 'Connection is secure'
      : url
        ? 'Connection is not secure'
        : ''
  }

  renderLoadingState(tab) {
    const loading = tab.status === 'loading'
    const icon = this.$.reloadButton.querySelector('use')
    icon.setAttribute('href', loading ? '#i-stop' : '#i-reload')
    this.$.reloadButton.title = loading ? 'Stop' : 'Reload'
  }

  async renderNavigationState(tabId) {
    if (!window.shell) return
    const state = await window.shell.getNavigationState(tabId)
    // Ignore stale responses from a tab switch
    if (tabId !== this.activeTabId || !state) return
    this.$.goBackButton.disabled = !state.canGoBack
    this.$.goForwardButton.disabled = !state.canGoForward
  }

  onReloadClick() {
    const tab = this.tabList.find((t) => t.id === this.activeTabId)
    if (tab?.status === 'loading') {
      window.shell?.stopNavigation(this.activeTabId)
    } else {
      chrome.tabs.reload()
    }
  }

  onAddressUrlKeyPress(event) {
    if (event.code === 'Enter') {
      this.submitAddress()
    }
  }

  submitAddress() {
    const value = this.$.addressUrl.value.trim()
    if (!value) return

    let url = value
    const looksLikeUrl =
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ||
      (/^[\w.-]+\.[a-zA-Z]{2,}(:\d+)?([/?#].*)?$/.test(value) && !/\s/.test(value))

    if (!looksLikeUrl) {
      url = SEARCH_URL + encodeURIComponent(value)
    } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
      url = 'https://' + value
    }

    if (this.activeTabId > -1) {
      chrome.tabs.update(this.activeTabId, { url })
    } else {
      chrome.tabs.update({ url })
    }
  }
}

window.webui = new WebUI()

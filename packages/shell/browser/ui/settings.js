const ACCENTS = {
  indigo: '#5b5bd6',
  blue: '#2f7cf6',
  teal: '#0e9488',
  green: '#22a06b',
  orange: '#e8790f',
  rose: '#d6336c',
}

class SettingsUI {
  settings = { theme: 'system', accent: 'indigo', effects: 'on' }

  constructor() {
    this.$.themeSegmented = document.getElementById('theme-segmented')
    this.$.accentGrid = document.getElementById('accent-grid')

    this.$.themeSegmented.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => this.update({ theme: button.dataset.value }))
    })
    this.$.accentGrid.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => this.update({ accent: button.dataset.value }))
    })
    document.getElementById('settings-close').addEventListener('click', () => {
      window.shell?.closeSettings()
    })

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') window.shell?.closeSettings()
    })

    this.init()
  }

  get $() {
    if (!this._$) this._$ = {}
    return this._$
  }

  async init() {
    if (window.shell) {
      this.settings = (await window.shell.getSettings()) || this.settings
      window.shell.onThemeUpdated((state) => this.apply(state))
    }
    this.apply(this.settings)
  }

  async update(patch) {
    if (!window.shell) return
    this.settings = (await window.shell.setSettings(patch)) || this.settings
    this.apply(this.settings)
  }

  apply(settings) {
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

    this.$.themeSegmented.querySelectorAll('button').forEach((button) => {
      button.toggleAttribute('data-active', button.dataset.value === this.settings.theme)
    })
    this.$.accentGrid.querySelectorAll('button').forEach((button) => {
      button.toggleAttribute('data-active', button.dataset.value === this.settings.accent)
    })
  }
}

new SettingsUI()

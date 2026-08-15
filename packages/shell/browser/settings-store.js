const fs = require('fs')
const path = require('path')
const ACCENTS = require('./ui/accents.js')

const DEFAULTS = {
  theme: 'system',
  accent: 'indigo',
}

class SettingsStore {
  constructor(settingsPath) {
    this.path = settingsPath
    this.state = { ...DEFAULTS }
    this.ready = false
  }

  sanitize(patch = {}) {
    const next = { ...this.state }
    if (['system', 'light', 'dark'].includes(patch.theme)) next.theme = patch.theme
    if (Object.keys(ACCENTS).includes(patch.accent)) next.accent = patch.accent
    return next
  }

  load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.path, 'utf8'))
      this.state = this.sanitize(raw)
    } catch {
      this.state = { ...DEFAULTS }
    }
    this.ready = true
    return this.get()
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this.path), { recursive: true })
      fs.writeFileSync(this.path, JSON.stringify(this.state, null, 2))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  get() {
    return { ...this.state }
  }

  set(patch = {}) {
    this.state = this.sanitize(patch)
    this.save()
    return this.get()
  }
}

module.exports = { SettingsStore, DEFAULTS }

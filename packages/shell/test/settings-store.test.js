const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { SettingsStore, DEFAULTS } = require('../browser/settings-store')

test('sanitize accepts valid theme/accent and ignores invalid values', () => {
  const store = new SettingsStore('/tmp/nonexistent.json')
  store.state = { theme: 'system', accent: 'indigo' }

  assert.deepEqual(store.sanitize({ theme: 'dark', accent: 'blue', effects: 'off' }), {
    theme: 'dark',
    accent: 'blue',
  })
  assert.deepEqual(store.sanitize({ theme: 'neon', accent: 'bogus' }), {
    theme: 'system',
    accent: 'indigo',
  })
})

test('load falls back to defaults on corrupt file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-settings-'))
  const file = path.join(dir, 'settings.json')
  fs.writeFileSync(file, '{ not json', 'utf8')

  const store = new SettingsStore(file)
  const loaded = store.load()
  assert.deepEqual(loaded, DEFAULTS)
  assert.equal(store.ready, true)
})

test('save writes file and set persists valid patch', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-settings-'))
  const file = path.join(dir, 'settings.json')

  const store = new SettingsStore(file)
  store.load()
  const next = store.set({ theme: 'dark', accent: 'rose' })
  assert.deepEqual(next, { theme: 'dark', accent: 'rose' })

  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert.deepEqual(onDisk, { theme: 'dark', accent: 'rose' })
})

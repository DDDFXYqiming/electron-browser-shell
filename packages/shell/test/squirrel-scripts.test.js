const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { resolveScriptsDir } = require('../browser/squirrel')

// The shortcut scripts ship outside app.asar (packagerConfig.extraResource);
// PowerShell cannot read files packed inside the archive.
test('source runs resolve the scripts directory next to the package root', () => {
  const original = process.resourcesPath
  delete process.resourcesPath
  try {
    const dir = resolveScriptsDir()
    assert.equal(fs.existsSync(path.join(dir, 'create-shortcuts.ps1')), true)
  } finally {
    if (original !== undefined) process.resourcesPath = original
  }
})

test('packaged builds prefer the resources directory', () => {
  const original = process.resourcesPath
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'squirrel-res-'))
  fs.mkdirSync(path.join(tmp, 'scripts'))
  fs.writeFileSync(path.join(tmp, 'scripts', 'create-shortcuts.ps1'), '')
  process.resourcesPath = tmp
  try {
    assert.equal(resolveScriptsDir(), path.join(tmp, 'scripts'))
  } finally {
    process.resourcesPath = original
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('a resources directory without scripts falls back to the source layout', () => {
  const original = process.resourcesPath
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'squirrel-empty-'))
  process.resourcesPath = tmp
  try {
    const dir = resolveScriptsDir()
    assert.notEqual(dir, path.join(tmp, 'scripts'))
    assert.equal(fs.existsSync(path.join(dir, 'create-shortcuts.ps1')), true)
  } finally {
    process.resourcesPath = original
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

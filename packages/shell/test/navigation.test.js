const test = require('node:test')
const assert = require('node:assert')
const { normalizeInput } = require('../browser/ui/navigation.js')

test('normalizeInput returns a Bing search URL for plain text', () => {
  const result = normalizeInput('hello world')
  assert.equal(result.query, 'hello world')
  assert.match(result.url, /^https:\/\/www\.bing\.com\/search\?q=hello%20world$/)
})

test('normalizeInput prepends https for a bare domain', () => {
  assert.equal(normalizeInput('example.com').url, 'https://example.com')
})

test('normalizeInput keeps an explicit protocol untouched', () => {
  assert.equal(normalizeInput('http://localhost:3000').url, 'http://localhost:3000')
})

test('normalizeInput prepends https for host:port input', () => {
  assert.equal(normalizeInput('localhost:3000').url, 'https://localhost:3000')
})

test('normalizeInput returns empty url for blank input', () => {
  assert.deepEqual(normalizeInput('   '), { query: '' })
})

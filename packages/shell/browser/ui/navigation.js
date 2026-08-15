// Shared address-bar / new-tab navigation normalization for Luma Browser.
// Exposed as CommonJS module for tests and as global BROOKS_NAV for renderer pages.
(function (root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.BROOKS_NAV = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SEARCH_URL = 'https://www.bing.com/search?q='

  function normalizeInput(value) {
    const text = String(value || '').trim()
    if (!text) return { query: '' }

    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text)
    const looksLikeHostPort = /^[\w.-]+:\d+([/?#].*)?$/.test(text)
    const looksLikeDomain =
      /^[\w.-]+\.[a-zA-Z]{2,}(:\d+)?([/?#].*)?$/.test(text) && !/\s/.test(text)

    if (hasScheme) {
      if (/^(https?|file|about|chrome|chrome-extension|data|javascript):/i.test(text)) {
        return { url: text }
      }
      if (looksLikeHostPort) {
        return { url: 'https://' + text }
      }
      return { url: text }
    }

    if (!looksLikeDomain) {
      return { query: text, url: SEARCH_URL + encodeURIComponent(text) }
    }

    return { url: 'https://' + text }
  }

  return { SEARCH_URL, normalizeInput }
})

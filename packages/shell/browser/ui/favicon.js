// Shared favicon fallback loader for Luma Browser renderer pages.
// Exposed as CommonJS module for tests and as global LUMA_FAVICON for pages.
(function (root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  if (root) root.LUMA_FAVICON = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_SOURCES = [
    (host) => `https://icons.duckduckgo.com/ip3/${host}.ico`,
    (host) => `https://icon.horse/icon/${host}`,
    (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    (host) => `https://${host}/favicon.ico`,
  ]
  const DEFAULT_TIMEOUT_MS = 3500

  function loadFavicon(container, letterEl, host, options = {}) {
    const sources = options.sources || DEFAULT_SOURCES
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const img = document.createElement('img')
    img.className = 'shortcut-favicon'
    img.alt = ''

    let sourceIndex = 0
    let timer = null

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const nextSource = () => {
      clearTimer()
      sourceIndex += 1
      if (sourceIndex >= sources.length) {
        img.remove()
        return
      }
      timer = setTimeout(nextSource, timeoutMs)
      img.src = sources[sourceIndex](host)
    }

    img.addEventListener('load', () => {
      clearTimer()
      img.classList.add('loaded')
      letterEl.classList.add('hidden')
    })
    img.addEventListener('error', nextSource)

    timer = setTimeout(nextSource, timeoutMs)
    img.src = sources[0](host)
    container.appendChild(img)

    return clearTimer
  }

  return { loadFavicon, DEFAULT_SOURCES, DEFAULT_TIMEOUT_MS }
})

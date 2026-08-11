const SEARCH_URL = 'https://www.bing.com/search?q='

const SHORTCUTS = [
  { name: 'Google', url: 'https://www.google.com', color: '#4285f4' },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#e62117' },
  { name: 'Electron', url: 'https://github.com/electron/electron', color: '#47848f' },
  {
    name: 'Browser Shell',
    url: 'https://github.com/samuelmaddock/electron-browser-shell',
    color: '#5b5bd6',
  },
  { name: 'Chrome Web Store', url: 'https://chromewebstore.google.com', color: '#2f7cf6' },
  {
    name: 'Edge Add-ons',
    url: 'https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home',
    color: '#0c59a4',
  },
  { name: 'Permission Site', url: 'https://permission.site', color: '#64748b' },
  { name: 'Samuel Maddock', url: 'https://samuelmaddock.com', color: '#7c3aed' },
]

const ACCENTS = {
  indigo: '#5b5bd6',
  blue: '#2f7cf6',
  teal: '#0e9488',
  green: '#22a06b',
  orange: '#e8790f',
  rose: '#d6336c',
}

const FAVICON_SOURCES = [
  (host) => `https://icons.duckduckgo.com/ip3/${host}.ico`,
  (host) => `https://icon.horse/icon/${host}`,
  (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
  (host) => `https://${host}/favicon.ico`,
]
const FAVICON_TIMEOUT_MS = 3500

const domain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const letter = (name) => (name || '?').trim().charAt(0).toUpperCase()

const attachFavicon = (iconEl, letterEl, host) => {
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
    if (sourceIndex >= FAVICON_SOURCES.length) {
      img.remove()
      return
    }
    timer = setTimeout(nextSource, FAVICON_TIMEOUT_MS)
    img.src = FAVICON_SOURCES[sourceIndex](host)
  }

  img.addEventListener('load', () => {
    clearTimer()
    img.classList.add('loaded')
    letterEl.classList.add('hidden')
  })
  img.addEventListener('error', nextSource)

  timer = setTimeout(nextSource, FAVICON_TIMEOUT_MS)
  img.src = FAVICON_SOURCES[0](host)
  iconEl.appendChild(img)
}

const renderShortcuts = () => {
  const grid = document.getElementById('shortcuts')
  grid.innerHTML = ''

  for (const item of SHORTCUTS) {
    const link = document.createElement('a')
    link.className = 'shortcut'
    link.href = item.url
    link.title = item.url

    const icon = document.createElement('div')
    icon.className = 'shortcut-icon'

    const letterEl = document.createElement('span')
    letterEl.className = 'shortcut-letter'
    letterEl.textContent = letter(item.name)
    icon.appendChild(letterEl)

    if (item.color) {
      icon.style.background = `linear-gradient(145deg, ${item.color}, color-mix(in srgb, ${item.color} 72%, #000))`
    }
    attachFavicon(icon, letterEl, domain(item.url))

    const name = document.createElement('span')
    name.className = 'shortcut-name'
    name.textContent = item.name

    const host = document.createElement('span')
    host.className = 'shortcut-domain'
    host.textContent = domain(item.url)

    link.append(icon, name, host)
    grid.appendChild(link)
  }
}

const navigateOrSearch = (value) => {
  const text = value.trim()
  if (!text) return

  let url = text
  const looksLikeUrl =
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text) ||
    (/^[\w.-]+\.[a-zA-Z]{2,}(:\d+)?([/?#].*)?$/.test(text) && !/\s/.test(text))

  if (!looksLikeUrl) {
    url = SEARCH_URL + encodeURIComponent(text)
  } else if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text)) {
    url = 'https://' + text
  }

  location.href = url
}

const applyTheme = (settings) => {
  const theme =
    settings.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : settings.theme
  document.documentElement.dataset.theme = theme
  document.documentElement.style.setProperty('--accent', ACCENTS[settings.accent] || ACCENTS.indigo)
}

document.getElementById('search-input').addEventListener('keydown', (event) => {
  if (event.code === 'Enter') navigateOrSearch(event.target.value)
})

renderShortcuts()

if (window.shell) {
  window.shell.getSettings().then(applyTheme)
  window.shell.onThemeUpdated(applyTheme)
} else {
  applyTheme({ theme: 'system', accent: 'indigo' })
}

// Fallback: follow OS theme changes even if the shell bridge misses them.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (window.shell) window.shell.getSettings().then(applyTheme)
})

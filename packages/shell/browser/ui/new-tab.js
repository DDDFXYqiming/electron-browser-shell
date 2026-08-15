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

const domain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const letter = (name) => (name || '?').trim().charAt(0).toUpperCase()

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
    LUMA_FAVICON.loadFavicon(icon, letterEl, domain(item.url))

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
  const result = BROOKS_NAV.normalizeInput(value)
  if (!result.url) return
  location.href = result.url
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

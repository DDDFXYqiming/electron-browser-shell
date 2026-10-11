[简体中文](README.md) | English

# electron-browser-shell

**A minimal, tabbed desktop web browser with first-class Chrome extension support—built on Electron.**

`electron-browser-shell` is a streamlined desktop browser engineered as a testbed and reference implementation for integrating Chrome extensions inside Electron applications. It supplements Electron's baseline runtime with comprehensive Chrome Extension APIs (such as `chrome.tabs`, `browserAction`, and interactive popups) and enables direct installation from the Chrome Web Store alongside unpacked local extension testing.

---

## Monorepo Architecture

The workspace is organized into four modular packages:

| Package | Location | Role & Capabilities |
| :--- | :--- | :--- |
| **`shell`** | [`packages/shell`](packages/shell) | The main browser application, delivering multi-tab navigation, omnibox controls, and window lifecycle management. |
| **`electron-chrome-extensions`** | [`packages/electron-chrome-extensions`](packages/electron-chrome-extensions) | Core polyfill bridge implementing missing Chrome Extension APIs within Electron webContents. |
| **`electron-chrome-context-menu`** | [`packages/electron-chrome-context-menu`](packages/electron-chrome-context-menu) | Rich context menu integration supporting dynamic extension menu items. |
| **`electron-chrome-web-store`** | [`packages/electron-chrome-web-store`](packages/electron-chrome-web-store) | Chrome Web Store client enabling inline resolution, downloads, and `.crx` installations. |

---

## Key Features & Roadmap

* **Tabbed Browsing Architecture**: Fast, lightweight multi-tab navigation built atop Electron WebContents.
* **Versatile Extension Loading**:
  * Direct installations from the [Chrome Web Store](https://chromewebstore.google.com/);
  * Loading local unpacked extensions from folders or `.crx` bundles;
  * Automated background extension update checks.
* **Manifest V3 Evolution**: Iteratively adopting Manifest V3 specifications.
* **Native Extension Popups**: Renders extension action popups seamlessly anchored to the address bar.

---

## Quick Start

### Requirements
* **Node.js**: 18 or newer
* **Package Manager**: Yarn (recommended)

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/DDDFXYqiming/electron-browser-shell.git
cd electron-browser-shell

# Install workspace dependencies and start
yarn
yarn start
```

### Testing Local Extensions
Drop any unpacked Chrome extension into `./extensions` within the project root before launching the browser.

---

## License

Most packages in this monorepo are distributed under the [MIT License](LICENSE). Refer to `electron-chrome-extensions` for specific licensing conditions.

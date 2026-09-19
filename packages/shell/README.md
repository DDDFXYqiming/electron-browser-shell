# Luma Browser

Luma Browser is a redesigned Windows browser shell with a Liquid Glass / Fluent
visual language, theme + accent settings, a glassy new-tab page, and Windows
installer support.

A `WebContentsView` is used for tab contents due to its stability for browsing remote content relative to the [buggy behaviors](https://github.com/electron/electron/issues?q=is%3Aissue+is%3Aopen+webview) found in Electron's `<webview>` API.

## Development

```powershell
git clone https://github.com/DDDFXYqiming/electron-browser-shell.git
cd electron-browser-shell
yarn install
cd packages\shell
yarn start
```

## Windows build

Set `LUMA_NODE_BIN` to select a compatible Node executable. Otherwise the build script uses the `node` command on PATH.

The one-shot script uses a Node 24 runtime (Node 26 has an extract-zip
compatibility issue) and produces both a portable zip and a Squirrel installer:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File packages\shell\build-windows.ps1
```

Artifacts land in `packages/shell/out`:

- Portable: `out\make\zip\win32\x64\Luma-Browser-2.2.0-win32-x64.zip`
- Installer: `out\make\squirrel.windows\x64\Luma Browser Setup.exe`

The installer creates Start Menu and Desktop shortcuts and registers an
uninstaller. Settings (theme / accent / effects) persist under
`%APPDATA%\Luma Browser\settings.json`.

## License

MIT

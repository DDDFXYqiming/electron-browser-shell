const path = require('path')

const ICON = path.resolve(__dirname, 'build', 'icon.ico')

module.exports = {
  packagerConfig: {
    name: 'Luma Browser',
    productName: 'Luma Browser',
    executableName: 'LumaBrowser',
    asar: true,
    icon: ICON,
    extraResource: ['browser/ui'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        setupIcon: ICON,
        setupExe: 'Luma Browser Setup.exe',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              name: 'browser',
              preload: {
                js: './preload.ts',
              },
            },
          ],
        },
        devServer: {
          client: {
            overlay: false,
          },
        },
      },
    },
  ].filter(Boolean),
}

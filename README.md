简体中文 | [English](README.en.md)

# electron-browser-shell

**基于 Electron 构建、支持原生 Chrome 扩展生态的轻量级多标签浏览器外壳**。

`electron-browser-shell` 是一个专为测试、运行并无缝集成 Chrome 浏览器扩展而打造的极简桌面浏览器。它在 Electron 底层机制之上，实现了对 Chrome Extensions API（如 `chrome.tabs`、`browserAction`、扩展弹出窗口 Popup 等）的深度封装，并支持直接从 Chrome 应用商店（Chrome Web Store）一键下载安装与热加载本地未打包扩展（Unpacked Extensions）。

---

## 模块子包架构

本工程采用 Monorepo 架构组织，拆分为四个各司其职的核心子模块：

| 子包名称 | 源码路径 | 核心职责与定位 |
| :--- | :--- | :--- |
| **`shell`** | [`packages/shell`](packages/shell) | 现代多标签浏览器应用本体，提供完整的标签栏、地址栏、导航控制器与窗口生命周期管理。 |
| **`electron-chrome-extensions`** | [`packages/electron-chrome-extensions`](packages/electron-chrome-extensions) | 核心扩展 API 适配层，补齐 Electron 原生所缺失的 Chrome 扩展交互接口（如 tabs、browserAction、popup 交互等）。 |
| **`electron-chrome-context-menu`** | [`packages/electron-chrome-context-menu`](packages/electron-chrome-context-menu) | 深度集成的右键上下文菜单模块，支持扩展项注册与原生系统菜单联动。 |
| **`electron-chrome-web-store`** | [`packages/electron-chrome-web-store`](packages/electron-chrome-web-store) | Chrome 网上应用店集成模块，支持在线一键解析、下载并安装 `.crx` 扩展程序。 |

---

## 核心特性与路线图

* **多标签页浏览与视图隔离**：基于 Electron WebContents 构建的轻量标签管理体系。
* **全渠道扩展载入**：
  * 支持直接从 [Chrome Web Store](https://chromewebstore.google.com/) 检索并安装在线插件；
  * 支持导入本地解压目录（Unpacked Extension）与打包文件（`.crx`）；
  * 内置扩展自动更新检查机制。
* **Manifest V3 适配演进**：逐步扩展对现代 Manifest V3 扩展规范的支持。
* **原生扩展 Popup 悬浮视口**：支持插件点击呼出独立交互弹窗。

---

## 快速开始

### 环境依赖
* **Node.js**：18+ 或更高版本
* **包管理器**：Yarn（推荐）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/DDDFXYqiming/electron-browser-shell.git
cd electron-browser-shell

# 安装工程依赖并启动浏览器
yarn
yarn start
```

### 调试本地扩展
将已解压的本地 Chrome 扩展放置于工程根目录的 `./extensions` 文件夹中，随后启动浏览器即可自动加载调试。

---

## 许可证

本项目各子模块主要采用 [MIT License](LICENSE) 开源（`electron-chrome-extensions` 遵循其独立协议说明）。

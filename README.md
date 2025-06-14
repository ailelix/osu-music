# 🎵 OSU! Music

**Version**: Alpha 0.1.0  
**Release Date**: 2025年6月

## 项目目标 🚀

OSU! Music 是一款集成 osu! API 的跨平台音乐软件，专为 osu! 玩家打造独特的音乐体验。用户可以通过本应用登录 osu! 账号，访问游玩历史、搜索浏览音乐，并享受与 osu! 生态深度整合的音乐功能。

## 当前状态与开发进度 📝

🎉 **Alpha 0.1.0 版本已发布！** 项目核心功能基本完成，正在准备第一个公开测试版本。

### 已完成 ✅

**核心架构与认证系统**:

- ✅ 基于 Electron + Vue 3 + Quasar + Pinia + TypeScript 构建
- ✅ 实现无边框窗口设计，兼容 macOS 原生控件
- ✅ 完整的 osu! OAuth 2.0 认证流程 (Client Secret 流程)
- ✅ 支持自定义协议回调 (`osu-music-fusion://oauth/callback`)
- ✅ Token 自动刷新与会话持久化

**音乐库管理系统**:

- ✅ 完整的音乐文件扫描和管理功能
- ✅ 支持 osu! 音乐文件格式 (`id-songname.mp3`)
- ✅ 播放列表创建、编辑和删除功能
- ✅ 音乐文件删除功能（后端IPC + 前端确认）
- ✅ Apple Music 风格的界面设计
- ✅ 音乐搜索和筛选功能
- ✅ 响应式布局（自动网格/列表切换）

**用户界面 & 交互**:

- ✅ 主布局：顶部栏 + 侧边导航抽屉
- ✅ 音乐库页面：播放列表管理 + 全部音乐浏览
- ✅ 播放器页面：完整的音乐播放控制界面
- ✅ 搜索页面：osu! 谱面搜索和浏览
- ✅ 认证设置页面：OAuth 凭证配置和账户管理
- ✅ 统一深灰色主题设计（rgba(30, 30, 33, 0.7)）
- ✅ 音乐卡片交互：收藏、播放列表、队列、删除
- ✅ 列表模式二级菜单优化

**播放功能**:

- ✅ 音乐播放、暂停、上一首/下一首控制
- ✅ 随机播放和循环播放模式
- ✅ 音量控制和进度条拖拽
- ✅ 播放状态管理和持久化
- ✅ 播放队列管理（添加到队列、下一首播放）
- ✅ 自动播放逻辑（队列空时自动播放）

**构建与部署**:

- ✅ macOS Universal Binary 支持（Intel + Apple Silicon）
- ✅ Windows x64 构建支持
- ✅ 应用程序图标和元数据配置
- ✅ macOS entitlements 和权限配置

### 进行中/计划中 🚧

**核心功能扩展**:

- [ ] **播放历史追踪**: 记录和展示用户播放习惯

**osu! 集成功能**:

- [ ] 读取用户游玩历史 (Top Scores)
- [ ] 个人资料展示和统计信息
- [ ] 谱面收藏和推荐系统
- [ ] 与本地音乐库的关联功能

**跨平台支持**:

- [ ] iOS 应用构建 (Capacitor)
- [ ] Android 应用构建 (Capacitor)
- [ ] 统一的多端体验设计

## 当前版本使用指南 📖

### Alpha 0.1.0 功能说明

**🎵 音乐库管理**:

- 支持扫描和导入本地音乐文件
- 创建和管理自定义播放列表
- 音乐文件删除（支持文件系统删除）
- 搜索和筛选音乐

**🎮 osu! 账户功能**:

- OAuth 2.0 安全登录
- 账户信息显示
- 设置页面配置 API 凭证

**🎼 播放控制**:

- 基础播放、暂停、上下首
- 播放队列管理
- 收藏功能
- 循环和随机播放模式

**💡 使用提示**:

- 首次使用需要在设置页面配置 osu! API 凭证
- 音乐文件建议使用 osu! 标准命名格式: `id-songname.mp3`
- 支持多种音乐格式 (MP3, FLAC, OGG 等)
- 界面支持响应式设计，自动适配屏幕大小

## 技术栈 🛠️

- **桌面应用框架**: [Electron](https://www.electronjs.org/)
- **前端框架**: [Vue 3](https://vuejs.org/) (Composition API + TypeScript)
- **UI 组件库**: [Quasar Framework (v2)](https://quasar.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **HTTP 客户端**: [Axios](https://axios-http.com/)
- **API 集成**: [osu! API v2](https://osu.ppy.sh/docs/index.html) (OAuth 2.0)
- **跨平台支持**: [Capacitor](https://capacitorjs.com/) (移动端)

## 项目特色 ✨

- **🎵 完整音乐库管理**: 本地音乐文件扫描、组织、播放和删除功能
- **🎮 osu! 深度集成**: 原生支持 osu! 账户登录和数据同步
- **🎨 现代化界面**: 融合 Apple Music 和 osu! lazer 的设计语言
- **📱 响应式设计**: 自动适配不同屏幕尺寸和方向
- **🎯 智能播放**: 播放队列管理、自动播放、收藏和播放列表
- **⚡ 高性能**: Electron + Vue 3 + TypeScript 技术栈
- **🔒 安全认证**: OAuth 2.0 标准认证流程
- **🌐 跨平台支持**: macOS、Windows、Linux 一次构建多平台部署

## 版本历史 📊

### Alpha 0.1.0 (2025年6月)

- 🎉 首个 Alpha 版本发布
- ✅ 核心音乐库管理功能完成
- ✅ osu! OAuth 认证系统完成
- ✅ 基础播放功能和界面完成
- ✅ macOS Universal Binary 支持
- ✅ 音乐文件删除功能
- ✅ 响应式界面设计

### 计划发布

- **Beta 0.2.0**: 音频引擎完善、谱面下载功能
- **Beta 0.3.0**: 用户数据集成、播放历史
- **Release 1.0.0**: 正式版发布

## 参与贡献 ❤️

osu! Music 是一个开源项目，我们非常欢迎有兴趣的开发者加入！

**我们正在寻找这样的贡献者：**

- 对 Electron/Vue.js 前端开发有经验或兴趣
- 熟悉现代前端技术栈 (Vue 3, TypeScript, Quasar, Pinia)
- 有音乐应用或游戏相关开发经验优先
- **熟练使用 AI 编程工具** (GitHub Copilot, Claude, ChatGPT 等)
- 对 osu! 文化和音乐有热情
- 积极主动，善于沟通协作

**贡献流程：**

1. **Fork 本仓库** 并 clone 到本地
2. **创建功能分支** (`git checkout -b feature/your-feature-name`)
3. **进行开发** 并确保代码质量
4. **提交更改** (`git commit -m 'Add some feature'`)
5. **推送分支** (`git push origin feature/your-feature-name`)
6. **创建 Pull Request** 到主分支

如有任何问题或建议，欢迎通过 Issue 或 Discussions 与我们交流。

## 快速开始 🚀

### 环境要求

- Node.js 18+
- npm 或 yarn
- Git
- macOS 10.15+ (for macOS builds)
- Windows 10+ (for Windows builds)

### 安装步骤

1. **克隆仓库**:

   ```bash
   git clone https://github.com/KirisameLonnet/osu-music.git
   cd osu-music-project
   ```

2. **安装依赖**:

   ```bash
   npm install
   # 或者使用 yarn
   yarn install
   ```

3. **配置 osu! API 凭证**:

   - 访问 [osu! API 设置页面](https://osu.ppy.sh/home/account/edit)
   - 创建新的 OAuth 应用程序
   - 设置回调URL为: `osu-music-fusion://oauth/callback`
   - 获取 Client ID 和 Client Secret

4. **启动开发环境**:
   ```bash
   # 启动 Electron 开发模式
   npm run dev:electron
   # 或使用 Quasar CLI
   quasar dev -m electron
   ```

### 构建发布版本

**macOS Universal Binary (推荐)**:

```bash
quasar build -m electron -T darwin --arch all
```

**Windows x64**:

```bash
quasar build -m electron -T win32 --arch x64
```

**Linux x64**:

```bash
quasar build -m electron -T linux --arch x64
```

### 移动端开发

```bash
# 添加移动端平台
npx cap add ios
npx cap add android

# 同步代码到移动端
npx cap sync

# 打开原生 IDE
npx cap open ios
npx cap open android
```

> **注意**: 目前移动端开发处于实验阶段，建议以桌面端为主进行开发。

## 许可证 📄

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 致谢 🙏

- [osu!](https://osu.ppy.sh/) - 提供优秀的音乐游戏和 API
- [Quasar Framework](https://quasar.dev/) - 强大的 Vue.js 框架
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用开发
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架

## 联系方式 📮

- 项目主页: [GitHub Repository](https://github.com/KirisameLonnet/osu-music)
- 问题反馈: [GitHub Issues](https://github.com/KirisameLonnet/osu-music/issues)
- 功能讨论: [GitHub Discussions](https://github.com/KirisameLonnet/osu-music/discussions)

---

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

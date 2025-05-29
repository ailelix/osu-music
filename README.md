# Osu! Music

## 项目目标 🚀

Osu! Music 旨在打造一款跨平台的音乐软件，集成 Osu! API。它致力于为 Osu! 玩家提独特音乐体验。用户将能够通过本应用登录自己的 Osu! 账号，访问游玩历史、欣赏音乐并享受更多与 Osu! 生态相关的音乐功能。

## 当前状态与 TODO List 📝
Osu！Music 处于几乎新建目的阶段，而且开发者比较懒 ;P

### 已完成 ✅

*   **核心架构搭建**:
    *   基于 Electron, Vue 3 (`<script setup lang="ts">`), Quasar Framework (v2), Pinia, Axios 搭建项目。
    *   实现了无边框窗口效果，并兼容 macOS 的 "红绿灯" 控件。
*   **基础 UI 布局 (`MainLayout.vue`)**:
    *   顶部栏 (`QHeader`) 与自定义动画 Logo (`AppLogo.vue`)。
    *   左侧抽屉式导航栏 (`AppDrawer.vue`)。
*   **Osu! OAuth 2.0 认证 (Client Secret 流程)**:
    *   用户可在设置页面配置从 Osu! 开发者门户获取的 Client ID 和 Client Secret (凭证目前存储于内存，应用重启需重新输入)。
    *   实现了标准的 Authorization Code Grant Flow (不使用 PKCE)。
    *   通过自定义协议方案 (`osu-music-fusion://oauth/callback`) 处理 OAuth 回调。
    *   `osuAuthService.ts` 负责授权 URL 构建、Token 交换和 Token 刷新逻辑。
    *   `authStore.ts` (Pinia) 负责 Access Token, Refresh Token, 过期时间及用户信息的内存状态管理，并使用 `localStorage` 实现 Token 和用户信息的**会话间持久化**（用户关闭再打开应用，若 Token 有效或可刷新，则能恢复登录状态）。
    *   `settingsStore.ts` (Pinia) 负责 Client ID 和 Client Secret 的**会话内内存管理**。
    *   实现了登录、注销、获取用户信息、尝试刷新 Token 的核心逻辑。
    *   实现了 OAuth 回调页面 (`OsuCallbackPage.vue`)，处理授权码交换、显示状态及错误反馈。
*   **页面**:
    *   设置页面 (`SettingsPage.vue`): 用于配置 Osu! OAuth 凭证，显示账户状态，执行登录/注销。
    *   回调处理页面 (`OsuCallbackPage.vue`): 处理 OAuth 回调，并引导用户。
*   **Electron 集成**:
    *   无边框窗口、自定义协议注册与处理、基本的窗口控制 IPC。
    *   通过 `contextBridge` 安全暴露必要的 Electron API 给渲染进程。

### 未完成/进行中 🚧

*   **凭证持久化**:
    *   [ ] **目前关键**: 实现 `settingsStore.ts` 中 Osu! Client ID 和 Client Secret 的安全持久化存储 (例如使用 `electron-store` 并配合 IPC)。目前它们仅存储在内存中，应用重启后用户需要重新输入。
*   **核心音乐功能**:
    *   [ ] 读取用户 Osu! 游玩历史 (Recent Plays, Top Scores)。
    *   [ ] 搜索、浏览和展示 Osu! 音乐信息。
    *   [ ] 音乐下载与管理功能。
    *   [ ] 本地音乐库与 Osu! 谱面关联。
*   **UI/UX 完善**:
    *   [ ] **底部播放控制条**: 设计并实现固定的音乐播放控制条（Hyprland风格）。
    *   [ ] 持续打磨应用的视觉风格，更好地融合 Apple Music 和 Osu! Lazer 的元素。
    *   [ ] 优化页面过渡动画和用户交互体验。
    *   [ ] 实现更多个性化设置选项（如主题、界面偏好等）。
 
    
## 技术栈 🛠️

*   **桌面应用框架**: [Electron](https://www.electronjs.org/)
*   **前端框架**: [Vue 3](https://vuejs.org/) (使用 `<script setup lang="ts">`)
*   **UI 库**: [Quasar Framework (v2)](https://quasar.dev/)
*   **状态管理**: [Pinia](https://pinia.vuejs.org/)
*   **HTTP 客户端**: [Axios](https://axios-http.com/)
*   **编程语言**: [TypeScript](https://www.typescriptlang.org/)
*   **包管理器**: [Yarn](https://yarnpkg.com/)
*   **API 交互**: [Osu! API v2](https://osu.ppy.sh/docs/index.html) (OAuth 2.0 Client Secret Flow)

## 参与贡献 ❤️

Osu! Music 是一个的开源项目，我们非常欢迎对本项目感兴趣的开发者加入！

**我们正在寻找这样的你：**

*   对 Electron 前端开发有了解或浓厚兴趣。
*   乐于学习使用 Vue 3, Quasar, Pinia 等现代前端技术。
*   愿意学习 Osu! API 的使用。
*   **能够熟练运用 AI 工具 (如 GitHub Copilot, Gemini 等) 进行开发** (我们鼓励并拥抱 AI 编程！)
*   对音乐软件、Osu! 文化有热情。
*   积极主动，乐于沟通和协作。

**如何贡献：**

1.  **Fork 本仓库**。
2.  **Clone 你 Fork 的仓库到本地**。
3.  **创建新的特性分支** (`git checkout -b feature/你的特性名称`)。
4.  **进行代码修改和开发**。
5.  **提交你的更改** (`git commit -m '添加了某个特性'`)。
6.  **将你的分支推送到你的 GitHub Fork** (`git push origin feature/你的特性名称`)。
7.  **创建 Pull Request** 到本仓库的 `main` (或 `develop`) 分支。


我们期待你的加入，如果你有任何问题或想法，欢迎通过 Issue 或 Discussions 与我们交流。

## 项目构建 🧑‍💻

本项目使用 [Quasar Framework](https://quasar.dev/) 进行开发和构建。

1.  **Clone 本仓库**:
    ```bash
    git clone https://github.com/KirisameLonnet/osu-music.git
    ```
2.  **进入项目目录**:
    ```bash
    cd osu-music
    ```
3.  **安装依赖**:
    Quasar 项目通常会同时生成 `package-lock.json` (npm) 和 `yarn.lock` (yarn)，你可以选择其中一个包管理器。这里以 npm 为例：
    ```bash
    npm install
    ```
    或者，如果你更喜欢使用 yarn:
    ```bash
    yarn install
    ```
    *（请在项目中统一使用一种包管理器以避免潜在问题。）*

4.  **启动开发模式 (带 Electron 应用)**:
    这将启动一个带热重载的开发服务器，并在 Electron 窗口中运行你的应用。
    ```bash
    quasar dev -m electron
    ```
    你也可以简写为：
    ```bash
    q dev -m electron
    ```

5.  **构建生产版本的 Electron 应用**:
    这将为你的目标平台构建可执行的应用文件。
    ```bash
    quasar build -m electron
    ```
    你也可以简写为：
    ```bash
    q build -m electron
    ```
    默认情况下，它可能会为你当前的操作系统构建。你可以添加 `--target` (或 `-T`) 和 `--arch` (或 `-A`) 参数来指定目标平台和架构.
    
    **我们始终有iOS构建和Android构建的企划，并且尽量做到一次开发多端部署，框架构建调试阶段暂不考虑移动端**
    
    更多构建选项请参考 [Quasar Electron 构建命令文档](https://quasar.dev/quasar-cli-vite/developing-electron-apps/build-commands)。


